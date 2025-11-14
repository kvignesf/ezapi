import { responseInfo } from '@/Collections/CollectionsAtom';
import { Tab, Tabs } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import httpStatus from 'http-status-codes';
import { useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { useRecoilValue } from 'recoil';
import ResponseEditor from './ResponseEditor';
import ResponseHeader from './ResponseHeader';

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
    },
    tab: {
        minWidth: 100,
        fontWeight: 500,
        fontSize: '14px',
        textTransform: 'none',
    },
    panel: {
        padding: theme.spacing(2),
        borderBottom: '1px solid #ddd',
        borderTop: '1px solid #ddd',
    },
    span: {
        fontWeight: 600,
        fontSize: '12px',
        display: 'inline-block',
        marginLeft: '10px',
    },
    iconSpan: {
        width: '50px',
        fontSize: '12px',
        display: 'inline-block',
        marginRight: '10px',
        marginBottom: '10px',
    },
    launchButton: {
        color: '#FF5F9E',
        borderRadius: theme.shape.borderRadius,
        padding: '2px',
        '&:hover': {
            backgroundColor: 'transparent',
        },
        fontSize: '5px',
    },
    launchTooltip: {
        fontSize: '13px',
        backgroundColor: '#FF5F9E',
    },
    launchArrow: {
        color: '#FF5F9E',
    },
}));

export default function Response({ loading }) {
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);
    const response = useRecoilValue(responseInfo);
    let statusText;
    if (response && response.status) {
        statusText = httpStatus.getStatusText(response.status);
    } else {
        statusText = 'Error';
    }
    const handleChange = (event, newValue) => {
        setSelectedTabIndex(newValue);
    };

    const classes = useStyles();
    return (
        <div>
            {response && response.data ? (
                <div className="flex justify-between flex-wrap">
                    <Tabs
                        value={selectedTabIndex}
                        onChange={handleChange}
                        variant="standard"
                        indicatorColor="transparent"
                        textColor="primary"
                    >
                        <Tab className={classes.tab} label="Response Body" />
                        {response.headers && Object.keys(response.headers).length > 0 ? (
                            <Tab className={classes.tab} label="Response Header" />
                        ) : null}
                    </Tabs>
                    <div className="flex mt-4 mr-4">
                        {response.status && (
                            <span className={classes.span}>
                                Status:
                                <span
                                    style={{
                                        color: response.status >= 200 && response.status < 300 ? '#138808' : 'red',
                                    }}
                                >
                                    {response.status ? `${response.status} ${statusText}` : ''}
                                </span>
                            </span>
                        )}
                        {response.time && (
                            <span className={classes.span}>
                                Time:
                                <span
                                    style={{
                                        color: response.status >= 200 && response.status < 300 ? '#138808' : 'red',
                                    }}
                                >
                                    {response.time ? ` ${response.time}s` : ''}
                                </span>
                            </span>
                        )}
                        {response.size && (
                            <span className={classes.span}>
                                Size:
                                <span
                                    style={{
                                        color: response.status >= 200 && response.status < 300 ? '#138808' : 'red',
                                    }}
                                >
                                    {response.size ? ` ${response.size}kB` : ''}
                                </span>
                            </span>
                        )}
                    </div>
                </div>
            ) : null}

            <div className="px-4 py-4 ">
                {loading ? (
                    <ThreeDots height="30" width="30" color="gray" visible={true} />
                ) : (
                    <>
                        {selectedTabIndex === 0 && response && response.data && <ResponseEditor value={response} />}
                        {selectedTabIndex === 1 && <ResponseHeader response={response} />}
                    </>
                )}
            </div>
        </div>
    );
}
