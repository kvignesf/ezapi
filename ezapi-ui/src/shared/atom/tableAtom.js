import { atom } from 'recoil';

export const defaultState = {
    selected: [],
    ref: '',
};

const tableAtom = atom({
    key: 'table',
    default: defaultState,
});

export default tableAtom;
