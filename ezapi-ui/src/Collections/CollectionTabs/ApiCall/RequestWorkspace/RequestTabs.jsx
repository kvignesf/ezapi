import { MenuItem, Select, Tab, Tabs, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useState } from 'react';
import { useRecoilState } from 'recoil';
import { requestParams } from '../../../CollectionsAtom';
import AuthTab from './AuthenticationTab/AuthTab';
import KeyValue from './KeyValue/KeyValuePanel';
import ReqBodyEditor from './ReqBodyEditor';
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
        '&.Mui-selected': {
            borderBottom: 'none',
        },
    },
    panel: {
        borderBottom: '1px solid #ddd',
        marginTop: '-2px',
        borderTop: '1px solid #ddd',
    },
    select: {
        fontWeight: 500,
        fontSize: '14px',
        width: 107,
        '&:focus': {
            backgroundColor: 'transparent',
            outline: 'none',
        },
        '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
        },
    },
    container: {
        display: 'flex',
        alignItems: 'center',
    },
}));

export default function RequestTabs() {
    const classes = useStyles();
    const [value, setValue] = useState(0);
    const [request, setRequest] = useRecoilState(requestParams);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const handleSelect = (event) => {
        const { name, value } = event.target;
        setRequest((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleFormatClick = () => {
        try {
            const formattedValue = JSON.stringify(JSON.parse(request.body), null, 2);
            setRequest((prevData) => ({
                ...prevData,
                body: formattedValue,
            }));
        } catch (error) {
            // Handle any parsing errors here
            console.error('Invalid JSON:', error);
        }
    };
    const requestTabs = [
        {
            slug: 'query-params',
            title: 'Query Params',
            panel: <KeyValue tab={0} />,
        },
        {
            slug: 'headers',
            title: 'Headers',
            panel: <KeyValue tab={1} />,
        },
        {
            slug: 'body',
            title: 'Body',
            panel: <ReqBodyEditor tab={2} />,
        },
        {
            slug: 'authorization',
            title: 'Authorization',
            panel: <AuthTab tab={3} />,
        },
    ];

    return (
        <div className={classes.root}>
            <div className="flex flex-wrap justify-between">
                <div className={classes.container}>
                    <Select
                        className={classes.select}
                        value={request.proxy ? request.proxy : 'No Proxy'}
                        onChange={handleSelect}
                        variant="outlined"
                        name="proxy"
                    >
                        <MenuItem value="No Proxy">No Proxy</MenuItem>
                        <MenuItem value="Proxy">Proxy</MenuItem>
                    </Select>
                    <Tabs
                        value={value}
                        onChange={handleChange}
                        variant="standard"
                        indicatorColor="transparent"
                        textColor="primary"
                        style={{
                            borderBottom: 'none',
                        }}
                    >
                        {requestTabs.map((tab) => (
                            <Tab className={classes.tab} key={tab.slug} label={tab.title} />
                        ))}
                    </Tabs>
                </div>
                {value === 2 ? (
                    <button
                        className={classes.tab}
                        style={{ paddingRight: '30px', color: '#c71c72', fontWeight: 700 }}
                        onClick={handleFormatClick}
                    >
                        Indent
                    </button>
                ) : null}
            </div>

            {requestTabs.map((tab, index) => (
                <TabPanel className={classes.panel} value={value} index={index} key={tab.slug}>
                    {tab.panel}
                </TabPanel>
            ))}
        </div>
    );
}

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && (
                <Typography component="div" variant="body1">
                    {children}
                </Typography>
            )}
        </div>
    );
}
