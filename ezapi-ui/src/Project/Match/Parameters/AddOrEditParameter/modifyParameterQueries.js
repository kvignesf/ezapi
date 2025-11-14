import { useMutation, useQueryClient } from 'react-query';
import client, { endpoint } from '../../../../shared/network/client';
import { queries } from '../../../../shared/network/queryClient';

const addParameter = async ({ projectId, attribute, description, dataType, required, possibleValues }) => {
    try {
        const { data } = await client.post(endpoint.addParameter, {
            projectId,
            data: {
                name: attribute,
                type: dataType,
                description,
                possibleValues: possibleValues?.split(',')?.map((item) => {
                    return item.trim(' ');
                }),
                required,
            },
        });
        return data;
    } catch (error) {
        console.log('error', error);
        throw error;
    }
};

export const useAddParameter = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation(addParameter, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(queries.parameters);
        },
    });

    return mutation;
};

const editParameter = async ({ projectId, paramId, attribute, description, dataType, required, possibleValues }) => {
    try {
        const { data } = await client.patch(endpoint.editParameter, {
            projectId,
            data: {
                paramId: paramId,
                name: attribute,
                type: dataType,
                description,
                possibleValues: possibleValues?.split(',')?.map((item) => {
                    return item.trim(' ');
                }),
                required,
            },
        });

        return data;
    } catch (error) {
        //throw getApiError(error);
        console.log('errorins', error);
        throw error;
    }
};

export const useEditParameter = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation(editParameter, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(queries.parameters);
        },
    });

    return mutation;
};

const bulkParamChange = async ({ projectId, data: postData }) => {
    try {
        const { data } = await client.post(endpoint.bulkParamChange, {
            projectId,
            data: postData,
        });
        return data;
    } catch (error) {
        console.log('error', error);
        throw error;
    }
};

export const useBulkChange = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation(bulkParamChange, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(queries.parameters);
        },
    });

    return mutation;
};
