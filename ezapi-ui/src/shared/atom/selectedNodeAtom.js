import { atom } from 'recoil';

export const defaultState = '';
export const defaultState2 = 'external';

const selectedNodeAtom = atom({
    key: 'selectedNode',
    default: defaultState,
});

export default selectedNodeAtom;
