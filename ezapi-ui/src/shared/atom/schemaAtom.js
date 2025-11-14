import { atom } from 'recoil';

export const defaultState = {
    selected: [],
};

const schemaAtom = atom({
    key: 'schema',
    default: defaultState,
});

export default schemaAtom;
