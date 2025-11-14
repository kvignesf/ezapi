import { Edge, Node as RFNode, NodeProps as RFNodeProps } from 'reactflow';
import { BranchData, FilterData, MainData, ResponsePayloadData } from './aggregate-cards';
import { ExternalAPI } from './external-api';

/** Node & Edges Level */

export interface CommonNodeData {
    name: string;
    parentNode: string;
    inputNodeIds?: string[];
    nonDeletable?: boolean;
}

export interface NodeData {
    commonData: CommonNodeData;
    runData?: ExternalAPI;
    branchData?: BranchData;
    mainData?: MainData;
    responsePayloadData?: ResponsePayloadData;
    filterData?: FilterData;
}

export interface Node extends RFNode<NodeData> {}
export interface NodeProps extends RFNodeProps<NodeData> {}

export interface ElementsType {
    nodes: Node[];
    edges: Edge[];
}

/* BusinessFlow flow level interfaces */

export interface IBusinessFlow {
    projectId: string;
    operationId: string;
    initialNodes: Node[];
    initialEdges: Edge[];
    isInitialStateLoaded: boolean;
    useStore: Function;
}
