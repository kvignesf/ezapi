import client, { endpoint } from '@/shared/network/client';
import { getApiError } from '@/shared/utils';

export const saveAggregateCard = async (cardId, data) => {
    try {
        const { data } = await client.post(`${endpoint.aggregateCards}/${cardId}`, data);
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const getAggregateCard = async (cardId, operationId, projectId) => {
    try {
        const { data } = await client.get(
            `${endpoint.aggregateCard}/${cardId}?operationId=${operationId}&projectId=${projectId}`,
        );
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const getAllAggregateCards = async (operationId, projectId) => {
    try {
        const { data } = await client.get(
            `${endpoint.aggregateCards}?operationId=${operationId}&projectId=${projectId}`,
        );
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const getMappingData = async (cardId, operationId, projectId) => {
    try {
        const { data } = await client.get(
            `${endpoint.aggregateMappings}/${cardId}?operationId=${operationId}&projectId=${projectId}`,
        );
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const saveAggregateMappings = async (data) => {
    try {
        const { value } = await client.post(`${endpoint.aggregateMappings}`, { ...data });
        return value;
    } catch (error) {
        throw getApiError(error);
    }
};

export const getResponseMappingData = async (operationId, projectId) => {
    try {
        const { data } = await client.get(`${endpoint.responseMappings}/${operationId}?projectId=${projectId}`);
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const saveResponseMappings = async (data) => {
    try {
        const { value } = await client.post(`${endpoint.responseMappings}`, { ...data });
        return value;
    } catch (error) {
        throw getApiError(error);
    }
};

// /aggregateCards? operationId=''

export const getSystemApis = async () => {
    try {
        const { data } = await client.get(`${endpoint.systemApis}`);
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};
