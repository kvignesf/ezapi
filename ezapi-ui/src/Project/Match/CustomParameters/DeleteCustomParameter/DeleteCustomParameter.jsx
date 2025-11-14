import { CircularProgress } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { useParams } from 'react-router';
import Colors from '../../../../shared/colors';
import { PrimaryButton, TextButton } from '../../../../shared/components/AppButton';
import AppIcon from '../../../../shared/components/AppIcon';
import { useDeleteCustomParameter } from './deleteCustomParameterQuery';

const DeleteCustomParameter = ({ parameter, onClose }) => {
    const { projectId } = useParams();
    const {
        isLoading: isDeletingCustomParameter,
        isSuccess: isDeleteCustomSuccess,
        error: deleteCustomParamError,
        mutate: deleteCustomParam,
    } = useDeleteCustomParameter();

    if (isDeleteCustomSuccess) {
        onClose();
        return null;
    }

    return (
        <div className="flex flex-col">
            <div className="p-4 flex flex-row justify-between border-b-1">
                <p className="text-subtitle1">Delete Parameter</p>

                {!isDeletingCustomParameter && (
                    <AppIcon
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            onClose();
                        }}
                    >
                        <CloseIcon />
                    </AppIcon>
                )}
            </div>
            <div className="p-4">
                <p className="mb-4 text-body2">{`Are you sure want to delete the parameter “${parameter?.name}”? Once deleted you can’t get it back.`}</p>
                {deleteCustomParamError && (
                    <p className="text-accent-red text-overline2">{deleteCustomParamError?.error?.error}</p>
                )}
            </div>
            <div className="border-t-1 p-4 flex flex-row justify-end items-center">
                {!isDeletingCustomParameter ? (
                    <>
                        <TextButton
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                onClose();
                            }}
                        >
                            Cancel
                        </TextButton>
                        <PrimaryButton
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                deleteCustomParam({
                                    projectId,
                                    customParamID: parameter?.customParamID,
                                });
                            }}
                            style={{ backgroundColor: Colors.accent.red }}
                        >
                            Delete
                        </PrimaryButton>
                    </>
                ) : (
                    <CircularProgress
                        style={{
                            width: '24px',
                            height: '24px',
                            color: Colors.brand.secondary,
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default DeleteCustomParameter;
