import { atom } from 'recoil';

export const defaultState = false;

const responseMapperAtom = atom({
    key: 'responseMapper',
    default: defaultState,
});

export default responseMapperAtom;
