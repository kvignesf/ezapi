import { useMutation, useQueryClient } from 'react-query';
import client, { endpoint } from '../../shared/network/client';
import { queries } from '../../shared/network/queryClient';
import { getApiError } from '../../shared/utils';

const deleteProject = async ({ id }) => {
    try {
        const { data } = await client.delete(`${endpoint.project}/${id}`);
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useDeleteProject = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation(deleteProject, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(queries.projects);
        },
    });

    return mutation;
};
