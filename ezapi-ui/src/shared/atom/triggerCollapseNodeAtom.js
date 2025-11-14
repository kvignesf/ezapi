import { atom } from 'recoil';

export const defaultState = '';

const triggerCollapseNodeAtom = atom({
    key: 'triggerCollapseNode',
    default: defaultState,
});

export default triggerCollapseNodeAtom;
