import { Fade, Menu, MenuItem } from '@material-ui/core';
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { SocketContext } from '../../Context/socket';
import Colors from '../colors';
import { getUserId } from '../storage';

const ProfileMenu = ({ onLogout, profileMenuAnchorEl, setProfilemenuAnchorEl }) => {
    /*   const navigateToContactUs = () => {
    history.push(routes.contact);
  }; */
    const socket = useContext(SocketContext);
    const userId = getUserId();
    //console.log("userId in logout..", userId)

    return (
        <Menu
            id="profile-menu"
            anchorEl={profileMenuAnchorEl}
            keepMounted
            open={Boolean(profileMenuAnchorEl)}
            onClose={() => {
                setProfilemenuAnchorEl(null);
            }}
            TransitionComponent={Fade}
            style={{ borderRadius: '1rem', zIndex: '1100' }}
        >
            <MenuItem>
                <Link
                    to="/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-overline2 text-brand-secondary hover:opacity-80"
                >
                    Contact Us
                </Link>
            </MenuItem>

            <MenuItem
                onClick={() => {
                    setProfilemenuAnchorEl(null);
                    socket.emit('forceDisconnect', {
                        user: userId,
                    });
                    socket.disconnect();
                    onLogout();
                }}
                style={{
                    color: Colors.accent.red,
                }}
            >
                Logout
            </MenuItem>
        </Menu>
    );
};

export default ProfileMenu;
