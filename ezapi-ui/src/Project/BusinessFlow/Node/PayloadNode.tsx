import { SocketContext } from '@/Context/socket';
import responseMapperAtom from '@/shared/atom/reponseMapperAtom';
import ErrorWithMessage from '@/shared/components/ErrorWithMessage';
import { operationAtomWithMiddleware } from '@/shared/utils';
import { Button } from '@material-ui/core';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Card, FormControlLabel, Radio, RadioGroup, Stack, Tab, Typography } from '@mui/material';

import deleteNodeAtom from '@/shared/atom/deleteNodeAtom';
import { Delete } from '@mui/icons-material';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import React, { SyntheticEvent, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { NodeProps, useNodeId } from 'reactflow';
import { useRecoilState } from 'recoil';
import Json from '../../../icons/Json.svg';
import Collapse from '../../../icons/collapse.svg';
import DialogIcon from '../../../icons/dialogIcon.svg';
import { NODE_TYPES } from '../constants';
import useNodeHook from '../hooks/useNodeHook';
import { AggregateCard, KeyValueProps } from '../interfaces';
import { NodeData } from '../interfaces/flow';
import { fetchAllAggregateCards } from '../services';
import { ResponseTab } from './Components/ResponseTab';
import { ValueCard } from './Components/ValueCard';

interface PayloadNodeProps extends NodeProps {}
interface DropDownProps {
    id: string;
    name: string;
}

const PayloadNode = (props: PayloadNodeProps): React.ReactElement => {
    const cardId: string = useNodeId() || '';
    const [collapse, setCollapse] = useState(false);
    const delayTimeSet = 2500;

    const [isFullMapping, setIsFullMapping] = useState(true);
    const [_deleteData, setDeleteData] = useRecoilState<Node[] | undefined | string>(deleteNodeAtom);
    const [_showResponseMapping, setShowResponseMapping] = useRecoilState(responseMapperAtom);
    const [isJsonValid, setIsJsonValid] = useState(true);
    const [tabValue, setTabValue] = useState('1');
    const [headerData, setHeaderData] = useState<KeyValueProps[]>();
    const [responseBodyData, setResponseBodyData] = useState<KeyValueProps[]>();

    const { projectId = '' }: { projectId: string } = useParams();
    const [operationData, _] = useRecoilState(operationAtomWithMiddleware);
    const operationId = operationData?.operation?.operationId;
    const [dropDownData, setDropDownData] = useState<DropDownProps[]>([]);
    const [selectedItem, setSelectedItem] = useState<DropDownProps | null>(null);

    const {
        node,
        isLoading,
        isNodeDataLoaded,
        isUpdateNodeOnServerDone,
        triggerDelayedNodeSaveOnServer,
        loadNodeDataFromServer,
    } = useNodeHook({
        nodeId: cardId,
        getUpdatedNodeData: getUpdatedNodeDataFn,
        collapse: collapse,
    });
    function getUpdatedNodeDataFn() {
        const newNodeData = props.data as NodeData;

        return {
            ...newNodeData,
            responsePayloadData: {
                customMapping: !isFullMapping,
                cardId: selectedItem?.id ?? '',
            },
        };
    }
    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        setTabValue(newValue);
    };
    // useEffect(() => {
    //     if (collapse) {
    //         console.log('loading from server now here!!');
    //         loadNodeDataFromServer();
    //     }
    // }, [collapse]);
    const socket = useContext(SocketContext);

    useEffect(() => {
        if (!socket.connected) return;
        const fetchData = (eventName: any) => {
            if (eventName?.body && eventName?.headers) {
                setResponseBodyData(eventName?.body);
                setHeaderData(eventName?.headers);
            } else {
                setResponseBodyData(eventName);
            }
        };

        socket.on('payloadCardResponse', (eventName: any) => {
            fetchData(eventName);
        });
    }, []);

    useEffect(() => {
        if (node?.data?.responsePayloadData?.cardId) {
            const name = dropDownData.find((x) => x.id === node?.data?.responsePayloadData?.cardId)?.name;
            setSelectedItem({ id: node?.data?.responsePayloadData?.cardId, name: name ?? '' });
            setResponseBodyData(node?.data?.responsePayloadData?.data);
        } else {
            setResponseBodyData(node?.data?.responsePayloadData?.data?.body);
            setHeaderData(node?.data?.responsePayloadData?.data?.headers);
        }
    }, [node, dropDownData]);

    const prepareData = async () => {
        const allCardsDataFromServer = await fetchAllAggregateCards({ operationId, projectId });
        const sortedData = allCardsDataFromServer
            .filter(
                (card: AggregateCard) =>
                    card.type === NODE_TYPES.EXTERNAL_API_NODE || card.type === NODE_TYPES.EXTERNAL_API_NODE_LOOP,
            )
            .map((card: AggregateCard) => ({
                name: card.name,
                id: card.id,
            }));

        const sorted2 = sortedData.filter((x: any) => x !== undefined);
        setDropDownData(sorted2);
    };

    useEffect(() => {
        if (collapse) prepareData();
    }, [collapse]);

    return (
        <Card sx={{ width: '513px' }}>
            <Stack
                direction={'row'}
                className={'custom-drag-handle'} //This is required to make only the header section draggable
                sx={{ borderBottom: '1px solid #C0CCDA', height: '52px', padding: '24px 16px' }}
                justifyContent={'space-between'}
            >
                <Stack direction={'row'}>
                    <img src={Json} style={{ width: '24px', height: '24px', alignSelf: 'center' }} />
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
                        Response Payload Builder
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
                </Stack>
            </Stack>
            {collapse && (
                <Stack justifyContent={'space-between'} sx={{ padding: '12px 8px', minHeight: '188px' }}>
                    <RadioGroup
                        aria-labelledby="controlled-radio-buttons-group"
                        name="controlled-radio-buttons-group"
                        value={isFullMapping}
                        onChange={(e) => {
                            setIsFullMapping(e.target.value == 'true');
                        }}
                    >
                        <Stack direction={'row'}>
                            <FormControlLabel value={true} control={<Radio />} label="Map Full Response" />
                            <FormControlLabel value={false} control={<Radio />} label="Custom Mapping" />
                        </Stack>
                    </RadioGroup>
                    {isFullMapping && (
                        <Autocomplete
                            value={selectedItem}
                            options={dropDownData}
                            getOptionLabel={(option) => option.name}
                            onChange={(_event: SyntheticEvent, newValue) => {
                                setSelectedItem(newValue);
                            }}
                            clearIcon={null}
                            openOnFocus={true}
                            fullWidth={true}
                            style={{ width: '350px' }}
                            renderInput={(params) => <TextField {...params} label="Select a Card..." />}
                        />
                    )}

                    <Stack width={'100%'} direction={'row-reverse'} paddingTop={'12px'}>
                        {isFullMapping ? (
                            <Button
                                style={{ width: '100px', background: '#1565C0', color: '#FFF' }}
                                variant="contained"
                                onClick={() => {
                                    triggerDelayedNodeSaveOnServer();
                                }}
                            >
                                SAVE
                            </Button>
                        ) : (
                            <Button
                                style={{ width: '200px', background: '#1565C0', color: '#FFF' }}
                                variant="contained"
                                onClick={() => {
                                    setShowResponseMapping(true);
                                    setSelectedItem(null);
                                    triggerDelayedNodeSaveOnServer();
                                }}
                            >
                                Add Response Mapping
                            </Button>
                        )}
                    </Stack>
                    <Stack paddingTop={'12px'} sx={{ width: '100%' }}>
                        {isFullMapping ? (
                            <ResponseTab
                                editable={false}
                                isResponse={false}
                                displayTitle="Response Body"
                                value={responseBodyData}
                            />
                        ) : (
                            <TabContext value={tabValue}>
                                <Stack direction="row" sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
                                    <TabList
                                        onChange={handleChange}
                                        aria-label="lab API tabs example"
                                        TabIndicatorProps={{ style: { display: 'none' } }}
                                    >
                                        <Tab
                                            label="Headers"
                                            value={'0'}
                                            sx={{
                                                borderBottom: tabValue === '0' ? '2px solid #1976d2' : '',
                                                color: tabValue === '0' ? '#1976d2' : '',
                                            }}
                                            key="headers"
                                        />
                                        <Tab
                                            label="Response Body"
                                            value={'1'}
                                            sx={{
                                                borderBottom: tabValue === '1' ? '2px solid #1976d2' : '',
                                                color: tabValue === '1' ? '#1976d2' : '',
                                            }}
                                            key="query"
                                        />
                                    </TabList>
                                </Stack>
                                <TabPanel value={'0'} sx={{ padding: '6px' }}>
                                    <ValueCard
                                        isHeader={true}
                                        value={headerData}
                                        disabled={true}
                                        disableAdd={true}
                                        disableDelete={true}
                                    />
                                </TabPanel>
                                <TabPanel value={'1'} sx={{ padding: '6px' }}>
                                    <ResponseTab editable={false} isResponse={false} value={responseBodyData} />
                                </TabPanel>
                            </TabContext>
                        )}
                    </Stack>
                    {!isJsonValid && <ErrorWithMessage message={'invalid JSON'} className={'mb-3'} contained isError />}
                </Stack>
            )}
        </Card>
    );
};

export { PayloadNode, PayloadNodeProps };
