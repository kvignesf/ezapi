import _ from 'lodash';
import { Edge, XYPosition } from 'reactflow';

import { NODE_TYPES } from '../constants';
import { AggregateCard, Node } from '../interfaces';
import { NodeData } from '../interfaces/flow';
import {
    prepareBranchData,
    prepareExternalAPIData,
    prepareFilterData,
    prepareMainData,
    prepareResponsePayloadData,
} from './utils';

// eslint-disable-next-line no-underscore-dangle
const _prepareBaseNodeAttributes = (responseData: any): any => {
    const nodeData: NodeData = {
        commonData: {
            name: responseData.name,
            parentNode: responseData.parentNode || '',
            inputNodeIds: responseData.inputNodeIds || [],
            nonDeletable: responseData.nonDeletable || false,
        },
        runData:
            responseData.type === NODE_TYPES.EXTERNAL_API_NODE ||
            responseData.type === NODE_TYPES.EXTERNAL_API_NODE_LOOP ||
            (NODE_TYPES.MAIN_NODE && !_.isEmpty(responseData.runData))
                ? prepareExternalAPIData(responseData.runData)
                : {},
        branchData:
            responseData.type === NODE_TYPES.BRANCH_NODE && !_.isEmpty(responseData.branchData)
                ? prepareBranchData(responseData.branchData)
                : { conditions: [] },
        filterData:
            responseData.type === NODE_TYPES.FILTER_NODE && !_.isEmpty(responseData.filterData)
                ? prepareFilterData(responseData.filterData)
                : {},
        responsePayloadData:
            responseData.type === NODE_TYPES.RESPONSE_PAYLOAD_NODE && !_.isEmpty(responseData.responsePayloadData)
                ? prepareResponsePayloadData(responseData.responsePayloadData)
                : {},
        mainData:
            responseData.type === NODE_TYPES.MAIN_NODE && !_.isEmpty(responseData.mainData)
                ? prepareMainData(responseData.mainData)
                : {},
    };

    const node = {
        // projectId: responseData.projectId,
        // operationId: responseData.operationId,
        type: responseData.type,
        position: responseData.position,
        data: nodeData,
        // systemApi: node.systemApi,
    };

    // TODO: Remove this once the backend is fixed.
    if (node.data.commonData.name === undefined && responseData.data?.name) {
        node.data.commonData.name = responseData.data.name;
    }

    return node;
};

// eslint-disable-next-line no-underscore-dangle
const _prepareExtraNodeAttributes = (responseData: any): any => {
    const data: any = {};
    ['width', 'height', 'positionAbsolute', 'selected', 'dragging', 'dragHandle'].forEach((fieldName: string) => {
        if (fieldName in responseData) {
            data[fieldName] = responseData[fieldName];
        }
    });
    return data;
};

const prepareNodesFromAggregateMetaDataResponse = (nodes: any[]): Node[] => {
    return nodes.map((node: any) => ({
        id: node['cardId'],
        ..._prepareBaseNodeAttributes(node),
        ..._prepareExtraNodeAttributes(node),
    }));
};

const prepareEdgesFromAggregateMetaDataResponse = (edges: any[]): Edge[] => {
    return edges.map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        selected: edge.selected,
        animated: edge.animated,
    }));
};

export const prepareNodesAndEdgesFromAggregateMetaDataResponse = (responseData: any): any => {
    return {
        projectId: responseData.projectId,
        operationId: responseData.operationId,
        nodes: prepareNodesFromAggregateMetaDataResponse(responseData.nodes),
        edges: prepareEdgesFromAggregateMetaDataResponse(responseData.edges),
    };
};

export const prepareNodeFromAggregateCardResponse = (responseData: any): Node => {
    const node: any = {
        id: responseData['_id'],
        ..._prepareBaseNodeAttributes(responseData),
    };
    return node as Node;
};

export const prepareNodeFromAggregateCard = (card: AggregateCard, position: XYPosition): Node => {
    const nodeData: NodeData = {
        commonData: {
            name: card.name,
            parentNode: card.parentNode || '',
            inputNodeIds: card.inputNodeIds || [],
            nonDeletable: false,
        },
        runData: prepareExternalAPIData(card.runData),
        branchData: prepareBranchData(card.branchData),
        mainData: prepareMainData(card.mainData),
        filterData: prepareFilterData(card.filterData),
        responsePayloadData: prepareResponsePayloadData(card.responsePayloadData),
    };

    const node: Node = {
        id: card.id,
        type: card.type,
        position: position,
        data: nodeData,
        dragHandle: '.custom-drag-handle',
        // systemApi: node.systemApi,
    };
    return node as Node;
};
