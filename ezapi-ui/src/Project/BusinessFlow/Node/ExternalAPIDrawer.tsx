import drawerCardAtom from '@/shared/atom/drawerCardAtom';
import selectedNodeAtom from '@/shared/atom/selectedNodeAtom';
import { CircularProgress, Tooltip } from '@material-ui/core';
import { Add } from '@material-ui/icons';
// @ts-ignore
import buildURL from 'axios/lib/helpers/buildURL';
import Qs from 'qs';
import LoaderWithMessage from '../../../shared/components/LoaderWithMessage';

import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import { CloudOff } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import {
    Autocomplete,
    AutocompleteRenderInputParams,
    Button,
    FormControlLabel,
    Radio,
    RadioGroup,
    Stack,
    Tab,
    TextField,
    Typography,
} from '@mui/material';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import _, { isEqual } from 'lodash';
import { SyntheticEvent, useContext, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import ApiIcon from '../../../icons/ApiIcon.svg';
import RunIcon from '../../../icons/runIcon.svg';
import { BusinessFlowContext } from '../BusinessFlowContext';
import { checkValidJson, convertObjectToFormData, formDataToObject } from '../businessFlowHelper';
import { getAggregateCard, getMappingData } from '../businessFlowQueries';
import { DEFAULT_API_RESPONSE } from '../defaults';
import useNodeHook from '../hooks/useNodeHook';
import { ExternalAPI, KeyValueProps } from '../interfaces';
import { CommonNodeData, NodeData } from '../interfaces/flow';
import { MyReactFlowState } from '../store';
import { ResponseTab } from './Components/ResponseTab';
import { TreeDropDown } from './Components/TreeDropDown';
import { ValueCard } from './Components/ValueCard';

interface ExternalAPIDrawerProps {
    cardId: string;
    refresh?: boolean;
    setRefresh?: any;
}
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
export const ExternalAPIDrawer = ({ cardId, refresh, setRefresh }: ExternalAPIDrawerProps) => {
    const { projectId, operationId, useStore } = useContext(BusinessFlowContext);
    const [cardData, setCardData] = useState<NodeData>();

    const updateNodeData = useStore((state: MyReactFlowState) => state.updateNodeData);
    const nodes = useStore((state: MyReactFlowState) => state.nodes);
    let isError: boolean | undefined;

    let initialRunData: ExternalAPI = {
        url: cardData?.runData?.url || '',
        method: cardData?.runData?.method || 'GET',
        headers: cardData?.runData?.headers || [],
        queryParams: cardData?.runData?.queryParams || [],
        pathParams: cardData?.runData?.pathParams || [],
        body: cardData?.runData?.body || '',
        output: cardData?.runData?.output || { ...DEFAULT_API_RESPONSE },
    };
    useEffect(() => {
        if (cardData) {
            initialRunData = {
                url: cardData?.runData?.url || '',
                method: cardData?.runData?.method || 'GET',
                headers: cardData?.runData?.headers || [],
                queryParams: cardData?.runData?.queryParams || [],
                pathParams: cardData?.runData?.pathParams || [],
                body: cardData?.runData?.body || '',
                output: cardData?.runData?.output || { ...DEFAULT_API_RESPONSE },
            };

            setCommonData(cardData?.commonData || {});

            isError = [undefined, 0].includes(cardData?.runData?.output?.status)
                ? undefined
                : cardData?.runData?.output?.success === false;

            setRunData(initialRunData);

            setShowResponse(
                cardData?.runData?.output?.status
                    ? cardData?.runData.output.status >= 200 && cardData?.runData?.output?.status < 300
                    : false,
            );
        }
    }, [cardData]);

    const [headers, setHeaders] = useState<KeyValueProps[]>();
    const [queryParams, setQueryParams] = useState<KeyValueProps[]>(initialRunData.queryParams || []);
    const [pathParams, setPathParams] = useState<KeyValueProps[]>(initialRunData.pathParams || []);
    const [runData, setRunData] = useState<ExternalAPI>(initialRunData);
    const [urlValue, setUrlValue] = useState<string>('');
    const [displayedUrlValue, setDisplayedUrlValue] = useState(initialRunData.url ?? '');
    const [explicitLoading, setExplicitLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [value, setValue] = useState('0');
    const [systemApis, _setSystemApis] = useState();
    const [requestBodyData, setRequestBodyData] = useState<any>(initialRunData.body?.data || {});
    const [isExecuting, setIsExecuting] = useState<boolean>(false);
    const [selectedNodeCardType, setSelectedNodeCardType] = useState('');

    const [apiType, setApiType] = useState<string>('api_call');
    const [_selectedCard] = useRecoilState(drawerCardAtom);
    const [intervalID, setIntervalID] = useState<number | undefined>();
    const [commonData, setCommonData] = useState<CommonNodeData>({
        name: '',
        parentNode: '',
    });

    // const [triggeredSaveDataOnServer, setTriggeredSaveDataOnServer] = useState<boolean>(false);

    const [isJsonValid, setIsJsonValid] = useState(true);
    const [_selectedNode, setSelectedNode] = useRecoilState(selectedNodeAtom);

    const [showResponse, setShowResponse] = useState(
        cardData?.runData?.output?.status
            ? cardData?.runData.output.status >= 200 && cardData?.runData?.output?.status < 300
            : false,
    );
    const [responseValue, setResponseValue] = useState<string>(cardData?.runData?.output?.success ? '1' : '0');

    const [executionNumber, setExecutionNumber] = useState<number>(0);
    const delayTimeSet = 4000;

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
        collapse: true,
    });

    function getUpdatedNodeDataFn() {
        const newNodeData = (_.isEmpty(node?.data) ? {} : node?.data) as NodeData;
        let updatedRunData;
        setExplicitLoading(false);

        if (runData.method !== 'GET') {
            console.log('requestbodydata:', requestBodyData, typeof requestBodyData);
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
                            : requestBodyData === ''
                            ? {}
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
        if (refresh) {
            loadNodeDataFromServer();
            setRefresh(false);
        }
    }, [refresh]);
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

    function setApiName(newApiName: string) {
        setCommonData({ ...commonData, name: newApiName });
        triggerDelayedNodeSaveOnServer(delayTimeSet);
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
                    //triggerDelayedNodeSaveOnServer(delayTimeSet);
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
                    // setCollapse(true);
                    setIsExecuting(false);
                    setResponseValue('1');
                    setShowResponse(true);
                    nullChecker();
                    scrollToBottom('scroll');

                    //triggerDelayedNodeSaveOnServer(delayTimeSet);
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
                            triggerDelayedNodeSaveOnServer(delayTimeSet);
                        }
                    });
                }
            }
        } else {
            apiCall();
            triggerDelayedNodeSaveOnServer(delayTimeSet);
        }
    };

    function setActionType(newMethod: string) {
        if (newMethod && runData.method?.toUpperCase() !== newMethod.toUpperCase()) {
            setRunData({ ...runData, method: newMethod as Method, output: { ...DEFAULT_API_RESPONSE } });
            triggerDelayedNodeSaveOnServer(delayTimeSet);
        }
    }

    function setUrl(newUrl: string) {
        setRunData({
            ...runData,
            url: newUrl,
            headers: headers,
            queryParams: queryParams,
            pathParams: pathParams,
            output: { ...DEFAULT_API_RESPONSE },
        });
        triggerDelayedNodeSaveOnServer(delayTimeSet);
    }

    function setHeadersData(newHeaders: KeyValueProps[]) {
        if (newHeaders) {
            setRunData({ ...runData, headers: newHeaders, output: { ...DEFAULT_API_RESPONSE } });
            triggerDelayedNodeSaveOnServer(delayTimeSet);
        }
    }

    const scrollToBottom = (id: any) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    };

    function setRequestData(newRequestData: string | object) {
        if (newRequestData) {
            const newRunData = {
                ...runData,
                body: {
                    data: formDataToObject(convertObjectToFormData(newRequestData)),
                },
                output: { ...DEFAULT_API_RESPONSE },
            };
            setRunData(newRunData);
            triggerDelayedNodeSaveOnServer(delayTimeSet);
        }
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

    const renderAPINodeBody = () => (
        <>
            <Stack
                justifyContent={'space-around'}
                sx={{ padding: '24px 16px', height: '300px', width: '100%', gap: 1 }}
                spacing={2}
            >
                <RadioGroup
                    aria-labelledby="controlled-radio-buttons-group"
                    name="controlled-radio-buttons-group"
                    onChange={(e) => {
                        setApiType(e.target.value);
                    }}
                    value={apiType}
                >
                    <Stack direction={'row'}>
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
                <div>
                    {' '}
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
                                onChange={(e) => {
                                    setApiName(e.target.value);
                                }}
                                sx={{
                                    width: '100%',
                                    padding: '0px',
                                }}
                                inputProps={{ style: { height: '15px' } }}
                            />
                        </>
                    )}
                </div>

                <Stack direction="row" sx={{ width: '100%' }}>
                    <Stack sx={{ paddingRight: '24px', width: '30%' }}>
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
                            // style={{
                            //     width: '155px',
                            // }}
                        />
                    </Stack>
                    <Stack sx={{ width: '70%' }}>
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
                            fullWidth={true}
                            onBlur={() => setIsFocused(false)}
                            // sx={{
                            //     width: '556px',
                            // }}
                            style={{ height: '50px' }}
                        />
                    </Stack>
                </Stack>
            </Stack>

            <Stack sx={{ paddingX: '16px', paddingY: '0px', width: '100%' }}>
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
                    <TabPanel value={'0'} sx={{ padding: '12px 0px' }}>
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
                            cardType={'drawer'}
                        />
                    </TabPanel>
                    <TabPanel
                        sx={{ padding: '12px 0px' }}
                        value={'1'}
                        key={
                            runData?.queryParams?.length
                                ? runData.queryParams[runData.queryParams.length - 1].key
                                : 'query panel'
                        }
                    >
                        <ValueCard
                            value={queryParams}
                            cardType={'drawer'}
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
                        sx={{ padding: '12px 0px' }}
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
                            cardType={'drawer'}
                            onChange={(newPathParams: KeyValueProps[]) => {
                                if (isEqual(pathParams, newPathParams)) return;
                                if (
                                    newPathParams?.length == 1 &&
                                    newPathParams[0].key === '' &&
                                    newPathParams[0].value === ''
                                ) {
                                    setPathParams([]);
                                } else {
                                    setPathParams(newPathParams);
                                }
                                if (!displayedUrlValue || !isValidUrl(displayedUrlValue)) {
                                    return;
                                } else {
                                    const currentUrl = new URL(displayedUrlValue ?? '');
                                    if (
                                        newPathParams?.length == 1 &&
                                        newPathParams[0].key === '' &&
                                        newPathParams[0].value === ''
                                    ) {
                                        currentUrl.pathname = '';
                                    } else {
                                        const newPath = newPathParams.map((param) => `/:${param.key}`).join('');
                                        currentUrl.pathname = newPath;
                                    }
                                    setUrl(currentUrl.toString());
                                    setDisplayedUrlValue(currentUrl.toString());
                                }
                            }}
                        />
                    </TabPanel>
                </TabContext>
                {/*
                {!showResponse && runData.method !== 'GET' && (
                    <Stack width="100%">
                        <ResponseTab
                            onChange={(value: any) => {
                                setRequestData(value);
                                if (checkValidJson(value)) {
                                    setIsJsonValid(true);
                                } else {
                                    setIsJsonValid(false);
                                }
                            }}
                            isError={isError}
                            isResponse={false}
                            displayTitle="Response Body"
                            value={runData.body?.data || {}}
                            disabled={apiType === 'system' ? true : false}
                        />
                    </Stack>
                )} */}
            </Stack>
        </>
    );

    return (
        <Stack sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack
                direction={'row'}
                sx={{
                    borderBottom: '1px solid #C0CCDA',
                    height: '52px',
                    padding: '24px 16px',
                    position: 'sticky',
                    top: '0',
                }}
                justifyContent={'space-between'}
            >
                <Stack direction={'row'}>
                    <img src={ApiIcon} style={{ width: '24px', height: '24px', alignSelf: 'center' }} />
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
                        {commonData.name ?? 'API'}
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
                                    (checkValidJson(requestBodyData) === true || runData.method !== 'GET') &&
                                    displayedUrlValue !== ''
                                ) {
                                    setIsJsonValid(true);
                                    triggerDelayedNodeSaveOnServer(1);
                                    setExplicitLoading(true);
                                }
                            }}
                        >
                            <Tooltip title="Save changes">
                                {(checkValidJson(requestBodyData) === false && runData.method !== 'GET') ||
                                displayedUrlValue === '' ? (
                                    <CloudOff style={{ color: 'grey', cursor: 'pointer' }} />
                                ) : (
                                    <CloudUploadIcon style={{ color: '#2c71c7', cursor: 'pointer' }} />
                                )}
                            </Tooltip>
                        </div>
                    )}
                    <Tooltip title="Execute API">
                        <img
                            src={RunIcon}
                            style={{ width: '24px', height: '24px', alignSelf: 'center', cursor: 'pointer' }}
                            onClick={
                                apiType === 'system'
                                    ? () => {
                                          setResponseValue('1');
                                      }
                                    : execute
                            }
                        />
                    </Tooltip>
                </Stack>
            </Stack>

            <Stack sx={{ overflow: 'auto', height: '100%', width: '100%' }} id="scroll">
                {isLoading && <LoaderWithMessage message="Loading data" className="mb-5" />}

                {!isLoading && (
                    <>
                        {renderAPINodeBody()}

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

                        {!showResponse && runData.method !== 'GET' && (
                            <Stack width="100%">
                                <ResponseTab
                                    onChange={(value: any) => {
                                        if (checkValidJson(value) === true) {
                                            setIsJsonValid(true);
                                        } else {
                                            setIsJsonValid(false);
                                        }
                                        setRequestBodyData(value);

                                        triggerDelayedNodeSaveOnServer(delayTimeSet);
                                    }}
                                    isError={isError}
                                    isResponse={false}
                                    displayTitle="Request Body"
                                    value={requestBodyData || {}}
                                    disabled={apiType === 'system' ? true : false}
                                />
                            </Stack>
                        )}

                        {showResponse && (
                            <Stack sx={{ padding: '9px 11px', width: '100%' }}>
                                {runData.method !== 'GET' ? (
                                    <>
                                        <TabContext value={responseValue}>
                                            <Stack direction="row" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                                <TabList
                                                    onChange={handleResponseChange}
                                                    aria-label="lab API tabs responses"
                                                >
                                                    <Tab label="Request" value={'0'} />
                                                    <Tab label="Response" value={'1'} />
                                                </TabList>
                                            </Stack>
                                            <Stack width="100%">
                                                <TabPanel
                                                    value={'0'}
                                                    sx={{ padding: '3px' }}
                                                    key={`request-${runData?.output?.status || 0}-${executionNumber}`}
                                                >
                                                    <ResponseTab
                                                        onChange={(value: any) => {
                                                            if (checkValidJson(value) === true) {
                                                                setIsJsonValid(true);
                                                            } else {
                                                                setIsJsonValid(false);
                                                            }
                                                            setRequestBodyData(value);

                                                            triggerDelayedNodeSaveOnServer(delayTimeSet);
                                                        }}
                                                        isError={isError}
                                                        isResponse={false}
                                                        value={requestBodyData || {}}
                                                        disabled={apiType === 'system' ? true : false}
                                                    />
                                                </TabPanel>
                                                <TabPanel
                                                    value={'1'}
                                                    sx={{ padding: '3px' }}
                                                    key={`response-${runData?.output?.status || 0}-${executionNumber}`}
                                                >
                                                    <ResponseTab
                                                        message={runData?.output?.status?.toString()}
                                                        isError={runData?.output?.status != 200}
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
                                        <Stack
                                            width="100%"
                                            key={`response-${runData?.output?.status || 0}-${executionNumber}`}
                                        >
                                            <ResponseTab
                                                message={runData?.output?.status?.toString()}
                                                isError={runData?.output?.status != 200}
                                                isResponse={true}
                                                value={runData?.output?.data}
                                                disabled={apiType === 'system' ? true : false}
                                            />
                                        </Stack>
                                    </TabContext>
                                )}
                            </Stack>
                        )}
                        <Stack sx={{ padding: '0 16px 16px' }} alignItems={'flex-start'}>
                            <Button
                                sx={{ width: 'fit-content' }}
                                onClick={() => {
                                    setSelectedNode(cardId);
                                }}
                                variant="outlined"
                                startIcon={<Add />}
                            >
                                Add Mapping
                            </Button>
                        </Stack>
                    </>
                )}
            </Stack>
        </Stack>
    );
};
