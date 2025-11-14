import { Snackbar } from '@material-ui/core';
import MuiAlert from '@mui/material/Alert';
import axios from 'axios';
import { useState } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { endpoint } from '../../../../shared/network/client';
import { getUserId } from '../../../../shared/storage';
import { accessToken, currentApi, currentTabs, requestParams, responseInfo } from '../../../CollectionsAtom';
import RequestTabs from './RequestTabs';
import UrlEditor from './UrlEditor';
export default function Request({ loading, setLoading }) {
    const [request, setRequest] = useRecoilState(requestParams);
    const authToken = useRecoilValue(accessToken);
    const setResponse = useSetRecoilState(responseInfo);
    const userId = getUserId();
    const api = useRecoilValue(currentApi);
    const setTabs = useSetRecoilState(currentTabs);
    const [snackbar, setSnackbar] = useState(false);

    const proxyURL = process.env.REACT_APP_PROXY_URL;

    const convertKeyValueToObject = (keyPairs) => {
        return [...keyPairs].reduce((data, pair) => {
            const key = pair.keyItem;
            const value = pair.valueItem;

            if (key === '') return data;
            return {
                ...data,
                [key.trim()]: value,
            };
        }, {});
    };

    const handleOnInputSend = async (e) => {
        setLoading(true);
        e.preventDefault();
        let data;
        const startTime = Date.now(); // Start tracking elapsed time
        if (request.body === undefined || request.body === null) {
            data = {};
        } else {
            try {
                data = request.body;
            } catch (e) {
                console.error('Something is wrong with the JSON data.', e);
            }
        }
        try {
            let testURL = 'http://localhost:';
            let newUrl = request.url;
            if (newUrl.includes('https://localhost:')) {
                newUrl = 'http://localhost:' + newUrl.slice(18);
            }
            let newProxy = request.proxy;
            if (newUrl.includes(testURL)) {
                newProxy = 'No Proxy';
            }
            const headers = convertKeyValueToObject(request.header);

            if (!Object.keys(headers).includes('content-type')) {
                headers['content-type'] = 'application/json';
            }

            if (authToken && authToken.length > 0) {
                headers.Authorization = `Bearer ${authToken}`;
            }
            if (newProxy === 'Proxy') {
                const req = {
                    ...request,
                    url: newUrl,
                    proxy: newProxy,
                };
                let res = {};
                const data = {
                    url: request.url,
                    method: request.method,
                    params: convertKeyValueToObject(request.queryParams),
                    headers,
                    data: request.body,
                };

                await axios({
                    //url: 'https://proxy.ezapi.ai',
                    url: proxyURL,
                    data,
                    method: 'POST',
                })
                    .then(async (response) => {
                        res = {
                            status: response.status,
                            headers: response.headers,
                            data: response.data,
                            time: ((Date.now() - startTime) / 1000).toFixed(2),
                            size: (new Blob([JSON.stringify(response)]).size / 1024).toFixed(2),
                            error: false,
                        };
                        setResponse(res);
                    })
                    .catch(async function (error) {
                        if (error.response) {
                            res = {
                                time: ((Date.now() - startTime) / 1000).toFixed(2),
                                data: error.response.data,
                                status: error.response.status,
                                headers: error.response.headers,
                            };
                            setResponse(res);
                        }
                    });

                const currentDate = new Date();
                const formattedDateTime = currentDate.toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                });
                await axios
                    .put(process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}/${api.id}`, {
                        request: req,
                        response: res,
                        modifiedAt: formattedDateTime,
                    })
                    .then((response) => {
                        const data = response.data;
                        setTabs((prev) => {
                            const isTabExists = prev.some((tab) => tab.id === data.id);
                            if (isTabExists) {
                                // If the tab already exists, update the existing tab with new data
                                return prev.map((tab) => {
                                    if (tab.id === data.id) {
                                        return {
                                            ...tab,
                                            request: data.request,
                                            response: data.response,
                                        };
                                    }
                                    return tab;
                                });
                            } else {
                                return [...prev];
                            }
                        });
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    });
            } else {
                const requestOptions = {
                    method: request.method,
                    headers,
                };

                if (request.method === 'GET' || request.method === 'HEAD') {
                    requestOptions.body = undefined;
                } else {
                    requestOptions.body = data;
                }
                // console.log(requestOptions);
                const response = await fetch(newUrl, requestOptions);
                let responseData;
                if (!response.ok) {
                    const errorStatus = response.status || 404;
                    const errorMessage = await response.text();
                    responseData = {
                        status: errorStatus,
                        headers: {},
                        data: errorMessage && errorMessage !== '{}' ? errorMessage : { error: 'Data Not Found' },
                        time: ((Date.now() - startTime) / 1000).toFixed(2),
                    };
                    setResponse(responseData);
                }
                if (response.ok) {
                    const responseHeaders = response.headers;
                    // Convert the headers to an object
                    const headersObject = {};
                    for (const [key, value] of responseHeaders) {
                        headersObject[key] = value;
                    }
                    responseData = {
                        status: response.status,
                        headers: headersObject,
                        data: await response.json(),
                        time: ((Date.now() - startTime) / 1000).toFixed(2),
                        size: (new Blob([JSON.stringify(response)]).size / 1024).toFixed(2),
                        error: false,
                    };
                    setResponse(responseData);
                }
                const currentDate = new Date();
                const formattedDateTime = currentDate.toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                });
                await axios
                    .put(process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}/${api.id}`, {
                        request: request,
                        response: responseData,
                        modifiedAt: formattedDateTime,
                    })
                    .then((response) => {
                        const data = response.data;
                        setTabs((prev) => {
                            const isTabExists = prev.some((tab) => tab.id === data.id);
                            if (isTabExists) {
                                // If the tab already exists, update the existing tab with new data
                                return prev.map((tab) => {
                                    if (tab.id === data.id) {
                                        return {
                                            ...tab,
                                            request: data.request,
                                            response: data.response,
                                        };
                                    }
                                    return tab;
                                });
                            } else {
                                return [...prev];
                            }
                        });
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    });
            }
            setRequest((oldRequestParams) => ({
                ...oldRequestParams,
                url: newUrl,
                proxy: newProxy,
            }));
        } catch (error) {
            if (error.name === 'TypeError') {
                setSnackbar(true);
            } else {
                console.error('An error occurred:', error);
            }
            setResponse({
                status: error.status || 404,
                headers: {},
                data: {},
                time: ((Date.now() - startTime) / 1000).toFixed(2),
                error: true,
                errorMessage: error.message,
            });
        }
        setLoading(false);
    };

    return (
        <>
            <UrlEditor onInputSend={handleOnInputSend} loading={loading} />
            <RequestTabs />
            <Snackbar open={snackbar} autoHideDuration={1800} onClose={() => setSnackbar(false)}>
                <MuiAlert
                    onClose={() => setSnackbar(false)}
                    elevation={6}
                    sx={{
                        width: '100%',
                        alignItems: 'center',
                        backgroundColor: 'grey',
                    }}
                    variant="filled"
                    icon={false}
                >
                    Network Error! Try with proxy
                </MuiAlert>
            </Snackbar>
        </>
    );
}
