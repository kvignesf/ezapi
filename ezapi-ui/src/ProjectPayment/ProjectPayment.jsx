import { Dialog } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { useFetchProjectDetails, useSubmitProject } from '../Project/projectQueries';
import AppIcon from '../shared/components/AppIcon';
import ErrorWithMessage from '../shared/components/ErrorWithMessage';
import EzapiFooter from '../shared/components/EzapiFooter';
import EzapiLogo from '../shared/components/EzapiLogo';
import InitialsAvatar from '../shared/components/InitialsAvatar';
import LoaderWithMessage from '../shared/components/LoaderWithMessage';
import ProfileMenu from '../shared/components/ProfileMenu';
import { queries } from '../shared/network/queryClient';
import { useLogout } from '../shared/query/authQueries';
import routes, { generateRoute } from '../shared/routes';
import { getEmailId, getFirstName, getLastName } from '../shared/storage';
import BillingDetailsForm from './BillingDetailsForm';
import CardDetailsForm from './CardDetailsForm';
import PaymentStatusDialog from './PaymentStatusDialog';
import ProductDetails from './ProductDetails';
import PublishStatusDialog from './PublishStatusDialog';
import { useConfirmPayment, useGetBasicProduct, useGetBillingDetails, useInitiatePayment } from './paymentQueries';

const Header = ({ projectDetails, logoutMutation: { isLoading: isLoggingOut, mutate: logout } }) => {
    const history = useHistory();
    const firstName = getFirstName();
    const lastName = getLastName();
    const [profileMenuAnchorEl, setProfilemenuAnchorEl] = useState(false);

    const navigateBack = () => {
        history.goBack();
    };

    const handleProfileMenuClick = (event) => {
        setProfilemenuAnchorEl(event?.currentTarget);
    };

    return (
        <header className="fixed top-0 w-full z-999 px-2 border-b-2 flex flex-row justify-between items-center bg-white">
            <div className="flex flex-row py-2 items-center">
                <AppIcon
                    style={{ marginRight: '1rem' }}
                    onClick={(event) => {
                        event?.preventDefault();
                        event?.stopPropagation();

                        navigateBack();
                    }}
                >
                    <ArrowBackIcon />
                </AppIcon>

                <p className="text-overline1 mr-3">{projectDetails?.projectName}</p>

                <EzapiLogo />
            </div>

            <div className="flex flex-row py-2">
                <div>
                    <InitialsAvatar
                        firstName={firstName}
                        lastName={lastName}
                        className="cursor-pointer"
                        onClick={(e) => {
                            e?.preventDefault();
                            e?.stopPropagation();

                            handleProfileMenuClick(e);
                        }}
                    />

                    <ProfileMenu
                        onLogout={logout}
                        profileMenuAnchorEl={profileMenuAnchorEl}
                        setProfilemenuAnchorEl={setProfilemenuAnchorEl}
                    />
                </div>
            </div>
        </header>
    );
};

