import { atom, atomFamily } from 'recoil';

export const accessToken = atom({
    key: 'accessToken',
    default: '',
});

export const toggle = atom({
    key: 'toggle',
    default: 'folders',
});

export const authFormData = atom({
    key: 'authFormData',
    default: {
        authType: 'No Auth',
        grantType: 'Grant Type',
        baseAuthUsername: '',
        baseAuthPassword: '',
        authCodeClientID: '',
        authCodeClientSecret: '',
        authEndpoint: '',
        authCodeScope: '',
        authCodeCode: '',
        authCodeRedirUri: '',
        implicitClientID: '',
        implicitAuthEndpoint: '',
        implicitRedirUri: '',
        implicitState: '',
        implicitScope: '',
        ccClientID: '',
        ccClientSecret: '',
        ccTokenEndpoint: '',
        bearerToken: '',
        apiKey: '',
        ccScope: '',
        pcClientID: '',
        pcClientSecret: '',
        pcTokenEndpoint: '',
        pcUsername: '',
        pcPassword: '',
        pcScope: '',
    },
});

export const requestParams = atom({
    key: 'requestParams',
    default: {
        method: 'GET',
        proxy: 'No Proxy',
        url: '',
        body: { '': '' },
        header: [],
        queryParams: [],
    },
});

export const responseInfo = atom({
    key: 'responseInfo',
    default: {},
});

export const currentApi = atom({
    key: 'currentApi',
    default: {},
});

export const currentTab = atom({
    key: 'currentTab',
    default: -1,
});
export const selectedType = atom({
    key: 'selectedType',
    default: { id: '0', type: 'folder' },
});
export const requestName = atom({
    key: 'requestName',
    default: '',
});
export const currentBreadCrumbs = atom({
    key: 'currentBreadCrumbs',
    default: [],
});
export const currentTabs = atom({
    key: 'currentTabs',
    default: [],
});
export const isSaveModalOpen = atom({
    key: 'isSaveModalOpen',
    default: false,
});
export const recentRequest = atom({
    key: 'recentRequest',
    default: [],
});
export const folderContentLoading = atom({
    key: 'folderContentLoading',
    default: false,
});

//for Docstore state management
export const folderState = atomFamily({
    key: 'folderStateAtom',
    default: [],
});

export const rootFolderIdAtom = atom({
    key: 'rootFolderIdAtom',
    default: [],
});

export const collapsedState = atomFamily({ key: 'collapsedState', default: true });

// // Recoil selector to get child components of a folder
// export const folderStateSelector = selectorFamily({
//     key: 'folderStateSelector',
//     get:
//         (id) =>
//         ({ get }) => {
//             const childComponents = get(folderStateAtom(id));
//             return childComponents || [];
//         },
// });
