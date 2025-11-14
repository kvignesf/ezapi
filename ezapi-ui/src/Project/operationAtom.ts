import { atom } from 'recoil';

import Constants from '../shared/constants';

interface IOperationRequest {
    headers: any[];
    formData: any[];
    pathParams: any[];
    endpoint: '';
    authorization: any;
    queryParams: any[];
    body: any[];
}

interface IOperationResponse {
    responseCode: number;
    description: string;
    headers: any[];
    body: any[];
}

interface IState {
    operation: any | null;
    resource: any | null;
    path: any | null;
    projectId: string | null;
    operationIndex: string | null;
    operationRequest: IOperationRequest;
    operationResponse: IOperationResponse[];
    isModified: boolean;
}

export const defaultState: IState = {
    operation: null,
    resource: null,
    path: null,
    projectId: null,

    operationIndex: null,

    operationRequest: {
        headers: [],
        formData: [],
        pathParams: [],
        endpoint: '',
        authorization: {},
        queryParams: [],
        body: [],
    },

    operationResponse: [
        {
            responseCode: Constants.mandatoryResponse.code,
            description: Constants.mandatoryResponse.description,
            headers: [],
            body: [],
        },
    ],

    isModified: false,
};

const operationAtom = atom({
    key: 'operation',
    default: defaultState,
});

export default operationAtom;
