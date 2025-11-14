const StorageKey = Object.freeze({
    accToken: 'acc_token',
    firstName: 'first_name',
    lastName: 'last_name',
    userId: 'user_id',
    emailId: 'email_id',
});

export const setAccessToken = (value) => sessionStorage.setItem(StorageKey.accToken, value);

export const getAccessToken = () => sessionStorage.getItem(StorageKey.accToken);

export const setFirstName = (value) => sessionStorage.setItem(StorageKey.firstName, value);

export const getFirstName = () => sessionStorage.getItem(StorageKey.firstName);

export const setLastName = (value) => sessionStorage.setItem(StorageKey.lastName, value);

export const getLastName = () => sessionStorage.getItem(StorageKey.lastName);

export const setUserId = (value) => sessionStorage.setItem(StorageKey.userId, value);

export const getUserId = () => sessionStorage.getItem(StorageKey.userId);

export const setEmailId = (value) => sessionStorage.setItem(StorageKey.emailId, value);

export const getEmailId = () => sessionStorage.getItem(StorageKey.emailId);

export const clearSession = () => sessionStorage.clear();
export const clearLocalStorage = () => localStorage.clear();

export const setRedirectUrl = (value) => {
    if (value) {
        localStorage.setItem('redirect_url', value);
    }
};

export const getRedirectUrl = () => {
    const pathName = localStorage.getItem('redirect_url');
    if (pathName) {
        localStorage.removeItem('redirect_url');
        return pathName;
    }
};
