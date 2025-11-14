import { QueryClient } from 'react-query';

export const queries = {
    projects: 'projects',
    products: 'products',
    basicProduct: 'basicProduct',
    billingDetails: 'billing',
    resources: 'resources',
    project: 'project',
    schemas: 'schemas',
    parameters: 'parameters',
    operationRequest: 'operationRequest',
    orders: 'orders',
    productVideos: 'productVideos',
    userProfile: 'userProfile',
    customParameters: 'customParameters',
};

const queryClient = new QueryClient({
    defaultOptions: {
        mutations: {
            retry: 0,
        },
        queries: {
            retry: 0,
        },
    },
});

export const clearQueryCache = (queryClient) => {
    if (queryClient) {
        /**
         * Clearing all queries
         */
        queryClient.cancelMutations();
        queryClient.cancelQueries();
        queryClient.clear();
    }
};

export default queryClient;
