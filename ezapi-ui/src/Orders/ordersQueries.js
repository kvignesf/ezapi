import { useQuery } from 'react-query';
import client, { endpoint } from '../shared/network/client';
import { queries } from '../shared/network/queryClient';
import { getAccessToken } from '../shared/storage';
import { getApiError } from '../shared/utils';
const acc_token = getAccessToken();

const getOrders = async () => {
    try {
        const { data } = await client.get(endpoint.orders, {
            headers: {
                Authorization: acc_token,
            },
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetOrders = () => {
    return useQuery([queries.orders], getOrders, {
        refetchOnWindowFocus: false,
    });
};
