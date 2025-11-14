import { Menu, MenuItem } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import { makeStyles } from '@material-ui/core/styles';
import { Close } from '@material-ui/icons';
import InsertDriveFileOutlinedIcon from '@material-ui/icons/InsertDriveFileOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { endpoint } from '../../../shared/network/client';
import { getUserId } from '../../../shared/storage';
import ApiCall from '../../CollectionTabs/ApiCall/ApiCall';
import {
    currentApi,
    currentBreadCrumbs,
    currentTab,
    currentTabs,
    folderState,
    requestParams,
    responseInfo,
    toggle,
} from '../../CollectionsAtom';
import LoadingDialog from '../../components/LoadingDialog';

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        alignItems: 'center',
        padding: '3px',
        cursor: 'pointer',
        minWidth: '12rem',
        justifyContent: 'space-between',
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
    },
    fileIcon: {
        fontSize: '17px',
    },

    fileName: {
        flexGrow: 1,
        fontWeight: 600,
        fontSize: '12px',
        marginLeft: '5px',
        whiteSpace: 'nowrap', // prevent wrapping of text
        overflow: 'hidden', // hide overflow text
        textOverflow: 'ellipsis', // add ellipsis when text overflows
    },
    renamingInputBox: {
        flexGrow: 1,
        fontSize: '13px',
        marginLeft: '5px',
        padding: '3px',
    },
    iconButton: {
        padding: '5px',
    },
    icons: {
        display: 'flex',
        width: '32%',
    },
    selectedFile: {
        display: 'flex',
        alignItems: 'center',
        padding: '2px',
        cursor: 'pointer',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(128, 128, 128, 0.2)',
    },
    newfileClass: {
        display: 'flex',
        alignItems: 'center',
        padding: '2px',
        cursor: 'pointer',
        justifyContent: 'space-between',
        overflow: 'auto',
        width: '100vw',
        '&::-webkit-scrollbar': {
            width: '5px',
            height: '5px',
        },
        '&::-webkit-scrollbar-track': {
            backgroundColor: '#f2f2f2',
            borderRadius: '10px',
        },
        '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c9c9c9',
            borderRadius: '10px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#a6a6a6',
        },
    },
}));

