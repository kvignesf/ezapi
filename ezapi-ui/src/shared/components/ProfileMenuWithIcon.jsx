import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { useState } from 'react';
import AppIcon from './AppIcon';
import ProfileMenu from './ProfileMenu';

const ProfileMenuWithIcon = ({ logout }) => {
    const [profileMenuAnchorEl, setProfilemenuAnchorEl] = useState(false);

    const handleProfileMenuClick = (event) => {
        setProfilemenuAnchorEl(event?.currentTarget);
    };

    const handleOnLogout = () => {
        logout();
    };

    return (
        <div>
            <AppIcon aria-label="profile options" style={{ color: 'white' }} onClick={handleProfileMenuClick}>
                <ExpandMoreIcon />
            </AppIcon>

            <ProfileMenu
                onLogout={handleOnLogout}
                profileMenuAnchorEl={profileMenuAnchorEl}
                setProfilemenuAnchorEl={setProfilemenuAnchorEl}
            />
        </div>
    );
};

export default ProfileMenuWithIcon;
