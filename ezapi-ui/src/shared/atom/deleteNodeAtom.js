import { atom } from 'recoil';

export const defaultState = undefined;

const deleteNodeAtom = atom({
    key: 'deleteNode',
    default: defaultState,
});

export default deleteNodeAtom;
