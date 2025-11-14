import { useMutation, useQueryClient } from 'react-query';
import client, { endpoint } from '../../../shared/network/client';
import { queries } from '../../../shared/network/queryClient';
import { getApiError } from '../../../shared/utils';

const addOperation = async ({ projectId, pathId, resourceId, name, type, desc }) => {
    try {
        const { data } = await client.patch(`${endpoint.operation}/add`, {
            pathId,
            resourceId,
            projectId,
            operationName: name,
            operationType: type,
            operationDescription: desc,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useAddOperation = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation(addOperation, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(queries.resources);
        },
    });
    return mutation;
};

const editOperation = async ({ pathId, resourceId, operationId, projectId, name, type, desc }) => {
    try {
        const { data } = await client.patch(`${endpoint.operation}/edit/${operationId}`, {
            pathId,
            resourceId,
            projectId,
            operationName: name,
            operationType: type,
            operationDescription: desc,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useEditOperation = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation(editOperation, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(queries.resources);
        },
    });
    return mutation;
};
