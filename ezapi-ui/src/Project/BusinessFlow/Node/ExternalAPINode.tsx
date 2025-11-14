import { CircularProgress, Tooltip } from '@material-ui/core';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import { CloudOff, Delete, ExpandLess, ExpandMore } from '@mui/icons-material';
import {
    Autocomplete,
    AutocompleteRenderInputParams,
    Button,
    Card,
    FormControlLabel,
    Radio,
    RadioGroup,
    Stack,
    Tab,
    TextField,
    Typography,
} from '@mui/material';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, Method } from 'axios';
// @ts-ignore
import buildURL from 'axios/lib/helpers/buildURL';
import _ from 'lodash';
import Qs from 'qs';
import { SyntheticEvent, useContext, useEffect, useState } from 'react';
import { Handle, Position, useNodeId } from 'reactflow';

import LoaderWithMessage from '../../../shared/components/LoaderWithMessage';
// @ts-ignore
import drawerCardAtom from '@/shared/atom/drawerCardAtom';
import selectedNodeAtom from '@/shared/atom/selectedNodeAtom';
import ErrorWithMessage from '@/shared/components/ErrorWithMessage';
import { Add } from '@material-ui/icons';
import { TabContext, TabList, TabPanel } from '@mui/lab';
// @ts-ignore
import deleteNodeAtom from '@/shared/atom/deleteNodeAtom';
import triggerCollapseNodeAtom from '@/shared/atom/triggerCollapseNodeAtom';
import { useRecoilState } from 'recoil';
import ApiIcon from '../../../icons/ApiIcon.svg';
import LoopIcon from '../../../icons/LoopIcon.svg';
import Collapse from '../../../icons/collapse.svg';
import DialogIcon from '../../../icons/dialogIcon.svg';
import RunIcon from '../../../icons/runIcon.svg';
import { BusinessFlowContext } from '../BusinessFlowContext';
import { checkValidJson } from '../businessFlowHelper';
import { getAggregateCard, getMappingData } from '../businessFlowQueries';
import { DEFAULT_API_RESPONSE } from '../defaults';
import useNodeHook from '../hooks/useNodeHook';
import { ExternalAPI, KeyValueProps, NodeProps } from '../interfaces';
import { CommonNodeData, IBusinessFlow, NodeData } from '../interfaces/flow';
import { MyReactFlowState } from '../store';
import { ResponseTab } from './Components/ResponseTab';
import { TreeDropDown } from './Components/TreeDropDown';
import { ValueCard } from './Components/ValueCard';

const NON_PROXY_HOST_NAMES = ['localhost', '127.0.0.1'];

const proxyURL = process.env.REACT_APP_PROXY_URL;

function getExternalAPIRequestAxiosOptions(
    runData: ExternalAPI,
    displayedUrlValue: String,
    headers: KeyValueProps[],
    queryParams: KeyValueProps[],
    pathParams: KeyValueProps[],
    requestBodyData: KeyValueProps[],
): AxiosRequestConfig {
    const headerValues: any = {};
    headers?.forEach((item) => {
        if (item.key) {
            headerValues[item.key] = item.value;
        }
    });

    const queryParamsValues: any = {};
    queryParams?.forEach((item) => {
        const existingValues = queryParamsValues[item.key] || [];
        existingValues.push(item.value);
        queryParamsValues[item.key] = existingValues;
    });

    const pathParamsValues: any = {};
    pathParams?.forEach((item) => {
        if (item.key) {
            pathParamsValues[item.key] = item.value;
        }
    });

    const paramsSerializer = (params: any) => Qs.stringify(params, { arrayFormat: 'repeat' });
    let url = buildURL(displayedUrlValue, queryParamsValues, paramsSerializer);
    Object.keys(pathParamsValues).forEach((key) => {
        url = url.replace(`:${key}`, pathParamsValues[key]);
    });

    const apiCardRequestData: any = {
        url: url,
        method: runData.method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...headerValues,
        },
        data: !_.isEmpty(requestBodyData)
            ? typeof requestBodyData === 'object'
                ? requestBodyData
                : typeof requestBodyData === 'string' && checkValidJson(requestBodyData) === true
                ? JSON.parse(requestBodyData)
                : {}
            : {},
        // params: paramsSerializer(queryParamsValues),
    };
    let isValidProxyRequest = true;

    if (
        /* NON_PROXY_HOST_NAMES.includes(location.hostname) || */ NON_PROXY_HOST_NAMES.includes(new URL(url).hostname)
    ) {
        isValidProxyRequest = false;
    }

    if (!isValidProxyRequest) {
        return apiCardRequestData;
    }

    const options: AxiosRequestConfig = {
        //url: 'https://proxy.ezapi.ai',
        url: proxyURL,
        method: 'post',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        data: apiCardRequestData,
    };

    return options;
}

