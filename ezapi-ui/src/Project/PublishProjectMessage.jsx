import { CircularProgress } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import _ from 'lodash';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useGetBasicProduct } from '../ProjectPayment/paymentQueries';
import { PrimaryButton, TextButton } from '../shared/components/AppButton';
import AppIcon from '../shared/components/AppIcon';
import Messages from '../shared/messages';
import routes from '../shared/routes';
import { ReactComponent as FailureLogo } from '../static/images/failure-icon.svg';

const PublishProjectMessage = ({
    publishProjectError,
    publishProjectData,
    project,
    mandMappingErr,
    onButtonClick,
    onClose,
}) => {
    const {
        isLoading: isLoadingBasicProduct,
        isFetching: isLoadingBasicProductBg,
        data: basicProductDetails,
        error: getBasicProductError,
        refetch: getBasicProductDetails,
    } = useGetBasicProduct({
        enabled: false,
    });
    const isHavingPublishErrors = () => {
        return !_.isEmpty(publishProjectError?.response?.data?.errorType);
    };

    const history = useHistory();

    const isAllowedProjectsLimitReached = () => {
        return publishProjectError?.response?.data?.errorType === 'ALLOWED_PROJECTS_LIMIT_EXHAUSTED';
    };

    const isPublishLimitReached = () => {
        return publishProjectError?.response?.data?.errorType === 'PUBLISH_LIMIT_REACHED';
    };

    const isFreePublishesExhausted = () => {
        return publishProjectError?.response?.data?.errorType === 'FREE_PROJECTS_EXHAUSTED';
    };

    const isTrialPeriodExpired = () => {
        return publishProjectError?.response?.data?.errorType === 'TRIAL_PERIOD_EXPIRED';
    };

    useEffect(() => {
        if (project && isFreePublishesExhausted()) {
            getBasicProductDetails();
        }
    }, [project]);

    return (
        <div>
            <div className="p-2 flex flex-row justify-between border-b-1">
                <p className="text-subtitle2">
                    {publishProjectData?.success
                        ? 'Publish Successful'
                        : isFreePublishesExhausted()
                        ? 'Upgrade Plan'
                        : isPublishLimitReached()
                        ? 'Republish Limit Exceeded'
                        : isAllowedProjectsLimitReached()
                        ? 'Allowed Project Limit Exceeded'
                        : mandMappingErr
                        ? 'Alert'
                        : 'Publish Failure'}
                </p>
                <AppIcon
                    onClick={(e) => {
                        e?.preventDefault();
                        e?.stopPropagation();

                        onClose();
                    }}
                >
                    <CloseIcon />
                </AppIcon>
            </div>
            <div className="p-4 py-6">
                {publishProjectData?.success ? (
                    <p className="text-overline2">{`Project ${project?.projectName} successfully published. You can now download the specs and artifacts.`}</p>
                ) : mandMappingErr ? (
                    <div className="flex flex-col items-center align-middle self-center justify-center p-2 py-6">
                        <FailureLogo width={60} height={60} className=" mb-5" />
                        <p className="text-overline2 ">{Messages.MANDATORY_MAPPING_MSG}</p>
                    </div>
                ) : (
                    <p className="text-overline2">{publishProjectData?.message}</p>
                )}

                {publishProjectError && !isHavingPublishErrors() && (
                    <p className="text-overline2">{publishProjectError?.message}</p>
                )}

                {publishProjectError && isTrialPeriodExpired() && (
                    <p className="text-accent-red text-overline2">{publishProjectError?.response?.data?.message}</p>
                )}

                {publishProjectError && isAllowedProjectsLimitReached() && (
                    <p className="text-accent-red text-overline2">{publishProjectError?.response?.data?.message}</p>
                )}

                {publishProjectError && isPublishLimitReached() && (
                    <div>
                        <p className="text-overline3 uppercase mb-3">
                            Republish Limit:
                            <span className="text-accent-red ml-2">{`${project?.publishCount}/${project?.publishLimit}`}</span>
                        </p>
                        <p className="text-overline2">
                            Republish limit exceeded for this project. If you want republish again, please Upgrade your
                            plan.
                        </p>
                    </div>
                )}

                {publishProjectError && isFreePublishesExhausted() && (
                    <p className="text-overline2">
                        You have reached your published project limit. You can still publish this project by upgrading.
                    </p>
                )}

                {isFreePublishesExhausted() && (
                    <div className="mt-6">
                        {isLoadingBasicProduct ||
                            (isLoadingBasicProductBg && (
                                <div className="flex flex-row">
                                    <CircularProgress
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            marginRight: '0.5rem',
                                        }}
                                    />
                                    <p className="text-overline2">Fetching basic plan details</p>
                                </div>
                            ))}

                        {getBasicProductError && <p className="text-overline2">Failed to load basic plan details</p>}

                        {basicProductDetails && !isLoadingBasicProduct && !isLoadingBasicProductBg && (
                            <p className="text-subtitle1">
                                {`$${basicProductDetails?.product?.price}`}
                                <span className="text-overline2 ml-2">per project</span>
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="border-t-1 flex flex-row items-center p-4">
                {isFreePublishesExhausted() && (
                    <PrimaryButton
                        onClick={() => {
                            history.push(routes.pricing);
                        }}
                    >
                        Upgrade
                    </PrimaryButton>
                )}

                <div className="flex-1 flex flex-row justify-end">
                    <TextButton
                        onClick={(e) => {
                            e?.preventDefault();
                            e?.stopPropagation();

                            onClose();
                        }}
                    >
                        Cancel
                    </TextButton>

                    {isPublishLimitReached() || isTrialPeriodExpired() || isAllowedProjectsLimitReached() ? (
                        <PrimaryButton
                            onClick={() => {
                                history.push(routes.pricing);
                            }}
                        >
                            Upgrade
                        </PrimaryButton>
                    ) : (
                        <PrimaryButton
                            onClick={(e) => {
                                e?.preventDefault();
                                e?.stopPropagation();

                                onButtonClick();
                            }}
                        >
                            {isFreePublishesExhausted() ? 'Purchase' : mandMappingErr ? 'Proceed' : 'OK'}
                        </PrimaryButton>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublishProjectMessage;
