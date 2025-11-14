import { ExternalAPIResponse, IBusinessFlow } from './interfaces';

export const DEFAULT_BUSINESS_FLOW_STATE: IBusinessFlow = {
    projectId: '',
    operationId: '',
    initialNodes: [],
    initialEdges: [],
    isInitialStateLoaded: false,
    useStore: () => {},
};

export const DEFAULT_API_RESPONSE: ExternalAPIResponse = {
    data: {},
    success: false,
    status: 0,
    statusText: '',
};
