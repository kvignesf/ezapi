import { createContext, useContext } from 'react';

const UserRoleContext = createContext();

const UserRoleProvider = ({ role: defaultRole, children }) => {
    return <UserRoleContext.Provider value={defaultRole}>{children}</UserRoleContext.Provider>;
};

export const useUserRole = () => {
    const role = useContext(UserRoleContext);

    return role;
};

export default UserRoleProvider;
