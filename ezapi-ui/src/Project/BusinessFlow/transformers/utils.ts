import _ from 'lodash';

import {
    BRANCH_DATA_CONDITON_FIELDS,
    EXTERNAL_API_NODE_DATA_FIELDS,
    FILTER_DATA_CONDITON_FIELDS,
    MAIN_DATA_CONDITON_FIELDS,
    RESPONSE_PAYLOAD_FIELDS,
} from '../constants';
import { ExternalAPI } from '../interfaces';
import { BranchCondition, BranchData, FilterData, MainData, ResponsePayloadData } from '../interfaces/aggregate-cards';

export const prepareExternalAPIData = (nodeData: any): ExternalAPI => {
    const data: any = {};
    if (_.isObject(nodeData) && !_.isEmpty(nodeData)) {
        EXTERNAL_API_NODE_DATA_FIELDS.forEach((dataField: string) => {
            if ((nodeData as any)['method'] === 'GET' && dataField === 'body') {
                return;
            }

            if (dataField in nodeData) {
                data[dataField] = (nodeData as any)[dataField];
            }
        });
    }
    return data as ExternalAPI;
};

export const prepareBranchData = (nodeData: any): BranchData => {
    const data: any = {
        conditions: [],
    };

    if (_.isObject(nodeData) && !_.isEmpty(nodeData) && (nodeData as any).conditions?.length) {
        const conditions = (nodeData as any).conditions || [];
        conditions.forEach((condition: any) => {
            const branchCondition: any = {};
            BRANCH_DATA_CONDITON_FIELDS.forEach((dataField: string) => {
                if (dataField in condition) {
                    branchCondition[dataField] = (condition as any)[dataField];
                }
            });
            data.conditions.push(branchCondition as BranchCondition);
        });
    }

    return data as BranchData;
};

export const prepareMainData = (nodeData: any): MainData => {
    const data: any = {};
    if (_.isObject(nodeData) && !_.isEmpty(nodeData)) {
        MAIN_DATA_CONDITON_FIELDS.forEach((dataField: string) => {
            if (dataField in nodeData) {
                data[dataField] = (nodeData as any)[dataField];
            }
        });
    }
    return data as MainData;
};

export const prepareResponsePayloadData = (nodeData: any): ResponsePayloadData => {
    const data: any = {};
    if (_.isObject(nodeData) && !_.isEmpty(nodeData)) {
        RESPONSE_PAYLOAD_FIELDS.forEach((dataField: string) => {
            if (dataField in nodeData) {
                data[dataField] = (nodeData as any)[dataField];
            }
        });
    }
    return data as ResponsePayloadData;
};

export const prepareFilterData = (nodeData: any): FilterData => {
    const data: any = {};
    if (_.isObject(nodeData) && !_.isEmpty(nodeData)) {
        FILTER_DATA_CONDITON_FIELDS.forEach((dataField: string) => {
            if (dataField in nodeData) {
                data[dataField] = (nodeData as any)[dataField];
            }
        });
    }
    return data as FilterData;
};
