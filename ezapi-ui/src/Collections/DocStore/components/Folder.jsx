import { Menu, MenuItem } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import { makeStyles } from '@material-ui/core/styles';
import CreateNewFolderOutlinedIcon from '@material-ui/icons/CreateNewFolderOutlined';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import InsertDriveFileOutlinedIcon from '@material-ui/icons/InsertDriveFileOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { endpoint } from '../../../shared/network/client';
import { getUserId } from '../../../shared/storage';
import {
    collapsedState,
    currentApi,
    currentBreadCrumbs,
    currentTab,
    currentTabs,
    folderContentLoading,
    folderState,
    requestParams,
    responseInfo,
} from '../../CollectionsAtom';
import LoadingDialog from '../../components/LoadingDialog';
import File from './File';

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        alignItems: 'center',
        padding: '3px',
        cursor: 'pointer',
        minWidth: '12rem',
        paddingLeft: '5px',
        justifyContent: 'space-between',
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
    },
    folderIcon: {
        fontSize: '17px',
    },
    fileIcon: {
        fontSize: '17px',
    },
    deleteIcon: {
        fontSize: '17px',
    },
    folderOpenIcon: {
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
        paddingLeft: '5px',
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

export default function Folder({ id, parentId, onDelete, selected, onSelect, onRename, name, isModal, saveModalOpen }) {
    const classes = useStyles();
    const childComponents = useRecoilValue(folderState(id));
    const setChildComponents = useSetRecoilState(folderState(id));
    const setParentComponent = useSetRecoilState(folderState(parentId));
    const collapsed = useRecoilValue(collapsedState(id));
    const setCollapsed = useSetRecoilState(collapsedState(id));
    const [folderName, setFolderName] = useState(name);
    const [editing, setEditing] = useState(false); // Add editing state
    const userId = getUserId();
    const [anchorEl, setAnchorEl] = useState(null);
    const inputRef = useRef(null);
    const isMountedRef = useRef(true);
    const [tabs, setTabs] = useRecoilState(currentTabs);
    const setCurrentTab = useSetRecoilState(currentTab);
    const setRequest = useSetRecoilState(requestParams);
    const setResponse = useSetRecoilState(responseInfo);
    const setCurrentApi = useSetRecoilState(currentApi);
    const setBreadCrumbs = useSetRecoilState(currentBreadCrumbs);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useRecoilState(folderContentLoading);
    const handleOptionClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleOptionClose = () => {
        setAnchorEl(null);
    };
    const addFile = async () => {
        const parentId = id;
        const newId = uuidv4();
        const newFile = (
            <File
                key={newId}
                id={newId}
                reqMethod="GET"
                parentId={parentId}
                selected={selected}
                onSelect={onSelect}
                editable={true}
                name="New Request"
            /> // Pass onSelect prop to child components
        );
        setChildComponents([...childComponents, newFile]);

        const currentDate = new Date();
        const formattedDateTime = currentDate.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        await axios.post(process.env.REACT_APP_API_URL + endpoint.collectionDirectory, {
            userId: userId,
            id: newId,
            name: 'New Request',
            type: 'File',
            parentFolderId: parentId,
        });

        axios.post(process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}/${newId}`, {
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
            parentFolderId: parentId,
            isRecent: true,
            createdAt: formattedDateTime,
            modifiedAt: formattedDateTime,
        });
    };

    const addFolder = async () => {
        const newId = uuidv4();
        const parentId = id;
        const newFolder = (
            <Folder
                key={newId}
                id={newId}
                parentId={parentId}
                onDelete={deleteChild}
                selected={selected}
                onSelect={onSelect}
                onRename={onRename}
                editable={true}
                name="New Folder"
            />
        );

        await axios.post(process.env.REACT_APP_API_URL + endpoint.collectionDirectory, {
            userId: userId,
            id: newId,
            name: 'New Folder',
            type: 'Folder',
            parentFolderId: parentId,
        });

        setChildComponents([...childComponents, newFolder]);
    };

    const deleteChild = (childId) => {
        const newChildComponents = childComponents.filter((child) => child?.props.id !== childId);
        setChildComponents(newChildComponents);
        onDelete(childId);
    };

    const handleDelete = async () => {
        handleOptionClose();
        setLoading(true);
        await axios
            .delete(process.env.REACT_APP_API_URL + `${endpoint.collectionDirectory}/${userId}/${id}`)
            .then((response) => {
                // Remove objects with matching IDs
                const tabsToRemove = response['data'].requestFiles;
                const isCurrentTab = tabsToRemove.find((tab) => tab.id === currentApi.id);
                const updatedTabs = tabs.filter((obj) => !tabsToRemove.includes(obj.id));

                // Update the Recoil state with the updated array
                setTabs(updatedTabs);

                if (isCurrentTab) {
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
            });
        deleteChild(id);
        setLoading(false);
    };

    const toggleCollapsed = async (event) => {
        if (!collapsed === false) {
            setCollapsed(false);
            const type = selected.type;
            let requestFiles;
            if (childComponents.length > 0) {
                return;
            }
            try {
                const res1 = await axios.get(
                    process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}`,
                );
                requestFiles = res1.data;

                const response = await axios.get(
                    process.env.REACT_APP_API_URL + endpoint.collectionDirectory + `/${userId}/${type}/${id}`,
                );
                const children = response.data.data;
                const QchildComponents = children.map((child) => {
                    if (child.type === 'File') {
                        let reqFile = requestFiles.filter((file) => file.id === child.id);
                        let reqObject = reqFile[0]?.request;
                        return (
                            <File
                                key={child.id}
                                id={child.id}
                                parentId={child.parentFolderId}
                                onDelete={deleteChild}
                                selected={selected}
                                onSelect={onSelect}
                                name={child.name}
                                onRename={onRename}
                                reqMethod={reqObject ? reqObject.method : null}
                                reqUrl={reqObject ? reqObject.url : null}
                            />
                        );
                    } else if (child.type === 'Folder') {
                        return (
                            <Folder
                                key={child.id}
                                id={child.id}
                                parentId={child.parentFolderId}
                                onDelete={deleteChild}
                                selected={selected}
                                onSelect={onSelect}
                                name={child.name}
                                onRename={onRename}
                            />
                        );
                    }
                });

                setChildComponents(QchildComponents);
            } catch (error) {
                // Handle error
                console.log(error);
            }
        } else {
            setCollapsed(!collapsed);
        }
    };

    const handleSelect = async (event) => {
        event.stopPropagation();
        onSelect({ type: 'folder', id: id });
    };

    const handleRename = (event) => {
        event.stopPropagation();
        setEditing(true); // Set editing state to true
        handleOptionClose();
    };

    const handleInputChange = (event) => {
        event.stopPropagation();
        setFolderName(event.target.value); // Update folderName state with input value
    };

    const handleInputKeyPress = (event) => {
        if (event.key === 'Enter') {
            // Check if Enter key is pressed
            handleInputBlur(); // Call handleInputBlur to update folder name
            setEditing(false);
        }
    };

    const handleInputBlur = async () => {
        if (folderName) {
            setParentComponent((folderData) => {
                return folderData.map((data) => {
                    if (data.props.id === id) {
                        return {
                            ...data,
                            props: {
                                ...data.props,
                                name: folderName,
                            },
                        };
                    }
                    return data;
                });
            });
            if (parentId === '0') {
                setDataLoading(true);
                onRename(id, folderName);
                setDataLoading(false);
            }
            const folderData = {
                name: folderName,
            };

            await axios.put(
                process.env.REACT_APP_API_URL + `${endpoint.collectionDirectory}/${userId}/${id}`,
                folderData,
            );
        } else {
            setFolderName(name);
        }
    };

    const downloadJson = (data, filename) => {
        const jsonContent = JSON.stringify(data);
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonContent));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleExport = async () => {
        await axios
            .get(process.env.REACT_APP_API_URL + `${endpoint.collectionDirectory}/${userId}/${id}`)
            .then((response) => {
                downloadJson(response['data'].exportData, `conektto_collection_${name}.json`);
            });

        handleOptionClose();
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

    const fileClass = id === selected.id ? classes.selectedFile : classes.root;

    return loading ? (
        <LoadingDialog />
    ) : (
        <div onClick={isModal === false && saveModalOpen === true ? null : handleSelect} ref={inputRef}>
            <div onClick={saveModalOpen === true ? null : handleSelect} className={fileClass} ref={inputRef}>
                <div className={classes.newfileClass} onClick={editing === false ? toggleCollapsed : null}>
                    {collapsed === true && (editing === true || editing === false) ? (
                        <FolderIcon className={classes.folderIcon} />
                    ) : (
                        <FolderOpenIcon className={classes.folderOpenIcon} />
                    )}
                    {editing === true ? (
                        <input
                            className={classes.renamingInputBox}
                            type="text"
                            value={folderName}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            onKeyPress={handleInputKeyPress} // Add onKeyPress event
                        />
                    ) : (
                        <span className={classes.fileName}>{folderName}</span>
                    )}
                </div>

                {isModal === false ? (
                    <div className={classes.icons}>
                        <Tooltip title="Add Request">
                            <IconButton className={classes.iconButton} onClick={addFile}>
                                <InsertDriveFileOutlinedIcon className={classes.fileIcon} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Add Folder">
                            <IconButton className={classes.iconButton} onClick={addFolder}>
                                <CreateNewFolderOutlinedIcon className={classes.folderIcon} />
                            </IconButton>
                        </Tooltip>
                        <>
                            <Tooltip title="Options">
                                <IconButton className={classes.iconButton} onClick={handleOptionClick}>
                                    <MoreVertIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleOptionClose}>
                                <MenuItem onClick={handleRename} style={{ fontSize: '14px', fontWeight: 500 }}>
                                    Rename
                                </MenuItem>
                                {parentId === '0' ? (
                                    <MenuItem onClick={handleExport} style={{ fontSize: '14px', fontWeight: 500 }}>
                                        Export
                                    </MenuItem>
                                ) : null}
                                <MenuItem
                                    style={{ color: 'red', fontSize: '14px', fontWeight: 500 }}
                                    onClick={handleDelete}
                                >
                                    Delete
                                </MenuItem>
                            </Menu>
                        </>
                    </div>
                ) : (
                    <div className={classes.icons}>
                        <Tooltip title="Add Folder">
                            <IconButton className={classes.iconButton} onClick={addFolder}>
                                <CreateNewFolderOutlinedIcon className={classes.folderIcon} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Rename">
                            <IconButton className={classes.iconButton} onClick={handleRename}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton className={classes.iconButton} onClick={handleDelete}>
                                <DeleteIcon style={{ color: 'crimson' }} fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </div>
                )}
            </div>
            {collapsed === true && (editing === true || editing === false) ? null : (
                <div style={{ paddingLeft: '20px' }}>
                    {dataLoading ? (
                        <ThreeDots height="20" width="20" color="grey" visible={true} />
                    ) : (
                        childComponents &&
                        childComponents.map((component) => {
                            if (component) {
                                return (
                                    <div key={component.props.id}>
                                        {React.cloneElement(component, {
                                            onDelete: deleteChild,
                                            onSelect: onSelect,
                                            selected: selected,
                                            onRename: onRename,
                                            isModal: isModal,
                                            saveModalOpen: saveModalOpen,
                                        })}
                                    </div>
                                );
                            } else {
                                return null;
                            }
                        })
                    )}
                </div>
            )}
        </div>
    );
}