const ProjectPayment = () => {
    const { projectId } = useParams();
    const history = useHistory();
    const {
        isLoading: isFetchingProjectDetails,
        isFetching: isFetchingProjectDetailsBg,
        isSuccess: isProjectDetailsFetched,
        error: projectDetailsError,
        data: projectDetails,
    } = useFetchProjectDetails(projectId, {
        refetchOnWindowFocus: false,
    });
    const logoutMutation = useLogout();
    const { isLoading: isLoggingOut, mutate: logout } = logoutMutation;
    // const {
    //   isLoading: isFetchingProducts,
    //   isFetching: isFetchingProductsBg,
    //   error: productsError,
    //   data: productsData,
    // } = useGetProducts(projectId);
    const {
        isLoading: isFetchingBasicProduct,
        isFetching: isFetchingBasicProductBg,
        error: getBasicProductError,
        data: basicProductData,
    } = useGetBasicProduct();
    const initiatePaymentMutation = useInitiatePayment();
    const confirmPaymentMutation = useConfirmPayment();
    const [userRole, setRole] = useState(null);
    const [dialog, setDialog] = useState({
        show: false,
        data: null,
        type: null,
    });
    const billingDetailsRef = useRef();
    const cardDetailsRef = useRef();
    const stripe = useStripe();
    const elements = useElements();
    const {
        isLoading: isInitiatingPayment,
        error: initiatePaymentError,
        data: initiatePaymentData,
        isSuccess: isInitiatePaymentSuccess,
        mutate: initiatePayment,
        reset: resetInitiatePayment,
    } = initiatePaymentMutation;
    const {
        isLoading: isConfirmingPayment,
        error: confirmPaymentError,
        isSuccess: isConfirmPaymentSuccess,
        data: confirmPaymentData,
        mutate: confirmPayment,
        reset: resetConfirmPayment,
    } = confirmPaymentMutation;
    const queryClient = useQueryClient();
    const { verifyProjectMutation, publishProjectMutation } = useSubmitProject(projectId);
    const {
        isLoading: isPublishingProject,
        isSuccess: isPublishProjectSuccess,
        data: publishProjectData,
        error: publishProjectError,
        mutate: publish,
        reset: resetPublishMutation,
    } = publishProjectMutation;
    const {
        isLoading: isVerifyingProject,
        isSuccess: isVerifyProjectSuccess,
        data: verifyProjectData,
        error: verifyProjectError,
        mutate: verify,
        reset: resetVerifyMutation,
    } = verifyProjectMutation;
    const {
        isLoading: isFetchingBillingDetails,
        isFetching: isFetchingBillingDetailsBg,
        isSuccess: isBillingDetailsSuccess,
        data: billingDetailsData,
        error: fetchBillingDetailsError,
        mutate: getBillingDetails,
    } = useGetBillingDetails(projectId);

    useEffect(() => {
        if (!_.isEmpty(projectId)) {
            getBillingDetails({ projectId });
        }
    }, [projectId]);

    useEffect(() => {
        if (isInitiatePaymentSuccess && !_.isEmpty(initiatePaymentData?.clientSecret)) {
            confirmPayment({
                secret: initiatePaymentData?.clientSecret,
                card: elements.getElement(CardElement),
                billingDetails: billingDetailsRef?.current?.values,
                // billingDetails: {},
                stripe,
            });
        }
    }, [isInitiatePaymentSuccess, initiatePaymentData]);

    useEffect(() => {
        if (billingDetailsData?.isDataAvailable && !_.isEmpty(billingDetailsData?.data)) {
            billingDetailsRef?.current?.setValues({
                addressLine1: billingDetailsData?.data?.address?.line1,
                addressLine2: billingDetailsData?.data?.address?.line2,
                zip: billingDetailsData?.data?.address?.postal_code,
                city: billingDetailsData?.data?.address?.city,
                country: billingDetailsData?.data?.address?.country,
                state: billingDetailsData?.data?.address?.state,
                fullName: billingDetailsData?.data?.name,
                email: billingDetailsData?.data?.email,
                phone: billingDetailsData?.data?.phone,
            });
        }
    }, [billingDetailsData]);

    useEffect(() => {
        if (projectDetails) {
            // Fetch and set user role
            if (projectDetails?.members && !_.isEmpty(projectDetails?.members)) {
                const userEmail = getEmailId();
                const currentUserDetails = projectDetails?.members?.find((member) => member?.email === userEmail);

                setRole(currentUserDetails?.role);
            }

            // Project is not valid state
            if (
                projectDetails?.status?.toLowerCase() !== 'in_progress' &&
                projectDetails?.status?.toLowerCase() !== 'complete'
            ) {
                navigateBack();
            }

            // Cannot make payment
            if (projectDetails?.projectBillingPlan?.toLowerCase() !== 'none') {
                navigateBack();
            }
        }
    }, [projectDetails]);

    useEffect(() => {
        // User no access
        if (projectDetailsError?.message?.toLowerCase() === 'no_access') {
            navigateBack();
        }
    }, [projectDetailsError]);

    // Auto publish after successful payment
    useEffect(() => {
        if (isPaymentSuccess()) {
            resetConfirmPayment();
            resetInitiatePayment();
            resetVerifyMutation();
            resetPublishMutation();

            verify({ projectId });
        }
    }, [isConfirmPaymentSuccess, confirmPaymentData]);

    const initiatePaymentProcess = (billingDetails) => {
        if (_.isEmpty(initiatePaymentData?.clientSecret)) {
            initiatePayment({
                projectId,
                productId: basicProductData?.product?.productId,
                billingDetails,
                // orderId,
            });
        } else {
            confirmPayment({
                secret: initiatePaymentData?.clientSecret,
                card: elements.getElement(CardElement),
                billingDetails: billingDetailsRef?.current?.values,
                stripe,
            });
        }
    };

    const navigateBack = () => {
        // history.goBack();
        // history.replace(generateRoute(routes.projects, projectId),);
        history.replace({
            pathname: generateRoute(routes.projects, projectId),
            state: { allow: true },
        });
    };

    const navigateToDashboard = () => {
        // history.goBack();
        // history.replace(routes.projects);
        history.replace({
            pathname: routes.projects,
            state: { allow: true },
        });
    };

    const handleCloseDialog = () => {
        resetVerifyMutation();
        resetPublishMutation();

        if (isPaymentSuccess()) {
            resetConfirmPayment();
            resetInitiatePayment();
            invalidateProject();
            navigateBack();
            return;
        } else if (initiatePaymentError) {
            resetInitiatePayment();
        }

        resetConfirmPayment();

        setDialog({
            show: false,
            type: null,
            data: null,
        });
    };

    const isPaymentSuccess = () => {
        return isConfirmPaymentSuccess && confirmPaymentData?.paymentIntent?.status === 'succeeded';
    };

    const invalidateProject = () => {
        queryClient.invalidateQueries(`${queries.projects}-${projectId}`);
    };

    if (isFetchingProjectDetails) {
        return (
            <div className="flex flex-col">
                <Header projectDetails={projectDetails} logoutMutation={logoutMutation} />

                <LoaderWithMessage message="Loading project details" />
            </div>
        );
    }

    if (isFetchingBillingDetails || isFetchingBillingDetailsBg) {
        return (
            <div className="flex flex-col">
                <Header projectDetails={projectDetails} logoutMutation={logoutMutation} />

                <LoaderWithMessage message="Loading billing details" />
            </div>
        );
    }

    if (projectDetailsError) {
        return (
            <div className="flex flex-col">
                <Header projectDetails={projectDetails} logoutMutation={logoutMutation} />

                <ErrorWithMessage message="Failed to fetch project details" />
            </div>
        );
    }

    if (isFetchingBasicProduct || isFetchingBasicProductBg) {
        return (
            <div className="flex flex-col">
                <Header projectDetails={projectDetails} logoutMutation={logoutMutation} />

                <LoaderWithMessage message="Loading plan details" />
            </div>
        );
    }

    if (getBasicProductError) {
        return (
            <div className="flex flex-col">
                <Header projectDetails={projectDetails} logoutMutation={logoutMutation} />

                <ErrorWithMessage message="Failed to fetch plan details" />
            </div>
        );
    }

    const shouldShowDialogForPayment = () =>
        isInitiatingPayment ||
        initiatePaymentError ||
        isConfirmingPayment ||
        confirmPaymentError ||
        confirmPaymentData ||
        isConfirmPaymentSuccess;

    const shouldShowDialogForPublish = () =>
        isVerifyingProject ||
        verifyProjectError ||
        verifyProjectData ||
        isPublishingProject ||
        publishProjectError ||
        publishProjectData;

    const canShowAutoPopulationButton = () => {
        return false;
        // const loggedInUserEmailId = getEmailId();

        // return (
        //   loggedInUserEmailId === "karthik.b@cumulations.com" ||
        //   loggedInUserEmailId === "madhuworldwide@gmail.com" ||
        //   loggedInUserEmailId === "dhirajsingh.k@cumulations.com"
        // );
    };

    return (
        <div>
            <Dialog
                aria-labelledby="payment-dialog"
                open={shouldShowDialogForPayment() || shouldShowDialogForPublish() || dialog?.show}
                fullWidth
                PaperProps={{
                    style: { borderRadius: 8 },
                }}
                onClose={(event, reason) => {
                    if (reason !== 'backdropClick') {
                    }
                }}
            >
                {shouldShowDialogForPayment() && (
                    <PaymentStatusDialog
                        onClose={handleCloseDialog}
                        onButtonClick={() => {
                            if (isPaymentSuccess()) {
                                resetConfirmPayment();
                                resetInitiatePayment();
                                resetVerifyMutation();
                                resetPublishMutation();
                                invalidateProject();
                                navigateBack();
                            } else {
                                handleCloseDialog();
                            }
                        }}
                        initiatePaymentMutation={initiatePaymentMutation}
                        confirmPaymentMutation={confirmPaymentMutation}
                    />
                )}

                {shouldShowDialogForPublish() && (
                    <PublishStatusDialog
                        onClose={() => {
                            resetConfirmPayment();
                            resetInitiatePayment();
                            resetVerifyMutation();
                            resetPublishMutation();
                            invalidateProject();
                            navigateToDashboard();
                        }}
                        onButtonClick={() => {
                            resetConfirmPayment();
                            resetInitiatePayment();
                            resetVerifyMutation();
                            resetPublishMutation();
                            invalidateProject();
                            navigateToDashboard();
                        }}
                        project={projectDetails}
                        verifyProjectMutation={verifyProjectMutation}
                        publishProjectMutation={publishProjectMutation}
                    />
                )}
            </Dialog>

            <Header projectDetails={projectDetails} logoutMutation={logoutMutation} />

            <div className="w-full flex flex-row p-12 h-full mt-14">
                {basicProductData && (
                    <div className="flex-1 mr-6 px-6">
                        {canShowAutoPopulationButton() && (
                            <button
                                className="p-1 bg-neutral-gray6 rounded-md mb-2"
                                onClick={(e) => {
                                    billingDetailsRef?.current?.setValues({
                                        fullName: 'Hello',
                                        country: 'IN',
                                        country: 'IN',
                                        addressLine1: 'Test Address',
                                        zip: '560070',
                                        city: 'Test City',
                                        state: 'Karnataka',
                                        email: 'testemail@randomdomain123.com',
                                    });
                                    cardDetailsRef?.current?.setValues({
                                        cardHolderName: 'Test card holder name',
                                    });
                                }}
                            >
                                <p className="text-overline2">Populate data</p>
                            </button>
                        )}

                        <BillingDetailsForm
                            formRef={billingDetailsRef}
                            disabled={isInitiatingPayment || isConfirmingPayment}
                        />

                        <CardDetailsForm
                            formRef={cardDetailsRef}
                            disabled={isInitiatingPayment || isConfirmingPayment}
                        />
                    </div>
                )}

                {basicProductData && (
                    <div className="flex-1">
                        <ProductDetails
                            product={basicProductData?.product}
                            disabled={isInitiatingPayment || isConfirmingPayment || isLoggingOut}
                            project={projectDetails}
                            onPurchaseClick={() => {
                                billingDetailsRef.current.handleSubmit();
                                cardDetailsRef.current.handleSubmit();

                                if (
                                    billingDetailsRef.current.isValid &&
                                    cardDetailsRef.current.isValid &&
                                    billingDetailsRef?.current?.values?.fullName &&
                                    billingDetailsRef?.current?.values?.addressLine1
                                ) {
                                    initiatePaymentProcess(billingDetailsRef.current.values);
                                }
                            }}
                        />
                    </div>
                )}
            </div>

            <EzapiFooter />
        </div>
    );
};

export default ProjectPayment;
