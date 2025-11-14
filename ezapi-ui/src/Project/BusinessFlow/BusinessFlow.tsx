import { SocketContext } from '@/Context/socket';
import branchQueryAtom from '@/shared/atom/branchQueryAtom';
import drawerCardAtom from '@/shared/atom/drawerCardAtom';
import filterAtom from '@/shared/atom/filterAtom';
import responseMapperAtom from '@/shared/atom/reponseMapperAtom';
import selectedNodeAtom from '@/shared/atom/selectedNodeAtom';
import { operationAtomWithMiddleware } from '@/shared/utils';
import { CircularProgress, Drawer, Stack } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    DefaultEdgeOptions,
    Edge,
    FitViewOptions,
    Node,
    OnConnectEnd,
    OnConnectStart,
    OnConnectStartParams,
    ReactFlowProvider,
    Viewport,
    XYPosition,
    useReactFlow,
    useStoreApi,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRecoilState } from 'recoil';
import { shallow } from 'zustand/shallow';
import { BusinessFlowContext } from './BusinessFlowContext';
import {
    BranchNode,
    ExternalAPINode,
    FilterNode,
    LoopNode,
    MainNode,
    NodeTypeSectionNode,
    PayloadNode,
    StartNode,
} from './Node';
import { AggregateMapping } from './Node/Components/AggregateMapping';
import { BranchQuerySelector } from './Node/Components/BranchQuerySelector';
import { FilterDrawer } from './Node/Components/FilterDrawer';
import { ExternalAPIDrawer } from './Node/ExternalAPIDrawer';
import { NODE_TYPES } from './constants';
import { DEFAULT_BUSINESS_FLOW_STATE } from './defaults';
import './index.css';
import { IBusinessFlow } from './interfaces';
import { NewAggregateCard } from './interfaces/aggregate-cards';

import deleteNodeAtom from '@/shared/atom/deleteNodeAtom';
import loaderAtom from '@/shared/atom/loaderAtom';
import triggerCollapseNodeAtom from '@/shared/atom/triggerCollapseNodeAtom';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
import { createAggregateCard, fetchAggregateMetaData, fetchNodeFromServer } from './services';
import createStore, { MyReactFlowState, getInputNodeIdsFromNode } from './store';
import { prepareNodeFromAggregateCard, prepareNodeFromAggregateCardResponse } from './transformers';

const canvasBackgroundColor = '#1A192B';
const edgeStrokeColor = '#fff';
const connectionLineStrokeColor = '#fff';

const nodeTypes = {
    [NODE_TYPES.PAYLOAD_BUILDER_NODE]: PayloadNode,
    [NODE_TYPES.FILTER_NODE]: FilterNode,
    [NODE_TYPES.BRANCH_NODE]: BranchNode,
    [NODE_TYPES.LOOP_NODE]: LoopNode,
    [NODE_TYPES.START_NODE]: StartNode,
    [NODE_TYPES.SELECTION_NODE]: NodeTypeSectionNode,
    [NODE_TYPES.EXTERNAL_API_NODE]: ExternalAPINode,
    [NODE_TYPES.EXTERNAL_API_NODE_LOOP]: ExternalAPINode,
    [NODE_TYPES.MAIN_NODE]: MainNode,
};

const fitViewOptions: FitViewOptions = {
    padding: 0.2,
};

const connectionLineStyle = {
    stroke: connectionLineStrokeColor,
};

const defaultViewPort: Viewport = {
    x: 200,
    y: 200,
    zoom: 1,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
    animated: true,
    style: {
        strokeWidth: 2,
        stroke: edgeStrokeColor,
    },
};

const selector = (state: MyReactFlowState) => ({
    nodes: state.nodes,
    edges: state.edges,
    history: state.history,
    updateHistory: state.updateHistory,
    currentIndex: state.currentIndex,
    setCurrentIndex: state.setCurrentIndex,
    setElements: state.setElements,
    updateElementsAndCurrentIndex: state.updateElementsAndCurrentIndex,
    onNodesChange: state.onNodesChange,
    onNodesDelete: state.onNodesDelete,
    onEdgesChange: state.onEdgesChange,
    onConnect: state.onConnect,
    updateNodeData: state.updateNodeData,
    addChildNode: state.addChildNode,
    setNodeType: state.setNodeType,
});

