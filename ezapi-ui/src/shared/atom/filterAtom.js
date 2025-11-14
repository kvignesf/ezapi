import { atom } from 'recoil';

export const defaultState = '';

const filterAtom = atom({
    key: 'filter',
    default: defaultState,
});

export default filterAtom;
