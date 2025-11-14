import { useMutation } from 'react-query';
import Messages from '../../shared/messages';
import client, { endpoint } from '../../shared/network/client';
import { getApiError } from '../../shared/utils';

const getTables = async ({ projectId }) => {
    try {
        const { data } = await client.post(endpoint.tablesLookup, {
            projectId,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetTables = () => {
    const mutation = useMutation(getTables, {});

    return mutation;
};

const getAttrRecommendations = async ({ projectId, schema, attribute }) => {
    try {
        const { data } = await client.post(endpoint.recommendations, {
            projectId,
            schema,
            attribute,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetAttrRecommendations = () => {
    const mutation = useMutation(getAttrRecommendations, {});

    return mutation;
};

const saveAttrRecommendation = async ({
    projectId,
    schema,
    schemaAttribute,
    path,
    level,
    tableName,
    tableAttribute,
}) => {
    if (!tableName) {
        throw Error(Messages.TABLE_REQUIRED);
    }

    if (!tableAttribute) {
        throw Error(Messages.COLUMN_REQUIRED);
    }

    try {
        const { data } = await client.post(endpoint.saveAttributeMatch, {
            projectId,
            schema,
            schemaAttribute,
            path,
            level,
            tableName,
            tableAttribute,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useSaveAttrRecommendations = () => {
    const mutation = useMutation(saveAttrRecommendation, {});

    return mutation;
};
