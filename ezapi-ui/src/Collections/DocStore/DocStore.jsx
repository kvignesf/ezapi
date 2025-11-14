import { Tooltip, styled } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import WorkHistoryOutlinedIcon from '@mui/icons-material/WorkHistoryOutlined';
import { Button, Input, InputAdornment } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { useHistory } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { PrimaryButton } from '../../shared/components/AppButton';
import AppIcon from '../../shared/components/AppIcon';
import { endpoint } from '../../shared/network/client';
import routes from '../../shared/routes';
import { getUserId } from '../../shared/storage';
import imageLogo from '../../static/images/logo/newconnectoLogo.svg';
import {
    folderContentLoading,
    isSaveModalOpen,
    requestName,
    rootFolderIdAtom,
    selectedType,
    toggle,
} from '../CollectionsAtom';
import LoadingDialog from '../components/LoadingDialog';
import File from './components/File';
import Folder from './components/Folder';
import RecentHistory from './components/RecentHistory';

const useStyles = makeStyles((theme) => ({
    app: {
        height: '100vh',
        overflow: 'hidden',
    },
    main: {
        height: '100vh',
        overflow: 'auto',
        '&::-webkit-scrollbar': {
            width: '5px',
            height: '0px',
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
    searchBar: {
        border: '1px solid #E6E7E5',
        borderRadius: '4px',
        outline: 'none',
        marginLeft: '5px',
        marginRight: '8px',
        background: 'transparent',
        width: '100%',
        height: '30px',
        padding: '5px 10px',
        boxSizing: 'border-box',
        color: '#000',
        marginBottom: '10px',
        marginTop: '-8px',
    },
}));

export default function DocStore({ isModal }) {
    const history = useHistory();
    const navigateBack = () => {
        history.replace({
            pathname: routes.projects,
            state: { allow: true },
        });
    };
    const classes = useStyles();
    let [folders, setFolders] = useRecoilState(rootFolderIdAtom);
    let [requests, setRequests] = useState([]);
    const [fileName, setFileName] = useRecoilState(requestName);
    const [searchQuery, setSearchQuery] = useState('');
    let [filteredFiles, setFilteredFiles] = useState([]);
    const [selected, setSelected] = useRecoilState(selectedType); // Add selected state variable
    const saveModalOpen = useRecoilValue(isSaveModalOpen);
    const [loading, setLoading] = useState(false);
    const userId = getUserId();
    //Import Dialog box components
    const [open, setOpen] = useState(false);
    const [postOpen, setPostOpen] = useState(false);
    const [connectOpen, setConnectOpen] = useState(false);
    const [file, setFile] = useState(null);
    const [alignment, setAlignment] = useRecoilState(toggle);
    const dataLoading = useRecoilValue(folderContentLoading);

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const handleToggle = (event, newAlignment) => {
        setAlignment(newAlignment);
    };

    const addFolder = async () => {
        const newId = uuidv4();
        const newFolder = (
            <Folder
                key={newId}
                id={newId}
                parentId={'0'}
                onDelete={handleDelete}
                selected={selected}
                onSelect={setSelected}
                onRename={handleRename}
                editable={true}
                name="New Collection"
            /> // Pass onSelect prop to child components
        );
        await axios
            .post(process.env.REACT_APP_API_URL + endpoint.collectionDirectory, {
                userId: userId,
                id: newId,
                name: 'New Collection',
                type: 'Collection',
                parentFolderId: '0',
            })
            .catch((error) => {
                // Handle error
                console.error('Error:', error);
            });
        setFolders([...folders, newFolder]);
    };

    const deleteChild = (childId) => {
        folders = folders.filter((child) => child.props.id !== childId);
        setFolders(folders);
        if (searchQuery.length > 0) {
            requests = requests.filter((child) => child.props.id !== childId);
            setRequests(requests);
            filteredFiles = filteredFiles.filter((child) => child.props.id !== childId);
            setFilteredFiles(filteredFiles);
        }
    };

    const handleDelete = async (componentId) => {
        deleteChild(componentId);
        setSelected({
            type: '',
            id: '',
        }); // Clear selected if the selected component is deleted
    };
    const handleRename = (id, newName) => {
        setFolders((folderData) => {
            return folderData.map((data) => {
                if (data.props.id === id) {
                    return {
                        ...data,
                        props: {
                            ...data.props,
                            name: newName,
                        },
                    };
                }
                return data;
            });
        });
    };

    useEffect(() => {
        let source = axios.CancelToken.source(); // Create a cancel token source
        const getFilesAndFolders = async () => {
            if (loading === false) {
                try {
                    const response1 = await axios.get(
                        process.env.REACT_APP_API_URL + endpoint.collectionDirectory + `/${userId}`,
                        {
                            cancelToken: source.token, // Pass the cancel token to the request
                        },
                    );
                    const parentFolders = response1.data.data.map((data) => (
                        <Folder key={data.id} id={data.id} parentId={'0'} name={data.name} />
                    ));
                    setFolders(parentFolders);

                    const requests = response1.data.files.map((data) => (
                        <File key={data.id} id={data.id} parentId={'0'} name={data.name} />
                    ));
                    setRequests(requests);
                } catch (error) {
                    if (axios.isCancel(error)) {
                        // Handle request cancellation
                        console.log('Request canceled:', error.message);
                    } else {
                        // Handle other errors
                        console.error(error);
                    }
                }
            }
        };

        getFilesAndFolders();

        // Cleanup function
        return () => {
            source.cancel(); // Cancel the request when the component is unmounted
        };
    }, [loading, userId]);
    const handleSearchChange = (event) => {
        const query = event.target.value;
        setSearchQuery(query);

        // Filter the data based on the search query
        const filtered = requests.filter((item) => item.props.name.toLowerCase().includes(query.toLowerCase()));
        setFilteredFiles(filtered);
    };

    const handleClickOpen = () => {
        setConnectOpen(false);
        setPostOpen(false);
        setFile(null);
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    const handlePostOpen = () => {
        setPostOpen(!postOpen);
    };

    const hanldePostFile = (event) => {
        if (file) {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onloadend = async (e) => {
                setLoading(true);
                const contents = e.target.result;
                const jsonData = JSON.parse(contents);

                // Extract the name from the "info" object
                const collectionName = jsonData?.info?.name ? jsonData.info.name : 'New Collection';

                // Assign the extracted name to the top-level "name" property
                jsonData.name = collectionName;
                // Remove unnecessary properties from the "info" object
                delete jsonData.info;
                // Modify the root-level property name from "item" to "items"
                jsonData.items = jsonData.item;
                delete jsonData.item;

                // Modify the property names to match the required structure recursively
                function modifyRequests(item) {
                    item.response = {};
                    if (item.request) {
                        if (item.name === item.request?.raw) {
                            item.name = 'New Request';
                        }
                        const request = item.request;
                        const url = request?.url;

                        // Retain only the "raw" URL and remove "host" and "path" details
                        request.url = url?.raw;
                        delete url?.host;
                        delete url?.path;
                    }
                    if (item.item) {
                        // Change the property name from "item" to "items"
                        item.items = item.item;
                        delete item.item;
                    }

                    if (item.items && item.items.length > 0) {
                        item.items.forEach(modifyRequests);
                    }
                }

                jsonData?.items?.forEach(modifyRequests);
                setOpen(false);
                await axios
                    .post(process.env.REACT_APP_API_URL + endpoint.collectionDirectory + '/upload', {
                        jsonData,
                        userId,
                    })
                    .catch((error) => {
                        console.error('Error uploading file:', error);
                        // Handle the error if needed
                    });
                setLoading(false);
            };
        }
        setFile(null);
    };

    const hanldeConnectFile = (event) => {
        if (file) {
            setLoading(true);
            const reader = new FileReader();
            reader.onload = async (e) => {
                const contents = e.target.result;
                const jsonData = JSON.parse(contents);
                setOpen(false);
                await axios
                    .post(process.env.REACT_APP_API_URL + endpoint.collectionDirectory + '/upload', {
                        jsonData,
                        userId,
                    })
                    .catch((error) => {
                        console.error('Error uploading file:', error);
                        // Handle the error if needed
                    });
                setLoading(false);
            };
            reader.readAsText(file);
        }
        setFile(null);
    };

    const handleConnectOpen = () => {
        setConnectOpen(!connectOpen);
    };

    const handleChange = (event) => {
        if (event.target.files[0]) {
            setFile(null);
            const file = event.target.files[0];
            setFile(file);
        }
    };
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey) {
                if (event.key === 'i') {
                    event.preventDefault(); // Prevent browser's default Save dialog
                    // Call your function here
                    handleClickOpen();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
    return (
        <div className={classes.app}>
            {loading && <LoadingDialog />}
            {isModal === false ? (
                <div className="flex flex-row py-2 justify-between m-2 items-center">
                    <div className="flex flex-row justify-between  items-center">
                        <AppIcon
                            style={{ marginRight: '1rem', color: 'black' }}
                            onClick={() => {
                                navigateBack();
                            }}
                        >
                            <ArrowBackIcon />
                        </AppIcon>
                        <div className="w-full flex flex-row">
                            <img
                                src={imageLogo}
                                alt="conektto logo"
                                className="p-1"
                                style={{ maxWidth: '128px', maxHeight: '40px' }}
                            />
                        </div>
                    </div>
                    <ToggleButtonGroup color="primary" value={alignment} size="small" exclusive onChange={handleToggle}>
                        <ToggleButton value="folders">
                            <Tooltip title="Collections">
                                <Inventory2OutlinedIcon fontSize="small" />
                            </Tooltip>
                        </ToggleButton>

                        <ToggleButton value="recent">
                            <Tooltip title="Recent History">
                                <WorkHistoryOutlinedIcon fontSize="small" />
                            </Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>
                    <div>
                        <label
                            for="specs"
                            className="bg-black
            opacity-90  rounded px-2 py-1 text-white text-smallLabel cursor-pointer"
                            onClick={handleClickOpen}
                            style={alignment !== 'folders' ? { visibility: 'hidden' } : null}
                        >
                            Import
                        </label>
                        <BootstrapDialog onClose={handleClose} aria-labelledby="customized-dialog-title" open={open}>
                            <BootstrapDialogTitle id="customized-dialog-title" onClose={handleClose}>
                                Import
                            </BootstrapDialogTitle>
                            <DialogContent dividers>
                                {!connectOpen ? (
                                    <Typography
                                        gutterBottom
                                        sx={{
                                            margin: '15px',
                                            padding: '5px',
                                            display: !postOpen ? 'hidden' : 'none',
                                        }}
                                    >
                                        <PrimaryButton onClick={handleConnectOpen}>Import from Conektto</PrimaryButton>
                                    </Typography>
                                ) : (
                                    <Typography
                                        sx={{
                                            margin: '0px 20px',
                                            padding: '15px',
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                                <label
                                                    for="specs"
                                                    className={`bg-brand-secondary  ${
                                                        file ? 'opacity-40' : 'hover:opacity-90'
                                                    }  rounded-md px-4 py-2 text-white text-mediumLabel`}
                                                    style={file ? { display: 'none' } : { display: 'block' }}
                                                >
                                                    Upload
                                                </label>
                                                <p style={{ margin: '10px', display: file ? 'none' : 'block' }}>
                                                    Upload File
                                                </p>
                                            </div>

                                            <input
                                                id="specs"
                                                type="file"
                                                accept=".json"
                                                hidden
                                                onChange={handleChange}
                                                disabled={file}
                                            />

                                            <div>
                                                <ul>
                                                    {file ? (
                                                        <li key={file.name}>
                                                            <div className="rounded-md border bg-neutral-gray7 p-2 mb-4 flex flex-row items-center justify-between">
                                                                <p className="text-overline2">
                                                                    {file.name} {Math.round(file.size / 1024)} KB
                                                                </p>
                                                            </div>
                                                        </li>
                                                    ) : null}
                                                </ul>
                                            </div>
                                            {file ? (
                                                <PrimaryButton onClick={hanldeConnectFile}>Import</PrimaryButton>
                                            ) : null}
                                        </div>
                                    </Typography>
                                )}
                                {!postOpen ? (
                                    <Typography
                                        gutterBottom
                                        sx={{
                                            margin: '15px',
                                            padding: '5px',
                                            display: !connectOpen ? 'hidden' : 'none',
                                        }}
                                    >
                                        <PrimaryButton onClick={handlePostOpen}>Import from PostMan</PrimaryButton>
                                    </Typography>
                                ) : (
                                    <Typography
                                        sx={{
                                            margin: '0px 20px',
                                            padding: '15px',
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                                <label
                                                    for="specs"
                                                    className={`bg-brand-secondary  ${
                                                        file ? 'opacity-40' : 'hover:opacity-90'
                                                    }  rounded-md px-4 py-2 text-white text-mediumLabel`}
                                                    style={file ? { display: 'none' } : { display: 'block' }}
                                                >
                                                    Upload
                                                </label>
                                                <p style={{ margin: '10px', display: file ? 'none' : 'block' }}>
                                                    Upload File
                                                </p>
                                            </div>

                                            <input
                                                id="specs"
                                                type="file"
                                                accept=".json"
                                                hidden
                                                onChange={handleChange}
                                                disabled={file}
                                            />

                                            <div>
                                                <ul>
                                                    {file ? (
                                                        <li key={file.name}>
                                                            <div className="rounded-md border bg-neutral-gray7 p-2 mb-4 flex flex-row items-center justify-between">
                                                                <p className="text-overline2">
                                                                    {file.name} {Math.round(file.size / 1024)} KB
                                                                </p>
                                                            </div>
                                                        </li>
                                                    ) : null}
                                                </ul>
                                            </div>
                                            {file ? (
                                                <PrimaryButton onClick={hanldePostFile}>Import</PrimaryButton>
                                            ) : null}
                                        </div>
                                    </Typography>
                                )}
                            </DialogContent>
                        </BootstrapDialog>
                    </div>
                </div>
            ) : null}
            {alignment === 'recent' && isModal === false ? <RecentHistory /> : null}
            {alignment === 'folders' || isModal === true ? (
                <div>
                    <div className="flex flex-row  justify-between mb-2 items-center border-b-1 border-gray-200">
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon fontSize="small" sx={{ marginRight: '-6px', marginLeft: '-10px' }} />}
                            sx={{ textTransform: 'none' }}
                            onClick={addFolder}
                            style={{
                                marginBottom: '10px',
                                background: 'transparent',
                                color: 'black',
                                height: '30px',
                                border: '1px solid #E6E7E5',
                                fontSize: '13px',
                                display: 'flex',
                                justifyContent: 'flex-start',
                                alignItems: 'center',
                                marginTop: isModal ? '0px' : '-8px',
                                marginLeft: '5px',
                            }}
                        >
                            New
                        </Button>
                        {isModal === false ? (
                            <Input
                                type="text"
                                placeholder="Search Request"
                                className={classes.searchBar}
                                style={{ fontWeight: 500, fontSize: '13px' }}
                                value={searchQuery}
                                onChange={handleSearchChange}
                                endAdornment={
                                    <InputAdornment position="end">
                                        {searchQuery && (
                                            <IconButton onClick={handleClearSearch}>
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </InputAdornment>
                                }
                            />
                        ) : (
                            <input
                                type="text"
                                placeholder="Enter the Request Name & Select the folder"
                                style={{
                                    marginTop: isModal ? '0px' : '-8px',
                                }}
                                className={classes.searchBar}
                                onChange={(e) => setFileName(e.target.value)}
                            />
                        )}
                    </div>
                    <div className={classes.main}>
                        {searchQuery.length > 0 ? (
                            filteredFiles.map((request) => (
                                <div key={request.props.id}>
                                    {React.cloneElement(request, {
                                        onDelete: handleDelete,
                                        onSelect: setSelected,
                                        selected: selected,
                                        onRename: handleRename,
                                    })}
                                </div>
                            ))
                        ) : dataLoading ? (
                            <ThreeDots height="20" width="20" color="grey" visible={true} />
                        ) : (
                            folders &&
                            folders.map((folder) => (
                                <div key={folder.props.id}>
                                    {React.cloneElement(folder, {
                                        onDelete: handleDelete,
                                        onSelect: setSelected,
                                        selected: selected,
                                        onRename: handleRename,
                                        parentId: '0',
                                        isModal: isModal,
                                        saveModalOpen: saveModalOpen,
                                    })}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

function BootstrapDialogTitle(props) {
    const { children, onClose, ...other } = props;

    return (
        <DialogTitle {...other}>
            {children}
            {onClose ? (
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            ) : null}
        </DialogTitle>
    );
}
