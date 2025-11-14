import { atom } from 'recoil';

export const defaultState = [];

const primaryAtom = atom({
    key: 'primary',
    default: defaultState,
});

export default primaryAtom;
