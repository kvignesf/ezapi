import { List, ListItem } from '@material-ui/core';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { Dialog, makeStyles } from '@material-ui/core/index';
import AddIcon from '@material-ui/icons/Add';
import LibraryBooksIcon from '@material-ui/icons/LibraryBooks';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import classNames from 'classnames';
import _ from 'lodash';
import { useState } from 'react';
import Confetti from 'react-confetti';
import { useHistory } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { getAccessToken, getFirstName, getLastName } from '../shared/storage';
// import DashboardSharpIcon from "@material-ui/icons/DashboardSharp";
import InventoryIcon from '@mui/icons-material/Inventory';
import React from 'react';
import AddProject from '../AddProject';
import projectAtom, { defaultState } from '../AddProject/projectAtom';
import Colors from '../shared/colors';
import EzapiFooter from '../shared/components/EzapiFooter';
import InitialsAvatar from '../shared/components/InitialsAvatar';
import ProfileMenuWithIcon from '../shared/components/ProfileMenuWithIcon';
import { useLogout } from '../shared/query/authQueries';
import routes, { generateRoute } from '../shared/routes';
import { ReactComponent as DashboardSharpIcon } from '../static/images/dashboard_logo.svg';
import imageLogo from '../static/images/logo/newconnectLogoOnlyWhite.svg';
import { ReactComponent as OrderHistoryIcon } from '../static/images/order-history.svg';
import { ReactComponent as PricingPageIcon } from '../static/images/pricing-page.svg';
import { ReactComponent as ProductTourIcon } from '../static/images/product_tour2.svg';
import { downloadIconProj, downloadIconSts, sideWidth } from './dwnDataGenAtom';

const acc_token = getAccessToken();
const baseUrl = process.env.REACT_APP_API_URL;
const displayAPIGov = process.env.REACT_APP_DISABLE_APIGOV ? process.env.REACT_APP_DISABLE_APIGOV : 'true';

const displayCollections = process.env.REACT_APP_DISPLAY_COLLECTIONS
    ? process.env.REACT_APP_DISPLAY_COLLECTIONS
    : 'true';

const useStyles = makeStyles({
    selectedItem: {
        background: Colors.brand.primarySubtle,
        borderLeft: `5px solid ${Colors.brand.primary}`,
        borderLeftWidth: '5px',
        borderTopRightRadius: '5px',
        borderBottomRightRadius: '5px',
    },
    root: {
        '&$selected': {
            backgroundColor: Colors.brand.primarySubtle,
            '&:hover': {
                backgroundColor: 'none',
            },
        },
    },
    selected: {},
});

const drawerWidth = 55;
const maxSidebarWidth = 190;