interface GetChildNodePositionProps {
    event: MouseEvent;
    parentNode?: Node;
    store: any;
    project: (position: XYPosition) => XYPosition;
}

const getChildNodePosition = ({ event, store, project, parentNode }: GetChildNodePositionProps) => {
    const { domNode } = store.getState();

    if (
        !domNode ||
        // we need to check if these properites exist, because when a node is not initialized yet,
        // it doesn't have a positionAbsolute nor a width or height
        !parentNode?.positionAbsolute ||
        !parentNode?.width ||
        !parentNode?.height
    ) {
        return;
    }

    const { top, left } = domNode.getBoundingClientRect();

    // we need to remove the wrapper bounds, in order to get the correct mouse position
    const panePosition = project({
        x: event.clientX - left,
        y: event.clientY - top,
    });

    // we are calculating with positionAbsolute here because child nodes are positioned relative to their parent
    return {
        x: panePosition.x,
        y: panePosition.y,
    };
};

interface CreateNewAggregateCardProps {
    projectId: string;
    operationId: string;
    parentNode: Node | undefined;
    position: XYPosition;
    nodes: Node[];
    edges: Edge[];
    addChildNode: Function;
    source?: CancelTokenSource;
    handleId: string | null;
    handleType: string | null;
}

const createNewAggregateCard = async ({
    projectId,
    operationId,
    parentNode,
    position,
    nodes,
    edges,
    source,
    addChildNode,
    handleId,
    handleType,
}: CreateNewAggregateCardProps) => {
    let inputNodeIds: string[] = [];
    if (parentNode?.id) {
        const parentInputNodeIds = getInputNodeIdsFromNode(parentNode.id, edges);
        inputNodeIds = [parentNode.id, ...parentInputNodeIds];
    }
    const newAggregateCard: NewAggregateCard = {
        projectId,
        operationId,
        type: 'selectionNode',
        name: `New Node ${nodes.length}`,
        parentNode: parentNode?.id || '',
        inputNodeIds: inputNodeIds,
        runData: {},
        branchData: {
            conditions: [],
        },
        mainData: {},
        responsePayloadData: {},
    };
    const createdAggregateCard = await createAggregateCard(newAggregateCard, source);
    const newNode = prepareNodeFromAggregateCard(createdAggregateCard, position);

    addChildNode({
        newNode: newNode,
        handleId: handleId,
        handleType: handleType,
    });
};

