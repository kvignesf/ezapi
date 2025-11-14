import { createContext } from 'react';
import { DEFAULT_BUSINESS_FLOW_STATE } from './defaults';
import { IBusinessFlow } from './interfaces';

export const BusinessFlowContext = createContext<IBusinessFlow>(DEFAULT_BUSINESS_FLOW_STATE);
