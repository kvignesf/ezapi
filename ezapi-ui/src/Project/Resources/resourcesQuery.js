import { useQuery } from 'react-query';
import client, { endpoint } from '../../shared/network/client';
import { queries } from '../../shared/network/queryClient';
import { getApiError } from '../../shared/utils';

const getResources = async ({ queryKey }) => {
    try {
        const { projectId } = queryKey[1];
        const { data } = await client.get(`${endpoint.resources}/${projectId}`);
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetResources = (projectId, options = {}) => {
    const query = useQuery([queries.resources, { projectId }], getResources, {
        ...options,
    });
    return query;
};
