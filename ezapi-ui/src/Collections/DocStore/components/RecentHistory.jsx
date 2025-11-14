import { makeStyles } from '@material-ui/core/styles';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { endpoint } from '../../../shared/network/client';
import { getUserId } from '../../../shared/storage';
import {
    currentApi,
    currentBreadCrumbs,
    currentTab,
    currentTabs,
    isSaveModalOpen,
    requestParams,
    responseInfo,
    selectedType,
} from '../../CollectionsAtom';
import File from './File';
const useStyles = makeStyles((theme) => ({
    heading: {
        color: 'grey',
        fontSize: '14px',
        fontWeight: 600,
        fontStyle: 'italic',
        marginTop: '10px',
        marginBottom: '5px',
        marginLeft: '5px',
    },
    heading1: {
        color: '#2C71C7',
        fontSize: '16px',
        marginTop: '10px',
        marginBottom: '5px',
        marginLeft: '5px',
    },
}));

const RecentHistory = () => {
    const classes = useStyles();
    const [requests, setRequests] = useState([]);
    const userId = getUserId();
    const [id, setId] = useState();
    const [selected, setSelected] = useRecoilState(selectedType);
    const [open, setOpen] = useState(false);
    const [tabs, setTabs] = useRecoilState(currentTabs);
    const [value, setValue] = useRecoilState(currentTab);
    const setRequest = useSetRecoilState(requestParams);
    const setResponse = useSetRecoilState(responseInfo);
    const setCurrentApi = useSetRecoilState(currentApi);
    const setBreadCrumbs = useSetRecoilState(currentBreadCrumbs);
    const setSaveModalOpen = useSetRecoilState(isSaveModalOpen);

    const handleClose = () => {
        setOpen(false);
    };

    useEffect(() => {
        let source = axios.CancelToken.source(); // Create a cancel token source
        const getFiles = async () => {
            await axios
                .get(process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}`, {
                    cancelToken: source.token, // Pass the cancel token to the request
                })
                .then((response) => {
                    let req = response.data;
                    req.sort((dateStr1, dateStr2) => {
                        const date1 = new Date(
                            dateStr1.modifiedAt.slice(6, 10),
                            dateStr1.modifiedAt.slice(3, 5) - 1,
                            dateStr1.modifiedAt.slice(0, 2),
                            dateStr1.modifiedAt.slice(11, 13),
                            dateStr1.modifiedAt.slice(14, 16),
                            dateStr1.modifiedAt.slice(17, 19),
                        );

                        const date2 = new Date(
                            dateStr2.modifiedAt.slice(6, 10),
                            dateStr2.modifiedAt.slice(3, 5) - 1,
                            dateStr2.modifiedAt.slice(0, 2),
                            dateStr2.modifiedAt.slice(11, 13),
                            dateStr2.modifiedAt.slice(14, 16),
                            dateStr2.modifiedAt.slice(17, 19),
                        );

                        return date1 - date2;
                    });

                    req = req.filter((obj) => obj.isRecent === true);
                    setRequests(req);
                })
                .catch((error) => {
                    console.error(error);
                });
        };
        getFiles();

        // Cleanup function
        return () => {
            source.cancel(); // Cancel the request when the component is unmounted
        };
    }, [tabs]);

    // Get the current date
    const today = new Date();
    // Get the date for yesterday
    const yesterday = new Date(Date.now() - 86400000);

    // Group the objects based on date
    let groupedData = requests.reduce((acc, obj) => {
        const parts = obj.modifiedAt.split(', ');
        const date = parts[0];
        const dateKey =
            date === today.toLocaleDateString()
                ? 'Today'
                : date === yesterday.toLocaleDateString()
                ? 'Yesterday'
                : date;
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(obj);
        return acc;
    }, {});

    const handleSave = () => {
        if (tabs[value]?.onSave === false) {
            setOpen(false);
            setSaveModalOpen(true);
        }
    };

    const handleDelete = async (id) => {
        await axios
            .delete(process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}/${id}`)
            .catch((error) => {
                console.error('Error while saving contents:', error);
            });
        let updatedRequests = [...requests];
        updatedRequests = updatedRequests.filter((tab) => tab.id !== id);
        setRequests(updatedRequests);
        const newTabs = tabs.filter((tab) => tab.id !== id);
        setTabs(newTabs);
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
            id: tabs[value - 1]?.id ? tabs[value - 1]?.id : '0',
            name: tabs[value - 1]?.label ? tabs[value - 1].label : 'New Request',
            type: 'file',
            onSave: tabs[value - 1]?.onSave ? tabs[value - 1].onSave : false,
            parentFolderId: tabs[value - 1]?.parentFolderId ? tabs[value - 1].parentFolderId : '0',
        });
        setBreadCrumbs(tabs[value - 1]?.parentFolderNames ? tabs[value - 1].parentFolderNames : []);
        setOpen(false);
    };

    const handleDialog = async (parentFolderId, id) => {
        if (
            tabs[value]?.onSave === false &&
            JSON.stringify(tabs[value].request) !==
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
            setId(id);
        } else {
            let updatedRequests = [...requests];
            updatedRequests = updatedRequests.filter((tab) => tab.id !== id);
            await axios
                .put(process.env.REACT_APP_API_URL + endpoint.collectionsRequest + `/${userId}/${id}`, {
                    isRecent: false,
                })
                .then(() => {
                    setRequests(updatedRequests);
                });
        }
    };
    const [collapsedDates, setCollapsedDates] = useState([]);

    const toggleDateCollapse = (date) => {
        if (collapsedDates.includes(date)) {
            setCollapsedDates(collapsedDates.filter((d) => d !== date));
        } else {
            setCollapsedDates([...collapsedDates, date]);
        }
    };

    return (
        <div>
            <h3 style={{ marginLeft: '10px' }} className={classes.heading1}>
                Recent Requests
            </h3>
            {groupedData[today] && (
                <div>
                    <p style={{ marginLeft: '10px' }} className={classes.heading}>
                        Today
                    </p>
                    {groupedData[today].map((obj, idx) => (
                        <File
                            key={obj.id}
                            id={obj.id}
                            name={obj.name}
                            reqMethod={obj.request.method}
                            reqUrl={obj.request.url}
                            onSelect={setSelected}
                            selected={selected}
                            handleDialog={() => handleDialog(obj.parentFolderId, obj.id)}
                        />
                    ))}
                </div>
            )}

            {groupedData[yesterday] && (
                <div>
                    <p style={{ marginLeft: '10px' }} className={classes.heading}>
                        Yesterday
                    </p>
                    {groupedData[yesterday]?.map((obj, idx) => (
                        <File
                            key={obj.id}
                            id={obj.id}
                            name={obj.name}
                            reqMethod={obj.request.method}
                            reqUrl={obj.request.url}
                            onSelect={setSelected}
                            selected={selected}
                            handleDialog={() => handleDialog(obj.parentFolderId, obj.id)}
                        />
                    ))}
                </div>
            )}

            {/* Render other dates */}
            {Object.keys(groupedData)
                .filter((date) => ![today, yesterday].includes(date)) // Exclude today and yesterday
                .map((date) => (
                    <div key={date}>
                        <p
                            className={classes.heading}
                            style={{ marginLeft: '5px', cursor: 'pointer', marginRight: '10px' }}
                            onClick={() => toggleDateCollapse(date)}
                        >
                            {collapsedDates.includes(date) ? (
                                <KeyboardArrowRightIcon style={{ marginTop: '-2px' }} />
                            ) : (
                                <KeyboardArrowDownIcon style={{ marginTop: '-2px' }} />
                            )}
                            {date}
                        </p>
                        {!collapsedDates.includes(date) && (
                            <>
                                {groupedData[date].map((obj, idx) => (
                                    <File
                                        key={obj.id}
                                        id={obj.id}
                                        name={obj.name}
                                        reqMethod={obj.request.method}
                                        reqUrl={obj.request.url}
                                        onSelect={setSelected}
                                        selected={selected}
                                        handleDialog={() => handleDialog(obj.parentFolderId, obj.id)}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                ))}
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
                            fontSize: '15px',
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
                        onClick={() => handleDelete(id)}
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
        </div>
    );
};

export default RecentHistory;
