import { atom } from 'recoil';

export const defaultState = {
    selected: null,
};

const storedProcedureAtom = atom({
    key: 'storedProcedure',
    default: defaultState,
});

export default storedProcedureAtom;
