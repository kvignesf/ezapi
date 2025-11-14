import { IconButton, Tab, Tabs } from '@material-ui/core';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { Add, Close, NavigateNext } from '@material-ui/icons';
import { TabContext, TabPanel } from '@material-ui/lab';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { endpoint } from '../../shared/network/client';
import { getUserId } from '../../shared/storage';
import {
    currentApi,
    currentBreadCrumbs,
    currentTab,
    currentTabs,
    folderState,
    isSaveModalOpen,
    requestParams,
    responseInfo,
} from '../CollectionsAtom';
import File from '../DocStore/components/File';
import ApiCall from './ApiCall/ApiCall';
import DefaultPage from './ApiCall/components/DefaultPage';

const useStyles = makeStyles((theme) => ({
    tabPanel: {
        margin: '-25px',
    },
    breadCrumbs: {
        margin: theme.spacing(2),
        marginLeft: theme.spacing(1),
    },
    root: {
        borderBottom: '3px solid #F0F0F0',
        marginTop: '-2px',
        height: '20px',
    },
    tab: {
        zIndex: '1',
        fontWeight: 'semibold',
        textTransform: 'none',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    selectedTab: {
        backgroundColor: 'rgba(128, 128, 128, 0.2)',
        fontWeight: 600,
        paddingRight: 5,
    },
    tabButton: {
        zIndex: '2',
    },
    closeButton: {
        '&::after': {
            content: '""',
            position: 'absolute',
            top: -10,
            right: -5,
            height: '120px',
            width: '2px',
            backgroundColor: theme.palette.divider,
        },
    },
    closeBtn: {
        zIndex: '2',
        position: 'relative',
        opacity: 0,
        '&:hover': {
            opacity: 1,
        },
    },
    modalButton: {
        margin: theme.spacing(1),
        padding: '5px 12px', // reduce the padding on the top and bottom
        fontSize: '12px',
        fontWeight: 600,
        height: '33px',
    },
}));

function CollectionTabs() {
    const userId = getUserId();
    const classes = useStyles();
    const [tabs, setTabs] = useRecoilState(currentTabs);
    const [index, setIndex] = useState(-1);
    const [value, setValue] = useRecoilState(currentTab);
    const [request, setRequest] = useRecoilState(requestParams);
    const [response, setResponse] = useRecoilState(responseInfo);
    const [api, setCurrentApi] = useRecoilState(currentApi);
    const [breadCrumbs, setBreadCrumbs] = useRecoilState(currentBreadCrumbs);
    const [open, setOpen] = useState(false);
    const setSaveModalOpen = useSetRecoilState(isSaveModalOpen);
    const setFolderData = useSetRecoilState(folderState(api.parentFolderId));

    const handleClickOpen = (index) => {
        setIndex(index);
        if (
            tabs[index]?.onSave === false &&
            tabs[index]?.request &&
            JSON.stringify(tabs[index].request) !==
                JSON.stringify({
                    method: 'GET',
                    proxy: 'No Proxy',
                    url: '',
                    body: { '': '' },
                    header: [],
                    queryParams: [],
                })
        ) {
            setOpen(true);
        } else {
            handleDelete(index);
        }
    };
    const handleClose = () => {
        setOpen(false);
    };

    const handleChange = async (event, newValue) => {
        if (
            (tabs[value]?.request && JSON.stringify(tabs[value]?.request) !== JSON.stringify(request)) ||
            (tabs[value]?.response && JSON.stringify(tabs[value]?.response) !== JSON.stringify(response))
        ) {
            const currentDate = new Date();
            const formattedDateTime = currentDate.toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
            await axios
                .put(process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}/${tabs[value]?.id}`, {
                    request: request,
                    response: response,
                    modifiedAt: formattedDateTime,
                })
                .then((response) => {
                    const data = response.data;
                    setTabs((prev) => {
                        const isTabExists = prev.some((tab) => tab.id === data.id);
                        if (isTabExists) {
                            // If the tab already exists, update the existing tab with new data
                            return prev.map((tab) => {
                                if (tab.id === data.id) {
                                    return {
                                        ...tab,
                                        request: data.request,
                                        response: data.response,
                                    };
                                }
                                return tab;
                            });
                        } else {
                            return [...prev];
                        }
                    });
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        }
        setValue(newValue);
        setRequest(tabs[newValue].request);
        setResponse(tabs[newValue].response);
        setCurrentApi({
            id: tabs[newValue]?.id ? tabs[newValue].id : '0',
            name: tabs[newValue]?.label ? tabs[newValue].label : 'New Request',
            type: 'file',
            onSave: tabs[newValue]?.onSave ? tabs[newValue].onSave : false,
            parentFolderId: tabs[newValue]?.parentFolderId ? tabs[newValue].parentFolderId : '0',
        });
        setBreadCrumbs(tabs[newValue]?.parentFolderNames ? tabs[newValue]?.parentFolderNames : []);
        axios
            .put(process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}/${tabs[newValue].id}`, {
                isRecent: true,
            })
            .catch((error) => console.log(error));
        setFolderData((folderData) => {
            return folderData.map((file) => {
                if (file.props.id === api.id) {
                    return (
                        <File
                            key={file.props.id}
                            id={file.props.id}
                            parentId={file.props.parentId}
                            selected={file.props.selected}
                            onSelect={file.props.onSelect}
                            name={file.props.name}
                            reqMethod={request.method ? request.method : 'GET'}
                            reqUrl={request.url ? request.url : ''}
                        />
                    );
                } else {
                    return file; // Return the original file object for non-matching IDs
                }
            });
        });
    };

    const handleSave = () => {
        if (tabs[index]?.onSave === false) {
            setOpen(false);
            setValue(index);
            setRequest(tabs[index].request);
            setResponse(tabs[index].response);
            setCurrentApi({
                id: tabs[index]?.id ? tabs[index].id : '0',
                name: tabs[index]?.label ? tabs[index].label : 'New Request',
                type: 'file',
                onSave: tabs[index]?.onSave ? tabs[index].onSave : false,
                parentFolderId: tabs[index]?.parentFolderId ? tabs[index].parentFolderId : '0',
            });
            setBreadCrumbs(tabs[index]?.parentFolderNames ? tabs[index]?.parentFolderNames : []);
            setSaveModalOpen(true);
        }
    };

    const handleDelete = async (idx) => {
        if (tabs[idx]?.onSave === false) {
            await axios
                .delete(process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}/${tabs[idx].id}`)
                .catch((error) => {
                    console.error('Error while saving contents:', error);
                });
        } else {
            if (
                JSON.stringify(request) !== JSON.stringify(tabs[value]?.request) ||
                JSON.stringify(response) !== JSON.stringify(tabs[value]?.response)
            ) {
                const currentDate = new Date();
                const formattedDateTime = currentDate.toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                });

                await axios
                    .put(
                        process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}/${tabs[value]?.id}`,
                        {
                            request: request,
                            response: response,
                            modifiedAt: formattedDateTime,
                        },
                    )
                    .then(() => {
                        setFolderData((folderData) => {
                            return folderData.map((file) => {
                                if (file.props.id === api.id) {
                                    return (
                                        <File
                                            key={file.props.id}
                                            id={file.props.id}
                                            parentId={file.props.parentId}
                                            selected={file.props.selected}
                                            onSelect={file.props.onSelect}
                                            name={file.props.name}
                                            reqMethod={request.method ? request.method : 'GET'}
                                            reqUrl={request.url ? request.url : ''}
                                        />
                                    );
                                } else {
                                    return file; // Return the original file object for non-matching IDs
                                }
                            });
                        });
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    });
            }
        }

        const newTabs = tabs.filter((_, i) => i !== idx);
        setTabs(newTabs);
        if (tabs.length > 0) {
            if (idx === value - 1 || idx <= value) {
                setIndex(value - 1);
                setValue(value - 1);
            } else {
                setIndex(value);
                setValue(value);
            }
            if (idx === value) {
                setRequest(
                    tabs[value - 1]?.request
                        ? tabs[value - 1].request
                        : {
                              method: 'GET',
                              proxy: 'No Proxy',
                              url: '',
                              body: { '': '' },
                              header: [],
                              queryParams: [],
                          },
                );
                setResponse(tabs[value - 1]?.response ? tabs[value - 1].response : {});
                setCurrentApi({
                    id: tabs[value - 1]?.id ? tabs[value - 1].id : '0',
                    name: tabs[value - 1]?.label ? tabs[value - 1].label : 'New Request',
                    type: 'file',
                    onSave: tabs[value - 1]?.onSave ? tabs[value - 1].onSave : false,
                    parentFolderId: tabs[value - 1]?.parentFolderId ? tabs[value - 1].parentFolderId : '0',
                });
                setBreadCrumbs(tabs[value - 1]?.parentFolderNames ? tabs[value - 1].parentFolderNames : []);
            } else {
                setRequest(
                    tabs[value]?.request
                        ? tabs[value].request
                        : {
                              method: 'GET',
                              proxy: 'No Proxy',
                              url: '',
                              body: { '': '' },
                              header: [],
                              queryParams: [],
                          },
                );
                setResponse(tabs[value]?.response ? tabs[value].response : {});
                setCurrentApi({
                    id: tabs[value]?.id ? tabs[value].id : '0',
                    name: tabs[value]?.label ? tabs[value].label : 'New Request',
                    type: 'file',
                    onSave: tabs[value]?.onSave ? tabs[value].onSave : false,
                    parentFolderId: tabs[value]?.parentFolderId ? tabs[value].parentFolderId : '0',
                });
                setBreadCrumbs(tabs[value]?.parentFolderNames ? tabs[value].parentFolderNames : []);
            }
        } else {
            setIndex(-1);
            setValue(-1);
            setRequest({
                method: 'GET',
                proxy: 'No Proxy',
                url: '',
                body: { '': '' },
                header: [],
                queryParams: [],
            });
            setResponse({});
            setCurrentApi({ id: 0, name: '', type: 'file', onSave: false, parentFolderId: '0' });
            setBreadCrumbs([]);
        }
        if (value - 1 === -1) {
            setRequest({
                method: 'GET',
                proxy: 'No Proxy',
                url: '',
                body: { '': '' },
                header: [],
                queryParams: [],
            });
            setResponse({});
            setCurrentApi({ id: 0, name: '', type: 'file', onSave: false, parentFolderId: '0' });
            setBreadCrumbs([]);
        }
        setOpen(false);
    };

    const handleAdd = async () => {
        const newId = uuidv4();
        const newTab = {
            id: newId,
            request: { method: 'GET', proxy: 'No Proxy', url: '', body: { '': '' }, header: [], queryParams: [] },
            response: {},
            parentFolderNames: [''],
            label: 'New Request',
            content: <ApiCall />,
            onSave: false,
            type: 'file',
        };
        setTabs([...tabs, newTab]);

        if (
            (tabs[value]?.request && JSON.stringify(tabs[value]?.request) !== JSON.stringify(request)) ||
            (tabs[value]?.response && JSON.stringify(tabs[value]?.response) !== JSON.stringify(response))
        ) {
            const currentDate = new Date();
            const formattedDateTime = currentDate.toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
            await axios
                .put(process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}/${tabs[value]?.id}`, {
                    request: request,
                    response: response,
                    modifiedAt: formattedDateTime,
                })
                .then((response) => {
                    const data = response.data;
                    setTabs((prev) => {
                        const isTabExists = prev.some((tab) => tab.id === data.id);
                        if (isTabExists) {
                            // If the tab already exists, update the existing tab with new data
                            return prev.map((tab) => {
                                if (tab.id === data.id) {
                                    return {
                                        ...tab,
                                        request: data.request,
                                        response: data.response,
                                    };
                                }
                                return tab;
                            });
                        } else {
                            return [...prev];
                        }
                    });
                    setFolderData((folderData) => {
                        return folderData.map((file) => {
                            if (file.props.id === api.id) {
                                return (
                                    <File
                                        key={file.props.id}
                                        id={file.props.id}
                                        parentId={file.props.parentId}
                                        selected={file.props.selected}
                                        onSelect={file.props.onSelect}
                                        name={file.props.name}
                                        reqMethod={request.method ? request.method : 'GET'}
                                        reqUrl={request.url ? request.url : ''}
                                    />
                                );
                            } else {
                                return file; // Return the original file object for non-matching IDs
                            }
                        });
                    });
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        }
        setIndex(tabs.length);
        setValue(tabs.length);
        setRequest({ method: 'GET', proxy: 'No Proxy', url: '', body: { '': '' }, header: [], queryParams: [] });
        setResponse({});
        setCurrentApi({ id: newId, name: 'New Request', type: 'file', onSave: false, parentFolderId: '0' });
        setBreadCrumbs([]);
        const currentDate = new Date();
        const formattedDateTime = currentDate.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        await axios.post(process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}/${newId}`, {
            name: 'New Request',
            request: {
                method: 'GET',
                proxy: 'No Proxy',
                url: '',
                body: { '': '' },
                header: [],
                queryParams: [],
            },
            response: { status: null, headers: {}, data: {}, time: 0, size: 0 },
            onSave: true,
            parentFolderId: '0',
            isRecent: true,
            createdAt: formattedDateTime,
            modifiedAt: formattedDateTime,
        });
    };

    const handleLeft = () => {
        if (value > 0) {
            setIndex(value - 1);
            setValue(value - 1);
            setRequest(
                tabs[value - 1]?.request
                    ? tabs[value - 1].request
                    : {
                          method: 'GET',
                          proxy: 'No Proxy',
                          url: '',
                          body: { '': '' },
                          header: [],
                          queryParams: [],
                      },
            );
            setResponse(tabs[value - 1]?.response ? tabs[value - 1].response : {});
            setCurrentApi({
                id: tabs[value - 1]?.id ? tabs[value - 1].id : '0',
                name: tabs[value - 1]?.label ? tabs[value - 1].label : 'New Request',
                type: 'file',
                onSave: tabs[value - 1]?.onSave ? tabs[value - 1].onSave : false,
                parentFolderId: tabs[value - 1]?.parentFolderId ? tabs[value - 1].parentFolderId : '0',
            });
            setBreadCrumbs(tabs[value - 1]?.parentFolderNames ? tabs[value - 1].parentFolderNames : []);
        }
    };
    const handleRight = () => {
        if (value < tabs.length - 1) {
            setIndex(value + 1);
            setValue(value + 1);
            setRequest(
                tabs[value + 1]?.request
                    ? tabs[value + 1].request
                    : {
                          method: 'GET',
                          proxy: 'No Proxy',
                          url: '',
                          body: { '': '' },
                          header: [],
                          queryParams: [],
                      },
            );
            setResponse(tabs[value + 1]?.response ? tabs[value + 1].response : {});
            setCurrentApi({
                id: tabs[value + 1]?.id ? tabs[value + 1].id : '0',
                name: tabs[value + 1]?.label ? tabs[value + 1].label : 'New Request',
                type: 'file',
                onSave: tabs[value + 1]?.onSave ? tabs[value + 1].onSave : false,
                parentFolderId: tabs[value + 1]?.parentFolderId ? tabs[value + 1].parentFolderId : '0',
            });
            setBreadCrumbs(tabs[value + 1]?.parentFolderNames ? tabs[value + 1].parentFolderNames : []);
        }
    };
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey) {
                if (event.key === 'q') {
                    event.preventDefault(); // Prevent browser's default Save dialog
                    // Call your function here
                    handleAdd();
                }
                if (event.key === 'd') {
                    event.preventDefault(); // Prevent browser's default Save dialog
                    // Call your function here
                    handleClickOpen(index);
                }
                if (event.key === 'ArrowLeft') {
                    event.preventDefault(); // Prevent browser's default Save dialog
                    // Call your function here
                    handleLeft();
                }
                if (event.key === 'ArrowRight') {
                    event.preventDefault(); // Prevent browser's default Save dialog
                    // Call your function here
                    handleRight();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleAdd, handleClickOpen, index]);
    return (
        <div>
            <TabContext value={value}>
                <Tabs
                    value={value}
                    onChange={handleChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    aria-label="scrollable"
                    className={classes.root}
                >
                    {tabs.map((tab, index) => (
                        <div
                            key={index}
                            style={{ marginLeft: value > 0 ? 5 : 0 }}
                            className={`${value === index ? classes.selectedTab : ''}`}
                        >
                            <Tab
                                label={
                                    <span>
                                        <span
                                            style={
                                                api.id === tab.id
                                                    ? request.method && request.method === 'GET'
                                                        ? { color: '#03C988', fontSize: '14px', fontWeight: 500 }
                                                        : request.method && request.method === 'POST'
                                                        ? { color: '#F29727', fontSize: '14px', fontWeight: 500 }
                                                        : request.method && request.method === 'DELETE'
                                                        ? { color: '#CD1818', fontSize: '14px', fontWeight: 500 }
                                                        : request.method && request.method === 'PATCH'
                                                        ? { color: '#4F709C', fontSize: '14px', fontWeight: 500 }
                                                        : request.method && request.method === 'PUT'
                                                        ? { color: '#5B8FF9', fontSize: '14px', fontWeight: 500 }
                                                        : 'GET'
                                                    : tab.request.method && tab.request.method === 'GET'
                                                    ? { color: '#03C988', fontSize: '14px', fontWeight: 500 }
                                                    : tab.request.method && tab.request.method === 'POST'
                                                    ? { color: '#F29727', fontSize: '14px', fontWeight: 500 }
                                                    : tab.request.method && tab.request.method === 'DELETE'
                                                    ? { color: '#CD1818', fontSize: '14px', fontWeight: 500 }
                                                    : tab.request.method && tab.request.method === 'PATCH'
                                                    ? { color: '#4F709C', fontSize: '14px', fontWeight: 500 }
                                                    : tab.request.method && tab.request.method === 'PUT'
                                                    ? { color: '#5B8FF9', fontSize: '14px', fontWeight: 500 }
                                                    : 'GET'
                                            }
                                        >
                                            {api.id === tab.id ? request.method : tab.request.method}
                                        </span>
                                        {tab.label.length > 15 ? ` ${tab.label.substring(0, 10)}...` : ` ${tab.label}`}
                                    </span>
                                }
                                value={index}
                                onClick={(e) => handleChange(e, index)}
                                className={classes.tab}
                            />
                            <IconButton
                                size="small"
                                onClick={() => handleClickOpen(index)}
                                className={`${classes.closeButton}`}
                            >
                                <Close fontSize="small" className={`${classes.closeBtn}`} />
                            </IconButton>
                        </div>
                    ))}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            margin: '11px 7px',
                        }}
                    >
                        <IconButton size="small" onClick={handleAdd} className={classes.tabButton}>
                            <Add fontSize="small" />
                        </IconButton>
                    </div>
                </Tabs>
                <Breadcrumbs
                    separator={<NavigateNext fontSize="small" />}
                    aria-label="breadcrumb"
                    className={classes.breadCrumbs}
                >
                    {breadCrumbs && breadCrumbs.length > 0
                        ? breadCrumbs.map((item, index) => {
                              const isLast = index === breadCrumbs.length - 1;
                              return isLast ? (
                                  <Typography
                                      color="textPrimary"
                                      style={{ fontSize: '14px', fontWeight: 600 }}
                                      key={item}
                                  >
                                      {item}
                                  </Typography>
                              ) : (
                                  <Typography color="inherit" style={{ fontSize: '13px', fontWeight: 600 }} key={item}>
                                      {item}
                                  </Typography>
                              );
                          })
                        : null}
                </Breadcrumbs>
                {value < 0 || value == null || value === undefined ? (
                    <DefaultPage />
                ) : (
                    tabs.map((tab, index) => (
                        <TabPanel key={index} value={index} className={classes.tabPanel}>
                            <p>{tab.content}</p>
                        </TabPanel>
                    ))
                )}

                <Dialog open={open} onClose={handleClose}>
                    <DialogTitle
                        style={{
                            color: 'red',
                            fontSize: '18px',
                            fontWeight: 500,
                        }}
                    >
                        {'Unsaved Request'}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText
                            style={{
                                fontWeight: 500,
                                fontSize: '16px',
                            }}
                        >
                            Request is not saved. Would you like to save?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            variant="contained"
                            color="grey"
                            size="small"
                            style={{
                                margin: '2px',
                                padding: '5px 10px', // reduce the padding on the top and bottom
                                fontSize: '12px',
                                fontWeight: 600,
                                height: '31px',
                                backgroundColor: 'black',
                                color: 'white',
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: 'black',
                                },
                            }}
                            onClick={() => handleDelete(index)}
                        >
                            No
                        </Button>
                        <Button
                            variant="contained"
                            style={{
                                margin: '5px',
                                padding: '5px 10px', // reduce the padding on the top and bottom
                                fontSize: '12px',
                                fontWeight: 600,
                                height: '31px',
                                backgroundColor: '#C72C71',
                                color: 'white',
                                boxShadow: 'none',
                            }}
                            size="small"
                            onClick={handleSave}
                        >
                            Yes
                        </Button>
                    </DialogActions>
                </Dialog>
            </TabContext>
        </div>
    );
}

export default CollectionTabs;
