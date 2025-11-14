import { Dialog } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useFetchProjectDetails, useSubmitProject } from '../Project/projectQueries';
import AppIcon from '../shared/components/AppIcon';
import ErrorWithMessage from '../shared/components/ErrorWithMessage';
import EzapiFooter from '../shared/components/EzapiFooter';
import EzapiLogo from '../shared/components/EzapiLogo';
import InitialsAvatar from '../shared/components/InitialsAvatar';
import LoaderWithMessage from '../shared/components/LoaderWithMessage';
import ProfileMenu from '../shared/components/ProfileMenu';
import client, { endpoint } from '../shared/network/client';
import { queries } from '../shared/network/queryClient';
import { useLogout } from '../shared/query/authQueries';
import routes from '../shared/routes';
import { getAccessToken, getEmailId, getFirstName, getLastName } from '../shared/storage';
import BillingDetailsForm from './BillingDetailsForm';
import CardDetailsForm from './CardDetailsForm';
import PaymentStatusDialog from './PaymentStatusDialog';
import ProductDetails from './ProductDetails';
import { useConfirmPayment, useGetBasicProduct, useGetBillingDetails, useInitiatePayment } from './paymentQueries';

const acc_token = getAccessToken();

const Header = ({ projectDetails, logoutMutation: { isLoading: isLoggingOut, mutate: logout } }) => {
    const history = useHistory();
    const firstName = getFirstName();
    const lastName = getLastName();
    const [profileMenuAnchorEl, setProfilemenuAnchorEl] = useState(false);

    const navigateBack = () => {
        history.push(routes.pricing);
        // history.goBack();
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
const pricingData = async () => {
    //const user_id = getUserId();

    /* const { data } = await client.get(endpoint.products2, {
    headers: {
      user_id: user_id
    }
  }); */

    const { data } = await client.get(endpoint.products2);
    // priceIDFinder(data);
    // console.log(data);
    return data;
};
export const usePricingData = () => {
    return useQuery([queries.products], pricingData, {
        refetchOnWindowFocus: false,
    });
};

const ProjectPayment = (props) => {
    const userProfile = async () => {
        try {
            const { data } = await client.get(endpoint.userProfile, {
                headers: {
                    Authorization: acc_token,
                },
            });

            return data;
        } catch (error) {}
    };
    const { data } = useQuery('userProfileKey', userProfile, {
        refetchOnWindowFocus: false,
    });
    // console.log(data?.['subscribed_price']);

    const location = useLocation();
    const [durationDefault, setDurationDefault] = React.useState(false);
    const [typeDefault, setTypeDefault] = React.useState(false);
    const [priceDefault, setPriceDefault] = React.useState();
    const [currentPlan, setCurrentPlan] = React.useState();
    const [addCardResponseID, setAddCardResponseID] = React.useState();
    const [cityName, setCityName] = React.useState('');
    const [countryName, setCountryName] = React.useState('');
    const [line1Name, setLine1Name] = React.useState('');
    const [stateName, setStateName] = React.useState('');
    const [postalCodeName, setPostalCodeName] = React.useState('');
    useEffect(() => {
        setCurrentPlan(data?.['subscribed_price']);
    });
    useEffect(() => {
        let selectedPlanType;
        console.log(location.state?.['duration']);
        if (location.state?.['duration'] === 'M') {
            selectedPlanType = 'mo';
        } else {
            selectedPlanType = 'yr';
        }
        setDurationDefault(selectedPlanType);
        setTypeDefault(location.state?.['type']);
        setPriceDefault(location.state?.['price']);
    }, [location]);

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
    const [tokenID, setTokenID] = useState();
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
    // console.log(initiatePaymentData);
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
                token: tokenID,
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

    const acc_token = getAccessToken();
    // console.log(acc_token);

    const { data: pricing_data } = usePricingData();
    let priceIDData = '';
    function priceIDFinder(type, duration) {
        if (!_.isEmpty(pricing_data?.products)) {
            pricing_data['products'].map((item, index) => {
                if (type == item['plan_name']) {
                    durationFinder(item, duration);
                }
            });
        }
    }
    function durationFinder(item, duration) {
        if (_.isEmpty(item['stripe'])) {
            return 'Trial cant be subscribed';
        }
        item['stripe'].map((item2, index2) => {
            //console.log("duration", duration)
            //console.log("lan_interval", item2["plan_interval"])
            if (duration == item2['plan_interval']) {
                // console.log(item2["price_id"]);
                priceIDData = item2['price_id'];
                return item2['price_id'];
            }
        });
    }

    const initiatePaymentProcess = async (billingDetails, type, duration) => {
        switch (type) {
            case 10:
                type = 'COMMUNITY';
                break;
            case 20:
                type = 'Basic';
                break;
            case 30:
                type = 'PRO';
                break;
        }
        switch (duration) {
            case 10:
                duration = 'month';
                break;
            case 20:
                duration = 'year';
                break;
        }
        //console.log("type", type)
        //console.log("duration", duration)
        priceIDFinder(type, duration);

        const { token, error } = await stripe.createToken(elements.getElement(CardElement), {
            headers: {
                Authorization: process.env.REACT_APP_STRIPE_KEY,
            },
        });

        setTokenID(token?.['id']);

        if (
            billingDetailsRef.current.isValid &&
            cardDetailsRef.current.isValid &&
            billingDetailsRef?.current?.values?.fullName &&
            billingDetailsRef?.current?.values?.addressLine1
        ) {
            initiatePaymentProcess2(billingDetailsRef.current.values, token?.['id']);
        }
    };

    const initiatePaymentProcess2 = async (billingDetails, token) => {
        initiatePayment({
            currentPlan: currentPlan,
            token: token,
            priceIDData: priceIDData,
            billingDetails: billingDetailsRef?.current?.values,
        });
    };

    const navigateBack = () => {
        history.push(routes.pricing);
    };

    const navigateToDashboard = () => {
        // history.goBack();
        history.replace(routes.projects);
    };

    const handleCloseDialog = () => {
        resetVerifyMutation();
        resetPublishMutation();

        if (isPaymentSuccess()) {
            resetConfirmPayment();
            resetInitiatePayment();
            resetVerifyMutation();
            resetPublishMutation();
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
        history.push(routes.payment);
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

    const shouldShowDialogForPayment = () => isInitiatingPayment || initiatePaymentError || isInitiatePaymentSuccess;
    // isConfirmingPayment ||
    // confirmPaymentError ||
    // confirmPaymentData ||
    // isConfirmPaymentSuccess;

    const shouldShowDialogForPublish = () =>
        isVerifyingProject ||
        verifyProjectError ||
        verifyProjectData ||
        isPublishingProject ||
        publishProjectError ||
        publishProjectData;

    const canShowAutoPopulationButton = () => {
        return true;
        // console.log(confirmPaymentMutation);
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
                        onButtonClick={() => {
                            if (isInitiatePaymentSuccess) {
                                resetInitiatePayment();
                                history.push(routes.pricing);
                            } else {
                                resetInitiatePayment();
                            }
                        }}
                        onClose={() => {
                            resetInitiatePayment();
                        }}
                        initiatePaymentMutation={initiatePaymentMutation}
                        confirmPaymentMutation={confirmPaymentMutation}
                    />
                )}
            </Dialog>

            <Header projectDetails={projectDetails} logoutMutation={logoutMutation} />
            <div className="w-full flex flex-row p-12 h-full mt-14">
                {basicProductData && (
                    <div className="flex-1 mr-6 px-6">
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
                            type={typeDefault}
                            duration={durationDefault}
                            priceId={priceDefault}
                            product={basicProductData?.product}
                            disabled={isInitiatingPayment || isConfirmingPayment || isLoggingOut}
                            project={projectDetails}
                            onPurchaseClick={(type, duration) => {
                                billingDetailsRef.current.handleSubmit();
                                cardDetailsRef.current.handleSubmit();
                                if (
                                    billingDetailsRef.current.isValid &&
                                    cardDetailsRef.current.isValid &&
                                    billingDetailsRef?.current?.values?.fullName &&
                                    billingDetailsRef?.current?.values?.addressLine1
                                ) {
                                    initiatePaymentProcess(billingDetailsRef.current.values, type, duration);
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
