import React, { useEffect, useRef } from "react";
import G6, { Tooltip } from "@antv/g6";

const { Util } = G6;

let graph = null;
let tooltip = null;

export default function TreeGraph({ duplicates, project, isOrgChecked }) {
  const icons = ["\u2705", "❗"];
  const orgRef = useRef(null);
  const userRef = useRef(null);

  const endpoints = Object.keys(project).filter(
    (data) =>
      data !== "projectName" &&
      data !== "createdDate" &&
      data !== "projectId" &&
      data !== "username"
  );

  const children = [];
  let count = 0;
  for (let i = 0; i < endpoints.length; i++) {
    const subChildren = [];
    const keys = Object.keys(project[endpoints[i]]);
    for (let j = 0; j < keys.length; j++) {
      count++;
      const method = keys[j];
      const subSubChildren = [];
      const operationIds = project[endpoints[i]][keys[j]];
      for (let k = 0; k < operationIds.length; k++) {
        count++;
        let icon;
        let duplicateOperations = {};
        if (duplicates && duplicates[method]) {
          duplicateOperations = Object(duplicates[method]);
        } else {
          continue;
        }

        if (duplicateOperations.hasOwnProperty(operationIds[k])) {
          icon = icons[1];
          subSubChildren.push({
            label: `${operationIds[k]} ${icon}`,
            id: `0-${i + 1}-${j + 1}-${k + 1}`,
            duplicates: duplicateOperations[operationIds[k]].duplicateIds,
            username: (duplicateOperations[operationIds[k]].username =
              !isOrgChecked
                ? "You"
                : duplicateOperations[operationIds[k]].username),
          });
        } else {
          icon = icons[0];
          subSubChildren.push({
            label: `${operationIds[k]} ${icon}`,
            id: `0-${i + 1}-${j + 1}-${k + 1}`,
          });
        }
      }
      const branchColor =
        keys[j] === "get"
          ? "#AACB73"
          : keys[j] === "post"
          ? "#FFB84C"
          : keys[j] === "put"
          ? "#5B8FF9"
          : keys[j] === "delete"
          ? "#EB455F"
          : keys[j] === "patch"
          ? "#7291a9"
          : null;
      subChildren.push({
        label: keys[j],
        id: `0-${i + 1}-${j + 1}`,
        children: subSubChildren,
        branchColor: branchColor,
      });
    }
    children.push({
      label: endpoints[i],
      id: `0-${i + 1}`,
      children: subChildren,
    });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rawData = {
    label: project.projectName,
    id: "0",
    isRoot: true,
    children: children,
  };

  const BaseConfig = {
    nameFontSize: 12,
    childCountWidth: 22,
    countMarginLeft: 0,
    propertyCountWidth: 30,
    itemPadding: 16,
    selectedIconWidth: 12,
    nameMarginLeft: 4,
    rootPadding: 18,
  };

  const NameStyle = {
    color: {
      default: "rgba(0, 0, 0, .65)",
      dash: "rgba(0, 0, 0, .3)",
      hover: "#40A8FF",
      actived: "#40A8FF",
      selected: "#40A8FF",
    },
  };
  const MainStyle = {
    background: {
      default: "#fff",
      hover: "#e8f7ff",
      actived: "#e8f7ff",
      selected: "#e8f7ff",
    },
  };

  if (project) {
    G6.registerNode("indentedRoot", {
      draw(model, group) {
        const rootColor = "#576286";
        const keyShape = group.addShape("rect", {
          attrs: {
            x: -46,
            y: -16,
            width: 92,
            height: 32,
            fill: rootColor,
            radius: 2,
            stroke: "#5B8FF9",
            lineWidth: model.selected ? 2 : 0,
            cursor: "pointer",
          },
          // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
          name: "key-shape",
        });

        if (model.label) {
          const text = group.addShape("text", {
            attrs: {
              text: model.label,
              fill: "#fff",
              fontSize: 20,
              x: 0,
              y: 0,
              textAlign: "center",
              textBaseline: "middle",
              cursor: "pointer",
            },
            // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
            name: "root-text-shape",
          });
          const textBBox = text.getBBox();
          const width = textBBox.width + 40;
          const height = textBBox.height + 30;
          keyShape.attr({
            x: -width / 2,
            y: -height / 2,
            width,
            height,
          });
        }

        const { children } = model;
        const hasChildren = children?.length;

        const bbox = keyShape.getBBox();
        const backContainer = group.addShape("path", {
          attrs: {
            path: hasChildren
              ? [
                  ["M", bbox.minX, bbox.minY],
                  ["L", bbox.maxX, bbox.minY],
                  ["L", bbox.maxX, bbox.maxY],
                  ["L", 10, bbox.maxY],
                  ["L", 10, bbox.maxY + 28],
                  ["L", -10, bbox.maxY + 28],
                  ["L", -10, bbox.maxY],
                  ["L", bbox.minX, bbox.maxY],
                  ["Z"],
                ]
              : [
                  ["M", bbox.minX, bbox.minY],
                  ["L", bbox.maxX, bbox.minY],
                  ["L", bbox.maxX, bbox.maxY],
                  ["L", 10, bbox.maxY],
                  ["L", 10, bbox.maxY + 14],
                  ["L", -10, bbox.maxY + 14],
                  ["L", -10, bbox.maxY],
                  ["L", bbox.minX, bbox.maxY],
                  ["Z"],
                ],
            fill: "#fff",
            opacity: 0,
          },
          draggable: true,
        });
        backContainer.toBack();
        return keyShape;
      },
    });

    G6.registerNode(
      "indentedNode",
      {
        addHoverBack(group, props) {
          const { mainX, mainY, width, height, fill } = props;
          group.addShape("rect", {
            attrs: {
              x: mainX,
              y: mainY,
              width,
              height,
              radius: 11,
              fill,
              cursor: "pointer",
            },
            // capture: false,
            // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
            name: "main-shape",
          });
        },
        addName(group, props) {
          const { label, x = 0, y, fill } = props;
          return group.addShape("text", {
            attrs: {
              text: label,
              x,
              y,
              textAlign: "start",
              textBaseline: "top",
              fill,
              fontSize: 20,
              fontFamily: "monospace",
              cursor: "pointer",
              fontWeight: 800,
            },
            // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
            name: "not-root-text-shape",
            draggable: true,
          });
        },
        draw(model, group) {
          const { selected, label } = model;

          const childCount = model.children?.length || 0;

          const { itemPadding, nameMarginLeft } = BaseConfig;

          let width = 0;
          const height = 10;
          // let x = -width / 2;
          const x = 0;
          const y = -height / 2;
          const borderRadius = 4;

          const text = this.addName(group, { label, x, y });

          let textWidth = text.getBBox().width;
          width = textWidth + itemPadding + nameMarginLeft;

          const keyShapeAttrs = {
            x,
            y,
            width,
            height,
            radius: borderRadius,
            fill: undefined,
            stroke: undefined,
          };

          const keyShape = group.addShape("rect", {
            attrs: keyShapeAttrs,
            // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
            name: "root-key-shape-rect-shape",
          });

          const mainX = x - 6;
          const mainY = -height - 6;

          // hover
          this.addHoverBack(group, {
            fill: selected
              ? MainStyle.background.hover
              : MainStyle.background.default,
            height,
            width,
            mainX,
            mainY,
          });

          let nameColor = NameStyle.color.default;
          if (selected) {
            nameColor = NameStyle.color.hover;
          }

          // 名称
          text.attr({
            y: y - 12,
            fill: nameColor,
          });
          text.toFront();
          textWidth = text.getBBox().width;

          const bbox = group.getBBox();
          const backContainer = group.addShape("path", {
            attrs: {
              path: childCount
                ? [
                    ["M", bbox.minX, bbox.minY],
                    ["L", bbox.maxX, bbox.minY],
                    ["L", bbox.maxX, bbox.maxY],
                    ["L", bbox.minX + 20, bbox.maxY],
                    ["L", bbox.minX + 20, bbox.maxY + 20],
                    ["L", bbox.minX, bbox.maxY + 20],
                    ["Z"],
                  ]
                : [
                    ["M", bbox.minX, bbox.minY],
                    ["L", bbox.maxX, bbox.minY],
                    ["L", bbox.maxX, bbox.maxY],
                    ["L", bbox.minX, bbox.maxY],
                    ["Z"],
                  ],
              fill: "#fff",
              opacity: 0,
            },
            draggable: true,
          });
          backContainer.toBack();
          return keyShape;
        },
        setState(name, value, node) {
          if (name === "closest" || name === "selected") {
            const group = node.getContainer();
            const textShape = group.find(
              (child) => child.get("name") === "not-root-text-shape"
            );
            const mainShape = group.find(
              (child) => child.get("name") === "main-shape"
            );
            if (value) {
              if (textShape) {
                textShape.attr("fill", NameStyle.color.hover);
              }
              if (mainShape) {
                mainShape.attr("fill", MainStyle.background.hover);
              }
            } else {
              const selected = node.hasState("selected");
              if (selected) {
                if (textShape) {
                  textShape.attr("fill", NameStyle.color.selected);
                }
                if (mainShape) {
                  mainShape.attr("fill", MainStyle.background.default);
                }
              } else {
                if (textShape) {
                  textShape.attr("fill", NameStyle.color.default);
                }
                if (mainShape) {
                  mainShape.attr("fill", MainStyle.background.default);
                }
              }
            }
          }
        },
      },
      "treeNode"
    );

    G6.registerEdge(
      "indentedEdge",
      {
        afterDraw: (cfg, group) => {
          const sourceNode = cfg.sourceNode?.getModel();
          const targetNode = cfg.targetNode?.getModel();
          const color =
            sourceNode.branchColor ||
            targetNode.branchColor ||
            cfg.color ||
            "#000";
          // const branchThick = sourceNode.depth <= 1 ? 3 : sourceNode.depth <= 3 ? 2 : 1;
          const keyShape = group.get("children")[0];
          keyShape.attr({
            stroke: color,
            lineWidth: 3, // branchThick
          });
          group.toBack();
        },
        getControlPoints: (cfg) => {
          const startPoint = cfg.startPoint;
          const endPoint = cfg.endPoint;
          return [
            startPoint,
            {
              x: startPoint.x,
              y: endPoint.y,
            },
            endPoint,
          ];
        },
        update: undefined,
      },
      "polyline"
    );

    G6.registerNode(
      "custom-node",
      {
        draw(cfg, group) {
          group.addShape("rect", {
            attrs: {
              x: -50,
              y: -25,
              width: 100,
              height: 50,
              fill: "#C6E5FF",
              stroke: "#5B8FF9",
              radius: 4,
              cursor: "pointer",
            },
            name: "main-box",
          });

          group.addShape("path", {
            attrs: {
              path: "M -20,-10 L 0,10 L 20,-10 Z",
              fill: "#5B8FF9",
              stroke: "#5B8FF9",
              lineWidth: 1,
              opacity: 0,
              cursor: "pointer",
              x: 0,
              y: 10,
            },
            name: "collapse-arrow",
          });

          return group;
        },
      },
      "rect"
    );
  }

  const dataTransform = (data) => {
    const changeData = (d, level = 0, color) => {
      const data = {
        ...d,
      };
      data.type = level === 0 ? "indentedRoot" : "indentedNode";
      data.hover = false;

      if (color) {
        data.color = color;
      }

      if (level === 1 && !d.direction) {
        if (!d.direction) {
          data.direction =
            d.id.charCodeAt(d.id.length - 1) % 2 === 0 ? "right" : "left";
        }
      }

      if (d.children) {
        data.children = d.children.map((child) =>
          changeData(child, level + 1, data.color)
        );
      }
      // 给定 branchColor 和 0-2 层节点 depth
      if (data.children?.length) {
        data.depth = 0;
        data.children.forEach((subtree, i) => {
          // dfs
          let currentDepth = 1;
          subtree.depth = currentDepth;
          Util.traverseTree(subtree, (child) => {
            if (!child.depth) {
              child.depth = currentDepth + 1;
            } else currentDepth = subtree.depth;
            if (child.children) {
              child.children.forEach((subChild) => {
                subChild.depth = child.depth + 1;
              });
            }

            if (!child.children?.length && child.schemaType?.subTypeCount) {
              child.collapsed = true;
            }
            return true;
          });
        });
      }
      return data;
    };
    return changeData(data);
  };

  useEffect(() => {
    if (!graph) {
      const ref = isOrgChecked ? orgRef : userRef;
      graph = new G6.TreeGraph({
        container: ref.current,
        width: 700,
        height: 750 + count * 10,
        layout: {
          type: "indented",
          direction: "LR",
          isHorizontal: true,
          indent: 40,
          getHeight: (d) => {
            if (d.isRoot) {
              return 30;
            }
            if (d.collapsed && d.children?.length) {
              return 36;
            }
            return 22;
          },
          getVGap: () => {
            return 10;
          },
        },
        modes: {
          default: ["collapse-expand"],
        },
        defaultNode: {
          type: "tree-node",
          label: "Node",
        },
        defaultEdge: {
          type: "indentedEdge",
          style: {
            lineWidth: 2,
            radius: 16,
          },
        },
        nodeStateStyles: {
          closest: {
            fill: "#f00",
            "node-label": {
              fill: "#f00",
            },
          },
        },
        minZoom: 0.5,
      });
    }

    graph.on("afterrender", (e) => {
      graph.getEdges().forEach((edge) => {
        const targetNode = edge.getTarget().getModel();
        const color = targetNode.branchColor;
        graph.updateItem(edge, { color });
      });
      setTimeout(() => {
        graph.moveTo(32, 32);
        graph.zoomTo(0.7);
      }, 16);
    });

    graph.data(dataTransform(rawData));
    graph.render();

    let table;
    tooltip = new Tooltip({
      placement: "left",
      offsetX: 30,
      offsetY: 30,
      getContent(e) {
        const { item } = e;
        const model = item.getModel();
        if (model.depth === 3) {
          // check if node depth is 3
          const treeData = getTreeData(model);
          if (treeData[0].duplicates && treeData[0].username) {
            table = `
            <h5 style="color: red; text-align: center; font-weight: Bold;">Found Duplicates!</h5>
            <table cellspacing="30">
              <thead>
                <tr>
                  <th style="padding: 10px;">Project Name</th>
                  <th  style="padding: 10px;">Created By</th>
                  <th  style="padding: 10px;">Endpoint</th>
                  <th  style="padding: 10px;">Operation ID</th>
                </tr>
              </thead>
              <tbody>
                ${treeData[0].duplicates
                  .map(
                    (endpoint) => `
                <tr>
                  <td  style="padding: 10px;">${endpoint.projectName}</td>
                  <td  style="padding: 10px;">${treeData[0].username}</td>    
                  <td  style="padding: 10px;">${endpoint.endpoint}</td>
                  <td  style="padding: 10px;">${endpoint.operationId}</td>
                </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>`;
          } else {
            table = `
            <h5 style="color: red; text-align: center; font-weight: Bold;">Found Duplicates!</h5>
            <table cellspacing="30">
              <thead>
                <tr>
                  <th style="padding: 10px;">Project Name</th>
                  <th  style="padding: 10px;">Created By</th>
                  <th  style="padding: 10px;">Endpoint</th>
                  <th  style="padding: 10px;">Operation ID</th>
                </tr>
              </thead>
              <tbody>
                ${treeData[0].duplicates
                  .map(
                    (endpoint) => `
                <tr>
                  <td  style="padding: 10px;">${endpoint.projectName}</td>
                  <td  style="padding: 10px;">${endpoint.username}</td>    
                  <td  style="padding: 10px;">${endpoint.endpoint}</td>
                  <td  style="padding: 10px;">${endpoint.operationId}</td>
                </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>`;
          }
          if (treeData[0].duplicates) {
            return table;
          } else {
            return "Operation Id";
          }
        } else if (model.depth === 2) {
          return "Method";
        } else {
          return "Endpoint";
        }
      },
      itemTypes: ["node:click", "node"],
    });

    graph.addPlugin(tooltip);

    function getTreeData(node) {
      const children = node.children || [];
      let subtreeData = [node];
      children.forEach((child) => {
        const grandchildren = getTreeData(child);
        subtreeData = subtreeData.concat(grandchildren);
      });
      return subtreeData;
    }
  }, [rawData, isOrgChecked]);
  return (
    <>{isOrgChecked ? <div ref={orgRef}></div> : <div ref={userRef}></div>}</>
  );
}
