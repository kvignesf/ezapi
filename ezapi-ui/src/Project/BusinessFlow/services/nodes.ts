import client from '@/shared/network/client';
import { getApiError } from '@/shared/utils';

import { GetNodeAPIProps, UpdateNodeAPIProps } from '@/Project/BusinessFlow/interfaces';
import { CancelTokenSource } from 'axios';
import { AggregateCard, NewAggregateCard } from '../interfaces/aggregate-cards';
import { prepareAggregateCard } from '../transformers';
import { prepareNodeFromAggregateCard, prepareNodeFromAggregateCardResponse } from '../transformers/flow';

export async function fetchNodeFromServer(props: GetNodeAPIProps, source?: CancelTokenSource): Promise<any> {
    const { nodeId, projectId, operationId } = props;

    const queryParamsObj = {
        projectId,
        operationId,
    };
    const queryParams = new URLSearchParams(queryParamsObj);
    const url = `${process.env.REACT_APP_API_URL}/aggregateCard/${nodeId}?${queryParams}`;

    try {
        const { data: responseData } = await client.get(url, { cancelToken: source?.token });
        return prepareNodeFromAggregateCardResponse(responseData);
    } catch (error) {
        throw getApiError(error);
    }
}

export async function createAggregateCard(
    newAggregateCard: NewAggregateCard,
    source?: CancelTokenSource,
): Promise<AggregateCard> {
    const url = `${process.env.REACT_APP_API_URL}/aggregateCard`;
    try {
        const { data: responseData } = await client.post(url, newAggregateCard, { cancelToken: source?.token });
        const aggregateCard: AggregateCard = prepareAggregateCard(responseData.data);
        return aggregateCard;
    } catch (error) {
        throw getApiError(error);
    }
}

export async function updateNodeOnServer(props: UpdateNodeAPIProps, _source?: CancelTokenSource) {
    const { card, position, updateNodeData, setNodeType } = props;

    const nodeId = card.id;
    if (!nodeId) return;
    const url = `${process.env.REACT_APP_API_URL}/aggregateCard/${nodeId}`;

    const putDataObj: NewAggregateCard = { ...card };

    // try {
    const { data: responseData } = await client.put(url, putDataObj);

    let node: any;
    if (responseData.message && responseData.message === 'no changes found' && position) {
        node = prepareNodeFromAggregateCard(card, position);
    } else {
        node = prepareNodeFromAggregateCardResponse(responseData.data);
    }

    updateNodeData && updateNodeData(nodeId, node.data);
    setNodeType && setNodeType(nodeId, node.type as string, node.data);
    // } catch (error) {
    //     throw getApiError(error);
    // }
}
