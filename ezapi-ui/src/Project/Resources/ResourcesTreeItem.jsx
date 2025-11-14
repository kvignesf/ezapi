import { Dialog, Fade, Menu, MenuItem } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { useEffect, useState } from 'react';
import ReactHoverObserver from 'react-hover-observer';
import ReactTooltip from 'react-tooltip';
import Colors from '../../shared/colors';
import AppIcon from '../../shared/components/AppIcon';
import { useCanEdit } from '../../shared/utils';
import AddOrEditPath from './AddOrEditPath';
import AddOrEditResource from './AddOrEditResource';
import DeleteResource from './DeleteResource';
import StyledTreeItem from './StyledTreeItem';

const ResourceTreeItem = ({
    currentTab,
    nodeId,
    resource,
    children,
    isDesign,
    resetSelectedOperation,
    projectType,
    ...rest
}) => {
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [isEllipsisActive, setIsEllipsisActive] = useState(null);
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
    useEffect(() => {});
    const handleAddPathClick = (event) => {
        event?.preventDefault();
        event?.stopPropagation();
        resetSelectedOperation();

        if (canEdit()) {
            setDialog({
                show: true,
                type: 'add-path',
            });
        }
    };

    const handleEditClick = () => {
        resetSelectedOperation();
        if (canEdit()) {
            setDialog({
                show: true,
                type: 'edit-resource',
            });
        }
    };

    const handleDeleteClick = () => {
        resetSelectedOperation();
        if (canEdit()) {
            setDialog({
                show: true,
                type: 'delete-resource',
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
                {dialog?.type === 'add-path' && canEdit() && (
                    <AddOrEditPath
                        onClose={handleCloseDialog}
                        title="Add Path"
                        resourceId={resource?.resourceId}
                        path={{}}
                    />
                )}

                {dialog?.type === 'edit-resource' && canEdit() && (
                    <AddOrEditResource onClose={handleCloseDialog} title="Edit Resource" resource={resource} />
                )}

                {dialog?.type === 'delete-resource' && canEdit() && (
                    <DeleteResource onClose={handleCloseDialog} resource={resource} />
                )}
            </Dialog>

            <ReactHoverObserver shouldDecorateChildren={false}>
                {({ isHovering }) => (
                    <StyledTreeItem
                        nodeId={nodeId}
                        label={
                            <div className="flex flex-row items-center py-1 pr-1 h-8">
                                <div className="flex flex-row flex-1 items-center">
                                    <AppIcon style={{ marginRight: '0.5rem' }}>
                                        <FolderOpenIcon style={{ fontSize: '18px', color: Colors.neutral.gray1 }} />
                                    </AppIcon>
                                    <div
                                        // style={{ "z-index": "1000" }}
                                        data-tip
                                        data-for="ellipsisData"
                                    >
                                        <p
                                            className="text-overline2 overflow-hidden whitespace-nowrap overflow-ellipsis w-36"
                                            onMouseEnter={(e) => {
                                                if (e.target.offsetWidth < e.target.scrollWidth) {
                                                    setIsEllipsisActive(true);
                                                } else {
                                                    setIsEllipsisActive(false);
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                setIsEllipsisActive(false);
                                                ReactTooltip.hide('ellipsisData');
                                            }}
                                        >
                                            {resource?.resourceName}
                                        </p>

                                        <ReactTooltip
                                            id="ellipsisData"
                                            backgroundColor="black"
                                            place="right"
                                            effect="solid"
                                            disable={!isEllipsisActive || menuAnchor}
                                        >
                                            {resource?.resourceName}
                                        </ReactTooltip>
                                    </div>
                                </div>

                                {isHovering && currentTab == 0 && canEdit() && projectType !== 'aggregate' && (
                                    <div>
                                        <AppIcon onClick={handleAddPathClick} style={{ marginRight: '0.5rem' }}>
                                            <AddIcon
                                                style={{
                                                    fontSize: '16px',
                                                    color: Colors.brand.secondary,
                                                }}
                                            />
                                        </AppIcon>
                                    </div>
                                )}

                                {isHovering && canEdit() && (
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
                                        id="path-menu"
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
                                    This resource is empty.
                                    {canEdit() && (
                                        <span
                                            className="text-overline3 text-brand-secondary cursor-pointer ml-1 hover:opacity-80"
                                            onClick={handleAddPathClick}
                                        >
                                            Add Path
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

export default ResourceTreeItem;
