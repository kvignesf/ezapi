import { atom } from 'recoil';

export const defaultState = {
    name: null,
    specs: null,
    dbs: null,
    password: '',
    collaborators: [],
};

const projectAtom = atom({
    key: 'project',
    default: defaultState,
});

export default projectAtom;
