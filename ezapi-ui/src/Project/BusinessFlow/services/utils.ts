import { EXTERNAL_API_NODE_DATA_FIELDS } from '@/Project/BusinessFlow/constants';

export function getNodeDataFromAggregateCardsResponse(response: any) {
    const newNodeResponse = response.data.data;

    const newNodeData: any = {};
    EXTERNAL_API_NODE_DATA_FIELDS.forEach((dataField: string) => {
        if (newNodeResponse.runData && newNodeResponse.runData[dataField]) {
            newNodeData[dataField] = newNodeResponse.runData[dataField];
        }
    });

    const newNode: any = {
        id: newNodeResponse['_id'],
        type: newNodeResponse.type,
        data: newNodeData,
        parentNode: newNodeResponse.parentNode,
    };

    return newNode;
}