const Dashboard = ({ selectedIndex, children, pricingDefaultCheck }) => {
    // console.log(acc_token);
    const styles = useStyles();
    const history = useHistory();
    const [dialog, setDialog] = useState({
        show: false,
        type: null,
        data: null,
    });
    const [counter, setCounter] = useState(() => {
        return 0;
    });
    const [profileMenuAnchorEl, setProfilemenuAnchorEl] = useState(false);
    const [projectState, setProjectState] = useRecoilState(projectAtom);
    const [showFirework, setShowFirework] = useState(false);

    const { isLoading: isLoggingOut, mutate: logout } = useLogout();
    const firstName = getFirstName();
    const lastName = getLastName();

    const handleSideMenuItemClick = (index) => {
        // console.log(index);
        if (index !== selectedIndex) {
            if (index === 0) {
                // Show add new project dialog
                showAddProjectDialog();
            } else if (index === 1) {
                history.push({
                    pathname: routes.projects,
                    state: { allow: true },
                });
                // history.push(routes.projects);
            } else if (index === 2) {
                history.push(routes.orders);
            } else if (index === 3) {
                history.push(routes.pricing);
            } else if (index === 4) {
                history.push(routes.productTour);
            } else if (index === 5) {
                history.replace({
                    pathname: routes.docs,
                    state: { allow: false },
                });
            } else if (index === 6) {
                history.push(routes.apiGovernance);
                window.location.reload();
            } else if (index === 7) {
                history.push(routes.collections);
            }
        }
    };

    const BackgroundParticles = () => {
        return <Confetti recycle={false} tweenDuration={10000} numberOfPieces={400} />;
    };
    const showAddProjectDialog = () => {
        setDialog({
            show: true,
            type: 'add-project',
        });
    };

    const handleCloseDialog = () => {
        setProjectState(defaultState);
        setShowFirework(false);

        setDialog({
            show: false,
            data: null,
        });
    };

    const handleProfileMenuClick = (event) => {
        setProfilemenuAnchorEl(event?.currentTarget);
    };

    const handleOnLogout = () => {
        logout();
    };
    const [enableIcon, setEnableIcon] = useRecoilState(downloadIconSts);
    const [projectIden, setProjectIden] = useRecoilState(downloadIconProj);

    const [sidebarWidth, setSidebarWidth] = useRecoilState(sideWidth);
    const useSidebarStyles = makeStyles((theme) => ({
        root: {
            display: 'flex',
        },
        appBar: {
            zIndex: theme.zIndex.drawer + 1,
        },
        content: {
            flexGrow: 1,
        },
        drawer: {
            width: sidebarWidth,
            flexShrink: 0,
        },
        drawerPaper: {
            width: sidebarWidth,
            borderRight: 'none',
        },
        drawerContainer: {
            overflow: 'auto',
        },
        resizable: {
            position: 'relative',
            '& .react-resizable-handle': {
                position: 'absolute',
                top: 0,
                right: 0,
                width: '2px',
                height: '100%',
                cursor: 'col-resize',
                zIndex: 1,
                backgroundColor: '#E6E7E5',
                transition: 'background-color 0.2s ease-in-out',
            },
            '& .react-resizable-handle:hover': {
                width: '5px',
                backgroundColor: 'gray4',
            },
            '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'gray4',
            },
        },
    }));
    const classes = useSidebarStyles();

    const handleResize = (e, { size }) => {
        if (size.width <= maxSidebarWidth) {
            setSidebarWidth(size.width);
        }
    };

    return (
        <div className="flex flex-col h-screen">
            {showFirework && BackgroundParticles()}
            <Dialog
                onClose={(event, reason) => {
                    if (reason !== 'backdropClick') {
                        handleCloseDialog();
                    }
                }}
                aria-labelledby="dashboard-dialog"
                open={isLoggingOut || (dialog?.show ?? false)}
                fullWidth
                PaperProps={{
                    style: { borderRadius: 8 },
                }}
            >
                {dialog?.type === 'add-project' && (
                    <AddProject
                        onClose={handleCloseDialog}
                        onSuccess={(projectId) => {
                            handleCloseDialog();

                            if (!_.isEmpty(projectId)) {
                                history.push(generateRoute(routes.projects, projectId));
                            }
                        }}
                    />
                )}

                {isLoggingOut && <div className="p-4">Logging you out ...</div>}
            </Dialog>

            <header
                className="fixed w-full top-0 bg-brand-primary flex flex-row p-4 items-center"
                style={{ height: '56px', zIndex: '99' }}
            >
                {/* EZAPI logo */}
                <div className="w-full flex flex-row">
                    <img
                        src={imageLogo}
                        alt="conektto logo"
                        className="p-1"
                        style={{ maxWidth: '128px', maxHeight: '50px' }}
                    />
                </div>

                {/* Initials logo */}
                <InitialsAvatar
                    firstName={firstName}
                    lastName={lastName}
                    style={{
                        marginRight: '0.5rem',
                    }}
                />

                {/* Name */}
                <p className="text-overline2 text-white whitespace-nowrap mr-2">
                    {firstName} {lastName}
                </p>

                {/* Options */}
                <ProfileMenuWithIcon logout={logout} />
            </header>

            <section className="flex flex-row my-14" style={{ height: '70vh' }}>
                <div className="h-full w-52 fixed left-0 border-r-2 border-gray-100">
                    <List>
                        <ListItem
                            button
                            selected={selectedIndex === 0}
                            onClick={() => {
                                handleSideMenuItemClick(0);
                                setShowFirework(true);
                            }}
                            style={{
                                padding: '1rem',
                                background: selectedIndex === 0 ? Colors.brand.primarySubtle : 'white',
                            }}
                            className={selectedIndex === 0 ? styles.selectedItem : null}
                            disableTouchRipple
                        >
                            <ListItemIcon
                                style={{
                                    minWidth: '0',
                                    marginRight: '1rem',
                                }}
                            >
                                <AddIcon
                                    className={`${classNames({
                                        'text-brand-primary': selectedIndex === 0,
                                        'text-neutral-gray2': selectedIndex !== 0,
                                    })}`}
                                    style={selectedIndex === 0 ? {} : { color: 'grey' }}
                                />
                            </ListItemIcon>
                            <p
                                className={`text-overline2 ${classNames({
                                    'text-brand-primary': selectedIndex === 0,
                                    'text-neutral-gray2': selectedIndex !== 0,
                                })}`}
                            >
                                Create New API
                            </p>
                        </ListItem>

                        <ListItem
                            button
                            selected={selectedIndex === 1}
                            onClick={() => {
                                handleSideMenuItemClick(1);
                            }}
                            style={{
                                padding: '1rem',
                            }}
                            className={selectedIndex === 1 ? styles.selectedItem : null}
                            classes={{ root: styles.root, selected: styles.selected }}
                            disableTouchRipple
                        >
                            <ListItemIcon style={{ minWidth: '0', marginRight: '1rem' }}>
                                <DashboardSharpIcon
                                    fill={selectedIndex === 1 ? Colors.brand.primary : Colors.neutral.gray4}
                                />
                            </ListItemIcon>
                            <p
                                className={`text-overline2 ${classNames({
                                    'text-brand-primary': selectedIndex === 1,
                                    'text-neutral-gray4': selectedIndex !== 1,
                                })}`}
                            >
                                Dashboard
                            </p>
                        </ListItem>

                        <ListItem
                            button
                            selected={selectedIndex === 2}
                            onClick={() => {
                                handleSideMenuItemClick(2);
                            }}
                            style={{
                                padding: '1rem',
                            }}
                            className={selectedIndex === 2 ? styles.selectedItem : null}
                            classes={{ root: styles.root, selected: styles.selected }}
                            disableTouchRipple
                        >
                            <ListItemIcon style={{ minWidth: '0', marginRight: '1rem' }}>
                                <OrderHistoryIcon
                                    fill={selectedIndex === 2 ? Colors.brand.primary : Colors.neutral.gray4}
                                />
                            </ListItemIcon>
                            <p
                                className={`text-overline2 ${classNames({
                                    'text-brand-primary': selectedIndex === 2,
                                    'text-neutral-gray4': selectedIndex !== 2,
                                })}`}
                            >
                                Order History
                            </p>
                        </ListItem>

                        <ListItem
                            button
                            selected={selectedIndex === 3}
                            onClick={() => {
                                handleSideMenuItemClick(3);
                            }}
                            style={{
                                padding: '1rem',
                            }}
                            className={selectedIndex === 3 ? styles.selectedItem : null}
                            classes={{ root: styles.root, selected: styles.selected }}
                            disableTouchRipple
                        >
                            <ListItemIcon style={{ minWidth: '0', marginRight: '1rem' }}>
                                <PricingPageIcon
                                    fill={selectedIndex === 3 ? Colors.brand.primary : Colors.neutral.gray4}
                                />
                            </ListItemIcon>
                            <p
                                className={`text-overline2 ${classNames({
                                    'text-brand-primary': selectedIndex === 3,
                                    'text-neutral-gray4': selectedIndex !== 3,
                                })}`}
                            >
                                Pricing Plan
                            </p>
                        </ListItem>
                        <ListItem
                            button
                            selected={selectedIndex === 4}
                            onClick={() => {
                                handleSideMenuItemClick(4);
                            }}
                            style={{
                                padding: '1rem',
                            }}
                            className={selectedIndex === 4 ? styles.selectedItem : null}
                            classes={{ root: styles.root, selected: styles.selected }}
                            disableTouchRipple
                        >
                            <ListItemIcon style={{ minWidth: '0', marginRight: '1rem' }}>
                                <ProductTourIcon
                                    fill={selectedIndex === 4 ? Colors.brand.primary : Colors.neutral.gray4}
                                />
                            </ListItemIcon>
                            <p
                                className={`text-overline2 ${classNames({
                                    'text-brand-primary': selectedIndex === 4,
                                    'text-neutral-gray4': selectedIndex !== 4,
                                })}`}
                            >
                                Product Tour
                            </p>
                        </ListItem>
                        <ListItem
                            button
                            selected={selectedIndex === 5}
                            onClick={() => {
                                handleSideMenuItemClick(5);
                            }}
                            style={{
                                padding: '1rem',
                            }}
                            className={selectedIndex === 5 ? styles.selectedItem : null}
                            classes={{ root: styles.root, selected: styles.selected }}
                            disableTouchRipple
                        >
                            <ListItemIcon style={{ minWidth: '0', marginRight: '1rem' }}>
                                <LibraryBooksIcon fill={selectedIndex === 5 ? Colors.brand.primary : 'grey'} />
                            </ListItemIcon>
                            <p
                                className={`text-overline2 ${classNames({
                                    'text-brand-primary': selectedIndex === 5,
                                    'text-neutral-gray4': selectedIndex !== 5,
                                })}`}
                            >
                                Docs
                            </p>
                        </ListItem>
                        {displayAPIGov == 'true' && (
                            <ListItem
                                button
                                selected={selectedIndex === 6}
                                onClick={() => {
                                    handleSideMenuItemClick(6);
                                }}
                                style={{
                                    padding: '1rem',
                                }}
                                className={selectedIndex === 6 ? styles.selectedItem : null}
                                classes={{ root: styles.root, selected: styles.selected }}
                                disableTouchRipple
                            >
                                <ListItemIcon style={{ minWidth: '0', marginRight: '1rem' }}>
                                    <AccountBalanceIcon
                                        //fill={selectedIndex === 6 ? Colors.brand.primary : "grey"}
                                        style={selectedIndex === 6 ? { color: '#C72C71' } : { color: 'grey' }}
                                    />
                                </ListItemIcon>
                                <p
                                    className={`text-overline2 ${classNames({
                                        'text-brand-primary': selectedIndex === 6,
                                        'text-neutral-gray4': selectedIndex !== 6,
                                    })}`}
                                >
                                    API Governance
                                </p>
                            </ListItem>
                        )}

                        {displayCollections == 'true' && (
                            <ListItem
                                button
                                selected={selectedIndex === 7}
                                onClick={() => {
                                    handleSideMenuItemClick(7);
                                }}
                                style={{
                                    padding: '1rem',
                                    height: '3.5rem',
                                    width: '200px',
                                }}
                                title={sidebarWidth < 120 ? 'Collections' : null}
                                className={selectedIndex === 7 ? styles.selectedItem : null}
                                classes={{ root: styles.root, selected: styles.selected }}
                                disableTouchRipple
                            >
                                <ListItemIcon style={{ minWidth: '0', marginRight: '1rem' }}>
                                    <InventoryIcon
                                        fill={selectedIndex === 7 ? Colors.brand.primary : Colors.neutral.gray4}
                                    />
                                </ListItemIcon>
                                {sidebarWidth !== drawerWidth ? (
                                    <p
                                        className={`text-overline2 ${classNames({
                                            'text-brand-primary': selectedIndex === 7,
                                            'text-neutral-gray4': selectedIndex !== 7,
                                        })}`}
                                    >
                                        Collections
                                    </p>
                                ) : null}
                            </ListItem>
                        )}
                    </List>
                </div>

                <div
                    className="ml-52 w-full"

                    // style={{ height: `calc(100vh - 180px)` }}
                >
                    {React.cloneElement(children, {
                        showCreateProjectDialog: showAddProjectDialog,
                    })}
                </div>
            </section>

            <EzapiFooter />
        </div>
    );
};

export default Dashboard;
