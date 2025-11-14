import { atom } from 'recoil';

export const defaultState = 'grid';

const currentViewAtom = atom({
    key: 'currentView',
    default: defaultState,
});

export default currentViewAtom;
