import { CircularProgress, Dialog, Fade, Menu, MenuItem } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DragIndicatorIcon from '@material-ui/icons/DragIndicator';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import _ from 'lodash';
import { useState } from 'react';
import { useDrag } from 'react-dnd';
import { useParams } from 'react-router';
import Scrollbar from 'react-smooth-scrollbar';
import { useRecoilValue } from 'recoil';
import Colors from '../../../shared/colors';
import { OutlineButton } from '../../../shared/components/AppButton';
import AppIcon from '../../../shared/components/AppIcon';
import { operationAtomWithMiddleware, useCanEdit } from '../../../shared/utils';
import EmptyParameters from '../../../static/images/empty-parameters.svg';
import AddOrEditCustomParameter from './AddOrEditCustomParameter/AddOrEditCustomParameter';
import DeleteCustomParameter from './DeleteCustomParameter/DeleteCustomParameter';
import { useGetCustomParameters } from './customParametersQuery';

const CustomParameters = () => {
    const { projectId } = useParams();
    const {
        isLoading: isFetchingCustomParameters,
        data: customParameters,
        error: getCustomParametersError,
    } = useGetCustomParameters(projectId, {
        refetchOnWindowFocus: false,
    });

    const [dialog, setDialog] = useState({
        show: false,
        type: null,
        data: null,
    });

    const operationState = useRecoilValue(operationAtomWithMiddleware);
    const canEdit = useCanEdit();

    const showAddParameterDialog = () => {
        setDialog({
            show: true,
            type: 'add-custom-parameter',
        });
    };

    const handleCloseDialog = () => {
        setDialog({
            show: false,
            data: null,
        });
    };

    return (
        <>
            <Dialog
                aria-labelledby="dashboard-dialog"
                open={dialog?.show ?? false}
                fullWidth
                PaperProps={{
                    style: { borderRadius: 8 },
                }}
                onClose={(event, reason) => {
                    if (reason !== 'backdropClick') {
                        handleCloseDialog();
                    }
                }}
            >
                {dialog?.type === 'add-custom-parameter' && canEdit() && (
                    <AddOrEditCustomParameter onClose={handleCloseDialog} />
                )}
            </Dialog>

            <div className="m-4 h-full mb-16">
                <div
                    className="bg-neutral-gray7 mt-14 p-4 rounded-md flex flex-col"
                    style={{ height: `calc(100% - 80px)` }}
                >
                    {isFetchingCustomParameters && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <CircularProgress
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    color: Colors.brand.secondary,
                                    marginBottom: '2rem',
                                }}
                            />
                            <p className="text-overline2">Fetching data</p>
                        </div>
                    )}

                    {getCustomParametersError && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <p className="text-overline2">{getCustomParametersError?.message}</p>
                        </div>
                    )}

                    {customParameters && customParameters?.data && !_.isEmpty(customParameters?.data) ? (
                        <div className="flex-1 flex flex-col">
                            <div className="flex flex-row justify-start bg-neutral-gray6 rounded-md p-1 py-2 mb-2">
                                <p className="flex-1 text-smallLabel ml-7 text-neutral-gray2 uppercase">Attribute</p>
                                <p className="flex-1 text-smallLabel uppercase text-neutral-gray2">Data Type</p>
                                <p className="flex-1 text-smallLabel uppercase text-neutral-gray2">Table Name</p>
                                <p className="flex-1 text-smallLabel uppercase text-neutral-gray2">Column Name</p>
                                <p className="flex-1 text-smallLabel uppercase text-neutral-gray2">Function</p>
                                <div className="w-8"></div>
                            </div>

                            <Scrollbar
                                style={{
                                    height: !operationState?.operationIndex ? `calc(100vh - 210px)` : null,
                                    maxHeight: operationState?.operationIndex ? `calc(50vh - 210px)` : null,
                                }}
                            >
                                {customParameters?.data?.map((param) => {
                                    return <CustomParamRow param={param} key={param?.customParamID} />;
                                })}
                            </Scrollbar>
                        </div>
                    ) : (
                        !isFetchingCustomParameters &&
                        !getCustomParametersError && (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <img
                                    src={EmptyParameters}
                                    style={{
                                        width: '110px',
                                        height: '110px',
                                    }}
                                    alt={'EmptyParametersLogo'}
                                />
                                <p className="text-overline2 mb-3">You don’t have any parameter</p>

                                {canEdit() && (
                                    <OutlineButton
                                        style={{
                                            borderColor: Colors.brand.secondary,
                                            borderWidth: '1px',
                                        }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();

                                            showAddParameterDialog();
                                        }}
                                    >
                                        <div className="flex flex-row items-center">
                                            <AppIcon
                                                size="20px"
                                                color={Colors.brand.secondary}
                                                style={{ marginRight: '0.5rem' }}
                                            >
                                                <AddIcon style={{ fontSize: '20px' }} />
                                            </AppIcon>
                                            <p className="text-overline2 text-brand-secondary">Add Parameter</p>
                                        </div>
                                    </OutlineButton>
                                )}
                            </div>
                        )
                    )}
                </div>
            </div>
        </>
    );
};

