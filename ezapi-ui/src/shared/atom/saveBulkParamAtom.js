import { atom } from 'recoil';

export const defaultState = false;

const saveBulkParamAtom = atom({
    key: 'saveBulkParamAtom',
    default: defaultState,
});

export default saveBulkParamAtom;
