import { KeyValueProps } from './common';
import { ExternalAPI } from './external-api';

export interface BranchCondition {
    conditionId: string;
    conditionType: string; // if, elif or else
    rawExpression: string;
    detailedExpression: string;
    targetNodeIds: string[];
}

export interface BranchData {
    conditions: BranchCondition[];
}

export interface MainData {
    headers?: KeyValueProps[];
    queryParams?: KeyValueProps[];
    pathParams?: KeyValueProps[];
    body?: any;
}

export interface ResponsePayloadData {
    customMapping?: boolean;
    cardId?: string;
    data?: any;
    headers?: KeyValueProps[];
}

export interface FilterRowData {
    index?: number;
    attributeRef: string;
    attributeDataType: string;
    attributeName: string;
    originalAttributeRef?: string;
    newAttributeRef?: string;
    iterateThroughArray?: boolean;
}

export interface FilterData {
    filterType?: string; // exclude or replace
    sourceNodeId?: string;
    targetNodeId?: string;
    replacedFields?: FilterRowData[];
    excludedFields?: FilterRowData[];
}

export interface NewAggregateCard {
    projectId: string;
    operationId: string;
    type: string;
    name: string;
    parentNode: string;
    inputNodeIds: string[];
    runData?: ExternalAPI;
    branchData?: BranchData;
    mainData?: MainData;
    responsePayloadData?: ResponsePayloadData;
    filterData?: FilterData;
    systemApi?: {
        operationDataId: {
            type: String;
        };
        sysProjectId: {
            type: String;
        };
    };
}

export interface AggregateCard extends NewAggregateCard {
    id: string;
}

export interface AggregateCardResponse extends NewAggregateCard {
    _id: string;
}
