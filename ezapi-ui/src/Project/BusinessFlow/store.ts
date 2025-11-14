import {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    Connection,
    Edge,
    EdgeChange,
    HandleType,
    NodeChange,
    OnConnect,
    OnEdgesChange,
    OnNodesChange,
    OnNodesDelete,
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { NODE_TYPES, NON_DELETABLE_NODE_IDS, NON_DELETABLE_NODE_TYPES } from './constants';
import defaultEdges from './edges';
import { ElementsType, Node, UpdateNodeAPIProps } from './interfaces';
import defaultNodes from './nodes';
import { deleteNodesOnServer, saveAggregateMetaData, updateNodeOnServer } from './services';
import { prepareAggregateCardFromNode, prepareAggregateMetaData } from './transformers';

export interface AddChildNodeParams {
    newNode: Node;
    handleId: string | null;
    handleType: HandleType | null;
    triggerUpdateHistory?: boolean;
    triggerSaveFlowState?: boolean;
}

export type MyReactFlowState = {
    projectId: string;
    operationId: string;
    setProjectId: (projectId: string) => void;
    setOperationId: (operationId: string) => void;
    nodes: Node[];
    edges: Edge[];
    history: ElementsType[];
    updateHistory: () => void;
    currentIndex: number;
    setCurrentIndex: (index: number) => void;
    setElements: (nodes: Node[], edges: Edge[]) => void;
    updateElementsAndCurrentIndex: (elements: ElementsType, index: number) => void;
    onNodesChange: OnNodesChange;
    onNodesDelete: OnNodesDelete;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    updateNodeData: (nodeId: string, data: any) => void;
    addChildNode: (params: AddChildNodeParams) => void;
    setNodeType: (nodeId: string, type: string, data: any) => void;
};

// this is our useStore hook that we can use in our components to get parts of the store and call actions

interface InitialStoreProps {
    projectId: string;
    operationId: string;
    initialNodes: Node[];
    initialEdges: Edge[];
    setIsLoading: Function;
}

export function getInputNodeIdsFromNode(nodeId: string, edges: Edge[]): string[] {
    // get all the input node ids for a given node id
    const inputNodeIds = edges.filter((edge: Edge) => edge.target === nodeId).map((edge: Edge) => edge.source);

    // get all the input node ids for the input node ids
    inputNodeIds.forEach((inputNodeId: string) => {
        const inputNodeIdsForIndirectEdge = getInputNodeIdsFromNode(inputNodeId, edges);
        inputNodeIds.push(...inputNodeIdsForIndirectEdge);
    });

    return inputNodeIds;
}

export function updateInputNodeIdsForNodes(nodes: Node[], edges: Edge[]) {
    nodes.forEach((node: Node) => {
        if (
            [NODE_TYPES.EXTERNAL_API_NODE, NODE_TYPES.EXTERNAL_API_NODE_LOOP, NODE_TYPES.BRANCH_NODE].includes(
                node.type as string,
            )
        ) {
            const parentNode = node.data.commonData.parentNode;
            const inputNodeIds = getInputNodeIdsFromNode(node.id, edges);
            node.data.commonData.inputNodeIds = inputNodeIds;
            if (parentNode && !inputNodeIds.includes(parentNode)) {
                node.data.commonData.parentNode = '';
            }
        }
    });
}

const createStore = ({ projectId, operationId, initialNodes, initialEdges, setIsLoading }: InitialStoreProps) =>
    create<MyReactFlowState>((set: any, get: any) => ({
        projectId,
        operationId,

        nodes: initialNodes.length ? initialNodes : defaultNodes,
        edges: initialEdges.length ? initialEdges : defaultEdges,

        currentIndex: -1,
        history: [],

        deferredSaveId: null,

        setProjectId: (projectId: string) => set({ projectId }),
        setOperationId: (operationId: string) => set({ operationId }),

        setCurrentIndex: (index: number) => set({ currentIndex: index }),

        updateHistory: () => {
            const { nodes, edges, currentIndex, history } = get();
            const updatedHistory = [...history, { nodes, edges }];
            set({ history: updatedHistory, currentIndex: currentIndex + 1 });
        },
        resetHistory: () => {
            set({ history: [], currentIndex: -1 });
        },

        setElements: (nodes: Node[], edges: Edge[]) => {
            set({ nodes, edges });
        },
        updateElementsAndCurrentIndex(elements: ElementsType, index: number) {
            const { nodes, edges } = elements;
            set({ nodes, edges, currentIndex: index });
        },

        saveFlowState: () => {
            const { projectId, operationId, nodes, edges } = get();
            const props = prepareAggregateMetaData(projectId, operationId, nodes, edges);
            saveAggregateMetaData(props);
        },

        deferredSave: () => {
            const { deferredSaveId, saveFlowState } = get();

            if (deferredSaveId) {
                clearTimeout(deferredSaveId);
            }

            const newDeferredSaveId = setTimeout(() => {
                saveFlowState();
            }, 5000);

            set({ deferredSaveId: newDeferredSaveId });
        },

        onNodesChange: (changes: NodeChange[]) => {
            const { edges, nodes, setElements, deferredSave } = get();

            let parsedChanges: NodeChange[] = [];

            if (changes.length && changes[0].type === 'remove') {
                // We should not allow to delete the main node, start node or end node. Hence, we are skipping the changes
            } else {
                parsedChanges = changes;
                const updatedNodes = applyNodeChanges(parsedChanges, nodes);
                setElements(updatedNodes, edges);
            }
            // if (parsedChanges.length && parsedChanges[0].type !== 'remove') {
            //     deferredSave();
            // }
        },

        onNodesDelete: async (rfDeletedNodes: Node[]) => {
            const { nodes, edges, setElements, resetHistory, saveFlowState } = get();

            // remove non deletable nodes from the list of deleted nodes
            rfDeletedNodes = rfDeletedNodes.filter((deletedNode: Node) => {
                return (
                    deletedNode.selected === true &&
                    !(
                        NON_DELETABLE_NODE_IDS.includes(deletedNode.id) ||
                        NON_DELETABLE_NODE_TYPES.includes(deletedNode.type ?? '') ||
                        deletedNode.data.commonData.nonDeletable === true
                    )
                );
            });

            // check if deletedNodes has a filter node or a filter node's external api node. if it is, then delete both as well
            const nonFilteredDeletedNodeIds = rfDeletedNodes.map((deletedNode: Node) => deletedNode.id);
            const deletedNodeIds: string[] = [];

            nodes.forEach((node: Node) => {
                const isNodeInDeletedNodes = nonFilteredDeletedNodeIds.includes(node.id);

                if (node.type === NODE_TYPES.FILTER_NODE && isNodeInDeletedNodes) {
                    let targetNodeId = edges.find((edge: Edge) => edge.source === node.id)?.target;
                    const targetNode = nodes.find((node: Node) => node.id === targetNodeId);
                    if (
                        targetNode &&
                        (targetNode.type === NODE_TYPES.EXTERNAL_API_NODE ||
                            targetNode.type === NODE_TYPES.EXTERNAL_API_NODE_LOOP)
                    ) {
                        deletedNodeIds.push(targetNodeId);
                    }
                } else if (
                    (node.type === NODE_TYPES.EXTERNAL_API_NODE || node.type === NODE_TYPES.EXTERNAL_API_NODE_LOOP) &&
                    isNodeInDeletedNodes
                ) {
                    let parentNode = nodes.find((node: Node) => node.id === node.parentNode);
                    if (!parentNode) {
                        const parentNodeId = edges.find((edge: Edge) => edge.target === node.id)?.source;
                        if (parentNodeId) {
                            parentNode = nodes.find((node: Node) => node.id === parentNodeId);
                        }
                    }
                    if (parentNode && parentNode.type === NODE_TYPES.FILTER_NODE) {
                        deletedNodeIds.push(parentNode.id);
                    }
                }
                if (isNodeInDeletedNodes) {
                    deletedNodeIds.push(node.id);
                }
            });

            const deletedNodes = deletedNodeIds.map((deletedNodeId: string) =>
                nodes.find((node: Node) => node.id === deletedNodeId),
            );

            if (deletedNodes.length) {
                const updatedNodes = nodes.filter((node: Node) => !deletedNodeIds.includes(node.id));
                const updatedEdges = edges.filter(
                    (edge: Edge) => !(deletedNodeIds.includes(edge.source) || deletedNodeIds.includes(edge.target)),
                );
                updateInputNodeIdsForNodes(updatedNodes, updatedEdges);

                const aggregateMetaData = prepareAggregateMetaData(projectId, operationId, updatedNodes, updatedEdges);
                await deleteNodesOnServer({
                    projectId,
                    operationId,
                    cardIdsToDelete: deletedNodeIds,
                    updatedAggregateMetadata: {
                        nodes: aggregateMetaData.nodes,
                        edges: aggregateMetaData.edges,
                    },
                    updatedResponseMapper: {
                        responseHeaders: [],
                        responseBody: [],
                    },
                });

                setElements(updatedNodes, updatedEdges);
                // resetHistory();
                saveFlowState();
                setIsLoading(false);
            } else {
                setElements(nodes, edges);
            }
        },

        onEdgesChange: async (changes: EdgeChange[]) => {
            const { nodes, edges, setElements, updateHistory, saveFlowState } = get();

            let parsedChanges: EdgeChange[] = [];

            for (const change of changes) {
                if (change.type === 'remove' && change.id) {
                    const selectedEges = edges.filter((edge: Edge) => edge.id === change.id && edge.selected === true);
                    if (selectedEges.length) {
                        parsedChanges.push(change);
                    }
                } else {
                    parsedChanges.push(change);
                }
            }

            const updatedNodes = nodes;
            const updatedEdges = applyEdgeChanges(parsedChanges, edges);

            if (parsedChanges.length) {
                updateInputNodeIdsForNodes(updatedNodes, updatedEdges);
            }

            setElements(updatedNodes, updatedEdges);

            if (parsedChanges.length) {
                updateHistory();
                saveFlowState();
            }
        },

        onConnect: async (connection: Connection) => {
            const { projectId, operationId, nodes, edges, setElements, updateHistory, saveFlowState } = get();

            const updatedNodes = nodes;
            const updatedEdges = addEdge(connection, edges);

            updateInputNodeIdsForNodes(updatedNodes, updatedEdges);

            const updatedNode = updatedNodes.find((node: any) => node.id === connection.target);
            if (
                [NODE_TYPES.EXTERNAL_API_NODE, NODE_TYPES.EXTERNAL_API_NODE_LOOP, NODE_TYPES.BRANCH_NODE].includes(
                    updatedNode.type,
                )
            ) {
                const updatedNodeRequestData: UpdateNodeAPIProps = {
                    card: prepareAggregateCardFromNode(updatedNode, projectId, operationId),
                };
                await updateNodeOnServer(updatedNodeRequestData);
            }

            setElements(updatedNodes, updatedEdges);
            updateHistory();
            saveFlowState();
        },

        addChildNode: ({
            newNode,
            handleId,
            handleType,
            triggerSaveFlowState = true,
            triggerUpdateHistory = true,
        }: AddChildNodeParams) => {
            const { nodes, edges, setElements, updateHistory, saveFlowState } = get();

            const newEdge: Edge = {
                id: uuidv4(),
                source: newNode.data.commonData.parentNode,
                target: newNode.id,
                sourceHandle: handleType === 'source' ? handleId : null,
                targetHandle: handleType === 'target' ? handleId : null,
            };

            const updatedNodes = [...nodes, newNode];
            const updatedEdges = [...edges, newEdge];

            setElements(updatedNodes, updatedEdges);

            if (triggerUpdateHistory) {
                updateHistory();
            }
            if (triggerSaveFlowState) {
                saveFlowState();
            }
        },

        updateNodeData: (nodeId: string, data: any) => {
            const { nodes, edges, setElements, saveFlowState, deferredSave } = get();

            const updatedNodes = nodes.map((node: any) => {
                if (node.id === nodeId) {
                    // it's important to create a new object here, to inform React Flow about the cahnges
                    node.data = { ...data };
                }

                return node;
            });

            setElements(updatedNodes, edges);
            saveFlowState();
            // deferredSave();
        },

        setNodeType: async (nodeId: string, type: string, data: any) => {
            const { nodes, edges, setElements, updateHistory, saveFlowState } = get();

            const updatedNodes = nodes.map((node: any) => {
                if (node.id === nodeId) {
                    // it's important to create a new object here, to inform React Flow about the cahnges
                    node.type = type;
                    node.data = { ...node.data, ...data };
                }
                return node;
            });

            setElements(updatedNodes, edges);
            updateHistory();
            saveFlowState();
        },
    }));

export default createStore;
