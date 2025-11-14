import { atom } from 'recoil';

export const defaultState = false;

const loaderAtom = atom({
    key: 'loader',
    default: defaultState,
});

export default loaderAtom;
