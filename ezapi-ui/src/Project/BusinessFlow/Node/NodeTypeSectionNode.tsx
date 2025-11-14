import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import axios, { CancelTokenSource } from 'axios';
import { useContext, useEffect, useState } from 'react';
import { Handle, HandleType, Node, Position, XYPosition, useNodeId } from 'reactflow';
import ApiIcon from '../../../icons/ApiIcon.svg';
import FunctionIcon from '../../../icons/FunctionIcon.svg';
import Json from '../../../icons/Json.svg';
import LoopIcon from '../../../icons/LoopIcon.svg';
import apiLoop from '../../../icons/apiLoop.svg';
import BranchIcon from '../../../icons/branch.svg';
import branchLoop from '../../../icons/branchLoop.svg';
import FilterIcon from '../../../icons/filter.svg';
import filterLoop from '../../../icons/filterLoop.svg';
import { BusinessFlowContext } from '../BusinessFlowContext';
import { NODE_TYPES } from '../constants';
import { NodeProps, UpdateNodeAPIProps } from '../interfaces';
import { NewAggregateCard } from '../interfaces/aggregate-cards';
import { createAggregateCard, updateNodeOnServer } from '../services';
import { MyReactFlowState } from '../store';
import { prepareAggregateCardFromNode, prepareNodeFromAggregateCard } from '../transformers';

interface NodeTypeSelectionState {
    type: string;
    data: any;
}

