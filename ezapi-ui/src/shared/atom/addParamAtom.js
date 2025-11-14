import { atom } from 'recoil';

export const defaultState = false;

const addParamAtom = atom({
    key: 'addParam',
    default: defaultState,
});

export default addParamAtom;
