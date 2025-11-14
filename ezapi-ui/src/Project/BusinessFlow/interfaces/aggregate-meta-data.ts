import { XYPosition } from 'reactflow';

export interface AggregateMetaDataNode {
    cardId: string;
    type: string;
    name: string;
    position: XYPosition;
    parentNode: string;
    inputNodeIds?: string[];
    nonDeletable?: boolean;
    width?: number;
    height?: number;
    positionAbsolute?: {
        x: number;
        y: number;
    };
    selected?: boolean;
    dragging?: boolean;
    dragHandle: string;
}

export interface AggregateMetaDataEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    selected: boolean;
    animated: boolean;
}

export interface AggregateMetaData {
    projectId: string;
    operationId: string;
    nodes: AggregateMetaDataNode[];
    edges: AggregateMetaDataEdge[];
}
