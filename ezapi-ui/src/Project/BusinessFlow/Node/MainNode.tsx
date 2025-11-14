import ErrorWithMessage from '@/shared/components/ErrorWithMessage';
import { operationAtomWithMiddleware } from '@/shared/utils';
import ArrowCircleRightOutlinedIcon from '@mui/icons-material/ArrowCircleRightOutlined';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Card, Stack, Tab, Tooltip, Typography } from '@mui/material';
import { Node } from '@reactflow/core';

import _ from 'lodash';
import { useGetOperation } from '../../../shared/query/operationDetailsQuery';
import { checkValidJson } from '../businessFlowHelper';
import { ValueCard } from './Components/ValueCard';

import { useContext, useEffect, useState } from 'react';
import { Handle, Position, useNodeId } from 'reactflow';
import { useRecoilValue } from 'recoil';
import { getAccessToken } from '../../../shared/storage';
import { BusinessFlowContext } from '../BusinessFlowContext';
import useNodeHook from '../hooks/useNodeHook';
import { ExternalAPI, IBusinessFlow, NodeProps } from '../interfaces';
import { MainData } from '../interfaces/aggregate-cards';
import { NodeData } from '../interfaces/flow';
import { MyReactFlowState } from '../store';
import { ResponseTab } from './Components/ResponseTab';

type KeyValueProps = {
    key: string;
    value: any;
};

interface MainNodeProps extends NodeProps {}