const CustomParamRow = ({ param }) => {
    const [isHovering, setHovering] = useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState(false);
    const [dialog, setDialog] = useState({
        show: false,
        type: null,
        data: null,
    });

    const [{ isDragging }, drag, dragPreview] = useDrag(
        () => ({
            type: 'drag_item',
            item: param,
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        }),
        [param],
    );

    const showDeleteCustomParameterDialog = () => {
        if (canEdit()) {
            setDialog({
                show: true,
                type: 'delete-custom-parameter',
            });
        }
    };

    const showEditCustomParameterDialog = () => {
        if (canEdit()) {
            setDialog({
                show: true,
                type: 'edit-custom-parameter',
            });
        }
    };

    const handleCloseDialog = () => {
        setDialog({
            show: false,
            data: null,
        });
    };

    const canEdit = useCanEdit();

    return (
        <div
            ref={canEdit() ? drag : null}
            style={{
                opacity: isDragging ? 0.5 : 1,
                cursor: canEdit() ? 'pointer' : 'default',
            }}
        >
            <>
                <Dialog
                    aria-labelledby="dashboard-dialog"
                    open={dialog?.show ?? false}
                    fullWidth
                    PaperProps={{
                        style: { borderRadius: 8 },
                    }}
                    onClose={(event, reason) => {
                        if (reason !== 'backdropClick') {
                            handleCloseDialog();
                        }
                    }}
                >
                    {dialog?.type === 'edit-custom-parameter' && canEdit() && (
                        <AddOrEditCustomParameter onClose={handleCloseDialog} parameter={param} />
                    )}

                    {dialog?.type === 'delete-custom-parameter' && canEdit() && (
                        <DeleteCustomParameter onClose={handleCloseDialog} parameter={param} />
                    )}
                </Dialog>

                <div
                    key={param.id}
                    onMouseEnter={(e) => {
                        e?.preventDefault();
                        e?.stopPropagation();

                        if (canEdit()) {
                            setHovering(true);
                        }
                    }}
                    onMouseLeave={(e) => {
                        e?.preventDefault();
                        e?.stopPropagation();

                        if (canEdit()) {
                            setHovering(false);
                        }
                    }}
                    className="bg-white mb-1 rounded-md flex flex-row p-1 py-2 items-center"
                >
                    <AppIcon className="mr-1 opacity-50">
                        <DragIndicatorIcon className={'cursor-move'} style={{ height: '1.25rem' }} />
                    </AppIcon>
                    <p className="flex-1 ml-1 text-overline2">{param?.name}</p>
                    <p className="flex-1 text-overline2">{param?.type}</p>
                    <p className="flex-1 text-overline2">{param?.tableName}</p>
                    <p className="flex-1 text-overline2">{param?.columnName}</p>
                    <p className="flex-1 text-overline2">{param?.functionName}</p>

                    <div className="w-8 h-8">
                        {isHovering && canEdit() ? (
                            <AppIcon
                                style={{ padding: '0px' }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    setMenuAnchorEl(e.currentTarget);
                                }}
                            >
                                <MoreVertIcon style={{ width: '20px', height: 'min-content' }} />
                            </AppIcon>
                        ) : (
                            <div style={{ width: '20px', height: 'min-content' }}></div>
                        )}
                    </div>

                    {canEdit() && (
                        <Menu
                            id="param-menu"
                            anchorEl={menuAnchorEl}
                            keepMounted
                            open={Boolean(menuAnchorEl)}
                            onClose={() => {
                                setMenuAnchorEl(null);
                            }}
                            TransitionComponent={Fade}
                            style={{ borderRadius: '1rem', zIndex: '100' }}
                        >
                            <MenuItem
                                onClick={() => {
                                    setMenuAnchorEl(null);

                                    showEditCustomParameterDialog();
                                }}
                            >
                                Edit
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    setMenuAnchorEl(null);

                                    showDeleteCustomParameterDialog();
                                }}
                                style={{ color: Colors.accent.red }}
                            >
                                Delete
                            </MenuItem>
                        </Menu>
                    )}
                </div>
            </>
        </div>
    );
};

export default CustomParameters;