const ExternalAPINodeComponent = (props: NodeProps): React.ReactElement => {
    const cardId: string = useNodeId() || '';

    const initialCommonData: CommonNodeData = {
        name: props.data.commonData.name,
        parentNode: props.data.commonData.parentNode,
        inputNodeIds: props.data.commonData.inputNodeIds,
        nonDeletable: props.data.commonData.nonDeletable,
    };

    const initialRunData: ExternalAPI = {
        url: props.data.runData?.url || '',
        method: props.data.runData?.method || 'GET',
        headers: props.data.runData?.headers || [],
        queryParams: props.data.runData?.queryParams || [],
        pathParams: props.data.runData?.pathParams || [],
        body: props.data.runData?.method == 'GET' ? null : props.data.runData?.body || '',
        output: props.data.runData?.output || { ...DEFAULT_API_RESPONSE },
    };

    const [headers, setHeaders] = useState<KeyValueProps[]>();
    const [queryParams, setQueryParams] = useState<KeyValueProps[]>(initialRunData.queryParams || []);
    const [pathParams, setPathParams] = useState<KeyValueProps[]>(initialRunData.pathParams || []);
    const [requestBodyData, setRequestBodyData] = useState<any>(initialRunData.body?.data || {});
    const [commonData, setCommonData] = useState<CommonNodeData>(initialCommonData);
    const [runData, setRunData] = useState<ExternalAPI>(initialRunData);
    const { useStore } = useContext<IBusinessFlow>(BusinessFlowContext);
    const [selectedNodeCardType, setSelectedNodeCardType] = useState('');
    const nodes = useStore((state: MyReactFlowState) => state.nodes);

    const [displayedUrlValue, setDisplayedUrlValue] = useState(initialRunData.url ?? '');
    const [isFocused, setIsFocused] = useState(false);

    const [isExecuting, setIsExecuting] = useState<boolean>(false);
    const [iconSelector, setIconSelector] = useState('delete');

    const [value, setValue] = useState('0');
    const [systemApis, _setSystemApis] = useState();
    const { projectId, operationId } = useContext(BusinessFlowContext);
    const [triggerCollapseNode, setTriggerCollapseNode] = useRecoilState(triggerCollapseNodeAtom);

    const [apiType, setApiType] = useState<string>('api_call');
    const [_deleteData, setDeleteData] = useRecoilState<Node[] | undefined | string>(deleteNodeAtom);
    const [_selectedCard, setSelectedCard] = useRecoilState(drawerCardAtom);
    const [drawerSelected, setDrawerSelected] = useState('');
    const [explicitLoading, setExplicitLoading] = useState(false);

    const [isJsonValid, setIsJsonValid] = useState(true);
    const [selectedNode, setSelectedNode] = useRecoilState(selectedNodeAtom);

    const [collapse, setCollapse] = useState(props.data.runData?.output?.success || false);
    const [showResponse, setShowResponse] = useState(
        props.data.runData?.output?.status
            ? props.data.runData.output.status >= 200 && props.data.runData?.output?.status < 300
            : false,
    );
    const [responseValue, setResponseValue] = useState<string>(props.data.runData?.output?.success ? '1' : '0');
    const [viewMore, setViewMore] = useState<boolean>(false);
    const [executionNumber, setExecutionNumber] = useState<number>(0);
    const delayTimeSet = 3500;
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
    const isError = [undefined, 0].includes(props.data.runData?.output?.status)
        ? undefined
        : props.data.runData?.output?.success === false;

    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        nullChecker();

        setValue(newValue);
    };
    const nullChecker = () => {
        if (headers?.length == 1 && headers[0].key === '' && headers[0].value === '') {
            setHeaders([]);
        }
        if (queryParams?.length == 1 && queryParams[0].key === '' && queryParams[0].value === '') {
            setQueryParams([]);
        }
    };
    const handleResponseChange = (_event: React.SyntheticEvent, newValue: string) => {
        setResponseValue(newValue);
    };

    useEffect(() => {
        setSelectedNodeCardType(props.type ?? (nodes.find((node: any) => node.id === selectedNode)?.type || ''));
    }, [nodes, selectedNode]);
    function getUpdatedNodeDataFn() {
        const newNodeData = (_.isEmpty(props.data) ? {} : props.data) as NodeData;
        let updatedRunData;
        setExplicitLoading(false);

        if (runData.method !== 'GET') {
            updatedRunData = {
                ...runData,
                url: displayedUrlValue,
                pathParams: pathParams,
                queryParams: queryParams,
                headers: headers,
                body: {
                    data:
                        typeof requestBodyData === 'object'
                            ? requestBodyData
                            : typeof requestBodyData === 'string' && checkValidJson(requestBodyData) === true
                            ? JSON.parse(requestBodyData)
                            : node?.data?.runData?.body?.data ?? {},
                },
                output: runData.output,
            };
        } else {
            const { body, ...otherRunData } = runData;
            updatedRunData = {
                ...otherRunData,
                url: displayedUrlValue,
                pathParams: pathParams,
                queryParams: queryParams,
                headers: headers,
                output: runData.output,
            };
        }

        return {
            ...newNodeData,
            commonData: commonData,
            runData: updatedRunData,
        };
    }

    function isValidUrl(url: string) {
        try {
            new URL(url);
            return true;
        } catch (err) {
            setPathParams([]);
            return false;
        }
    }

    function setApiName(newApiName: string) {
        setCommonData({ ...commonData, name: newApiName });
        triggerDelayedNodeSaveOnServer(delayTimeSet);
    }

    function setActionType(newMethod: string) {
        if (newMethod && runData.method?.toUpperCase() !== newMethod.toUpperCase()) {
            setRunData({ ...runData, method: newMethod as Method, output: { ...DEFAULT_API_RESPONSE } });
            triggerDelayedNodeSaveOnServer(delayTimeSet);
        }
    }

    function toggleCollapse() {
        setCollapse(!collapse);
    }

    const execute = async (event: React.MouseEvent) => {
        event.preventDefault();
        if (!isNodeDataLoaded || isLoading || isExecuting || !runData.url || displayedUrlValue === '') {
            return;
        }

        setIsExecuting(true);
        const options: AxiosRequestConfig = getExternalAPIRequestAxiosOptions(
            runData,
            displayedUrlValue,
            headers ?? [],
            queryParams,
            pathParams,
            requestBodyData,
        );

        const apiCall = async () => {
            await axios
                .request(options)
                .then(function (response: AxiosResponse) {
                    const newNodeData = {
                        ...runData,
                        output: {
                            data: response.data,
                            success: response.status >= 200 && response.status < 300,
                            status: response.status,
                            statusText: response.statusText,
                        },
                    };
                    setRunData(newNodeData);
                    // triggerDelayedNodeSaveOnServer(delayTimeSet);
                })
                .catch(function (error: any) {
                    // check if the error was thrown from axios
                    if (axios.isAxiosError(error)) {
                        const axiosError = error as AxiosError;
                        const newNodeData = {
                            ...runData,
                            output: {
                                data: axiosError.response?.data,
                                success: false,
                                status: axiosError.response?.status,
                                statusText: axiosError.response?.statusText,
                            },
                        };

                        setRunData(newNodeData);
                    } else {
                        const newNodeData = {
                            ...runData,
                            output: {
                                data: {},
                                success: false,
                                statusText: 'Something went wrong!',
                            },
                        };

                        setRunData(newNodeData);
                    }
                })
                .finally(() => {
                    setCollapse(true);
                    setIsExecuting(false);
                    setResponseValue('1');
                    setShowResponse(true);
                    nullChecker();

                    triggerDelayedNodeSaveOnServer(delayTimeSet);
                    setExecutionNumber(executionNumber + 1);
                });
        };

        //if (isLoop && options.url && NON_PROXY_HOST_NAMES.includes(new URL(options.url).hostname)) {
        if (
            selectedNodeCardType === 'externalAPILoopNode' &&
            options.url &&
            NON_PROXY_HOST_NAMES.includes(new URL(options.url).hostname)
        ) {
            const mappingData = await getMappingData(cardId, operationId, projectId);
            if (
                mappingData &&
                mappingData.data &&
                mappingData.data.relationsRequestBody &&
                mappingData.data.relationsRequestBody.length > 0
            ) {
                const relationsRequestBody = mappingData.data.relationsRequestBody.filter((obj: any) =>
                    obj.mappedAttributeRef.includes('[n]'),
                );
                if (relationsRequestBody && relationsRequestBody.length > 0) {
                    relationsRequestBody.map(async (item: any) => {
                        const { mappedAttributeAPI, attributeRef, mappedAttributeRef } = item;
                        const attributes = attributeRef.split('body.'); //finds the attribute sequence for attribute
                        const mappedAttributes = mappedAttributeRef.split('.'); //finds the parent level sequence for mapped attribute
                        const mappedItemIndex = mappedAttributes.findIndex((element: string) =>
                            element.includes('[n]'),
                        );

                        if (mappedAttributeAPI !== '') {
                            const mappedCardData = await getAggregateCard(
                                item.mappedAttributeAPI,
                                operationId,
                                projectId,
                            );

                            let mappedRefArray = 'runData.output.data';
                            let mapedRefValue = '';
                            if (mappedItemIndex === 1) {
                                mapedRefValue = mappedAttributes[2];
                                for (let i = 3; i < mappedAttributes.length; i++) {
                                    mapedRefValue = mapedRefValue + '.' + mappedAttributes[i];
                                }
                            } else {
                                for (let i = 2; i < mappedAttributes.length; i++) {
                                    if (i <= mappedItemIndex) {
                                        mappedRefArray = mappedRefArray + '.' + mappedAttributes[i];
                                    } else {
                                        mapedRefValue = mapedRefValue + '.' + mappedAttributes[i];
                                    }
                                }
                            }

                            const arr = _.get(mappedCardData, mappedRefArray); //array which needs to be mapped

                            for (let index = 0; index < arr.length; index++) {
                                const newRef = mappedRefArray + `[${index}].` + mapedRefValue;
                                const finalData = _.get(mappedCardData, newRef);
                                if (finalData !== undefined && attributes[1] !== undefined) {
                                    let updatedData = _.set(requestBodyData, attributes[1], finalData);
                                    runData.body = updatedData;
                                    await apiCall();
                                }
                            }
                        }
                    });
                }
            }
        } else {
            apiCall();
            // triggerDelayedNodeSaveOnServer(delayTimeSet);
        }
    };

    useEffect(() => {
        if (node && !_.isEmpty(node.data.commonData)) {
            setCommonData({
                ...node.data.commonData,
            });
        }
        if (node && !_.isEmpty(node.data.runData)) {
            setRunData({
                ...node.data.runData,
            });
            setDisplayedUrlValue(node.data.runData.url ?? '');
            setHeaders(node.data.runData.headers ?? []);
            setQueryParams(node.data.runData.queryParams ?? []);
            setPathParams(node.data.runData.pathParams ?? []);
            setRequestBodyData(node.data.runData.body?.data ?? {});
            const outputInfo = node.data.runData?.output;
            const hasResponse = Boolean(outputInfo && outputInfo.status && outputInfo.status > 0);
            if (hasResponse) {
                setShowResponse(hasResponse);
                setResponseValue('1');
            }
            setExecutionNumber(executionNumber + 1);
        }
    }, [node]);

    useEffect(() => {
        if (props && !_.isEmpty(props.data.commonData)) {
            setCommonData({
                ...props.data.commonData,
            });
        }
        if (props && !_.isEmpty(props.data.runData)) {
            setRunData({
                ...props.data.runData,
            });
            setDisplayedUrlValue(props.data.runData.url ?? '');
            setHeaders(props.data.runData.headers ?? []);
            setQueryParams(props.data.runData.queryParams ?? []);
            setPathParams(props.data.runData.pathParams ?? []);
            setRequestBodyData(props.data.runData.body?.data ?? {});
            // const outputInfo = props.data.runData?.output;
            // const hasResponse = Boolean(outputInfo && outputInfo.status && outputInfo.status > 0);
            // if (hasResponse) {
            //     setShowResponse(hasResponse);
            // }
        }
    }, []);
    useEffect(() => {
        if (triggerCollapseNode == '') return;
        if (triggerCollapseNode === cardId) {
            setCollapse(true);
            setTriggerCollapseNode('');
        }
    }, [triggerCollapseNode]);

    useEffect(() => {
        if (!displayedUrlValue || !isValidUrl(displayedUrlValue) || !isFocused) return;

        const currentUrl = new URL(displayedUrlValue ?? '');
        const pathname = currentUrl.pathname;

        if (pathname && pathname !== '/') {
            const pathParamsData = pathname.split('/').filter((part) => part !== '');
            const clonePathParam = pathParamsData
                .map((param, index, arr) => {
                    if (param.startsWith(':') || (index > 0 && arr[index - 1] === ':')) {
                        const key = param.startsWith(':') ? param.substring(1) : param;
                        const existingParam = pathParams.find((p) => p.key === key);
                        return {
                            key: key,
                            value: existingParam ? existingParam.value : '',
                        };
                    }
                    return null;
                })
                .filter((item): item is { key: string; value: string } => item !== null);

            const uniquePathParam = Array.from(new Map(clonePathParam.map((item) => [item.key, item])).values());
            setPathParams(uniquePathParam);
        } else {
            setPathParams([]);
        }
    }, [displayedUrlValue]);

    const renderAPINodeBody = () => (
        <>
            <Stack justifyContent={'space-around'} sx={{ padding: '24px 16px', height: '300px' }}>
                <RadioGroup
                    aria-labelledby="controlled-radio-buttons-group"
                    name="controlled-radio-buttons-group"
                    onChange={(e: any) => {
                        setApiType(e.target.value);
                    }}
                    value={apiType}
                >
                    <Stack direction={'row'} justifyContent={'space-between'}>
                        <FormControlLabel value="api_call" control={<Radio />} label={'API Call'} />
                        <FormControlLabel value="system" control={<Radio />} label={'Conektto API'} disabled />
                        <FormControlLabel
                            value="collection"
                            control={<Radio />}
                            label={'Conektto Collection'}
                            disabled
                        />
                    </Stack>
                </RadioGroup>
                {apiType === 'system' ? (
                    <TreeDropDown data={systemApis} />
                ) : (
                    <>
                        <Typography sx={{ fontSize: '14px', fontWeight: 600 }} color="text.primary" gutterBottom>
                            API endpoint
                        </Typography>
                        <TextField
                            required={true}
                            variant="outlined"
                            value={commonData.name}
                            onChange={(e: any) => {
                                setApiName(e.target.value);
                            }}
                            sx={{
                                width: '480px',
                            }}
                            inputProps={{ style: { height: '15px' } }}
                        />
                    </>
                )}

                <Stack direction="row" sx={{ paddingTop: '24px' }}>
                    <Stack sx={{ paddingRight: '24px' }}>
                        <Typography sx={{ fontSize: '14px', fontWeight: 600 }} color="text.primary" gutterBottom>
                            Action Type
                        </Typography>

                        <Autocomplete
                            key={runData.method}
                            onChange={(_event: SyntheticEvent, newValue: string) => {
                                if (newValue === 'GET') setResponseValue('0');
                                setActionType(newValue);
                            }}
                            options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH']}
                            renderInput={(params: AutocompleteRenderInputParams) => (
                                <TextField {...params} variant="outlined" style={{ height: '50px' }} />
                            )}
                            defaultValue={'GET'}
                            value={runData.method ? runData.method.toUpperCase() : ''}
                            clearIcon={null}
                            openOnFocus={true}
                            fullWidth={true}
                            style={{
                                width: '155px',
                            }}
                        />
                    </Stack>
                    <Stack>
                        <Typography sx={{ fontSize: '14px', fontWeight: 600 }} color="text.primary" gutterBottom>
                            URL
                        </Typography>
                        <TextField
                            required={true}
                            variant="outlined"
                            defaultValue={runData.url}
                            value={displayedUrlValue}
                            disabled={apiType === 'system' ? true : false}
                            onChange={(event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
                                setDisplayedUrlValue(event.target.value as string);
                                triggerDelayedNodeSaveOnServer(delayTimeSet);
                            }}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            sx={{
                                width: '301px',
                            }}
                            style={{ height: '50px' }}
                        />
                    </Stack>
                </Stack>
                <Button
                    color={'primary'}
                    variant="contained"
                    sx={{ marginTop: '24px', height: '30px', textTransform: 'none' }}
                    onClick={() => {
                        setViewMore(!viewMore);
                    }}
                    startIcon={!viewMore ? <ExpandMore /> : <ExpandLess />}
                >
                    {viewMore ? 'View Less' : ' View More'}
                </Button>
            </Stack>
            {viewMore && (
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
                                    key="headers"
                                />
                                <Tab
                                    label="Query Param"
                                    value={'1'}
                                    sx={{
                                        borderBottom: value === '1' ? '2px solid #1976d2' : '',
                                        color: value === '1' ? '#1976d2' : '',
                                    }}
                                    key="query"
                                />
                                <Tab
                                    label="Path Params"
                                    value={'2'}
                                    sx={{
                                        borderBottom: value === '2' ? '2px solid #1976d2' : '',
                                        color: value === '2' ? '#1976d2' : '',
                                    }}
                                    key="path"
                                />
                            </TabList>
                        </Stack>
                        <TabPanel
                            value={'0'}
                            key={
                                runData?.headers?.length
                                    ? runData.headers[runData.headers.length - 1].key
                                    : 'headers panel'
                            }
                        >
                            <ValueCard
                                isHeader={true}
                                value={headers}
                                disabled={apiType === 'system' ? true : false}
                                onChange={(newHeaders: KeyValueProps[]) => {
                                    if (!newHeaders) return;
                                    setHeaders(newHeaders);
                                    if (!_.isEqual(newHeaders, headers)) {
                                        triggerDelayedNodeSaveOnServer(delayTimeSet);
                                    }
                                }}
                            />
                        </TabPanel>
                        <TabPanel
                            value={'1'}
                            key={
                                runData?.queryParams?.length
                                    ? runData.queryParams[runData.queryParams.length - 1].key
                                    : 'query panel'
                            }
                        >
                            <ValueCard
                                value={queryParams}
                                disabled={apiType === 'system' ? true : false}
                                onChange={(newQueryParams: KeyValueProps[]) => {
                                    if (!newQueryParams) return;
                                    setQueryParams(newQueryParams);
                                    if (!_.isEqual(newQueryParams, queryParams)) {
                                        triggerDelayedNodeSaveOnServer(delayTimeSet);
                                    }
                                }}
                            />
                        </TabPanel>
                        <TabPanel
                            value={'2'}
                            key={
                                runData?.pathParams?.length
                                    ? runData.pathParams[runData.pathParams.length - 1].key
                                    : 'path panel'
                            }
                        >
                            <ValueCard
                                disableAdd={true}
                                disableDelete={true}
                                disableKey={true}
                                value={pathParams}
                                disabled={apiType === 'system' ? true : false}
                                onChange={(newPathParams: KeyValueProps[]) => {
                                    if (!newPathParams) return;
                                    setPathParams(newPathParams);
                                    if (!_.isEqual(newPathParams, pathParams)) {
                                        triggerDelayedNodeSaveOnServer(delayTimeSet);
                                    }
                                }}
                            />
                        </TabPanel>
                    </TabContext>

                    {!showResponse && runData.method !== 'GET' && (
                        <Stack width="100%">
                            <ResponseTab
                                onChange={(value: any) => {
                                    if (checkValidJson(value) === true) {
                                        setRequestBodyData(value);
                                        setIsJsonValid(true);
                                    }
                                    triggerDelayedNodeSaveOnServer(delayTimeSet);
                                }}
                                // isError={runData?.output?.status != 200 && runData?.output?.status != 0}
                                isResponse={false}
                                displayTitle="Request Body"
                                value={requestBodyData || {}}
                                disabled={apiType === 'system' ? true : false}
                            />
                        </Stack>
                    )}

                    <Stack sx={{ padding: '0 16px 16px' }} alignItems={'flex-start'}>
                        <Button
                            sx={{ width: 'fit-content' }}
                            onClick={() => {
                                setDrawerSelected('mapping');
                                setCollapse(false);
                            }}
                            variant="outlined"
                            startIcon={<Add />}
                        >
                            Add Mapping
                        </Button>
                    </Stack>
                </Stack>
            )}
        </>
    );
    useEffect(() => {
        if (drawerSelected != '') {
            if (isUpdateNodeOnServerDone) {
                if (drawerSelected == 'drawer') {
                    setSelectedCard(cardId);
                } else {
                    setSelectedNode(cardId);
                }

                setDrawerSelected('');
            }
        }
    }, [drawerSelected, isUpdateNodeOnServerDone]);

    return (
        <Card sx={{ width: '513px' }}>
            <Tooltip
                title={selectedNodeCardType === 'externalAPILoopNode' ? 'Loop Node' : 'API Node'}
                arrow
                placement="top"
            >
                <Stack
                    className={'custom-drag-handle'} //This is required to make only the header section draggable
                    direction={'row'}
                    sx={{ borderBottom: '1px solid #C0CCDA', height: '52px', padding: '24px 16px' }}
                    justifyContent={'space-between'}
                >
                    <Stack direction={'row'}>
                        <img
                            src={selectedNodeCardType === 'externalAPILoopNode' ? LoopIcon : ApiIcon}
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
                            {commonData.name
                                ? commonData.name
                                : selectedNodeCardType === 'externalAPILoopNode'
                                ? 'Loop Node'
                                : 'API Node'}
                        </Typography>
                    </Stack>
                    <Stack direction={'row'} spacing={1}>
                        {explicitLoading && !isUpdateNodeOnServerDone ? (
                            <div className="flex flex-row items-center">
                                <CircularProgress
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        marginRight: '0.5rem',
                                    }}
                                />

                                <p className="text-overline2 opacity-60">Saving ...</p>
                            </div>
                        ) : (
                            <div
                                style={{ width: '24px', height: '24px', alignSelf: 'center' }}
                                onClick={() => {
                                    nullChecker();

                                    if (
                                        (checkValidJson(requestBodyData) === true ||
                                            props.data.runData?.method === 'GET') &&
                                        displayedUrlValue !== ''
                                    ) {
                                        setIsJsonValid(true);
                                        triggerDelayedNodeSaveOnServer(1);
                                        setExplicitLoading(true);
                                    }
                                }}
                            >
                                <Tooltip title="Save changes">
                                    {(checkValidJson(requestBodyData) === false &&
                                        props.data.runData?.method !== 'GET') ||
                                    displayedUrlValue === '' ? (
                                        <CloudOff style={{ color: 'grey', cursor: 'pointer' }} />
                                    ) : (
                                        <CloudUploadIcon style={{ color: '#2c71c7', cursor: 'pointer' }} />
                                    )}
                                </Tooltip>
                            </div>
                        )}
                        <Tooltip title="Delete">
                            <Delete
                                sx={{ alignSelf: 'center', cursor: 'pointer' }}
                                color={'primary'}
                                onClick={() => {
                                    setDeleteData(cardId);
                                }}
                            />
                        </Tooltip>
                        <Tooltip title="Zoom-In View">
                            <img
                                src={DialogIcon}
                                style={{ width: '24px', height: '24px', alignSelf: 'center', cursor: 'pointer' }}
                                onClick={() => {
                                    setDrawerSelected('drawer');
                                }}
                            />
                        </Tooltip>
                        <Tooltip title="Expand/Collapse">
                            <img
                                src={Collapse}
                                style={{ width: '24px', height: '24px', alignSelf: 'center', cursor: 'pointer' }}
                                onClick={toggleCollapse}
                            />
                        </Tooltip>
                        {isNodeDataLoaded && (
                            <Tooltip title="Execute API">
                                <img
                                    src={RunIcon}
                                    style={{ width: '24px', height: '24px', alignSelf: 'center', cursor: 'pointer' }}
                                    onClick={
                                        apiType === 'system'
                                            ? () => {
                                                  setCollapse(true);
                                                  setResponseValue('1');
                                              }
                                            : execute
                                    }
                                />
                            </Tooltip>
                        )}
                    </Stack>
                </Stack>
            </Tooltip>

            {collapse && isNodeDataLoaded && renderAPINodeBody()}

            {(isLoading || isExecuting) && (
                <Stack>
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
                        {'Loading...'}
                    </Typography>
                </Stack>
            )}
            {!collapse && !isUpdateNodeOnServerDone && drawerSelected != '' && (
                <div className="my-7">
                    <LoaderWithMessage message={'Saving Data'} contained={true} className="" />
                </div>
            )}
            {showResponse && (
                <Stack>
                    {runData.method !== 'GET' ? (
                        <>
                            <TabContext value={responseValue}>
                                <Stack direction="row" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                    <TabList
                                        onChange={handleResponseChange}
                                        aria-label="lab API tabs responses"
                                        TabIndicatorProps={{ style: { display: 'none' } }}
                                    >
                                        <Tab
                                            label="Request"
                                            value={'0'}
                                            sx={{
                                                borderBottom: responseValue === '0' ? '2px solid #1976d2' : '',
                                                color: responseValue === '0' ? '#1976d2' : '',
                                            }}
                                        />
                                        <Tab
                                            label="Response"
                                            value={'1'}
                                            sx={{
                                                borderBottom: responseValue === '1' ? '2px solid #1976d2' : '',
                                                color: responseValue === '1' ? '#1976d2' : '',
                                            }}
                                        />
                                    </TabList>
                                </Stack>
                                <Stack width="100%">
                                    <TabPanel
                                        sx={{ padding: 0 }}
                                        value={'0'}
                                        key={`request-${runData?.output?.status || 0}-${executionNumber}`}
                                    >
                                        <ResponseTab
                                            message={''}
                                            isError={runData?.output?.status != 200 && runData?.output?.status != 0}
                                            isResponse={false}
                                            value={requestBodyData || {}}
                                            disabled={apiType === 'system' ? true : false}
                                            onChange={(value: any) => {
                                                if (checkValidJson(value) === true) {
                                                    setRequestBodyData(value);
                                                    setIsJsonValid(true);
                                                } else {
                                                    setIsJsonValid(false);
                                                }
                                                triggerDelayedNodeSaveOnServer(delayTimeSet);
                                            }}
                                        />
                                    </TabPanel>
                                    <TabPanel
                                        sx={{ padding: 0 }}
                                        value={'1'}
                                        key={`response-${runData?.output?.status || 0}-${executionNumber}`}
                                    >
                                        <ResponseTab
                                            message={runData?.output?.status?.toString()}
                                            isError={runData?.output?.status != 200 && runData?.output?.status != 0}
                                            value={runData?.output?.data}
                                            disabled={apiType === 'system' ? true : false}
                                        />
                                    </TabPanel>
                                </Stack>
                            </TabContext>
                        </>
                    ) : (
                        <TabContext value={'0'}>
                            <Stack direction="row" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList
                                    onChange={handleResponseChange}
                                    aria-label="lab API tabs responses"
                                    TabIndicatorProps={{ style: { display: 'none' } }}
                                >
                                    <Tab
                                        label="Response"
                                        value={'0'}
                                        sx={{
                                            borderBottom: responseValue === '0' ? '2px solid #1976d2' : '',
                                            color: responseValue === '0' ? '#1976d2' : '',
                                        }}
                                    />
                                </TabList>
                            </Stack>
                            <Stack width="100%" key={`response-${runData?.output?.status || 0}-${executionNumber}`}>
                                <ResponseTab
                                    message={runData?.output?.status?.toString()}
                                    isError={runData?.output?.status != 200 && runData?.output?.status != 0}
                                    isResponse={true}
                                    value={runData?.output?.data}
                                    disabled={apiType === 'system' ? true : false}
                                />
                            </Stack>
                        </TabContext>
                    )}
                </Stack>
            )}
            {!isJsonValid && !collapse && (
                <ErrorWithMessage message={'invalid JSON'} className={'mb-3'} contained isError />
            )}
        </Card>
    );
};

const ExternalAPINode = (props: NodeProps): React.ReactElement => (
    <>
        <Handle
            type="target"
            position={Position.Left}
            style={{ background: '#555' }}
            onConnect={(params) => console.log('handle onConnect', params)}
            isConnectable={props.isConnectable}
        />
        <Handle
            type="source"
            position={Position.Right}
            style={{ background: '#555' }}
            onConnect={(params) => console.log('handle onConnect', params)}
            isConnectable={props.isConnectable}
        />
        <ExternalAPINodeComponent {...props} />
    </>
);

export { ExternalAPINode };
