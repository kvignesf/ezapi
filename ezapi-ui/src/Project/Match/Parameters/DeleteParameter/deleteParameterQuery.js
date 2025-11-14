import { useMutation, useQueryClient } from 'react-query';
import client, { endpoint } from '../../../../shared/network/client';
import { queries } from '../../../../shared/network/queryClient';
import { getApiError } from '../../../../shared/utils';

const deleteParameter = async ({ projectId, paramId }) => {
    try {
        const { data } = await client.patch(endpoint.deleteParameter, {
            projectId,
            paramId,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useDeleteParameter = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation(deleteParameter, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(queries.parameters);
        },
    });

    return mutation;
};
