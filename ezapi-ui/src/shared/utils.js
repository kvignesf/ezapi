import _ from 'lodash';
import { useEffect, useState } from 'react';
import { selector, useGetRecoilValueInfo_UNSTABLE } from 'recoil';
import { useUserRole } from '../Project/UserRoleContext';
import operationAtom, { defaultState } from '../Project/operationAtom';
import schemaAtom from './atom/schemaAtom';
import tableAtom from './atom/tableAtom';
import Constants from './constants';
import Messages from './messages';
import { endpoint } from './network/client';
import { getAccessToken } from './storage';

export const isEmailValid = (email) => {
    const re =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

export const isUserLoggedIn = () => {
    const token = getAccessToken();

    return token && !_.isEmpty(token);
};

export const getApiError = (error) => {
    const url = error?.config?.url;

    if (error?.response?.status === 400) {
        if (url && url === endpoint.login) {
            return new Error(Messages.NO_USER_DETAILS);
        }

        if (url && url === endpoint.publishProject) {
            return error;
        }

        if (url && url === endpoint.project) {
            return error;
        }

        /* if(url && url === endpoint.verifyProject) {
      console.log("err", error?.message)
      return error?.message[0];
    } */

        if (url && url === endpoint.testDBConnection) {
            return new Error(error?.response?.data?.message);
        }

        if (url && url === endpoint.exportDBSchema) {
            return new Error(error?.response?.data?.message);
        }

        if (url && !_.isEmpty(url) && url.includes('/upload_To_GCP')) {
            return new Error(error?.response?.data?.message);
        }
        return new Error(error?.response?.data?.message);
        // return new Error(Messages.INVALID_DATA);
    } else if (url && !_.isEmpty(url) && url.includes('/uploads')) {
        return new Error(error?.response?.data?.aiResponse?.message);
    }

    return new Error(Messages.UNKNOWN);
};

export const isArray = (object) => {
    //return object?.type === "array" && !object?.schemaName;
    return object?.type === 'array';
};

export const isAttribute = (object) => {
    //console.log("object,", object)
    return (
        object?.type === 'string' ||
        object?.type === 'date' ||
        object?.type === 'float' ||
        object?.type === 'objectId' ||
        object?.type === 'oid' ||
        (object?.type &&
            !_.isEmpty(object?.type) &&
            object?.paramType !== 'column' &&
            (_.includes(Constants.acceptedTypes, object?.type) || isCustomParam(object)))
    );
};

export const isArrayOrObjectAttribute = (object) => {
    return (
        object?.type &&
        _.isEmpty(object?.ref) &&
        object?.paramType !== 'column' &&
        _.includes(Constants.bodyAcceptedTypes, object?.type)
    );
};
/** if we are not utilizing ezapi_ref_array anymore that condition can be removed */
export const isSchema = (object) => {
    return (
        object?.type === 'ref' ||
        object?.type === 'ezapi_ref' ||
        object?.type === 'ezapi_ref_array' ||
        (object?.data !== null && object?.data !== undefined && !object?.contentType) ||
        (object?.schemaName && !isAttribute(object))
    );
};

export const isArrayOfObject = (object) => {
    return object?.type === 'arrayOfObjects';
};

export const isDatabase = (object) => {
    return object?.type === 'ezapi_table';
};

export const isMongoDb = (object) => {
    return object?.type === 'ezapi_collection';
};

export const isStoredProcedure = (object) => {
    return object?.type === 'storedProcedure';
};
export const isInput = (object) => {
    return object?.type === 'input';
};
export const isOutput = (object) => {
    return object?.type === 'output';
};

export const isColumn = (object) => {
    return object?.paramType === 'column';
};

export const isObject = (object) => {
    return object?.type === 'object';
};

export const isFullMatch = (object) => {
    return object?.match_type?.toLowerCase() === 'full';
};

export const isPartialMatch = (object) => {
    return object?.match_type?.toLowerCase() === 'partial';
};

export const isCustomParam = (object) => {
    return object?.paramType === 'customParam';
};

export const isDocumentField = (object) => {
    return object?.paramType === 'documentField';
};

export const isNoMatch = (object) => {
    return !object?.match_type || object?.match_type?.toLowerCase() === 'no match';
};

export const useWindowSize = () => {
    // Initialize state with undefined width/height so server and client renders match
    // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
    const [windowSize, setWindowSize] = useState({
        width: undefined,
        height: undefined,
    });
    useEffect(() => {
        // Handler to call on window resize
        function handleResize() {
            // Set window width/height to state
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }
        // Add event listener
        window.addEventListener('resize', handleResize);
        // Call handler right away so state gets updated with initial window size
        handleResize();
        // Remove event listener on cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Empty array ensures that effect is only run on mount
    return windowSize;
};

/**
 * Generates request body that can be passed to Sync Operation Request API
 *
 * @param  {[object]} [operationRequest] The operation request state saved in the local.
 * @return {[object]} [apiRequest] The request body that can be passed to the API.
 */
export const generateSyncOperationRequestRequest = (operationRequest) => {
    let request = {
        headers: [],
        authorization: '',
        endpoint: '',
        path: [],
        query: [],
        formData: [],
        body: [],
        cookie: [],
    };

    if (!operationRequest || _.isEmpty(operationRequest)) {
        return request;
    }

    if (operationRequest?.headers && !_.isEmpty(operationRequest?.headers)) {
        request.headers = operationRequest?.headers?.map((header) => {
            let clonedHeader = _.cloneDeep(header);

            clonedHeader.required = header?.required === true || header?.required === 'true' ? true : false;

            const possibleValuesType = Object.prototype.toString.call(header?.possibleValues);

            if (possibleValuesType === '[object String]') {
                clonedHeader.possibleValues =
                    header?.possibleValues?.split(',').map((item) => {
                        return item.trim(' ');
                    }) ?? [];
            }

            return clonedHeader;
        });
    }

    if (operationRequest?.queryParams && !_.isEmpty(operationRequest?.queryParams)) {
        request.query = operationRequest?.queryParams?.map((item) => {
            let clonedItem = _.cloneDeep(item);

            clonedItem.required = item?.required === true || item?.required === 'true' ? true : false;

            return clonedItem;
        });
    }

    if (operationRequest?.pathParams && !_.isEmpty(operationRequest?.pathParams)) {
        request.path = operationRequest?.pathParams?.map((item) => {
            let clonedItem = _.cloneDeep(item);

            clonedItem.required = item?.required === true || item?.required === 'true' ? true : false;

            return clonedItem;
        });
    }

    if (operationRequest?.formData && !_.isEmpty(operationRequest?.formData)) {
        request.formData = operationRequest?.formData?.map((item) => {
            let clonedItem = _.cloneDeep(item);

            clonedItem.required = item?.required === true || item?.required === 'true' ? true : false;

            return clonedItem;
        });
    }

    if (operationRequest?.authorization && !_.isEmpty(operationRequest?.authorization)) {
        let clonedItem = _.cloneDeep(operationRequest?.authorization);
        request.authorization = clonedItem;
    }

    if (operationRequest?.endpoint && !_.isEmpty(operationRequest?.endpoint)) {
        let clonedItem = _.cloneDeep(operationRequest?.endpoint);
        request.endpoint = clonedItem;
    }

    if (operationRequest?.body && !_.isEmpty(operationRequest?.body)) {
        request.body = operationRequest?.body?.map((item) => {
            const clonedItem = _.cloneDeep(item);

            if (isArrayOfObject(item) || isArray(item) || isObject(item)) {
                if (clonedItem?.hasOwnProperty('data')) {
                    delete clonedItem?.data;
                }
                if (clonedItem?.hasOwnProperty('possibleValues')) {
                    delete clonedItem?.possibleValues;
                }
                /* if (clonedItem?.hasOwnProperty("schemaName")) {
          delete clonedItem?.schemaName;
        } */
                if (clonedItem?.hasOwnProperty('schemaRef')) {
                    delete clonedItem?.schemaRef;
                }
                if (clonedItem?.hasOwnProperty('parentName')) {
                    delete clonedItem?.parentName;
                }
                if (clonedItem?.hasOwnProperty('commonName')) {
                    delete clonedItem?.commonName;
                }

                return clonedItem;
            } else if (isSchema(item) || isDatabase(item)) {
                return clonedItem;
            } else if (
                isAttribute(item) ||
                isColumn(item) ||
                isStoredProcedure(item) ||
                isArrayOrObjectAttribute(item)
            ) {
                return clonedItem;
            }
            return clonedItem;
        });
    }

    return request;
};

/**
 * Parses the response of Get Operation Request API to the local state format.
 *
 * @param  {[object]} [operationResponse] The operation response which is to be parsed into the local state format.
 * @return {[object]} [object] Operation Request in the local state format.
 */
export const parseGetOperationRequestResponse = (requestAPIData) => {
    var operationResponse = requestAPIData?.requestBody;
    if (!operationResponse || _.isEmpty(operationResponse)) {
        return {
            headers: [],
            formData: [],
            pathParams: [],
            queryParams: [],
            body: [],
            endpoint: '',
            authorization: {},
        };
    }
    let request = {
        headers: [],
        formData: [],
        pathParams: [],
        queryParams: [],
        authorization: {},
        endpoint: '',
        body: [],
    };

    if (operationResponse?.header && !_.isEmpty(operationResponse?.header)) {
        request.headers = operationResponse?.header?.map((header) => {
            const headerName = Object.keys(header)[0];
            const headerObject = header[headerName];

            let clonedHeader = _.cloneDeep(headerObject);

            clonedHeader.name = headerName;

            clonedHeader.required = headerObject?.required === true || headerObject?.required === 'true' ? true : false;

            clonedHeader.possibleValues =
                headerObject?.possibleValues?.reduce((acc, curr) => {
                    if (acc) {
                        return acc + ', ' + curr;
                    }
                    return curr;
                }, '') ?? [];

            return clonedHeader;
        });
    }

    if (operationResponse?.query && !_.isEmpty(operationResponse?.query)) {
        request.queryParams = operationResponse?.query?.map((query) => {
            const queryName = Object.keys(query)[0];
            const queryObject = query[queryName];

            const clonedQueryObject = _.cloneDeep(queryObject);
            clonedQueryObject.name = queryName;

            return clonedQueryObject;
        });
    }

    if (operationResponse?.path && !_.isEmpty(operationResponse?.path)) {
        request.pathParams = operationResponse?.path?.map((param) => {
            const paramName = Object.keys(param)[0];
            const paramObject = param[paramName];

            const clonedParamObject = _.cloneDeep(paramObject);
            clonedParamObject.name = paramName;

            return clonedParamObject;
        });
    }

    if (operationResponse?.formData && !_.isEmpty(operationResponse?.formData)) {
        request.formData = operationResponse?.formData?.map((formData) => {
            const formDataName = Object.keys(formData)[0];
            const formDataObject = formData[formDataName];

            const clonedFormDataObject = _.cloneDeep(formDataObject);
            clonedFormDataObject.name = formDataName;

            return clonedFormDataObject;
        });
    }

    if (operationResponse?.body && !_.isEmpty(operationResponse?.body)) {
        if (operationResponse?.body?.properties && !_.isEmpty(operationResponse?.body?.properties)) {
            // Multiple body items

            request.body = Object.keys(operationResponse?.body?.properties).map((objectName) => {
                const clonedObj = _.cloneDeep(operationResponse?.body?.properties[objectName]);

                if (!clonedObj?.name || _.isEmpty(clonedObj?.name)) {
                    clonedObj.name = objectName;
                }

                return clonedObj;
            });
        } else {
            // Single body item

            if (
                operationResponse?.body?.ezapi_ref ||
                isAttribute(operationResponse?.body) ||
                isColumn(operationResponse?.body) ||
                isStoredProcedure(operationResponse?.body) ||
                operationResponse?.body?.schemaName
            ) {
                request.body = [_.cloneDeep(operationResponse?.body)];
            }
        }
    }

    if (operationResponse?.authorization && !_.isEmpty(operationResponse?.authorization)) {
        request.authorization = operationResponse?.authorization;
    }
    if (requestAPIData?.endpoint && !_.isEmpty(requestAPIData?.endpoint)) {
        request.endpoint = requestAPIData?.endpoint;
    }

    return request;
};

/**
 * Generates request body that can be passed to Sync Operation Response API
 *
 * @param  {[object]} [operationRequest] The operation response state saved in the local.
 * @return {[object]} [apiRequest] The request body that can be passed to the API.
 */
export const generateSyncOperationResponseRequest = (operationResponse) => {
    let request = [];

    if (!operationResponse || _.isEmpty(operationResponse)) {
        return request;
    }

    request = operationResponse?.map((reponseData) => {
        let responseObject = {
            status_code: reponseData?.responseCode,
            description: reponseData?.description,
            links: [],
            headers: [],
            content: [],
        };

        if (reponseData?.headers && !_.isEmpty(reponseData?.headers)) {
            responseObject.headers = reponseData?.headers?.map((header) => {
                let clonedHeader = _.cloneDeep(header);

                clonedHeader.required = header?.required === true || header?.required === 'true' ? true : false;

                const possibleValuesType = Object.prototype.toString.call(header?.possibleValues);

                if (possibleValuesType === '[object String]') {
                    clonedHeader.possibleValues =
                        header?.possibleValues?.split(',').map((item) => {
                            return item.trim(' ');
                        }) ?? [];
                }

                return clonedHeader;
            });
        }

        if (reponseData?.body && !_.isEmpty(reponseData?.body)) {
            responseObject.content = reponseData?.body?.map((item) => {
                if (isArrayOfObject(item) || isArray(item) || isObject(item)) {
                    const clonedItem = _.cloneDeep(item);

                    if (clonedItem?.hasOwnProperty('data')) {
                        delete clonedItem?.data;
                    }
                    if (!isArray(item)) {
                        if (clonedItem?.hasOwnProperty('possibleValues')) {
                            delete clonedItem?.possibleValues;
                        }
                    }
                    /* if (clonedItem?.hasOwnProperty("schemaName")) {
            delete clonedItem?.schemaName;
          } */
                    if (clonedItem?.hasOwnProperty('schemaRef')) {
                        delete clonedItem?.schemaRef;
                    }
                    if (clonedItem?.hasOwnProperty('parentName')) {
                        delete clonedItem?.parentName;
                    }
                    if (clonedItem?.hasOwnProperty('commonName')) {
                        delete clonedItem?.commonName;
                    }
                    return clonedItem;
                } else if (isSchema(item)) {
                    const clonedItem = _.cloneDeep(item);

                    if (clonedItem?.hasOwnProperty('data')) {
                        delete clonedItem?.data;
                    }

                    return clonedItem;
                } else if (isAttribute(item) || isColumn(item) || isDatabase(item) || isStoredProcedure(item)) {
                    return item;
                }
                return item;
            });
        }

        return responseObject;
    });

    return request;
};

/**
 * Parses the response of Get Operation Response API to the local state format.
 *
 * @param  {[object]} [operationResponse] The operation response which is to be parsed into the local state format.
 * @return {[object]} [object] Operation Response in the local state format.
 */
export const parseGetOperationResponseResponse = (operationResponse) => {
    let response = [
        {
            responseCode: Constants.mandatoryResponse.code,
            description: Constants.mandatoryResponse.description,
            headers: [],
            body: [],
        },
    ];

    if (!operationResponse || _.isEmpty(operationResponse)) {
        return response;
    }

    response = operationResponse?.map((responseData) => {
        let responseObj = {
            responseCode: null,
            description: null,
            headers: [],
            body: [],
        };

        responseObj.responseCode = parseInt(responseData.status_code);
        responseObj.description = responseData.description;

        responseObj.headers = responseData?.headers?.map((header) => {
            const headerName = Object.keys(header)[0];
            const headerObject = header[headerName];

            let clonedHeader = _.cloneDeep(headerObject);

            clonedHeader.name = headerName;

            clonedHeader.required = headerObject?.required === true || headerObject?.required === 'true' ? true : false;

            clonedHeader.possibleValues =
                headerObject?.possibleValues?.reduce((acc, curr) => {
                    if (acc) {
                        return acc + ', ' + curr;
                    }
                    return curr;
                }, '') ?? [];

            return clonedHeader;
        });

        responseObj.body = [];
        if (responseData?.content?.properties && !_.isEmpty(responseData?.content?.properties)) {
            // Multiple body items

            responseObj.body = Object.keys(responseData?.content?.properties).map((objectName) => {
                const clonedObj = _.cloneDeep(responseData?.content?.properties[objectName]);

                if (!clonedObj?.name || _.isEmpty(clonedObj?.name)) {
                    clonedObj.name = objectName;
                }

                return clonedObj;
            });
        } else {
            // Single body item

            if (
                responseData?.content?.ezapi_ref ||
                isAttribute(responseData?.content) ||
                isColumn(responseData?.content) ||
                isStoredProcedure(responseData?.content)
            ) {
                // if (responseData?.content) {

                responseObj.body = [_.cloneDeep(responseData?.content)];
            }
        }

        return responseObj;
    });

    return response;
};

export const useGetParentName = () => {
    const getRecoilValueInfo = useGetRecoilValueInfo_UNSTABLE();
    const fetch = (object) => {
        if (isAttribute(object)) {
            const { loadable: schemaAtomLoadable } = getRecoilValueInfo(schemaAtom);
            const schemaDetails = schemaAtomLoadable?.contents;

            if (schemaDetails && schemaDetails?.selected && !_.isEmpty(schemaDetails?.selected)) {
                const value = schemaDetails?.selected
                    ?.slice()
                    ?.reverse()
                    ?.find((item) => isSchema(item));

                return value?.name;
            }

            return null;
        } else if (isColumn(object)) {
            const { loadable: tableAtomLoadable } = getRecoilValueInfo(tableAtom);
            const tableDetails = tableAtomLoadable?.contents;
            if (tableDetails && tableDetails?.selected && !_.isEmpty(tableDetails?.selected)) {
                return tableDetails?.selected[tableDetails.selected.length - 1]?.name;
            }
            return null;
        }
    };

    return {
        fetch,
    };
};

export const useGetFullPath = () => {
    const getRecoilValueInfo = useGetRecoilValueInfo_UNSTABLE();
    const fetch = (object) => {
        if (isAttribute(object)) {
            const { loadable: schemaAtomLoadable } = getRecoilValueInfo(schemaAtom);
            const schemaDetails = schemaAtomLoadable?.contents;

            if (schemaDetails && schemaDetails?.selected && !_.isEmpty(schemaDetails?.selected)) {
                const path = schemaDetails?.selected?.reduce((acc, curr) => {
                    if (_.isEmpty(acc)) {
                        return '/' + curr?.name;
                    }
                    return acc + '/' + curr?.name;
                }, '');

                return path;
            }

            return null;
        } else if (isColumn(object)) {
            return object?.tableName;
        }
    };

    return {
        fetch,
    };
};

/**
 * Returns the OS name which is running this webapp.
 *
 * @return {[string]} Name of the OS
 */
export const getOs = () => {
    let userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'mac';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = 'ios';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'windows';
    } else if (/Android/.test(userAgent)) {
        os = 'android';
    } else if (!os && /Linux/.test(platform)) {
        os = 'linux';
    }

    return os;
};

export const operationAtomWithMiddleware = selector({
    key: operationAtom.key + '_middleware',
    get: ({ get }) => {
        return get(operationAtom);
    },
    set: ({ set, get }, newValue) => {
        // Setting isModified Flag
        const previousValue = get(operationAtom);
        const clonedNewValue = _.cloneDeep(newValue);

        if (previousValue === defaultState) {
            // Initial data loading up

            clonedNewValue.isModified = false;
        } else if (!clonedNewValue?.operation || !clonedNewValue?.operationIndex) {
            // Resetting atom state
            clonedNewValue.isModified = false;
        } else if (clonedNewValue?.operationIndex !== previousValue?.operationIndex) {
            // New operation is selected
            clonedNewValue.isModified = false;
            clonedNewValue.operationRequest = defaultState?.operationRequest;
            clonedNewValue.operationResponse = defaultState?.operationResponse;
        } else if (clonedNewValue?.isModified !== previousValue?.isModified) {
            // Operation is synced
            clonedNewValue.isModified = false;
        } else {
            // Something internally is modified
            clonedNewValue.isModified = true;
        }

        set(operationAtom, clonedNewValue);
    },
});

export const canEdit = (role) => {
    // console.log(role);
    return role?.toLowerCase() === 'admin';
};

export const useCanEdit = () => {
    const role = useUserRole();

    return () => {
        return canEdit(role);
    };
};

export const isItemSame = (item1, item2, fullPath) => {
    if (isAttribute(item1)) {
        // return item1.parentName === fullPath && item1.name === item2.name;
        return item1?.name === item2?.name;
    } else if (isColumn(item1)) {
        return item1.tableName === fullPath && item1.sourceName === item2.sourceName;
    } else {
        return item1?.name === item2?.name;
    }
};

export const isAutoGenerated = (item, operationState) => {
    return (
        (!item.auto && operationState?.operation?.operationType?.toLowerCase() === 'post') ||
        operationState?.operation?.operationType?.toLowerCase() === 'get' ||
        operationState?.operation?.operationType?.toLowerCase() === 'put' ||
        operationState?.operation?.operationType?.toLowerCase() === 'delete' ||
        operationState?.operation?.operationType?.toLowerCase() === 'patch' ||
        operationState?.operation?.operationType?.toLowerCase() === 'head'
    );
};

export const isFreePublishesExhausted = (publishProjectError) => {
    return publishProjectError?.response?.data?.errorType === 'FREE_PROJECTS_EXHAUSTED';
};

export const isOrderSuccess = (order) => {
    return order?.payment_status?.toLowerCase() === 'succeeded';
};

export const isOrderInitiated = (order) => {
    return order?.payment_status?.toLowerCase() === 'initiated';
};

export const isOrderInOtherState = (order) => {
    return !isOrderSuccess(order) && !isOrderInitiated(order);
};

export const delay = (ms) => new Promise((res) => setTimeout(res, ms));
