import { useMutation } from 'react-query';
import client, { endpoint } from '../../../shared/network/client';
import { getApiError } from '../../../shared/utils';

const getStoredProcedures = async ({ projectId }) => {
    try {
        const { data } = await client.get(`${endpoint.storedProcedures}/` + projectId);
        // const { data } = await client.get(
        //   `${endpoint.storedProcedures}/6229daec-8552-490c-beab-79519ee93081`
        // );

        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetStoredProcedures = () => {
    const mutation = useMutation(getStoredProcedures, {});

    return mutation;
};
