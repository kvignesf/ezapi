import { atom } from 'recoil';

export const defaultState = '';

const drawerCardAtom = atom({
    key: 'drawerCard',
    default: defaultState,
});

export default drawerCardAtom;
