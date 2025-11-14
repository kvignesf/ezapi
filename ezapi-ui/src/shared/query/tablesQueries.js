import _ from 'lodash';
import { useMutation } from 'react-query';
import { useRecoilState } from 'recoil';
import tablesDataAtom from '../atom/tablesDataAtom';
import client, { endpoint } from '../network/client';
import { getApiError } from '../utils';

const getTablesLookup = async ({ projectId }) => {
    try {
        const { data } = await client.post(
            endpoint.tablesLookup,
            {
                projectId,
            },
            {
                timeout: 120000,
            },
        );
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetTablesLookup = () => {
    const mutation = useMutation(getTablesLookup, {});

    return mutation;
};

const getTablesData = async ({ projectId }) => {
    try {
        const { data } = await client.post(
            endpoint.tablesData,
            {
                projectId,
            },
            {
                timeout: 120000,
            },
        );
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetTablesData = () => {
    const mutation = useMutation(getTablesData, {});

    return mutation;
};

const getSubTablesData = async ({ projectId, name, type, ref }) => {
    try {
        const { data } = await client.post(
            `${endpoint.tableSubData}`,
            {
                projectId,
                type,
                ref,
                name,
            },
            {
                timeout: 120000,
            },
        );
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetSubTables = () => {
    const [tablesDataState, setTablesDataState] = useRecoilState(tablesDataAtom);

    const query = useMutation(getSubTablesData, {
        onSuccess: (data) => {
            if (data) {
                let updatedTableState = _.cloneDeep(tablesDataState);

                updatedTableState?.selected?.pop();

                setTablesDataState(updatedTableState);
            }
        },
        onError: (err) => {
            let updatedTableState = _.cloneDeep(tablesDataState);
            updatedTableState?.selected?.pop();
            setTablesDataState(updatedTableState);
        },
    });

    return query;
};
