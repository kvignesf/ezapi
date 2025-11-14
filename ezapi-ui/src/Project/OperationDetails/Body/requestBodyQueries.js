import { useMutation } from 'react-query';
import client, { endpoint } from '../../../shared/network/client';
import { getApiError } from '../../../shared/utils';

const getSubSchema = async ({ projectId, name, type, ref }) => {
    try {
        const { data } = await client.post(`${endpoint.subSchemaData}`, {
            projectId,
            // projectId: "30001",
            name,
            type,
            ref,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetSubSchema = () => {
    const query = useMutation(getSubSchema);

    return query;
};

const getTableData = async ({ projectId, ref }) => {
    try {
        const { data } = await client.post(`${endpoint.tablesLookup}`, {
            projectId,
            tableFilter: ref,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetTableData = () => {
    const query = useMutation(getTableData);

    return query;
};
