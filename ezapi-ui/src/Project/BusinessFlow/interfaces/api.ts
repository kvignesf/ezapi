import { ResponseMapper } from './mapping';

import { XYPosition } from 'reactflow';
import { AggregateCard } from './aggregate-cards';
import { AggregateMetaDataEdge, AggregateMetaDataNode } from './aggregate-meta-data';

export interface FetchAPIProps {
    projectId: string;
    operationId: string;
}

export interface GetNodeAPIProps extends FetchAPIProps {
    nodeId: string;
}

export interface UpdateNodeAPIProps {
    card: AggregateCard;
    position?: XYPosition;
    updateNodeData?: (nodeId: string, data: any) => void;
    setNodeType?: (nodeId: string, type: string, data: any) => void;
}

export interface DeleteNodesAPIProps extends FetchAPIProps {
    projectId: string;
    operationId: string;
    cardIdsToDelete: string[];
    updatedAggregateMetadata: {
        nodes: AggregateMetaDataNode[];
        edges: AggregateMetaDataEdge[];
    };
    updatedResponseMapper: ResponseMapper;
}
