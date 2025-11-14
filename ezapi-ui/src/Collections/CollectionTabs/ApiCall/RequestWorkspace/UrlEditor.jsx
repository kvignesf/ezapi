import File from '@/Collections/DocStore/components/File';
import LoadingDialog from '@/Collections/components/LoadingDialog';
import {
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    Input,
    Menu,
    MenuItem,
    Select,
    Snackbar,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import SaveOutlinedIcon from '@material-ui/icons/SaveOutlined';
import SendIcon from '@material-ui/icons/Send';
import MuiAlert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import axios from 'axios';
import { useState } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { endpoint } from '../../../../shared/network/client';
import { getUserId } from '../../../../shared/storage';
import {
    currentApi,
    currentBreadCrumbs,
    currentTab,
    currentTabs,
    folderContentLoading,
    folderState,
    isSaveModalOpen,
    requestName,
    requestParams,
    responseInfo,
    selectedType,
} from '../../../CollectionsAtom';
import DocStore from '../../../DocStore/DocStore';

const requestMethods = [
    {
        slug: 'get',
        method: 'GET',
    },
    {
        slug: 'post',
        method: 'POST',
    },
    {
        slug: 'put',
        method: 'PUT',
    },
    {
        slug: 'patch',
        method: 'PATCH',
    },
    {
        slug: 'delete',
        method: 'DELETE',
    },
];

const useStyles = (api) =>
    makeStyles((theme) => ({
        formControl: {
            margin: theme.spacing(1),
            minWidth: 100,
        },
        input: {
            flex: 1,
            marginLeft: theme.spacing(1),
            marginRight: theme.spacing(1),
            border: '1px solid #e6e6e6',
            borderRadius: '4px',
            padding: '8px 12px', // reduce the padding on the top and bottom
            fontSize: '14px',
            height: '35px',
        },
        button: {
            marginLeft: theme.spacing(1),
            marginRight: theme.spacing(1),
            padding: '8px 16px', // reduce the padding on the top and bottom
            fontSize: '14px',
            fontWeight: 600,
            height: '45px',
            textTransform: 'none',
            boxShadow: 'none',
        },

        modalButton: {
            margin: theme.spacing(1),
            padding: '5px 12px', // reduce the padding on the top and bottom
            fontSize: '12px',
            fontWeight: 600,
            height: '33px',
            boxShadow: 'none',
        },
        label: {
            fontSize: '12px',
            padding: '2px 4px',
            marginTop: '-5px',
        },
        select: {
            fontSize: '13px',
            padding: '8px',
            height: '35px',
            fontWeight: 400,
            marginTop: '-7px',
        },
        sendButton: {
            marginLeft: theme.spacing(1),
            marginRight: theme.spacing(1),
            padding: '8px 16px', // reduce the padding on the top and bottom
            fontSize: '14px',
            fontWeight: 600,
            height: '45px',
            textTransform: 'none',
            boxShadow: 'none',
            width: '100px',
            height: '35px',
            fontSize: '14px',
            fontWeight: 500,
        },
        cancel: {
            backgroundColor: 'black',
            color: 'white',
            '&:hover': {
                backgroundColor: 'black',
            },
        },
        saveButton: {
            marginLeft: theme.spacing(1),
            marginRight: api.onSave === true ? null : theme.spacing(1),
            padding: '8px 16px',
            paddingRight: api.onSave === true ? 0 : null,
            fontWeight: 600,
            height: '45px',
            textTransform: 'none',
            width: '90px',
            height: '35px',
            fontSize: '14px',
            fontWeight: 500,
            backgroundColor: 'black',
            boxShadow: 'none',
            color: 'white',
            '&:hover': {
                backgroundColor: 'black',
            },
        },
        saveAsButton: {
            height: '35px',
            fontSize: '14px',
            marginRight: theme.spacing(1.5),
            width: '30px',
            paddingLeft: 0,
            fontWeight: 500,
            backgroundColor: 'black',
            borderRadius: '0 4px 4px 0',
            color: 'white',
            '&:hover': {
                backgroundColor: 'black',
            },
        },
    }));

export default function UrlEditor({ onInputSend, loading }) {
    const [request, setRequest] = useRecoilState(requestParams);
    const [response, setResponse] = useRecoilState(responseInfo);
    const selected = useRecoilValue(selectedType);
    const [open, setOpen] = useRecoilState(isSaveModalOpen);
    const userId = getUserId();
    let [tabs, setTabs] = useRecoilState(currentTabs);
    const currenttab = useRecoilValue(currentTab);
    const [api, setCurrentApi] = useRecoilState(currentApi);
    const classes = useStyles(api)();
    const setBreadCrumbs = useSetRecoilState(currentBreadCrumbs);
    const [checked, setChecked] = useState(false);
    const [folderLoading, setFolderLoading] = useRecoilState(folderContentLoading);
    const [fileName, setFileName] = useRecoilState(requestName);
    const [anchorEl, setAnchorEl] = useState(null);
    const [snackbar, setSnackbar] = useState(false);
    const setFolderData = useSetRecoilState(folderState(api.parentFolderId));
    const setSaveFolder = useSetRecoilState(folderState(selected.id));
    const handleCheckChange = (event) => {
        setChecked(event.target.checked);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setRequest((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };
    const handleSendClick = async (event) => {
        onInputSend(event);
    };
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const SaveCurrent = async () => {
        if (
            JSON.stringify(request) !== JSON.stringify(tabs[currenttab]?.request) ||
            JSON.stringify(response) !== JSON.stringify(tabs[currenttab]?.response)
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
                .put(process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}/${api.id}`, {
                    request: request
                        ? request
                        : { method: 'GET', proxy: 'No Proxy', url: '', body: { '': '' }, header: [], queryParams: [] },
                    response: response ? response : { status: null, headers: {}, data: {}, time: 0, size: 0 },
                    parentFolderId: api.parentFolderId,
                    name: fileName ? fileName : 'New Request',
                    onSave: true,
                    modifiedAt: formattedDateTime,
                })
                .then(() => {
                    setSnackbar(true);
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
                    console.log(error);
                });
        }
    };

    const handleSave = async (event) => {
        const newId = uuidv4();
        if (checked) {
            setFolderLoading(true);
            if (selected.id) {
                const type = 'file';
                let parentFolderNames;
                await axios.post(process.env.REACT_APP_API_URL + endpoint.collectionDirectory, {
                    userId: userId,
                    id: newId,
                    name: fileName ? fileName : 'New Request',
                    type: 'File',
                    parentFolderId: selected.id,
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
                    .post(process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}/${newId}`, {
                        name: fileName ? fileName : 'New Request',
                        request: request
                            ? request
                            : {
                                  method: 'GET',
                                  proxy: 'No Proxy',
                                  url: '',
                                  body: { '': '' },
                                  header: [],
                                  queryParams: [],
                              },
                        response: response ? response : { status: null, headers: {}, data: {}, time: 0, size: 0 },
                        onSave: true,
                        parentFolderId: selected.id,
                        createdAt: formattedDateTime,
                        modifiedAt: formattedDateTime,
                    })
                    .then(() => {
                        setSnackbar(true);
                    })
                    .catch((error) => {
                        console.log(error);
                    });
                await axios
                    .get(process.env.REACT_APP_API_URL + endpoint.collectionDirectory + `/${userId}/${type}/${newId}`)
                    .then((response) => {
                        parentFolderNames = response['data'].result;
                        parentFolderNames = parentFolderNames.reverse();
                    })
                    .catch((err) => {
                        console.log(err);
                    });

                await axios
                    .get(process.env.REACT_APP_API_URL + `${endpoint.collectionsRequest}/${userId}/${newId}`)
                    .then(async (response) => {
                        const data = response.data;
                        setTabs((prev) => {
                            return prev.map((tab, index) => {
                                if (index === currenttab) {
                                    // Modify the object at the target index
                                    return {
                                        ...tab,
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
                                    };
                                }
                                // For other indices, return the tab object as is
                                return tab;
                            });
                        });

                        setRequest(data.request);
                        setResponse(data.response);
                        setCurrentApi({
                            id: data.id,
                            name: data.name,
                            onSave: data.onSave,
                            type: 'file',
                            parentFolderId: data.parentFolderId,
                        });
                        setBreadCrumbs(parentFolderNames);
                    });
            }
            setSaveFolder((folderData) => {
                return [
                    ...folderData,
                    <File
                        key={newId}
                        id={newId}
                        parentId={selected.id}
                        selected={selected}
                        onSelect={selected}
                        name={fileName}
                        reqMethod={request.method ? request.method : 'GET'}
                        reqUrl={request.url ? request.url : ''}
                    />,
                ];
            });
            setFileName('');
            setFolderLoading(false);
            setOpen(false);
        } else {
            setFolderLoading(true);
            if (api.parentFolderId === '0') {
                await axios
                    .post(process.env.REACT_APP_API_URL + endpoint.collectionDirectory, {
                        userId: userId,
                        id: api.id,
                        name: fileName ? fileName : 'New Request',
                        type: 'File',
                        parentFolderId: selected.id,
                    })
                    .then(() => {
                        setSaveFolder((folderData) => {
                            return [
                                ...folderData,
                                <File
                                    key={api.id}
                                    id={api.id}
                                    parentId={selected.id}
                                    selected={selected}
                                    onSelect={selected}
                                    name={fileName}
                                    reqMethod={request.method ? request.method : 'GET'}
                                    reqUrl={request.url ? request.url : ''}
                                />,
                            ];
                        });
                    });
            } else {
                await axios
                    .put(process.env.REACT_APP_API_URL + endpoint.collectionDirectory + `/${userId}/${api.id}`, {
                        name: fileName ? fileName : 'New Request',
                        parentFolderId: selected.id,
                    })
                    .then(() => {
                        setFolderData((folderData) => {
                            return folderData.filter((file) => file.props.id !== api.id);
                        });
                        setSaveFolder((folderData) => {
                            return [
                                ...folderData,
                                <File
                                    key={api.id}
                                    id={api.id}
                                    parentId={selected.id}
                                    selected={selected}
                                    onSelect={selected}
                                    name={fileName}
                                    reqMethod={request.method ? request.method : 'GET'}
                                    reqUrl={request.url ? request.url : ''}
                                />,
                            ];
                        });
                    });
            }
            const type = 'file';
            let parentFolderNames;
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
                .get(process.env.REACT_APP_API_URL + endpoint.collectionDirectory + `/${userId}/${type}/${api.id}`)
                .then((response) => {
                    parentFolderNames = response['data'].result;
                    parentFolderNames = parentFolderNames.reverse();
                })
                .catch((err) => {
                    console.log(err);
                });
            await axios
                .put(process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}/${api.id}`, {
                    request: request
                        ? request
                        : { method: 'GET', proxy: 'No Proxy', url: '', body: { '': '' }, header: [], queryParams: [] },
                    response: response ? response : { status: null, headers: {}, data: {}, time: 0, size: 0 },
                    parentFolderId: selected.id,
                    name: fileName ? fileName : 'New Request',
                    onSave: true,
                    modifiedAt: formattedDateTime,
                })
                .then((response) => {
                    setSnackbar(true);
                    const data = response.data;
                    setTabs((prev) => {
                        return prev.map((tab, index) => {
                            if (index === currenttab) {
                                // Modify the object at the target index
                                return {
                                    ...tab,
                                    id: data.id,
                                    parentFolderNames: parentFolderNames,
                                    request: data.request,
                                    response: data.response,
                                    label: data.name,
                                    onSave: data.onSave,
                                    type: 'file',
                                };
                            }
                            // For other indices, return the tab object as is
                            return tab;
                        });
                    });
                    setRequest(data.request);
                    setResponse(data.response);
                    setCurrentApi({
                        id: data.id,
                        name: data.name,
                        onSave: data.onSave,
                        type: 'file',
                        parentFolderId: data.parentFolderId,
                    });
                    setBreadCrumbs(parentFolderNames);
                })
                .catch((error) => {
                    console.log(error);
                });

            setFileName('');
            setFolderLoading(false);
            setOpen(false);
        }
    };

    const handleSaveClickOpen = () => {
        setAnchorEl(null);
        setOpen(true);
    };
    const handleSaveClose = () => {
        setOpen(false);
    };

    const handleKeyPress = (event) => {
        if (event.keyCode === 13) {
            // Call your function here
            handleSendClick(event);
        }
    };

    return (
        <div>
            <form className="flex">
                <FormControl variant="outlined" className={classes.formControl}>
                    <Select
                        className={classes.select}
                        labelId="req-method-label"
                        id="req-method-select"
                        value={request.method}
                        onChange={handleChange}
                        variant="outlined"
                        name="method"
                    >
                        {requestMethods.map((option) => (
                            <MenuItem key={option.slug} value={option.method}>
                                {option.method}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Input
                    className={classes.input}
                    placeholder="URL"
                    value={request.url}
                    onChange={handleChange}
                    inputProps={{
                        'aria-label': 'URL',
                    }}
                    name="url"
                    onKeyUp={handleKeyPress}
                />
                <Button
                    className={classes.sendButton}
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={loading ? null : <SendIcon />}
                    onClick={handleSendClick}
                    disabled={loading}
                    style={{ color: loading && 'white', backgroundColor: loading && '#C61870' }}
                >
                    {loading ? 'Sending...' : 'Send'}
                </Button>
                <Button
                    className={classes.saveButton}
                    variant="contained"
                    color="grey"
                    size="small"
                    startIcon={<SaveOutlinedIcon />}
                    disabled={loading}
                    onClick={api.onSave === true ? SaveCurrent : handleSaveClickOpen}
                    style={{
                        borderRadius: api.onSave === true ? '4px 0 0 4px' : '4px',
                        color: loading && 'white',
                        backgroundColor: loading && '#0D0D0D',
                    }}
                >
                    Save
                </Button>
                {api.onSave === true ? (
                    <>
                        <button type="button" className={classes.saveAsButton} onClick={handleClick} disabled={loading}>
                            <ArrowDropDownIcon style={{ margin: 0, padding: 0 }} />
                        </button>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleCloseMenu}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                        >
                            <MenuItem onClick={handleSaveClickOpen}>Save As</MenuItem>
                        </Menu>
                    </>
                ) : null}
            </form>
            <Dialog
                open={open}
                onClose={handleSaveClose}
                scroll={'paper'}
                aria-labelledby="scroll-dialog-title"
                aria-describedby="scroll-dialog-description"
            >
                <DialogTitle id="scroll-dialog-title">Save Request</DialogTitle>
                <DialogContent dividers style={{ height: '60vh', width: '37rem', overflow: 'hidden' }}>
                    <DocStore isModal={true} />
                </DialogContent>
                <DialogActions style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {api.parentFolderId === '0' ? (
                        <div></div>
                    ) : (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={checked}
                                    onChange={handleCheckChange}
                                    inputProps={{ 'aria-label': 'controlled' }}
                                />
                            }
                            label={<span style={{ fontWeight: 500, fontSize: '15px' }}>Save a Copy</span>}
                        />
                    )}

                    <div>
                        <Button
                            className={`${classes.modalButton} ${classes.cancel}`}
                            variant="contained"
                            color="grey"
                            size="small"
                            onClick={handleSaveClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            className={`${classes.modalButton}`}
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={handleSave}
                            disabled={fileName.length > 0 && selected.type === 'folder' ? false : true}
                        >
                            Save
                        </Button>
                    </div>
                </DialogActions>
            </Dialog>
            {folderLoading && <LoadingDialog />}
            <Snackbar open={snackbar} autoHideDuration={1800} onClose={() => setSnackbar(false)}>
                <MuiAlert
                    onClose={() => setSnackbar(false)}
                    elevation={6}
                    severity="info"
                    sx={{
                        width: '100%',
                        alignItems: 'center',
                        backgroundColor: '#2c71c7', // Set the background color to #2c71c7
                    }}
                    variant="filled"
                    icon={false}
                >
                    Request Saved!
                </MuiAlert>
            </Snackbar>
        </div>
    );
}
