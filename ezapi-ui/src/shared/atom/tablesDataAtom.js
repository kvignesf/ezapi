import { atom } from 'recoil';

export const defaultState = [];

const tablesDataAtom = atom({
    key: 'tablesData',
    default: defaultState,
});

export default tablesDataAtom;