function NodeTypeSectionNode(props: NodeProps) {
    const nodeId: string = useNodeId() || '';
    const { useStore, projectId, operationId } = useContext(BusinessFlowContext);
    const { xPos, yPos } = props;

    const setNodeType = useStore((state: MyReactFlowState) => state.setNodeType);
    const addChildNode = useStore((state: MyReactFlowState) => state.addChildNode);
    const [selectedMenu, setSelectedMenu] = useState('');

    const nodes = useStore((state: MyReactFlowState) => state.nodes);
    const numberOfNodes = (nodeType: string) => nodes.filter((node: Node) => node.type === nodeType).length;

    const [updateNodeDataProps, setUpdateNodeDataProps] = useState<NodeTypeSelectionState | null>();

    useEffect(() => {
        const source: CancelTokenSource = axios.CancelToken.source();

        const updateNodeDataOnServerFn = async () => {
            if (updateNodeDataProps) {
                console.log('NodeTypeSectionNode.nodes', nodes);

                const updatedNode: any = { ...nodes.find((node: Node) => node.id === nodeId) };
                updatedNode.type = updateNodeDataProps.type;
                updatedNode.data = {
                    ...updateNodeDataProps.data,
                };

                const updatedNodeRequestData: UpdateNodeAPIProps = {
                    card: prepareAggregateCardFromNode(updatedNode, projectId, operationId),
                    position: updatedNode.position,
                    setNodeType,
                };
                await updateNodeOnServer(updatedNodeRequestData, source);
            }
        };

        updateNodeDataOnServerFn();

        return () => {
            source.cancel('Cancelled previous request to update a node on server');
        };
    }, [updateNodeDataProps]);

    const attachNewExternalNodeToFilterNode = async () => {
        const newAggregateCardPosition: XYPosition = {
            x: xPos + 600,
            y: yPos,
        };

        const newAggregateCard: NewAggregateCard = {
            projectId,
            operationId,
            type: NODE_TYPES.EXTERNAL_API_NODE,
            name: `New Node ${nodes.length}`,
            parentNode: nodeId,
            inputNodeIds: [nodeId],
            runData: {
                method: 'post',
                url: '',
                headers: [],
                body: {
                    data: {},
                },
            },
            branchData: {
                conditions: [],
            },
            mainData: {},
        };
        const createdAggregateCard = await createAggregateCard(newAggregateCard);
        const newNode = prepareNodeFromAggregateCard(createdAggregateCard, newAggregateCardPosition);

        addChildNode({
            newNode: newNode,
            handleId: nodeId,
            handleType: 'source' as HandleType,
            triggerSaveFlowState: false,
            triggerUpdateHistory: false,
        });

        return newNode;
    };

    const handleNodeType = async (type: string) => {
        if (type === 'PAYLOAD_BUILDER' && nodes.find((node: Node) => node.type === NODE_TYPES.PAYLOAD_BUILDER_NODE)) {
            return;
        }
        switch (type) {
            case 'API': {
                setUpdateNodeDataProps({
                    type: NODE_TYPES.EXTERNAL_API_NODE,
                    data: {
                        commonData: {
                            ...props.data.commonData,
                        },
                        runData: {
                            ...(props.data.runData || {}),
                            method: 'GET',
                            url: '',
                            headers: [],
                            body: {
                                data: {},
                            },
                        },
                    },
                });
                break;
            }
            case 'BRANCH': {
                setNodeType(nodeId, NODE_TYPES.BRANCH_NODE, {
                    conditions: [],
                });
                break;
            }
            case 'LOOP': {
                setNodeType(nodeId, NODE_TYPES.LOOP_NODE, {});
                break;
            }
            case 'FILTER': {
                const newNode = await attachNewExternalNodeToFilterNode();
                setUpdateNodeDataProps({
                    type: NODE_TYPES.FILTER_NODE,
                    data: {
                        commonData: {
                            ...props.data.commonData,
                            name: `New Filter ${numberOfNodes(NODE_TYPES.FILTER_NODE) + 1}`,
                        },
                        runData: {},
                        mainData: {},
                        filterData: {
                            ...(props.data.filterData || {}),
                            filterType: 'filter exclude and replace',
                            sourceNodeId: props.data.commonData.parentNode || '',
                            targetNodeId: newNode.id,
                            replacedFields: [],
                            excludedFields: [],
                        },
                    },
                });
                break;
            }

            case 'PAYLOAD_BUILDER': {
                setNodeType(nodeId, NODE_TYPES.PAYLOAD_BUILDER_NODE, {});
                setUpdateNodeDataProps({
                    type: NODE_TYPES.PAYLOAD_BUILDER_NODE,
                    data: {
                        commonData: {
                            ...props.data.commonData,
                            name: `Payload Response ${numberOfNodes(NODE_TYPES.PAYLOAD_BUILDER_NODE) + 1}`,
                        },
                        runData: {},
                        mainData: {},
                        filterData: {},
                        responsePayloadData: {
                            ...(props.data.responsePayloadData || {}),
                            customMapping: false,
                            cardId: '',
                            data: {},
                        },
                    },
                });
                break;
            }
            default:
                break;
        }
    };
    const handleSubNodeType = async (type: string) => {
        console.log('handlingSubNodeclick', type);
        switch (type) {
            case 'LOOP':
                setUpdateNodeDataProps({
                    type: NODE_TYPES.EXTERNAL_API_NODE_LOOP,
                    data: {
                        commonData: {
                            ...props.data.commonData,
                        },
                        runData: {
                            ...(props.data.runData || {}),
                            method: 'GET',
                            url: '',
                            headers: [],
                            body: {
                                data: {},
                            },
                        },
                    },
                });
                break;
            // case 'BRANCH':
            //     setNodeType(nodeId, NODE_TYPES.BRANCH_NODE, {
            //         conditions: [],
            //     });
            //     break;
            // case 'FILTER':
            //     const newNode = await attachNewExternalNodeToFilterNode();
            //     setUpdateNodeDataProps({
            //         type: NODE_TYPES.FILTER_NODE,
            //         data: {
            //             commonData: {
            //                 ...props.data.commonData,
            //                 name: `New Filter ${numberOfNodes(NODE_TYPES.FILTER_NODE) + 1}`,
            //             },
            //             runData: {},
            //             mainData: {},
            //             filterData: {
            //                 ...(props.data.filterData || {}),
            //                 filterType: 'filter exclude and replace',
            //                 sourceNodeId: props.data.commonData.parentNode || '',
            //                 targetNodeId: newNode.id,
            //                 replacedFields: [],
            //                 excludedFields: [],
            //             },
            //         },
            //     });
            //     break;

            default:
                break;
        }
    };

    return (
        <>
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#555' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={props.isConnectable}
            />
            <Stack sx={{ width: '182px', bgcolor: 'background.paper', border: '1px solid #C0CCDA' }}>
                <nav>
                    <List disablePadding>
                        <ListItem sx={{ padding: '0' }} onClick={() => handleNodeType('API')}>
                            <ListItemButton disableGutters>
                                <ListItemIcon sx={{ minWidth: '35px', marginLeft: '14px' }}>
                                    <img src={ApiIcon} style={{ width: '24px', height: '24px', alignSelf: 'center' }} />
                                </ListItemIcon>
                                <ListItemText primary="API" />
                            </ListItemButton>
                        </ListItem>
                        <ListItem sx={{ padding: '0' }} onClick={() => handleNodeType('BRANCH')}>
                            <ListItemButton disableGutters>
                                <ListItemIcon sx={{ minWidth: '35px', marginLeft: '14px' }}>
                                    <img
                                        src={BranchIcon}
                                        style={{ width: '24px', height: '24px', alignSelf: 'center' }}
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Branch" />
                            </ListItemButton>
                        </ListItem>
                        <div style={{ display: 'flex' }}>
                            <Stack sx={{ width: '182px' }}>
                                <ListItem
                                    sx={{ padding: '0' }}
                                    onMouseEnter={() => setSelectedMenu('LOOP')}
                                    onMouseLeave={() => setSelectedMenu('')}
                                >
                                    <ListItemButton disableGutters>
                                        <ListItemIcon sx={{ minWidth: '35px', marginLeft: '14px' }}>
                                            <img
                                                src={LoopIcon}
                                                style={{ width: '24px', height: '24px', alignSelf: 'center' }}
                                            />
                                        </ListItemIcon>
                                        <ListItemText primary="Loop" />
                                        {selectedMenu !== 'LOOP' && (
                                            <ListItemIcon style={{ minWidth: 'auto', marginRight: '14px' }}>
                                                <KeyboardArrowRightIcon />
                                            </ListItemIcon>
                                        )}
                                    </ListItemButton>
                                </ListItem>
                            </Stack>

                            {selectedMenu === 'LOOP' && (
                                <Stack
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: '182px',

                                        width: '200px',
                                        bgcolor: 'background.paper',
                                        border: '1px solid #C0CCDA',
                                    }}
                                    onMouseEnter={() => setSelectedMenu('LOOP')}
                                    onMouseLeave={() => setSelectedMenu('')}
                                >
                                    <nav>
                                        <List disablePadding>
                                            <ListItem
                                                sx={{ padding: '0' }}
                                                button
                                                onClick={() => handleSubNodeType('LOOP')}
                                            >
                                                <ListItemButton disableGutters>
                                                    <ListItemIcon sx={{ minWidth: '35px', marginLeft: '14px' }}>
                                                        <img
                                                            src={apiLoop}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                alignSelf: 'center',
                                                            }}
                                                        />
                                                    </ListItemIcon>
                                                    <ListItemText primary="API call In a Loop" />
                                                </ListItemButton>
                                            </ListItem>
                                            <ListItem
                                                sx={{ padding: '0' }}
                                                button
                                                onClick={() => handleSubNodeType('BRANCH')}
                                            >
                                                <ListItemButton disableGutters disabled>
                                                    <ListItemIcon sx={{ minWidth: '35px', marginLeft: '14px' }}>
                                                        <img
                                                            src={branchLoop}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                alignSelf: 'center',
                                                            }}
                                                        />
                                                    </ListItemIcon>
                                                    <ListItemText primary="Loop with Branch" />
                                                </ListItemButton>
                                            </ListItem>
                                            <ListItem
                                                sx={{ padding: '0' }}
                                                button
                                                onClick={() => handleSubNodeType('FILTER')}
                                            >
                                                <ListItemButton disableGutters disabled>
                                                    <ListItemIcon sx={{ minWidth: '35px', marginLeft: '14px' }}>
                                                        <img
                                                            src={filterLoop}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                alignSelf: 'center',
                                                            }}
                                                        />
                                                    </ListItemIcon>
                                                    <ListItemText primary="Loop with Filter" />
                                                </ListItemButton>
                                            </ListItem>
                                        </List>
                                    </nav>
                                </Stack>
                            )}
                        </div>

                        <ListItem sx={{ padding: '0' }} onClick={() => handleNodeType('FILTER')}>
                            <ListItemButton disableGutters>
                                <ListItemIcon sx={{ minWidth: '35px', marginLeft: '14px' }}>
                                    <img
                                        src={FilterIcon}
                                        style={{ width: '24px', height: '24px', alignSelf: 'center' }}
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Filter" />
                            </ListItemButton>
                        </ListItem>
                        <ListItem sx={{ padding: '0' }} onClick={() => handleNodeType('FUNCTION')}>
                            <ListItemButton disableGutters disabled>
                                <ListItemIcon sx={{ minWidth: '35px', marginLeft: '14px' }}>
                                    <img
                                        src={FunctionIcon}
                                        style={{ width: '24px', height: '24px', alignSelf: 'center' }}
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Function" />
                            </ListItemButton>
                        </ListItem>
                        <ListItem sx={{ padding: '0' }} onClick={() => handleNodeType('PAYLOAD_BUILDER')}>
                            <ListItemButton disableGutters>
                                <ListItemIcon sx={{ minWidth: '35px', marginLeft: '14px' }}>
                                    <img src={Json} style={{ width: '24px', height: '24px', alignSelf: 'center' }} />
                                </ListItemIcon>
                                <ListItemText primary="Payload Builder" />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </nav>
            </Stack>
        </>
    );
}

export { NodeTypeSectionNode };