const Flow = () => {
    const { initialNodes, initialEdges, useStore, projectId, operationId } = useContext(BusinessFlowContext);
    const [openMappingDrawer, setOpenMappingDrawer] = useState(false);
    const [openFilterDrawer, setOpenFilterDrawer] = useState(false);
    const [selectBranchQuery, setSelectBranchQuery] = useState(false);
    const [showAPIDrawer, setShowAPIDrawer] = useState(false);
    const [refreshDrawer, setRefreshDrawer] = useState(false);

    const [deleteData, setDeleteData] = useRecoilState<Node[] | undefined | string>(deleteNodeAtom);
    const [selectedNode, setSelectedNode] = useRecoilState(selectedNodeAtom);
    const [triggerCollapseNode, setTriggerCollapseNode] = useRecoilState(triggerCollapseNodeAtom);

    const [selectedBranchCondition, setSelectedBranchCondition] = useRecoilState(branchQueryAtom);
    const [selectedCard, setSelectedCard] = useRecoilState(drawerCardAtom);
    const [showResponseMapping, setShowResponseMapping] = useRecoilState(responseMapperAtom);
    const [filterType, setFilterType] = useRecoilState(filterAtom);
    const [isLoading, setIsLoading] = useRecoilState(loaderAtom);
    const { project, fitView } = useReactFlow();
    const reactFlowWrapper = useRef<HTMLInputElement>(null);
    const connectionStartParams = useRef<OnConnectStartParams | null>(null);

    const store = useStoreApi();
    const {
        nodes,
        edges,
        onNodesChange,
        onNodesDelete,
        onEdgesChange,
        onConnect,
        addChildNode,
        updateNodeData,
    }: MyReactFlowState = useStore(selector, shallow);

    const socket = useContext(SocketContext);

    useEffect(() => {
        if (socket) {
            socket.on('filterUpdateDone', (data: any) => {
                if (data && data.cards) {
                    const targetIds = Object.keys(data.cards);
                    targetIds.map((id) => {
                        const node = prepareNodeFromAggregateCardResponse(data.cards[`${id}`]);
                        updateNodeData(id, node.data);
                    });
                }
            });
        }
    }, []);

    const [newNodeInfo, setNewNodeInfo] = useState<{ parentNode: Node | undefined; position: XYPosition } | null>(null);

    // const undo = () => {
    //     const newCurrentIndex = currentIndex - 1;

    //     if (newCurrentIndex < 0) {
    //         setElements(initialNodes, initialEdges);
    //         setCurrentIndex(-1);
    //     } else {
    //         const { nodes: newNodes, edges: newEdges } = history[newCurrentIndex];
    //         setElements(newNodes, newEdges);
    //         setCurrentIndex(newCurrentIndex);
    //     }
    // };

    // const redo = () => {
    //     if (currentIndex === history.length - 1) {
    //         return;
    //     }
    //     const newCurrentIndex = currentIndex + 1;

    //     const { nodes: newNodes, edges: newEdges } = history[newCurrentIndex];
    //     setElements(newNodes, newEdges);
    //     setCurrentIndex(newCurrentIndex);
    // };

    const onKeyDown = (event: KeyboardEvent) => {
        const ctrl = event.ctrlKey ? 'Control-' : '';
        const alt = event.altKey ? 'Alt-' : '';
        const meta = event.metaKey ? 'Meta-' : '';
        const shift = event.shiftKey ? 'Shift-' : '';
        const key = `${ctrl}${alt}${shift}${meta}${event.key}`;
        // if (key === 'Meta-z')
        // if (key === 'Shift-Meta-z') redo();
    };

    useEffect(() => {
        if (selectedNode !== '' && selectedBranchCondition === '' && filterType === '') {
            setOpenMappingDrawer(true);
        }
    }, [selectedNode]);

    useEffect(() => {
        if (selectedBranchCondition !== '' && selectedNode !== '' && filterType === '') {
            setSelectBranchQuery(true);
        }
    }, [selectedBranchCondition]);

    useEffect(() => {
        if (filterType !== '' && selectedNode !== '' && selectedBranchCondition === '') {
            setOpenFilterDrawer(true);
        }
    }, [filterType]);

    useEffect(() => {
        if (selectedCard !== '') {
            setShowAPIDrawer(true);
        }
    }, [selectedCard]);

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    });

    const onLoad = () => {
        const selectionNode = nodes.find((node) => node.type === 'selectionNode');
        if (!selectionNode) {
            fitView(fitViewOptions);
        }
    };

    useEffect(() => {
        if (typeof deleteData === 'string') {
            const nodeData = nodes.filter((n) => n.id === deleteData);
            if (nodeData.length > 0) {
                setDeleteData(nodeData);
            }
        }
    }, [deleteData]);

    useEffect(() => {
        const source: CancelTokenSource = axios.CancelToken.source();
        if (newNodeInfo?.position) {
            createNewAggregateCard({
                projectId,
                operationId,
                parentNode: newNodeInfo?.parentNode,
                position: newNodeInfo?.position,
                nodes,
                edges,
                addChildNode,
                source,
                handleId: connectionStartParams.current?.handleId || null,
                handleType: connectionStartParams.current?.handleType || null,
            });
        }

        return () => {
            source.cancel('Cancelled previous request to create a node on server');
        };
    }, [newNodeInfo]);

    const onConnectStart: OnConnectStart = useCallback((_, params: OnConnectStartParams) => {
        connectionStartParams.current = params;
    }, []);

    const onConnectEnd: OnConnectEnd = useCallback(
        (event: MouseEvent) => {
            const { nodeInternals } = store.getState();
            const targetIsPane = (event.target as Element).classList.contains('react-flow__pane');

            if (targetIsPane && connectionStartParams.current) {
                const parentNode: any = nodeInternals.get(connectionStartParams.current.nodeId as string);
                if (!parentNode) {
                    return;
                }
                const childNodePosition = getChildNodePosition({
                    event,
                    parentNode,
                    store,
                    project,
                });
                if (childNodePosition) {
                    setNewNodeInfo({ parentNode, position: childNodePosition });
                }
            }
        },
        [getChildNodePosition, project],
    );

    return (
        <div className="wrapper" ref={reactFlowWrapper}>
            {deleteData !== undefined && typeof deleteData !== 'string' && (
                <ConfirmDialog
                    title={'Delete Node'}
                    //description={'Are you sure you want to delete the node? Once deleted you cant get it back.'}
                    description={'This Action will delete the node permanently. Do you wish to proceed ?'}
                    onCancel={() => {
                        setDeleteData(undefined);
                    }}
                    onConfirm={() => {
                        onNodesDelete(deleteData!);
                        setDeleteData(undefined);
                        setIsLoading(true);
                    }}
                />
            )}
            <Drawer
                anchor={'right'}
                open={openMappingDrawer || showResponseMapping}
                onClose={() => {
                    if (showResponseMapping) {
                        setShowResponseMapping(false);
                    } else {
                        setOpenMappingDrawer(false);
                        setSelectedNode('');
                    }
                }}
                PaperProps={{
                    style: {
                        height: '100%',
                        width: '100%',
                        position: 'absolute',
                    },
                }}
            >
                <AggregateMapping
                    isResponse={showResponseMapping}
                    nodeId={selectedNode}
                    operationId={operationId}
                    projectId={projectId}
                    inputNodeIds={
                        nodes.find((node: Node) => node.id === selectedNode)?.data.commonData.inputNodeIds || []
                    }
                    selectedNodeCardType={nodes.find((node: Node) => node.id === selectedNode)?.type || ''}
                    onClose={async (type: string) => {
                        const node = nodes.find((node: Node) => node.id === selectedNode);
                        if (showResponseMapping) {
                            setShowResponseMapping(false);
                        } else {
                            setOpenMappingDrawer(false);
                            setSelectedNode('');
                            if (node) {
                                setTriggerCollapseNode(node.id);
                            }
                        }
                        if (node && type == 'save') {
                            const getNodeData = {
                                projectId,
                                operationId,
                                nodeId: node.id,
                            };
                            const latestNodeInfo = await fetchNodeFromServer(getNodeData);
                            updateNodeData(node.id, latestNodeInfo.data);
                            setRefreshDrawer(true);
                            setTriggerCollapseNode(node.id);
                        }
                    }}
                />
            </Drawer>

            <Drawer
                anchor={'right'}
                open={openFilterDrawer}
                onClose={() => {
                    setOpenFilterDrawer(false);
                    setSelectedNode('');
                    setFilterType('');
                }}
                PaperProps={{
                    style: {
                        height: '100%',
                        width: '80%',
                        position: 'absolute',
                    },
                }}
            >
                <FilterDrawer
                    type={filterType}
                    nodeId={selectedNode}
                    operationId={operationId}
                    projectId={projectId}
                    inputNodeIds={
                        nodes.find((node: Node) => node.id === selectedNode)?.data.commonData.inputNodeIds || []
                    }
                    onClose={async () => {
                        const node = nodes.find((node: Node) => node.id === selectedNode);
                        let targetNode: Node | undefined = undefined;
                        if (node && node.type === NODE_TYPES.FILTER_NODE && node.data.filterData?.targetNodeId) {
                            targetNode = nodes.find((node: Node) => node.id === node.data.filterData?.targetNodeId);
                        }
                        if (targetNode) {
                            const getNodeData = {
                                projectId,
                                operationId,
                                nodeId: targetNode.id,
                            };
                            const latestNodeInfo = await fetchNodeFromServer(getNodeData);
                            updateNodeData(targetNode.id, latestNodeInfo.data);
                        }
                        setOpenFilterDrawer(false);
                        setSelectedNode('');
                        setFilterType('');
                    }}
                />
            </Drawer>
            <Drawer
                anchor={'right'}
                open={selectBranchQuery}
                onClose={() => {
                    setSelectBranchQuery(false);
                    setSelectedBranchCondition('');
                    setSelectedNode('');
                }}
                PaperProps={{
                    style: {
                        height: '100%',
                        width: '85%',
                        position: 'absolute',
                    },
                }}
            >
                <BranchQuerySelector
                    conditionId={selectedBranchCondition}
                    nodeId={selectedNode}
                    inputNodeIds={
                        nodes.find((node: Node) => node.id === selectedNode)?.data.commonData.inputNodeIds || []
                    }
                    operationId={operationId}
                    projectId={projectId}
                    onClose={async () => {
                        setSelectBranchQuery(false);
                        setSelectedBranchCondition('');
                        setSelectedNode('');
                    }}
                />
            </Drawer>
            <Drawer
                anchor={'right'}
                open={showAPIDrawer}
                onClose={() => {
                    setShowAPIDrawer(false);
                    setSelectedCard('');
                }}
                PaperProps={{
                    style: {
                        height: '100%',
                        width: '55%',
                        position: 'absolute',
                    },
                }}
                sx={{ overflow: 'unset' }}
            >
                <ExternalAPIDrawer cardId={selectedCard} refresh={refreshDrawer} setRefresh={setRefreshDrawer} />
            </Drawer>
            <ReactFlow
                onLoad={onLoad}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onNodesDelete={(data: Node[]) => {
                    if (data && data[0] && data[0].type !== 'mainNode') {
                        setDeleteData(data);
                    }
                }}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                defaultEdgeOptions={defaultEdgeOptions}
                defaultViewport={defaultViewPort}
                fitViewOptions={fitViewOptions}
                nodeTypes={nodeTypes}
                connectionLineStyle={connectionLineStyle}
                style={{ background: canvasBackgroundColor }}
                proOptions={{ hideAttribution: true }}
            >
                <Background color={canvasBackgroundColor} variant={BackgroundVariant.Dots} />
                <Controls />
            </ReactFlow>
        </div>
    );
};

