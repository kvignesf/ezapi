import { useMutation, useQueryClient } from 'react-query';
import client, { endpoint } from '../../../shared/network/client';
import { queries } from '../../../shared/network/queryClient';
import { getApiError } from '../../../shared/utils';

const deleteOperation = async ({ pathId, operationId, resourceId }) => {
    try {
        const { data } = await client.patch(`${endpoint.operation}/delete/${operationId}`, {
            pathId,
            resourceId,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useDeleteOperation = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation(deleteOperation, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(queries.resources);
        },
    });
    return mutation;
};