export default function File({
    id,
    parentId,
    onDelete,
    onSelect,
    selected,
    name,
    isModal,
    saveModalOpen,
    reqMethod,
    reqUrl,
    handleDialog,
}) {
    const classes = useStyles();
    const [fileName, setFileName] = useState(name);
    const [editing, setEditing] = useState(false); // Add editing state
    const userId = getUserId();
    const [anchorEl, setAnchorEl] = useState(null);
    const inputRef = useRef(null);
    const isMountedRef = useRef(true);
    const [tabs, setTabs] = useRecoilState(currentTabs);
    const [currenttab, setCurrentTab] = useRecoilState(currentTab);
    const [request, setRequest] = useRecoilState(requestParams);
    const [response, setResponse] = useRecoilState(responseInfo);
    const [api, setCurrentApi] = useRecoilState(currentApi);
    const setBreadCrumbs = useSetRecoilState(currentBreadCrumbs);
    const [isApiHappening, setApiHappening] = useState(false);
    const [loading, setLoading] = useState(false);
    const alignment = useRecoilValue(toggle);
    const [folderData, setFolderData] = useRecoilState(folderState(parentId));
    const handleOptionClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleOptionClose = () => {
        setAnchorEl(null);
    };
    const handleDelete = async () => {
        setLoading(true);

        await axios
            .delete(process.env.REACT_APP_API_URL + `${endpoint.collectionDirectory}/${userId}/${id}`)
            .catch((err) => {
                console.log(err);
            });

        await axios
            .delete(process.env.REACT_APP_API_URL + `${endpoint.collectionsRequest}/${userId}/${id}`)
            .then(() => {
                const index = tabs.findIndex((child) => child.id === id);
                const newTabs = tabs.filter((child) => child.id !== id);
                setTabs(newTabs);
                if (tabs.length > 0) {
                    if (index === currenttab - 1 || index <= currenttab) {
                        setCurrentTab(currenttab - 1);
                    } else {
                        setCurrentTab(currenttab);
                    }
                    if (index === currenttab) {
                        setRequest(
                            tabs[currenttab - 1]?.request
                                ? tabs[currenttab - 1].request
                                : {
                                      method: 'GET',
                                      proxy: 'No Proxy',
                                      url: '',
                                      body: { '': '' },
                                      header: [],
                                      queryParams: [],
                                  },
                        );
                        setResponse(tabs[currenttab - 1]?.response ? tabs[currenttab - 1].response : {});
                        setCurrentApi({
                            id: tabs[currenttab - 1]?.id ? tabs[currenttab - 1].id : '0',
                            name: tabs[currenttab - 1]?.label ? tabs[currenttab - 1].label : 'New Request',
                            type: 'file',
                            onSave: tabs[currenttab - 1]?.onSave ? tabs[currenttab - 1].onSave : false,
                            parentFolderId: tabs[currenttab - 1]?.parentFolderId
                                ? tabs[currenttab - 1].parentFolderId
                                : '0',
                        });
                        setBreadCrumbs(
                            tabs[currenttab - 1]?.parentFolderNames ? tabs[currenttab - 1].parentFolderNames : [],
                        );
                    } else {
                        setRequest(
                            tabs[currenttab]?.request
                                ? tabs[currenttab].request
                                : {
                                      method: 'GET',
                                      proxy: 'No Proxy',
                                      url: '',
                                      body: { '': '' },
                                      header: [],
                                      queryParams: [],
                                  },
                        );
                        setResponse(tabs[currenttab]?.response ? tabs[currenttab].response : {});
                        setCurrentApi({
                            id: tabs[currenttab]?.id ? tabs[currenttab].id : '0',
                            name: tabs[currenttab]?.label ? tabs[currenttab].label : 'New Request',
                            type: 'file',
                            onSave: tabs[currenttab]?.onSave ? tabs[currenttab].onSave : false,
                            parentFolderId: tabs[currenttab]?.parentFolderId ? tabs[currenttab].parentFolderId : '0',
                        });
                        setBreadCrumbs(tabs[currenttab]?.parentFolderNames ? tabs[currenttab].parentFolderNames : []);
                    }
                } else if (tabs.length === 0) {
                    setCurrentTab(-1);
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
            })
            .catch((err) => {
                console.log(err);
            });
        onSelect({});

        setFolderData((folderData) => {
            return folderData.filter((file) => file.props.id !== id);
        });

        onSelect({
            type: '',
            id: '',
        }); // Clear selected if the selected component is delet
        setLoading(false);
    };
    const handleSelect = async (event) => {
        event.stopPropagation();
        onSelect({ type: 'file', id: id });
        if (editing === false) {
            const isTabExists = tabs.some((tab) => tab.id === id);
            let index = tabs.findIndex((tab) => tab.id === id);

            if (
                (tabs[currenttab]?.request && JSON.stringify(tabs[currenttab]?.request) !== JSON.stringify(request)) ||
                (tabs[currenttab]?.response && JSON.stringify(tabs[currenttab]?.response) !== JSON.stringify(response))
            ) {
                await axios
                    .put(
                        process.env.REACT_APP_API_URL +
                            endpoint.collectionsRequest +
                            `/${userId}/${tabs[currenttab]?.id}`,
                        {
                            request: request,
                            response: response,
                        },
                    )
                    .then((response) => {
                        const data = response.data;
                        setTabs((prev) => {
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
                        });
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    });
            }

            if (isTabExists) {
                setCurrentTab(index);
                setRequest(tabs[index].request);
                setResponse(tabs[index].response);

                setCurrentApi({
                    id: tabs[index].id,
                    name: tabs[index]?.label ? tabs[index].label : 'New Request',
                    type: 'file',
                    onSave: tabs[index]?.onSave ? tabs[index].onSave : false,
                    parentFolderId: tabs[index]?.parentFolderId ? tabs[index].parentFolderId : '0',
                });
                setBreadCrumbs(tabs[index].parentFolderNames);
                return [...tabs];
            } else {
                setApiHappening(true);
                const type = 'file';
                let parentFolderNames;

                await axios
                    .get(process.env.REACT_APP_API_URL + endpoint.collectionDirectory + `/${userId}/${type}/${id}`)
                    .then((response) => {
                        parentFolderNames = response['data'].result;
                        parentFolderNames = parentFolderNames.reverse();
                    })
                    .catch((err) => {
                        console.log(err);
                    });
                await axios
                    .put(process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}/${id}`, {
                        isRecent: true,
                    })
                    .then(async (response) => {
                        const data = response.data;
                        setTabs((prev) => {
                            return [
                                ...prev,
                                {
                                    id: data.id ? data.id : '0',
                                    parentFolderNames: parentFolderNames ? parentFolderNames : [],
                                    request: data.request
                                        ? data.request
                                        : {
                                              method: 'GET',
                                              proxy: 'No Proxy',
                                              url: '',
                                              body: { '': '' },
                                              header: [],
                                              queryParams: [],
                                          },
                                    response: data.response ? data.response : {},
                                    label: data.name ? data.name : 'New Request',
                                    onSave: data.onSave ? data.onSave : false,
                                    type: 'file',
                                    parentFolderId: data.parentFolderId ? data.parentFolderId : '0',
                                    content: <ApiCall />,
                                },
                            ];
                        });

                        setCurrentTab(tabs.length);
                        setRequest(
                            data.request
                                ? data.request
                                : {
                                      method: 'GET',
                                      proxy: 'No Proxy',
                                      url: '',
                                      body: { '': '' },
                                      header: [],
                                      queryParams: [],
                                  },
                        );
                        setResponse(data.response ? data.response : {});

                        setCurrentApi({
                            id: data.id,
                            name: data.name ? data.name : 'New Request',
                            onSave: data.onSave,
                            type: 'file',
                            parentFolderId: data.parentFolderId,
                        });
                        setBreadCrumbs(parentFolderNames ? parentFolderNames : []);
                        setApiHappening(false);
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                        setApiHappening(false);
                    });
            }
        }
    };
    const handleRename = (event) => {
        event.stopPropagation();
        setEditing(true); // Set editing state to true
        handleOptionClose();
    };

    const handleInputChange = (event) => {
        event.stopPropagation();
        setFileName(event.target.value); // Update folderName state with input value
    };

    const handleInputKeyPress = (event) => {
        if (event.key === 'Enter') {
            // Check if Enter key is pressed
            handleInputBlur(); // Call handleInputBlur to update folder name
            setEditing(false);
        }
    };

    const handleInputBlur = async (event) => {
        if (fileName) {
            const nameChangedFolderData = folderData.map((file) => {
                if (file.props.id === id) {
                    return {
                        ...file,
                        props: {
                            ...file.props,
                            name: fileName,
                        },
                    };
                }
                return file;
            });
            setFolderData(nameChangedFolderData);
            let parentFolderNames;
            await axios
                .put(process.env.REACT_APP_API_URL + `${endpoint.collectionDirectory}/${userId}/${id}`, {
                    name: fileName,
                })
                .catch((error) => {
                    console.error('Error:', error);
                });

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
                .put(process.env.REACT_APP_API_URL + `${endpoint.collectionsRequest}/${userId}/${id}`, {
                    name: fileName,
                    modifiedAt: formattedDateTime,
                })
                .catch((error) => {
                    console.error('Error:', error);
                });

            await axios
                .get(process.env.REACT_APP_API_URL + endpoint.collectionDirectory + `/${userId}/${'file'}/${id}`)
                .then((response) => {
                    parentFolderNames = response['data'].result;
                    parentFolderNames = parentFolderNames.reverse();
                })
                .catch((err) => {
                    console.log(err);
                });
            setTabs((prev) => {
                const isTabExists = prev.some((tab) => tab.id === id);
                if (isTabExists) {
                    // If the tab already exists, update the existing tab with new data
                    return prev.map((tab) => {
                        if (tab.id === id) {
                            return {
                                ...tab,
                                parentFolderNames: parentFolderNames,
                                label: fileName,
                            };
                        }
                        return tab;
                    });
                } else {
                    return [...prev];
                }
            });

            if (selected.id === api.id)
                setBreadCrumbs((prev) => {
                    const newArray = [...prev];
                    if (newArray.length > 0) {
                        newArray[newArray.length - 1] = fileName;
                    }
                    return newArray;
                });
        } else {
            setFileName(name);
        }
    };
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (inputRef.current && !inputRef.current.contains(event.target)) {
                if (isMountedRef.current) {
                    setEditing(false);
                }
            }
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
            isMountedRef.current = false;
        };
    }, []);

    const fileClass = selected && selected.id === id ? classes.selectedFile : classes.root;
    let method, requestUrl;
    if (api.id === id) {
        method = request?.method && request.method;
        requestUrl = request?.url && request.url;
    } else {
        method = reqMethod ? reqMethod : 'GET';
        requestUrl = reqUrl ? reqUrl : null;
    }

    return loading ? (
        <LoadingDialog />
    ) : (
        <div className={fileClass}>
            <div
                onClick={saveModalOpen === true || isApiHappening === true ? null : handleSelect}
                className={classes.newfileClass}
                ref={inputRef}
            >
                <InsertDriveFileOutlinedIcon className={classes.fileIcon} />
                {editing === true ? (
                    <input
                        className={classes.renamingInputBox}
                        type="text"
                        value={fileName}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyPress={handleInputKeyPress} // Add onKeyPress event
                    />
                ) : requestUrl ? (
                    <Tooltip title={requestUrl ? requestUrl : null}>
                        <span className={classes.fileName}>{fileName}</span>
                    </Tooltip>
                ) : (
                    <span className={classes.fileName}>{fileName}</span>
                )}
            </div>
            <div style={{ display: 'flex' }}>
                <span
                    className={classes.fileName}
                    style={
                        method === 'GET'
                            ? { color: '#03C988', marginRight: 5 }
                            : method === 'POST'
                            ? { color: '#F29727', marginRight: 5 }
                            : method === 'DELETE'
                            ? { color: '#CD1818', marginRight: 5 }
                            : method === 'PATCH'
                            ? { color: '#4F709C', marginRight: 5 }
                            : method === 'PUT'
                            ? { color: '#5B8FF9', marginRight: 5 }
                            : null
                    }
                >
                    {method}
                </span>
            </div>
            {isModal === true ? null : alignment === 'folders' ? (
                <>
                    <Tooltip title="Options">
                        <IconButton
                            className={classes.iconButton}
                            onClick={(e) => {
                                onSelect({ type: 'file', id: id });
                                handleOptionClick(e);
                            }}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleOptionClose}>
                        <MenuItem onClick={handleRename} style={{ fontSize: '14px', fontWeight: 500 }}>
                            Rename
                        </MenuItem>
                        <MenuItem style={{ color: 'red', fontSize: '14px', fontWeight: 500 }} onClick={handleDelete}>
                            Delete
                        </MenuItem>
                    </Menu>
                </>
            ) : alignment === 'recent' ? (
                <Tooltip title="Remove">
                    <IconButton className={classes.iconButton} onClick={handleDialog}>
                        <Close fontSize="small" />
                    </IconButton>
                </Tooltip>
            ) : null}
        </div>
    );
}
