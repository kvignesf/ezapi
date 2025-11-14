import { IconButton, OutlinedInput } from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';
import { makeStyles } from '@material-ui/core/styles';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useRecoilState } from 'recoil';
import { requestParams } from '../../../../CollectionsAtom';

const useStyles = makeStyles((theme) => ({
    deleteButton: {
        color: '#FC2947',
        borderRadius: theme.shape.borderRadius,
        padding: '2px',
        '&:hover': {
            backgroundColor: 'transparent',
        },
        fontSize: '5px',
        marginLeft: '15px',
    },
    tickButton: {
        color: '#03C988',
        padding: '2px',
        '&:hover': {
            backgroundColor: 'transparent',
        },
        fontSize: '5px',
        marginLeft: '15px',
    },
    editButton: {
        color: '#3C4048',
        padding: '2px',
        '&:hover': {
            backgroundColor: 'transparent',
        },
        fontSize: '5px',
        marginLeft: '15px',
    },
    deleteTooltip: {
        fontSize: '12px',
        backgroundColor: '#FC2947',
    },
    deleteArrow: {
        color: '#FC2947',
    },
    checkTooltip: {
        fontSize: '12px',
        backgroundColor: '#5D9C59',
    },
    checkArrow: {
        color: '#5D9C59',
    },
    editTooltip: {
        fontSize: '12px',
        backgroundColor: '#3C4048',
    },
    editArrow: {
        color: '#3C4048',
    },
}));
export default function KeyValueEditor({ keyPair, onKeyPairRemove, tab }) {
    const classes = useStyles();
    const [request, setRequest] = useRecoilState(requestParams);

    function handleKeyChange(event) {
        if (tab === 0) {
            const updatedQueryParams = request['queryParams'].map((item) => {
                if (item.id === keyPair.id) {
                    return { ...item, keyItem: event.target.value };
                }
                return item;
            });
            setRequest({ ...request, queryParams: updatedQueryParams });
        }
        if (tab === 1) {
            const updatedHeader = request['header'].map((item) => {
                if (item.id === keyPair.id) {
                    return { ...item, keyItem: event.target.value };
                }
                return item;
            });
            setRequest({ ...request, header: updatedHeader });
        }
    }
    function handleValueChange(event) {
        if (tab === 0) {
            const updatedQueryParams = request['queryParams'].map((item) => {
                if (item.id === keyPair.id) {
                    return { ...item, valueItem: event.target.value };
                }
                return item;
            });
            setRequest({ ...request, queryParams: updatedQueryParams });
        }
        if (tab === 1) {
            const updatedHeader = request['header'].map((item) => {
                if (item.id === keyPair.id) {
                    return { ...item, valueItem: event.target.value };
                }
                return item;
            });
            setRequest({ ...request, header: updatedHeader });
        }
    }

    function setInputDisable(isEditable) {
        if (tab === 0) {
            const updatedQueryParams = request['queryParams'].map((item) => {
                if (item.id === keyPair.id) {
                    return { ...item, isEditable: isEditable };
                }
                return item;
            });
            setRequest({ ...request, queryParams: updatedQueryParams });
        }
        if (tab === 1) {
            const updatedHeader = request['header'].map((item) => {
                if (item.id === keyPair.id) {
                    return { ...item, isEditable: isEditable };
                }
                return item;
            });
            setRequest({ ...request, header: updatedHeader });
        }
    }

    return (
        <>
            <div className="flex mt-3 ml-3">
                <OutlinedInput
                    placeholder="Key"
                    value={keyPair.keyItem}
                    onChange={handleKeyChange}
                    style={{ height: '30px', width: '25%', fontSize: '14px' }}
                    disabled={keyPair.isEditable}
                />
                <OutlinedInput
                    placeholder="Value"
                    className="ml-5"
                    value={keyPair.valueItem}
                    onChange={handleValueChange}
                    style={{ height: '30px', width: '25%', fontSize: '14px' }}
                    disabled={keyPair.isEditable}
                />

                <div>
                    {!keyPair.isEditable ? (
                        <Tooltip
                            title="Save"
                            classes={{
                                tooltip: classes.checkTooltip,
                                arrow: classes.checkArrow,
                            }}
                            arrow
                            enterDelay={300}
                            leaveDelay={100}
                            placement="top"
                        >
                            <IconButton className={classes.tickButton} onClick={() => setInputDisable(true)}>
                                <CheckCircleOutlineOutlinedIcon />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Tooltip
                            title="Edit"
                            classes={{
                                tooltip: classes.editTooltip,
                                arrow: classes.editArrow,
                            }}
                            arrow
                            enterDelay={300}
                            leaveDelay={100}
                            placement="top"
                        >
                            <IconButton className={classes.editButton} onClick={() => setInputDisable(false)}>
                                <EditOutlinedIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip
                        title="Delete"
                        classes={{
                            tooltip: classes.deleteTooltip,
                            arrow: classes.deleteArrow,
                        }}
                        arrow
                        enterDelay={300}
                        leaveDelay={100}
                        placement="top"
                    >
                        <IconButton className={classes.deleteButton} onClick={() => onKeyPairRemove(keyPair)}>
                            <DeleteOutlineIcon />
                        </IconButton>
                    </Tooltip>
                </div>
            </div>
        </>
    );
}
