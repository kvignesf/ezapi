import { atom } from 'recoil';

export const defaultState = '';

const branchQueryAtom = atom({
    key: 'selectedQuery',
    default: defaultState,
});

export default branchQueryAtom;
