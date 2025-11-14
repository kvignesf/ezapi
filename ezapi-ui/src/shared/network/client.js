import axios from 'axios';
import Messages from '../messages';
import routes from '../routes';
import { clearSession, getAccessToken } from '../storage';

const baseUrl = process.env.REACT_APP_API_URL;

export const endpoint = Object.freeze({
    login: '/auth',
    github_auth: '/github_auth',
    sso: '/sso_url',
    auth_workos: '/auth_workos',
    logout: '/logout',
    project: '/project',
    projects: '/projects',
    aiMatcher: '/aiMatcher',
    resources: '/resources',
    path: '/path',
    paths: '/paths',
    operation: '/operation',
    schemasList: '/schemasList',
    subSchemaData: '/subSchemaData',
    addParameter: '/projectParams/add',
    editParameter: '/projectParams/edit',
    bulkParamChange: '/projectParams/bulk',
    getParameter: '/projectParams/get',
    deleteParameter: '/projectParams/delete',
    tablesLookup: '/tablesLookup',
    tablesData: '/tablesData',
    tableSubData: '/tableSubschema',
    recommendations: '/recommendations',
    schemaRecommendations: '/schemaRecommendations',
    saveAttributeMatch: '/overrideAttrMatch',
    saveSchemaMatch: '/overrideSchemaMatch',
    publishProject: '/publish',
    tableRelations: '/getTablesRelations',
    //operationDataTables: "/getOperationDataTables",
    tableMappings: '/tableMappings',
    verifyProject: '/projectValidate',
    downloadSpec: '/download_spec',
    downloadArtifact: '/download_apiops',
    downloadDatabase: '/download_gendata',
    downloadCodegen: '/download_codegen',
    downloadApigee: '/download_apigee',
    testDBConnection: '/testDBConnection',
    exportDBSchema: '/db_to_python',
    getCustomParameter: '/customParameters/get',
    addCustomParameter: '/customParameters/add',
    editCustomParameter: '/customParameters/edit',
    deleteCustomParameter: '/customParameters/delete',
    storedProcedures: '/storedProcedures',
    downloadDotNetCodegen: '/download_dotnet_codegen',
    downloadPythonCodegen: '/download_python_codegen',
    downloadNodeCodegen: '/download_node_codegen',
    mandMappingTableData: '/listAllAttributes',
    googleLogin: '/google-signin',
    push_to_github: '/pushToGithub',
    view_repo: '/view_repo',

    // Payment
    products2: '/products',
    products: '/product',
    userProfile: '/userProfile',
    basicProduct: '/product/basic',
    billingDetails: '/billing-details',
    payment: '/payment',
    initiatePayment: '/initiate-order',
    addCard: '/addCard',
    defaultCard: '/makeDefaultCard',
    subscribe: '/subscribe',
    unSubscribe: '/cancelSubscription',
    // initiatePayment: "/subscribe",

    // Orders
    orders: '/orders',

    //ProductTour
    productVideos: '/productVideos',

    //API Governance
    apiSprawl: '/apiSprawl',
    //dataLineage: "/dataLineage",

    //Collections
    collectionDirectory: '/collectionDirectory',
    collectionsRequest: '/collectionsRequest',

    //businessFlow
    aggregateCard: '/aggregateCard',
    aggregateCards: '/aggregateCards',
    aggregateMappings: '/aggregateMappings',
    responseMappings: '/aggregateResponseMappings',
    aggregations: '/aggregations',
    systemApis: '/system-api',
});

const client = axios.create({
    baseURL: baseUrl,
    timeout: 50000,
    timeoutErrorMessage: Messages.UNKNOWN,
    responseType: 'json',
});

// Setting token for requests
client.interceptors.request.use(
    (request) => {
        const accessToken = getAccessToken();
        const url = request.url;

        if (accessToken && url && url !== endpoint.login) {
            request.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return request;
    },
    (err) => {
        return Promise.reject(err);
    },
);

const navigateToSignin = () => {
    clearSession();
    window.location.replace(routes.signIn);
};

// Intercepting error responses
client.interceptors.response.use(
    (response) => {
        return response;
    },
    (err) => {
        const error = err?.response;

        // Logout if 401
        if (error?.status === 401) {
            navigateToSignin();
        }

        return Promise.reject(err);
    },
);

export default client;
