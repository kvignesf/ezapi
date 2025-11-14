import { CircularProgress } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import _ from 'lodash';
import Scrollbar from 'react-smooth-scrollbar';
import { PrimaryButton } from '../shared/components/AppButton';
import AppIcon from '../shared/components/AppIcon';
import Messages from '../shared/messages';
import { ReactComponent as FailureLogo } from '../static/images/failure-icon.svg';
import { ReactComponent as SuccessLogo } from '../static/images/success-icon.svg';

const PublishStatusDialog = ({
    onButtonClick,
    onClose,
    project,
    verifyProjectMutation: {
        isLoading: isVerifyingProject,
        isSuccess: isVerifyProjectSuccess,
        data: verifyProjectData,
        error: verifyProjectError,
    },
    publishProjectMutation: {
        isLoading: isPublishingProject,
        isSuccess: isPublishProjectSuccess,
        data: publishProjectData,
        error: publishProjectError,
    },
}) => {
    const isProjectHavingErrors = () =>
        isVerifyProjectSuccess && verifyProjectData?.response && !_.isEmpty(verifyProjectData?.response);

    const getContent = () => {
        if (isVerifyingProject) {
            return <p className="text-overline2">Validating Project</p>;
        } else if (isProjectHavingErrors()) {
            return (
                <div>
                    <p className="text-overline2 mb-2">
                        Looks like there are a few issues found in this project. Kindly resolve them.
                    </p>
                    <Scrollbar>
                        <div className="max-h-96">
                            {verifyProjectData?.response?.map((responseItem) => {
                                return (
                                    <div className="mb-2">
                                        <p className="text-overline1 mb-1">{`/${responseItem?.resource_name}/${responseItem?.path_name}/${responseItem?.operation_name}`}</p>

                                        {responseItem?.errors?.map((errorMessage) => {
                                            return (
                                                <p className="text-overline2 mb-1 text-accent-red">{`- ${errorMessage}`}</p>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </Scrollbar>
                </div>
            );
        } else if (verifyProjectError) {
            return <p className="text-overline2">{Messages.VALIDATE_RETRY}</p>;
        } else if (isPublishingProject) {
            return <p className="text-overline2">Publishing project.</p>;
        } else if (publishProjectError) {
            return <p className="text-overline2">{Messages.PUBLISH_RETRY}</p>;
        } else if (isPublishProjectSuccess) {
            return (
                <div>
                    {publishProjectData?.success ? (
                        <p className="text-overline2">{Messages.publishSuccess(project?.projectName)}</p>
                    ) : (
                        <p className="text-overline2">{publishProjectData?.message}</p>
                    )}
                </div>
            );
        }

        return '-';
    };

    const getTitle = () => {
        if (isVerifyingProject) {
            return 'Project Validation';
        } else if (verifyProjectError || isProjectHavingErrors()) {
            return 'Project Validation Failure';
        } else if (isPublishingProject) {
            return 'Project Publish';
        } else if (publishProjectError) {
            return 'Project Publish Failure';
        } else if (isPublishProjectSuccess) {
            return 'Project Publish Success';
        }
    };

    return (
        <div>
            <div className="p-4 flex flex-row justify-between border-b-1">
                <p className="text-subtitle2">{getTitle()}</p>
                {!isPublishingProject && !isVerifyingProject && (
                    <AppIcon
                        onClick={(e) => {
                            e?.preventDefault();
                            e?.stopPropagation();

                            onClose();
                        }}
                    >
                        <CloseIcon />
                    </AppIcon>
                )}
            </div>

            <div className="p-4 py-6">
                {isPublishProjectSuccess ? (
                    <div className="w-full flex flex-col items-center justify-center mb-3">
                        <SuccessLogo className="mb-2" />
                        <p className="text-subtitle2">Successful!</p>
                    </div>
                ) : publishProjectError || verifyProjectError || isProjectHavingErrors() ? (
                    <div className="w-full flex flex-col items-center justify-center mb-3">
                        <FailureLogo className="mb-2" />
                        <p className="text-subtitle2">Failure!</p>
                    </div>
                ) : null}

                {getContent()}
            </div>

            <div className="p-4 border-t-1 flex flex-row justify-end">
                {!isPublishingProject && !isVerifyingProject ? (
                    <PrimaryButton
                        onClick={(e) => {
                            e?.preventDefault();
                            e?.stopPropagation();

                            onButtonClick();
                        }}
                    >
                        OK
                    </PrimaryButton>
                ) : (
                    <CircularProgress size={24} />
                )}
            </div>
        </div>
    );
};

export default PublishStatusDialog;
