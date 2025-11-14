import CloseIcon from '@material-ui/icons/Close';
import { PrimaryButton } from '../shared/components/AppButton';
import AppIcon from '../shared/components/AppIcon';

const VerifyProjectError = ({ error, onClose, onRetry }) => {
    return (
        <div
            className="flex flex-col"
            onClick={(e) => {
                e?.preventDefault();
                e?.stopPropagation();
            }}
        >
            <div className="flex flex-row p-4 justify-between border-b-1">
                <p className="text-subtitle2">Project Validation Failure</p>
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

            <p className="text-overline2 p-4 my-2">Failed to validate the project. Do you wish to retry ?</p>

            <div className="border-t-1 p-4 flex flex-row justify-end">
                <PrimaryButton
                    onClick={(e) => {
                        e?.preventDefault();
                        e?.stopPropagation();

                        onRetry();
                    }}
                >
                    Retry
                </PrimaryButton>
            </div>
        </div>
    );
};

export default VerifyProjectError;
