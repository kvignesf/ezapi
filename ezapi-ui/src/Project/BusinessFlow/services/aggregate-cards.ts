import client from '@/shared/network/client';
import { getApiError } from '@/shared/utils';

import { AggregateCard, FetchAPIProps } from '../interfaces';
import { prepareAggregateCards } from '../transformers';

export async function fetchAllAggregateCards({ projectId, operationId }: FetchAPIProps): Promise<AggregateCard[]> {
    const baseUrl = process.env.REACT_APP_API_URL;

    const paramsObj = { projectId, operationId };
    const searchParams = new URLSearchParams(paramsObj);

    const url = `${baseUrl}/aggregateCards?${searchParams.toString()}`;

    let cards: AggregateCard[] = [];

    try {
        const { data: responseData } = await client.get(url);
        cards = prepareAggregateCards(responseData.data);
    } catch (error) {
        console.log('error', getApiError(error));
    }

    return cards;
}
