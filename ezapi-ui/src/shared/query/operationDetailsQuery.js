import _ from 'lodash';
import { useMutation } from 'react-query';
import { useGetRecoilValueInfo_UNSTABLE, useSetRecoilState } from 'recoil';
import operationAtom from '../../Project/operationAtom';
import Constants from '../constants';
import client from '../network/client';
import {
    getApiError,
    operationAtomWithMiddleware,
    parseGetOperationRequestResponse,
    parseGetOperationResponseResponse,
} from '../utils';

const syncOperation = async ({
    projectId,
    resourceId,

    pathId,
    operationId,
    requestData,
    responseData,
}) => {
    try {
        const { data: saveRequestApiData } = await client.post(`/operationData/sinkRequest/${operationId}`, {
            projectId,
            resourceId,
            pathId,

            ...requestData,
        });

        const { data: saveResponseApiData } = await client.post(`/operationData/sinkResponse/${operationId}`, {
            projectId,
            resourceId,
            pathId,
            responseData,
        });

        /* const { data: saveSimulateArtefactsData } = await client.post(
      `simulation_artefacts`,
      {
        projectid: projectId,
      },
      {
        timeout: 120000,
      }
    ); */

        return {
            saveRequestApiData,
            saveResponseApiData,
            //saveSimulateArtefactsData,
        };
    } catch (error) {
        throw getApiError(error);
    }
};

export const useSyncOperation = () => {
    const setOperationState = useSetRecoilState(operationAtomWithMiddleware);
    const getRecoilValueInfo = useGetRecoilValueInfo_UNSTABLE();

    const mutation = useMutation(syncOperation, {
        onMutate: () => {
            const { loadable: operationAtomLoadable } = getRecoilValueInfo(operationAtomWithMiddleware);
            const clonedOperationState = _.cloneDeep(operationAtomLoadable?.contents);
            // console.log(clonedOperationState);
            clonedOperationState.isModified = false;

            setOperationState(clonedOperationState);
        },
    });

    return mutation;
};

export const getOperation = async ({ projectId, resourceId, pathId, operationId }) => {
    try {
        const { data: getRequestApiData } = await client.post(`/operationData/request/${operationId}`, {
            projectId,
            resourceId,
            pathId,
        });

        const { data: getResponseApiData } = await client.post(`/operationData/response/${operationId}`, {
            projectId,
            resourceId,
            pathId,
        });

        return {
            getRequestApiData,
            getResponseApiData,
        };
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetOperation = () => {
    const setOperationState = useSetRecoilState(operationAtom);

    const mutation = useMutation(getOperation, {
        onSuccess: (data, variables) => {
            if (data?.getRequestApiData) {
                setOperationState((operationState) => {
                    const clonedOperationState = _.cloneDeep(operationState);
                    const parsedOperationRequest = parseGetOperationRequestResponse(data?.getRequestApiData);
                    clonedOperationState.operationRequest = parsedOperationRequest;
                    clonedOperationState.projectId = variables?.projectId;
                    return clonedOperationState;
                });
            }

            if (data?.getResponseApiData) {
                setOperationState((operationState) => {
                    const clonedOperationState = _.cloneDeep(operationState);

                    let parsedOperationResponse = parseGetOperationResponseResponse(
                        data?.getResponseApiData?.responseBody,
                    );

                    if (!parsedOperationResponse || _.isEmpty(parsedOperationResponse)) {
                        parsedOperationResponse = [
                            {
                                responseCode: Constants.mandatoryResponseCode,
                                headers: [],
                                body: [],
                            },
                        ];
                    }

                    clonedOperationState.operationResponse = parsedOperationResponse;
                    clonedOperationState.projectId = variables?.projectId;

                    return clonedOperationState;
                });
            }
        },
    });

    return mutation;
};
