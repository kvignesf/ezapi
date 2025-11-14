import { atom } from 'recoil';

export const downloadIconSts = atom({
    key: 'IconEnable',
    default: false,
});

export const downloadIconProj = atom({
    key: 'projectId',
});

export const sideWidth = atom({
    key: 'sidebarWidth',
    default: 190,
});