const MainNode = (props: MainNodeProps) => {
    const initialMainData: MainData = {
        headers: props.data.runData?.headers || [],
        queryParams: props.data.runData?.queryParams || [],
        pathParams: props.data.runData?.pathParams || [],
        body: props.data.runData?.body || '',
    };

    const cardId: string = useNodeId() || '';

    const saveDelay = 2500;
    const acc_token = getAccessToken();
    const { projectId, operationId } = useContext(BusinessFlowContext);
    const { useStore } = useContext<IBusinessFlow>(BusinessFlowContext);
    const nodes = useStore((state: MyReactFlowState) => state.nodes);
    const operationState = useRecoilValue(operationAtomWithMiddleware);
    const [isJsonValid, setIsJsonValid] = useState(true);
    const [simulateFailed, setSimulateFailed] = useState<boolean>(true);
    const [savedNodeRB, setSavedNodeRB] = useState<Record<string, any> | undefined>({});
    const [requestBodyData, setRequestBodyData] = useState<Record<string, any> | undefined>({});
    const [mainData, setMainData] = useState<ExternalAPI>(initialMainData);
    const [stopTrigger, setStopTrigger] = useState(false);
    const { node, triggerDelayedNodeSaveOnServer } = useNodeHook({
        nodeId: cardId,
        getUpdatedNodeData: getUpdatedNodeDataFn,
        collapse: true,
    });

    function getUpdatedNodeDataFn() {
        const newNodeData = (_.isEmpty(props.data) ? {} : props.data) as NodeData;
        if (requestBodyData && checkValidJson(requestBodyData) === true) {
            return {
                ...newNodeData,
                mainData: mainData,
            };
        }
        return newNodeData;
    }

    const [value, setValue] = useState('0');

    const outputNodes = nodes.filter((node: Node) =>
        Boolean(node.type !== 'mainNode' && node.data?.output && Object.keys(node.data?.output).length > 0),
    );

    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };

    function setHeadersData(newHeaders: KeyValueProps[]) {
        if (newHeaders) {
            setMainData({ ...mainData, headers: newHeaders });
            triggerDelayedNodeSaveOnServer(saveDelay);
        }
    }

    function setQueryData(newQueryParams: KeyValueProps[]) {
        if (newQueryParams) {
            setMainData({ ...mainData, queryParams: newQueryParams });
            triggerDelayedNodeSaveOnServer(saveDelay);
        }
    }

    function setPathData(newPathParams: KeyValueProps[]) {
        if (newPathParams) {
            setMainData({ ...mainData, pathParams: newPathParams });
            triggerDelayedNodeSaveOnServer(saveDelay);
        }
    }

    function setNewRequestData(newRequestData: string) {
        setMainData({
            ...mainData,
            body: {
                data: typeof newRequestData === 'object' ? newRequestData : JSON.parse(newRequestData!),
            },
            // output: { ...DEFAULT_API_RESPONSE },
        });
        triggerDelayedNodeSaveOnServer(saveDelay);
    }

    function transformObject(obj: any): any {
        if (obj === null) {
            return null;
        } else if (Array.isArray(obj)) {
            return obj.map(transformObject).fill('');
        } else if (typeof obj === 'object') {
            const transformedObj: Record<string, any> = {};
            for (let key in obj) {
                transformedObj[key] = transformObject(obj[key]);
            }
            return transformedObj;
        } else {
            return null; // or '' if you wish
        }
    }
    function mapSavedRequestToOperation(
        savedRequestBody: Record<string, any>,
        operationRequestBody: Record<string, any>,
    ): Record<string, any> {
        const result: Record<string, any> = {};

        for (const key in operationRequestBody) {
            if (operationRequestBody.hasOwnProperty(key)) {
                if (
                    typeof operationRequestBody[key] === 'object' &&
                    operationRequestBody[key] !== null &&
                    !Array.isArray(operationRequestBody[key]) &&
                    typeof operationRequestBody[key] !== 'string'
                ) {
                    result[key] = mapSavedRequestToOperation(
                        savedRequestBody.hasOwnProperty(key) && typeof savedRequestBody[key] === 'object'
                            ? savedRequestBody[key]
                            : {},
                        operationRequestBody[key],
                    );
                } else {
                    result[key] = savedRequestBody.hasOwnProperty(key)
                        ? savedRequestBody[key]
                        : operationRequestBody[key];
                }
            }
        }

        return result;
    }

    async function simulate_artefact_API() {
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${acc_token}` },
            body: JSON.stringify({
                projectid: projectId,
                operationid: operationState.operation.operationId,
            }),
        };
        return fetch(process.env.REACT_APP_API_URL + '/simulation_artefacts', requestOptions).then((response) => {
            return response.json();
        });
    }
    async function simulateAPI() {
        return fetch(process.env.REACT_APP_API_URL + `/simulate/${projectId}/${operationState.operation.operationId}`, {
            headers: {
                Authorization: `Bearer ${acc_token}`,
                'Content-Type': 'application/json',
            },
            method: 'GET',
        })
            .then((res) => {
                return res.json();
            })
            .then((result) => {
                if (result?.data) {
                    return result?.data?.requestBody;
                } else {
                    throw result;
                }
            })
            .catch((error) => {
                console.log(error);
                setSimulateFailed(true);
            });
    }

    useEffect(() => {
        if (operationState.operation.operationType !== 'GET') {
            simulate_artefact_API()
                .then((response) => {
                    if (response.message == 'Ok') {
                        simulateAPI().then((response) => {
                            setSimulateFailed(false);
                            setRequestBodyData(transformObject(response));
                            triggerDelayedNodeSaveOnServer(saveDelay);
                        });
                    }
                })
                .catch((error) => {
                    console.log('Error occurred in simulate_artefact_API: ', error);
                    setSimulateFailed(true);
                });
        }
    }, []);
    useEffect(() => {
        if (simulateFailed) return;
        const generateInitialValue = (
            operationStateArray: { name: string; possibleValues: string[] }[],
            nodeArray: Param[],
        ) => {
            const nodeMap = new Map(nodeArray.map((param) => [param.key, param.value]));

            return operationStateArray.map(({ name }) => ({
                key: name,
                value: nodeMap.get(name) ?? '',
            }));
        };

        const headersInitialValue = generateInitialValue(
            operationState.operationRequest.headers,
            node?.data?.mainData?.headers || [],
        );
        const queryParamsInitialValue = generateInitialValue(
            operationState.operationRequest.queryParams,
            node?.data?.mainData?.queryParams || [],
        );
        const pathParamsInitialValue = generateInitialValue(
            operationState.operationRequest.pathParams,
            node?.data?.mainData?.pathParams || [],
        );

        setSavedNodeRB(node?.data?.mainData?.body?.data ?? {});
        setMainData({
            headers: headersInitialValue,
            queryParams: queryParamsInitialValue,
            pathParams: pathParamsInitialValue,
            body: { data: node?.data?.mainData?.body?.data ?? {} },
        });
    }, [operationState, node, simulateFailed]);
    const getOperationMutation = useGetOperation();

    useEffect(() => {
        if (operationState?.operationIndex && operationState?.operation) {
            getOperationMutation.mutate({
                operationId: operationState.operation.operationId,
                pathId: operationState.path.pathId,
                resourceId: operationState.resource.resourceId,
                projectId: projectId,
            });
        }
    }, []);

    useEffect(() => {
        if (simulateFailed) {
            setRequestBodyData(savedNodeRB);
            return;
        }
        if (
            simulateFailed ||
            stopTrigger ||
            !requestBodyData ||
            !savedNodeRB ||
            requestBodyData?.keys?.length === 0 ||
            savedNodeRB?.keys?.length === 0 ||
            checkValidJson(requestBodyData) !== true ||
            checkValidJson(savedNodeRB) !== true
        ) {
            return;
        }

        const requestBodyTypeChecked =
            typeof requestBodyData === 'object' ? requestBodyData : JSON.parse(requestBodyData);
        const savedNodeRBTypeChecked = typeof savedNodeRB === 'object' ? savedNodeRB : JSON.parse(savedNodeRB);
        let operationRequestBody = mapSavedRequestToOperation(
            savedNodeRBTypeChecked ?? {},
            requestBodyTypeChecked ?? {},
        );

        if (JSON.stringify(requestBodyData) !== JSON.stringify(operationRequestBody)) {
            setRequestBodyData(operationRequestBody);
            setStopTrigger(true);
        }
    }, [savedNodeRB]);

    type Param = {
        key: string;
        value: string;
    };

    // function mergeParams(initialValue: Param[], nodeValue: Param[]): Param[] {
    //     const nodeMap = new Map(nodeValue.map((param) => [param.key, param.value]));
    //     const initialMap = new Map(initialValue.map((param) => [param.key, param.value]));

    //     return Array.from(initialMap.keys()).map((key) => {
    //         return {
    //             key: key,
    //             value: nodeMap.has(key) ? nodeMap.get(key) ?? '' : initialMap.get(key) ?? '',
    //         };
    //     });
    // }

    return (
        <>
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#555' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={props.isConnectable}
            />
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#555' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={props.isConnectable}
            />

            <Card sx={{ width: '513px' }}>
                <Tooltip title={'Main Node'} arrow placement="top">
                    <Stack
                        direction={'row'}
                        sx={{ borderBottom: '1px solid #C0CCDA', height: '52px', padding: '24px 16px' }}
                        justifyContent={'space-between'}
                        className={'custom-drag-handle'} //This is required to make only the header section draggable
                    >
                        <Stack direction={'row'}>
                            <ArrowCircleRightOutlinedIcon
                                style={{ width: '24px', height: '24px', alignSelf: 'center' }}
                            />
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
                                {'Main'}
                            </Typography>
                        </Stack>
                    </Stack>
                </Tooltip>
                {outputNodes.length <= 0 && (
                    <>
                        <Stack sx={{ width: '100%' }}>
                            <TabContext value={value}>
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
                                                borderBottom: value === '0' ? '2px solid #1976d2' : '',
                                                color: value === '0' ? '#1976d2' : '',
                                            }}
                                        />
                                        <Tab
                                            label="Query Param"
                                            value={'1'}
                                            sx={{
                                                borderBottom: value === '1' ? '2px solid #1976d2' : '',
                                                color: value === '1' ? '#1976d2' : '',
                                            }}
                                        />
                                        <Tab
                                            label="Path Params"
                                            value={'2'}
                                            sx={{
                                                borderBottom: value === '2' ? '2px solid #1976d2' : '',
                                                color: value === '2' ? '#1976d2' : '',
                                            }}
                                        />
                                    </TabList>
                                </Stack>
                                <TabPanel key={'headers'} value={'0'}>
                                    <ValueCard
                                        value={mainData.headers}
                                        nodeType="main"
                                        onChange={(headers: KeyValueProps[]) => {
                                            if (!_.isEqual(headers, mainData.headers)) {
                                                const distinctHeaders = headers.filter(
                                                    (value, index, self) =>
                                                        index ===
                                                        self.findIndex(
                                                            (t) => t.key === value.key && t.value === value.value,
                                                        ),
                                                );
                                                setHeadersData(distinctHeaders);
                                            }
                                        }}
                                    />
                                </TabPanel>
                                <TabPanel key={'queryParam'} value={'1'}>
                                    <ValueCard
                                        value={mainData.queryParams}
                                        nodeType="main"
                                        onChange={(queryParams: KeyValueProps[]) => {
                                            if (!_.isEqual(queryParams, mainData.queryParams)) {
                                                const distinctQueryParams = queryParams.filter(
                                                    (value, index, self) =>
                                                        index ===
                                                        self.findIndex(
                                                            (t) => t.key === value.key && t.value === value.value,
                                                        ),
                                                );
                                                setQueryData(distinctQueryParams);
                                            }
                                        }}
                                    />
                                </TabPanel>
                                <TabPanel key={'pathParam'} value={'2'}>
                                    <ValueCard
                                        // disableAdd
                                        value={mainData.pathParams}
                                        nodeType="main"
                                        onChange={(pathparams: KeyValueProps[]) => {
                                            if (!_.isEqual(pathparams, mainData.pathParams)) {
                                                const newPathparams = pathparams.filter(
                                                    (item: KeyValueProps) => item.key !== '',
                                                );
                                                const distinctPathParams = newPathparams.filter(
                                                    (value, index, self) =>
                                                        index ===
                                                        self.findIndex(
                                                            (t) => t.key === value.key && t.value === value.value,
                                                        ),
                                                );
                                                setPathData(distinctPathParams);
                                            }
                                        }}
                                    />
                                </TabPanel>
                            </TabContext>
                        </Stack>
                        {operationState.operation.operationType !== 'GET' && (
                            <>
                                <Stack sx={{ width: '100%' }}>
                                    <ResponseTab
                                        onChange={(value: string) => {
                                            // setRequestBodyData(value);
                                            if (checkValidJson(value) === true) {
                                                setNewRequestData(value);
                                                setIsJsonValid(true);
                                            } else {
                                                setIsJsonValid(false);
                                            }
                                        }}
                                        // isError={isError}
                                        isResponse={false}
                                        displayTitle="Request Body"
                                        value={requestBodyData}
                                        // disabled={apiType === 'system' ? true : false}
                                    />
                                </Stack>
                                {!isJsonValid && (
                                    <ErrorWithMessage message={'invalid JSON'} className={'mb-3'} contained isError />
                                )}
                            </>
                        )}
                    </>
                )}

                {outputNodes.length >= 1 && (
                    <Stack justifyContent={'center'} sx={{ padding: '16px', minHeight: '75px' }}>
                        {outputNodes.map((node: Node, idx: number) => (
                            <Typography
                                key={`${idx}`}
                                sx={{ fontSize: '14px', fontWeight: 600 }}
                                color="text.primary"
                                gutterBottom
                            >
                                {idx + 1}
                                &nbsp;
                                {node.data.name}
                            </Typography>
                        ))}
                    </Stack>
                )}
            </Card>
        </>
    );
};

export { MainNode, MainNodeProps };
