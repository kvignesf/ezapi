import { CircularProgress, Dialog } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import TreeView from '@material-ui/lab/TreeView';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { useResetRecoilState } from 'recoil';
import storedProcedureAtom from '../../shared/atom/storedProcedureAtom';
import Colors from '../../shared/colors';
import { PrimaryButton } from '../../shared/components/AppButton';
import AppIcon from '../../shared/components/AppIcon';
import ErrorWithMessage from '../../shared/components/ErrorWithMessage';
import LoaderWithMessage from '../../shared/components/LoaderWithMessage';
import { useCanEdit } from '../../shared/utils';
import EmptyState from '../../static/images/empty-state.svg';
import AddOrEditResource from './AddOrEditResource';
import OperationTreeItem from './OperationTreeItem';
import PathTreeItem from './PathTreeItem';
import ResourceTreeItem from './ResourcesTreeItem';
import { useGetResources } from './resourcesQuery';

const useStyles = makeStyles({
    root: {
        height: 240,
        flexGrow: 1,
        maxWidth: 400,
    },
});

const Resources = ({
    projectType,
    projectId,
    isDesign,
    selectedIndex,
    onOperationSelect,
    onSimulateSelect,
    currentTab,
    simulateData,
    ...props
}) => {
    const resetStoredProcedureState = useResetRecoilState(storedProcedureAtom);
    const classes = useStyles();
    const {
        isLoading: isLoadingResources,
        data: resources,
        isFetching: isLoadingResourcesBg,
        error: getResourcesError,
    } = useGetResources(projectId, {
        refetchOnWindowFocus: false,
    });
    let treeNodeIndex = 1;
    const [dialog, setDialog] = useState({
        show: false,
        type: null,
        data: null,
    });

    const canEdit = useCanEdit();

    const [expanded, setExpanded] = React.useState([]);
    const [selectedEndpoint, setSelectedEndpoint] = React.useState(0);
    const [pathArr, setPathArr] = React.useState([]);
    const handleToggle = (event, nodeIds) => {
        setExpanded(nodeIds);
    };

    const handleExpandClick = () => {
        setExpanded((oldExpanded) => (oldExpanded.length === 0 ? Array.from(Array(1000).keys()) : []));
    };
    useEffect(() => {
        //console.log(treeNodeIndex);

        setExpanded((oldExpanded) => (oldExpanded.length === 0 ? Array.from(Array(1000).keys()) : []));
    }, []);
    useEffect(() => {
        var tempArr = [];
        simulateData?.data?.map((item) => {
            var tempEndpoint = item['endpoint'];
            var tempPath;
            if (tempEndpoint.includes('?')) {
                tempPath = tempEndpoint?.slice(tempEndpoint.indexOf('/') + 1, tempEndpoint.indexOf('?'));
            } else {
                tempPath = tempEndpoint.substr(1);
            }
            if (tempArr.indexOf(tempPath) === -1) {
                tempArr.push(tempPath);
            }
        });
        setPathArr(tempArr);
    }, [simulateData]);

    const showAddResourceDialog = () => {
        if (canEdit()) {
            setDialog({
                show: true,
                type: 'add-resource',
            });
        }
    };

    const handleCloseDialog = () => {
        setDialog({
            show: false,
            type: null,
            data: null,
        });
    };

    if (isLoadingResources || (currentTab == 1 && !simulateData)) {
        return <LoaderWithMessage message="Fetching resources" contained className="h-full" />;
    }

    const resetSelectedOperation = () => {
        onOperationSelect(null, null, null, null);
    };

    if (getResourcesError) {
        return <ErrorWithMessage message="Failed to load the resources" contained className="h-full" />;
    }

    return (
        <div {...props} style={{ maxHeight: '88vh', overflowY: 'auto' }}>
            <Dialog
                aria-labelledby="project-dialog"
                open={dialog?.show ?? false}
                fullWidth
                PaperProps={{
                    style: { borderRadius: 8 },
                }}
                onClose={(event, reason) => {
                    if (reason !== 'backdropClick') {
                        handleCloseDialog();
                    }
                }}
            >
                {dialog?.type === 'add-resource' && canEdit() && (
                    <AddOrEditResource
                        title="Create Resource"
                        onClose={handleCloseDialog}
                        projectId={projectId}
                        resource={{}}
                    />
                )}
            </Dialog>

            <div className="flex flex-row justify-between items-center my-2 mx-2">
                <p className="text-overline2 flex-1">Resources</p>

                {isLoadingResourcesBg && <CircularProgress size="16px" className="mr-2" />}

                {canEdit() && currentTab == 0 && projectType !== 'aggregate' && (
                    <AppIcon style={{ padding: '0', margin: '0' }} onClick={showAddResourceDialog}>
                        <AddIcon style={{ fontSize: '18px', color: 'black' }} />
                    </AppIcon>
                )}
            </div>

            {currentTab == 0 &&
                (!_.isEmpty(resources) ? (
                    <TreeView
                        expanded={expanded}
                        aria-label="controlled"
                        onNodeToggle={handleToggle}
                        className={classes.root}
                        defaultCollapseIcon={<ArrowDropDownIcon style={{ color: Colors.neutral.gray3 }} />}
                        defaultExpandIcon={<ArrowRightIcon style={{ color: Colors.neutral.gray3 }} />}
                        style={{ pointerEvents: 'auto' }}
                        selected={selectedIndex}
                    >
                        {resources?.map((resource, resourceIndex) => {
                            const resourceNodeIndex = treeNodeIndex++;
                            // console.log(resource);
                            return (
                                <ResourceTreeItem
                                    projectType={projectType}
                                    currentTab={currentTab}
                                    key={resourceNodeIndex}
                                    nodeId={resourceNodeIndex}
                                    isDesign={isDesign}
                                    resource={resource}
                                    resetSelectedOperation={() => {
                                        resetSelectedOperation();
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        resetSelectedOperation();
                                    }}
                                >
                                    {resource?.path && !_.isEmpty(resource?.path)
                                        ? resource?.path?.map((path, pathIndex) => {
                                              const pathNodeId = treeNodeIndex++;

                                              return (
                                                  <PathTreeItem
                                                      projectType={projectType}
                                                      currentTab={currentTab}
                                                      key={pathNodeId}
                                                      nodeId={pathNodeId}
                                                      resourceId={resource?.resourceId}
                                                      path={path}
                                                      resetSelectedOperation={() => {
                                                          resetSelectedOperation();
                                                      }}
                                                      onClick={(e) => {
                                                          e.stopPropagation();
                                                          resetSelectedOperation();
                                                      }}
                                                      isDesign={isDesign}
                                                  >
                                                      {path?.operations && !_.isEmpty(path?.operations)
                                                          ? path?.operations?.map((operation, operationIndex) => {
                                                                const operationNodeId = treeNodeIndex++;

                                                                return (
                                                                    <OperationTreeItem
                                                                        isDesign={isDesign}
                                                                        currentTab={currentTab}
                                                                        key={operationNodeId}
                                                                        nodeId={operationNodeId}
                                                                        resourceId={resource?.resourceId}
                                                                        pathId={path?.pathId}
                                                                        type={operation?.operationType}
                                                                        operation={operation}
                                                                        resetSelectedOperation={() => {
                                                                            resetSelectedOperation();
                                                                        }}
                                                                        onClick={(e) => {
                                                                            resetStoredProcedureState();

                                                                            e.stopPropagation();
                                                                            onOperationSelect(
                                                                                operationNodeId,
                                                                                resource,
                                                                                path,
                                                                                operation,
                                                                            );
                                                                        }}
                                                                    />
                                                                );
                                                            })
                                                          : null}
                                                  </PathTreeItem>
                                              );
                                          })
                                        : null}
                                </ResourceTreeItem>
                            );
                        })}
                    </TreeView>
                ) : (
                    <div className="flex-1 justify-center flex flex-col items-center">
                        <img src={EmptyState} className="mb-1" style={{ height: '120px', width: '120px' }} />

                        <p className="text-overline2 mb-5">You don’t have any resource</p>

                        {canEdit() && <PrimaryButton onClick={showAddResourceDialog}>Create Resource</PrimaryButton>}
                    </div>
                ))}
            {currentTab == 1 &&
                (!_.isEmpty(pathArr) ? (
                    <TreeView
                        expanded={expanded}
                        aria-label="controlled"
                        onNodeToggle={handleToggle}
                        className={classes.root}
                        defaultCollapseIcon={<ArrowDropDownIcon style={{ color: Colors.neutral.gray3 }} />}
                        defaultExpandIcon={<ArrowRightIcon style={{ color: Colors.neutral.gray3 }} />}
                        style={{ pointerEvents: 'auto' }}
                    >
                        {pathArr && !_.isEmpty(pathArr)
                            ? pathArr?.map((path, pathIndex) => {
                                  const pathNodeId = treeNodeIndex++;

                                  return (
                                      <PathTreeItem
                                          projectType={projectType}
                                          key={pathNodeId}
                                          nodeId={pathNodeId}
                                          // resourceId={resource?.resourceId}
                                          path={path}
                                          resetSelectedOperation={() => {
                                              resetSelectedOperation();
                                          }}
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              resetSelectedOperation();
                                          }}
                                      >
                                          {simulateData?.data && !_.isEmpty(simulateData?.data)
                                              ? simulateData.data?.map((operation, operationIndex) => {
                                                    // console.log(operation);
                                                    if (
                                                        operation?.endpoint == '/' + path ||
                                                        operation?.endpoint.includes('/' + path + '?')
                                                    ) {
                                                        const operationNodeId = treeNodeIndex++;

                                                        var opName = operation?.operation_id?.slice(
                                                            operation.operation_id.indexOf('/') + 1,
                                                        );
                                                        return (
                                                            <OperationTreeItem
                                                                key={operationNodeId}
                                                                nodeId={operationNodeId}
                                                                selected={selectedEndpoint}
                                                                pathId={path?.pathId}
                                                                type={operation?.httpMethod.toUpperCase()}
                                                                operation={opName}
                                                                resetSelectedOperation={() => {
                                                                    resetSelectedOperation();
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();

                                                                    setSelectedEndpoint(operationIndex);
                                                                    if (operationIndex != selectedEndpoint) {
                                                                        onSimulateSelect(operation);
                                                                    }
                                                                }}
                                                            />
                                                        );
                                                    }
                                                })
                                              : null}
                                      </PathTreeItem>
                                  );
                              })
                            : null}
                    </TreeView>
                ) : (
                    <div className="flex-1 justify-center flex flex-col items-center">
                        <img src={EmptyState} className="mb-1" style={{ height: '120px', width: '120px' }} />

                        <p className="text-overline2 mb-5">You don’t have any Paths</p>

                        {canEdit() && <PrimaryButton onClick={showAddResourceDialog}>Create Resource</PrimaryButton>}
                    </div>
                ))}
        </div>
    );
};

export default Resources;
