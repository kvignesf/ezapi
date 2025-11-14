import { useMutation, useQueryClient } from 'react-query';
import client, { endpoint } from '../../../shared/network/client';
import { queries } from '../../../shared/network/queryClient';
import { getApiError } from '../../../shared/utils';

const addPath = async ({ resourceId, pathName }) => {
    try {
        const { data } = await client.patch(`${endpoint.path}/add`, {
            resourceId: resourceId,
            pathName: pathName,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useAddPath = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation(addPath, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(queries.resources);
        },
    });
    return mutation;
};

const editPath = async ({ pathId, resourceId, pathName }) => {
    try {
        const { data } = await client.patch(`${endpoint.path}/rename`, {
            pathId: pathId,
            resourceId: resourceId,
            pathName: pathName,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useEditPath = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation(editPath, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(queries.resources);
        },
    });
    return mutation;
};
