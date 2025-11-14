import { Dialog, Fade, Menu, MenuItem } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { useState } from 'react';
import ReactHoverObserver from 'react-hover-observer';
import ReactTooltip from 'react-tooltip';
import Colors from '../../shared/colors';
import AppIcon from '../../shared/components/AppIcon';
import { useCanEdit } from '../../shared/utils';
import AddOrEditOperation from './AddOrEditOperation';
import AddOrEditPath from './AddOrEditPath';
import DeletePath from './DeletePath';
import StyledTreeItem from './StyledTreeItem';

const PathTreeItem = ({
    projectType,
    currentTab,
    nodeId,
    resourceId,
    path,
    isDesign,
    children,
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
    const [isEllipsisActive, setIsEllipsisActive] = useState(null);
    const handleMenuClick = (event) => {
        event?.preventDefault();
        event?.stopPropagation();
        setMenuAnchor(event?.currentTarget);
    };

    const handleAddOperationClick = (event) => {
        event?.preventDefault();
        event?.stopPropagation();
        resetSelectedOperation();

        if (canEdit()) {
            setDialog({
                show: true,
                type: 'add-operation',
            });
        }
    };

    const handleEditClick = () => {
        if (canEdit()) {
            setDialog({
                show: true,
                type: 'edit-path',
            });
        }
    };

    const handleDeleteClick = () => {
        if (canEdit()) {
            setDialog({
                show: true,
                type: 'delete-path',
            });
        }
    };

    const handleCloseDialog = () => {
        setDialog({
            show: false,
            data: null,
            type: null,
        });
    };

    return (
        <div {...rest}>
            <Dialog
                onClose={handleCloseDialog}
                aria-labelledby="dashboard-dialog"
                open={dialog?.show ?? false}
                fullWidth
                PaperProps={{
                    style: { borderRadius: 8, zIndex: 1001 },
                }}
            >
                {dialog?.type === 'add-operation' && canEdit() && (
                    <AddOrEditOperation
                        onClose={handleCloseDialog}
                        title="Add Operation"
                        pathId={path?.pathId}
                        resourceId={resourceId}
                        operation={{}}
                    />
                )}

                {dialog?.type === 'edit-path' && canEdit() && (
                    <AddOrEditPath onClose={handleCloseDialog} title="Edit Path" resourceId={resourceId} path={path} />
                )}

                {dialog?.type === 'delete-path' && canEdit() && (
                    <DeletePath resourceId={resourceId} onClose={handleCloseDialog} path={path} />
                )}
            </Dialog>

            <ReactHoverObserver shouldDecorateChildren={false}>
                {({ isHovering }) => (
                    <StyledTreeItem
                        nodeId={nodeId}
                        label={
                            <div className="flex flex-row items-center py-1 pr-1 h-8">
                                <div
                                    // style={{ "z-index": "1000" }}
                                    className="flex flex-row flex-1 items-center"
                                    data-tip
                                    data-for="ellipsisDataPath"
                                >
                                    <p className="rounded-sm border-2 border-neutral-gray1 px-1 mr-1 h-5 text-xs">/</p>
                                    <p
                                        className="text-overline2 overflow-hidden whitespace-nowrap overflow-ellipsis w-32"
                                        onMouseEnter={(e) => {
                                            if (e.target.offsetWidth < e.target.scrollWidth) {
                                                setIsEllipsisActive(true);
                                            } else {
                                                setIsEllipsisActive(false);
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            setIsEllipsisActive(false);
                                            ReactTooltip.hide('ellipsisDataPath');
                                        }}
                                    >
                                        {path.pathName ? path.pathName : path}
                                    </p>
                                    <ReactTooltip
                                        id="ellipsisDataPath"
                                        backgroundColor="black"
                                        place="right"
                                        effect="solid"
                                        disable={!isEllipsisActive || menuAnchor}
                                    >
                                        {path.pathName ? path.pathName : path}
                                    </ReactTooltip>
                                </div>

                                {isHovering && currentTab == 0 && canEdit() && projectType !== 'aggregate' && (
                                    <div>
                                        <AppIcon onClick={handleAddOperationClick} style={{ marginRight: '0.5rem' }}>
                                            <AddIcon
                                                style={{
                                                    fontSize: '16px',
                                                    color: Colors.brand.secondary,
                                                }}
                                            />
                                        </AppIcon>
                                    </div>
                                )}

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
                                            setMenuAnchor(null);
                                        }}
                                        TransitionComponent={Fade}
                                        style={{ borderRadius: '1rem', zIndex: '100' }}
                                    >
                                        <MenuItem
                                            onClick={(event) => {
                                                event?.preventDefault();
                                                setMenuAnchor(null);
                                                handleEditClick();
                                            }}
                                            disabled={!isDesign}
                                        >
                                            Edit
                                        </MenuItem>

                                        <MenuItem
                                            onClick={(event) => {
                                                event?.preventDefault();
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
                    >
                        {children ? (
                            children
                        ) : (
                            <div className="my-1 ml-1 flex flex-row items-center">
                                <p className="text-overline3 text-neutral-gray3 mr-1">
                                    This path is empty.
                                    {canEdit() && (
                                        <span
                                            className="text-overline3 text-brand-secondary cursor-pointer ml-1 hover:opacity-80"
                                            onClick={handleAddOperationClick}
                                        >
                                            Add Operation
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}
                    </StyledTreeItem>
                )}
            </ReactHoverObserver>
        </div>
    );
};

export default PathTreeItem;
