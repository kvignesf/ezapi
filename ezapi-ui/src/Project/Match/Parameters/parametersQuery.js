import { useQuery } from 'react-query';
import client, { endpoint } from '../../../shared/network/client';
import { queries } from '../../../shared/network/queryClient';
import { getApiError } from '../../../shared/utils';

const getParameters = async ({ queryKey }) => {
    const { projectId } = queryKey[1];

    try {
        const { data } = await client.get(`${endpoint.getParameter}/${projectId}`);
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetParameters = (projectId, options = {}) => {
    const query = useQuery([queries.parameters, { projectId }], getParameters, {
        ...options,
    });
    return query;
};
