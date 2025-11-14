import { Method } from 'axios';
import { KeyValueProps } from './common';

export interface ExternalAPIResponse {
    data: any;
    success: boolean;
    status?: number;
    statusText?: string;
}

export interface ExternalAPI {
    url?: string;
    method?: Method;
    headers?: KeyValueProps[];
    queryParams?: KeyValueProps[];
    pathParams?: KeyValueProps[];
    body?: any;
    output?: ExternalAPIResponse;
}
