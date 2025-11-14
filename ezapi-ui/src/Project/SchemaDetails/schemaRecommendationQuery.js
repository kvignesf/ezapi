import aes from 'crypto-js/aes';
import _ from 'lodash';
import { useMutation } from 'react-query';
import client, { endpoint } from '../../shared/network/client';
import { getApiError } from '../../shared/utils';

const getTables = async ({ projectId }) => {
    try {
        const { data } = await client.post(
            endpoint.tablesLookup,
            {
                projectId,
            },
            {
                validateStatus: function (status) {
                    return status == 200 || status == 400;
                },
                timeout: 120000,
            },
        );
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetTables = () => {
    const mutation = useMutation(getTables, {});

    return mutation;
};

const getSchemaRecommendations = async ({ projectId, schema }) => {
    try {
        const { data } = await client.post(endpoint.schemaRecommendations, {
            projectId,
            schema,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetSchemaRecommendations = () => {
    const mutation = useMutation(getSchemaRecommendations, {});

    return mutation;
};

const saveSchemaRecommendation = async ({ projectId, schema, attributesWithOverrides, data, newProjectDetails }) => {
    var ciphertext = aes.encrypt(newProjectDetails?.password, process.env.REACT_APP_AES_ENCRYPTION_KEY).toString();
    if (schema != undefined) {
        const incompleteOverridenAttribute = attributesWithOverrides.find(
            (overridenAttribute) =>
                !overridenAttribute?.overridenMatch ||
                _.isEmpty(overridenAttribute?.overridenMatch) ||
                _.isEmpty(overridenAttribute?.overridenMatch?.tableName) ||
                _.isEmpty(overridenAttribute?.overridenMatch?.tableAttribute),
        );

        if (incompleteOverridenAttribute) {
            throw new Error(`Please fill all the details of ${incompleteOverridenAttribute?.name} attribute`);
        }
    }

    try {
        const { dataResponse } = await client.post(endpoint.saveSchemaMatch, {
            projectId,
            schema,
            data: attributesWithOverrides ?? data ?? [],
            //password: ciphertext,
        });
        return dataResponse;
    } catch (error) {
        throw error?.response?.data;
    }
};

export const useSaveSchemaRecommendations = () => {
    const mutation = useMutation(saveSchemaRecommendation, {});

    return mutation;
};
