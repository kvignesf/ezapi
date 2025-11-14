import { CircularProgress } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { useHistory } from 'react-router-dom';
import { PrimaryButton } from '../shared/components/AppButton';
import AppIcon from '../shared/components/AppIcon';
import Messages from '../shared/messages';
import { ReactComponent as FailureLogo } from '../static/images/failure-icon.svg';
import { ReactComponent as SuccessLogo } from '../static/images/success-icon.svg';

const PaymentStatusDialog = ({
    response,
    onButtonClick,
    onClose,
    confirmPaymentMutation: {
        isLoading: isConfirmingPayment,
        error: confirmPaymentError,
        isSuccess: isConfirmPaymentSuccess,
        data: confirmPaymentData,
        mutate: confirmPayment,
        reset: resetConfirmPayment,
    },
    initiatePaymentMutation: {
        isLoading: isInitiatingPayment,
        error: initiatePaymentError,
        data: initiatePaymentData,
        isSuccess: isInitiatePaymentSuccess,
        mutate: initiatePayment,
        reset: resetInitiatePayment,
    },
}) => {
    const history = useHistory();
    // console.log(response);
    const isPaymentSuccess = () => {
        // if (response == 200) {
        //   return true;
        // } else {
        //   return false;
        // }
        return (
            isInitiatePaymentSuccess &&
            initiatePaymentData?.[0]['status'] == 200 &&
            initiatePaymentData?.[1]['status'] == 200 &&
            !initiatePaymentError
        );
    };

    const getContentMessage = () => {
        if (isInitiatingPayment) {
            return 'Initializing Payment';
        } else if (initiatePaymentError) {
            // console.log(initiatePaymentError);
            return initiatePaymentError.message;
        } else if (isConfirmingPayment) {
            return 'Confirming Payment';
        } else if (isPaymentSuccess()) {
            return 'Payment successful';
        } else if (!isPaymentSuccess()) {
            return (
                confirmPaymentData?.error?.message + ' Please try again!' ??
                confirmPaymentError?.message + ' Please try again.' ??
                Messages.PAYMENT_RETRY
            );
        }

        return '-';
    };

    return (
        <div>
            <div className="p-4 flex flex-row justify-between border-b-1">
                <p className="text-subtitle2">
                    {isInitiatingPayment
                        ? 'Payment Initialization'
                        : initiatePaymentError
                        ? 'Payment Failure'
                        : isPaymentSuccess()
                        ? 'Payment Success'
                        : 'Payment Failure'}
                </p>
                {!isInitiatingPayment && !isConfirmingPayment && (
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
                {isPaymentSuccess() ? (
                    <div className="w-full flex flex-col items-center justify-center mb-3">
                        <SuccessLogo className="mb-2" />
                        <p className="text-subtitle2">Successful!</p>
                    </div>
                ) : (initiatePaymentError || confirmPaymentError || !isPaymentSuccess()) &&
                  !isInitiatingPayment &&
                  !isConfirmingPayment ? (
                    <div className="w-full flex flex-col items-center justify-center mb-3">
                        <FailureLogo className="mb-2" />
                        <p className="text-subtitle2">Failure!</p>
                    </div>
                ) : null}

                <p className="text-overline2">{getContentMessage()}</p>
            </div>

            <div className="p-4 border-t-1 flex flex-row justify-end">
                {!isInitiatingPayment && !isConfirmingPayment ? (
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

export default PaymentStatusDialog;
