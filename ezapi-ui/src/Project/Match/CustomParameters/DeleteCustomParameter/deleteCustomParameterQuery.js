import { useMutation, useQueryClient } from 'react-query';
import client, { endpoint } from '../../../../shared/network/client';
import { queries } from '../../../../shared/network/queryClient';
import { getApiError } from '../../../../shared/utils';

const deleteCustomParameter = async ({ projectId, customParamID }) => {
    try {
        const { data } = await client.patch(endpoint.deleteCustomParameter, {
            projectID: projectId,
            customParamID,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useDeleteCustomParameter = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation(deleteCustomParameter, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(queries.customParameters);
        },
    });
    return mutation;
};
