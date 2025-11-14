import { useMutation, useQueryClient } from 'react-query';
import client, { endpoint } from '../../../shared/network/client';
import { queries } from '../../../shared/network/queryClient';
import { getApiError } from '../../../shared/utils';

const deleteResource = async ({ resourceId, projectId }) => {
    try {
        const { data } = await client.delete(`/project/${projectId}${endpoint.resources}/${resourceId}`);
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useDeleteResource = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation(deleteResource, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(queries.resources);
        },
    });
    return mutation;
};
