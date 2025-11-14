import { Dialog, Fade, Menu, MenuItem } from '@material-ui/core';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { useState } from 'react';
import ReactHoverObserver from 'react-hover-observer';
import Colors from '../../shared/colors';
import ApiMethod from '../../shared/components/ApiMethod';
import AppIcon from '../../shared/components/AppIcon';
import { useCanEdit } from '../../shared/utils';
import AddOrEditOperation from './AddOrEditOperation';
import DeleteOperation from './DeleteOperation';
import './OperationTreeItem.css';
import StyledTreeItem from './StyledTreeItem';

const OperationTreeItem = ({
    currentTab,
    nodeId,
    resourceId,
    pathId,
    type,
    operation,
    selected,
    resetSelectedOperation,
    ...rest
}) => {
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [dialog, setDialog] = useState({
        show: false,
        data: null,
        type: null,
    });
    const canEdit = useCanEdit();

    const handleMenuClick = (event) => {
        event?.preventDefault();
        event?.stopPropagation();
        setMenuAnchor(event?.currentTarget);
    };

    const handleEditClick = () => {
        resetSelectedOperation();

        if (canEdit()) {
            setDialog({
                show: true,
                type: 'edit-operation',
            });
        }
    };

    const handleDeleteClick = () => {
        resetSelectedOperation();
        if (canEdit()) {
            setDialog({
                show: true,
                type: 'delete-operation',
            });
        }
    };

    const handleCloseDialog = (event) => {
        event?.preventDefault();
        event?.stopPropagation();
        setDialog({
            show: false,
            data: null,
            type: null,
        });
    };
    function truncate(str, n) {
        return str.length > n ? str.substr(0, n - 1) + '...' : str;
    }
    return (
        <div {...rest}>
            <Dialog
                onClose={handleCloseDialog}
                aria-labelledby="dashboard-dialog"
                open={dialog?.show ?? false}
                fullWidth
                PaperProps={{
                    style: { borderRadius: 8 },
                }}
            >
                {dialog?.type === 'edit-operation' && canEdit() && (
                    <AddOrEditOperation
                        onClose={handleCloseDialog}
                        title="Edit Operation"
                        pathId={pathId}
                        resourceId={resourceId}
                        operation={operation}
                    />
                )}

                {dialog?.type === 'delete-operation' && canEdit() && (
                    <DeleteOperation
                        onClose={handleCloseDialog}
                        pathId={pathId}
                        resourceId={resourceId}
                        operation={operation}
                    />
                )}
            </Dialog>

            <ReactHoverObserver shouldDecorateChildren={false}>
                {({ isHovering }) => (
                    <StyledTreeItem
                        nodeId={nodeId}
                        selected={selected}
                        label={
                            <div className="flex flex-row items-center pr-1 h-6">
                                <div className="flex flex-row flex-1 items-center">
                                    <ApiMethod type={type} style={{ marginRight: '0.5rem' }} />

                                    <p className="text-overline2 overflow-hidden whitespace-nowrap overflow-ellipsis w-28">
                                        {operation?.operationName ? operation.operationName : operation}
                                    </p>
                                </div>

                                {isHovering && currentTab == 0 && canEdit() && (
                                    <div>
                                        <AppIcon onClick={handleMenuClick}>
                                            <MoreVertIcon
                                                style={{
                                                    fontSize: '16px',
                                                    color: Colors.brand.secondary,
                                                }}
                                            />
                                        </AppIcon>
                                    </div>
                                )}

                                {canEdit() && (
                                    <Menu
                                        id="resources-menu"
                                        getContentAnchorEl={null}
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                                        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                                        anchorEl={menuAnchor}
                                        keepMounted
                                        open={Boolean(menuAnchor)}
                                        onClose={(event) => {
                                            event?.preventDefault();
                                            event?.stopPropagation();
                                            setMenuAnchor(null);
                                        }}
                                        TransitionComponent={Fade}
                                        style={{ borderRadius: '1rem', zIndex: '100' }}
                                    >
                                        <MenuItem
                                            onClick={(event) => {
                                                event?.preventDefault();
                                                event?.stopPropagation();
                                                setMenuAnchor(null);
                                                handleEditClick();
                                            }}
                                        >
                                            Edit
                                        </MenuItem>

                                        <MenuItem
                                            onClick={(event) => {
                                                event?.preventDefault();
                                                event?.stopPropagation();
                                                setMenuAnchor(null);
                                                handleDeleteClick();
                                            }}
                                            style={{ color: Colors.accent.red }}
                                        >
                                            Delete
                                        </MenuItem>
                                    </Menu>
                                )}
                            </div>
                        }
                    />
                )}
            </ReactHoverObserver>
        </div>
    );
};

export default OperationTreeItem;