function BusinessFlow() {
    const [initialState, setInitialState] = useState<IBusinessFlow>({ ...DEFAULT_BUSINESS_FLOW_STATE });

    const [isLoading, setIsLoading] = useRecoilState(loaderAtom);

    const { projectId = '' }: { projectId: string } = useParams();
    const [operationData, _] = useRecoilState(operationAtomWithMiddleware);
    const operationId = operationData?.operation?.operationId;

    useEffect(() => {
        setIsLoading(true);

        const source: CancelTokenSource = axios.CancelToken.source();

        const loadFlowStateFromServer = async () => {
            const response = await fetchAggregateMetaData(
                {
                    projectId,
                    operationId,
                },
                source,
            );

            const initialNodes = response?.nodes && response?.nodes.length ? response.nodes : [];
            const initialEdges = response?.edges && response?.edges.length ? response.edges : [];

            const newInitialStoreState = {
                projectId,
                operationId,
                initialNodes,
                initialEdges,
                isInitialStateLoaded: true,
                setIsLoading,
            };
            const useStore = createStore({
                ...newInitialStoreState,
            });
            setInitialState({
                ...newInitialStoreState,
                useStore,
            });
            setIsLoading(false);
        };

        loadFlowStateFromServer();

        return () => {
            source.cancel('Cancelled previous request to load business flow state from server');
        };
    }, [projectId, operationId]);

    return (
        <div className="flex-1 relative w-full h-full">
            {!isLoading && initialState.isInitialStateLoaded && projectId && operationId ? (
                <BusinessFlowContext.Provider value={{ ...initialState }}>
                    <ReactFlowProvider>
                        <Flow />
                    </ReactFlowProvider>
                </BusinessFlowContext.Provider>
            ) : (
                <Stack
                    sx={{
                        width: '100%',
                        height: '100%',
                        background: canvasBackgroundColor,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    gap={2}
                >
                    <CircularProgress size={50} />
                    <p style={{ color: connectionLineStrokeColor, fontSize: '20px' }}>{'Loading...'}</p>
                    <div style={{ height: '30px' }} />
                </Stack>
            )}
        </div>
    );
}

export default BusinessFlow;
