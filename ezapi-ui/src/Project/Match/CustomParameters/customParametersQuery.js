import { useQuery } from 'react-query';
import client, { endpoint } from '../../../shared/network/client';
import { queries } from '../../../shared/network/queryClient';
import { getApiError } from '../../../shared/utils';

const getCustomParameters = async ({ queryKey }) => {
    const { projectId } = queryKey[1];
    try {
        const { data } = await client.get(`${endpoint.getCustomParameter}/${projectId}`);
        return data;
    } catch (e) {
        throw getApiError(e);
    }
};

export const useGetCustomParameters = (projectId, options = {}) => {
    const query = useQuery([queries.customParameters, { projectId }], getCustomParameters, {
        ...options,
    });
    return query;
};
