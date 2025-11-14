import { Edge } from 'reactflow';
import { AggregateMetaData, AggregateMetaDataEdge, AggregateMetaDataNode, Node } from '../interfaces';

export const prepareAggregateMetaDataNode = (node: Node): AggregateMetaDataNode => {
    const aggregateMetaDataNode: AggregateMetaDataNode = {
        dragHandle: '.custom-drag-handle',
        cardId: node.id,
        type: node.type || '',
        name: node.data.commonData.name,
        position: node.position,
        parentNode: node.data.commonData.parentNode || '',
        inputNodeIds: node.data.commonData.inputNodeIds || [],
        nonDeletable: node.data.commonData.nonDeletable || false,
        // systemApi: node.systemApi,
    };

    ['width', 'height', 'positionAbsolute', 'selected', 'dragging'].forEach((fieldName: string) => {
        if (fieldName in node) {
            (aggregateMetaDataNode as any)[fieldName] = (node as any)[fieldName];
        }
    });

    return aggregateMetaDataNode;
};

export const prepareAggregateMetaDataEdge = (edge: Edge): AggregateMetaDataEdge => {
    const aggregateMetaDataEdge: AggregateMetaDataEdge = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || null,
        targetHandle: edge.targetHandle || null,
        selected: edge.selected || false,
        animated: edge.animated || false,
        // systemApi: node.systemApi,
    };
    return aggregateMetaDataEdge;
};

export const prepareAggregateMetaData = (
    projectId: string,
    operationId: string,
    nodes: Node[],
    edges: Edge[],
): AggregateMetaData => {
    const aggregateMetaData: AggregateMetaData = {
        projectId,
        operationId,
        nodes: nodes.map((node: Node) => prepareAggregateMetaDataNode(node)),
        edges: edges.map((edge: Edge) => prepareAggregateMetaDataEdge(edge)),
    };
    return aggregateMetaData;
};
