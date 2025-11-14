import { useMutation, useQueryClient } from 'react-query';
import client, { endpoint } from '../../../shared/network/client';
import { queries } from '../../../shared/network/queryClient';
import { getApiError } from '../../../shared/utils';

const addResource = async ({ projectId, name }) => {
    try {
        const { data } = await client.post(endpoint.resources, {
            projectId: projectId,
            resourceName: name,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useAddResource = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation(addResource, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(queries.resources);
        },
    });
    return mutation;
};

const editResource = async ({ id, name }) => {
    try {
        const { data } = await client.patch(`${endpoint.resources}/${id}/rename`, {
            resourceName: name,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useEditResource = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation(editResource, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(queries.resources);
        },
    });
    return mutation;
};
