import deleteNodeAtom from '@/shared/atom/deleteNodeAtom';
import filterAtom from '@/shared/atom/filterAtom';
import selectedNodeAtom from '@/shared/atom/selectedNodeAtom';
import { Delete } from '@mui/icons-material';
import { Card, Stack, TextField, Tooltip, Typography } from '@mui/material';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { Handle, NodeProps, Position, useNodeId } from 'reactflow';
import { useRecoilState } from 'recoil';
import Collapse from '../../../icons/collapse.svg';
import DialogIcon from '../../../icons/dialogIcon.svg';
import FilterIcon from '../../../icons/filter.svg';
import RunIcon from '../../../icons/runIcon.svg';
import useNodeHook from '../hooks/useNodeHook';
import { FilterRowData } from '../interfaces/aggregate-cards';

interface FilterNodeProps extends NodeProps {}

const FilterNode = (props: FilterNodeProps) => {
    const [collapse, setCollapse] = useState(false);
    const cardId: string = useNodeId() || '';
    const [_selectedNode, setSelectedNode] = useRecoilState(selectedNodeAtom);
    const [_filterType, setFilterType] = useRecoilState(filterAtom);
    const [replacedValue, setReplacedValue] = useState('');
    const [excludedValue, setExcludedValue] = useState('');
    const [_deleteData, setDeleteData] = useRecoilState<Node[] | undefined | string>(deleteNodeAtom);

    const { node, isNodeDataLoaded, isLoading } = useNodeHook({
        nodeId: cardId,
        getUpdatedNodeData: () => {},
        collapse: collapse,
    });

    const prepareData = () => {
        const filterData = _.isEmpty(props?.data?.filterData) ? node?.data.filterData : props.data.filterData;
        if (filterData) {
            let replacedString = '';
            let excludedString = '';
            if (filterData.replacedFields) {
                filterData.replacedFields.map((field: FilterRowData) => {
                    if (replacedString === '') {
                        replacedString = field.attributeName;
                    } else {
                        replacedString = replacedString + ', ' + field.attributeName;
                    }
                });
                setReplacedValue(replacedString);
            }

            if (filterData.excludedFields) {
                filterData.excludedFields.map((field: FilterRowData) => {
                    if (excludedString === '') {
                        excludedString = field.attributeName;
                    } else {
                        excludedString = excludedString + ', ' + field.attributeName;
                    }
                });
                setExcludedValue(excludedString);
            }
        }
    };

    useEffect(() => {
        if (isNodeDataLoaded) {
            prepareData();
        }
    }, [collapse, isNodeDataLoaded, isLoading, node, props]);
    return (
        <>
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#555' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={false}
            />
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#555' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={false}
            />
            <Card sx={{ width: '512px' }}>
                <Tooltip title={'Filter Node'} arrow placement="top">
                    <Stack
                        className={'custom-drag-handle'} //This is required to make only the header section draggable
                        direction={'row'}
                        sx={{ borderBottom: '1px solid #C0CCDA', height: '52px', padding: '24px 16px' }}
                        justifyContent={'space-between'}
                    >
                        <Stack direction={'row'}>
                            <img src={FilterIcon} style={{ width: '24px', height: '24px', alignSelf: 'center' }} />
                            <Typography
                                sx={{
                                    fontSize: '16px',
                                    alignSelf: 'center',
                                    marginBottom: '0',
                                    fontWeight: 600,
                                    paddingLeft: '8px',
                                }}
                                color="text.primary"
                                gutterBottom
                            >
                                Filter
                            </Typography>
                        </Stack>
                        <Stack direction={'row'} spacing={1}>
                            <Delete
                                sx={{ alignSelf: 'center', cursor: 'pointer' }}
                                color={'primary'}
                                onClick={() => {
                                    setDeleteData(cardId);
                                }}
                            />
                            <img
                                src={DialogIcon}
                                style={{ width: '24px', height: '24px', alignSelf: 'center', cursor: 'pointer' }}
                            />
                            <img
                                src={Collapse}
                                style={{ width: '24px', height: '24px', alignSelf: 'center', cursor: 'pointer' }}
                                onClick={() => {
                                    setCollapse(!collapse);
                                }}
                            />
                            <img
                                src={RunIcon}
                                style={{ width: '24px', height: '24px', alignSelf: 'center', cursor: 'pointer' }}
                                onClick={() => {}}
                            />
                        </Stack>
                    </Stack>
                </Tooltip>
                {collapse && (
                    <>
                        <Stack
                            justifyContent={'space-around'}
                            sx={{ padding: '24px 16px', height: '120px', borderBottom: '1px solid #C0CCDA' }}
                        >
                            <Typography sx={{ fontSize: '14px', fontWeight: 600 }} color="text.primary" gutterBottom>
                                Replace Expression
                            </Typography>
                            <TextField
                                required={true}
                                variant="outlined"
                                onClick={() => {
                                    setSelectedNode(cardId);
                                    setFilterType('replace');
                                }}
                                value={replacedValue}
                                sx={{
                                    width: '480px',
                                }}
                                inputProps={{ style: { height: '15px' } }}
                            />
                        </Stack>
                        <Stack justifyContent={'space-around'} sx={{ padding: '24px 16px', height: '120px' }}>
                            <Typography sx={{ fontSize: '14px', fontWeight: 600 }} color="text.primary" gutterBottom>
                                Exclude Expression
                            </Typography>
                            <TextField
                                required={true}
                                variant="outlined"
                                onClick={() => {
                                    setSelectedNode(cardId);
                                    setFilterType('exclude');
                                }}
                                value={excludedValue}
                                sx={{
                                    width: '480px',
                                }}
                                inputProps={{ style: { height: '15px' } }}
                            />
                        </Stack>
                    </>
                )}
            </Card>
        </>
    );
};

export { FilterNode, FilterNodeProps };
