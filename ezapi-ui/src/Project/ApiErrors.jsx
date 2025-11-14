import CloseIcon from '@material-ui/icons/Close';

import { PrimaryButton } from '../shared/components/AppButton';
import AppIcon from '../shared/components/AppIcon';

const ApiErrors = ({ onClose, error }) => {
    return (
        <div
            className="flex flex-col"
            onClick={(e) => {
                e?.preventDefault();
                e?.stopPropagation();
            }}
        >
            <div className="flex flex-row p-4 justify-between border-b-1">
                <p className="text-subtitle2">Simulation Failure</p>
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

            <div className="p-4">
                <p className="text-overline2 mb-2">
                    Looks like there are a few issues found in this project. Please resolve/retry to proceed.
                </p>

                {error?.body ? (
                    <div className="max-h-96">
                        <p className="text-overline2 mb-1 text-accent-red">{`- ${error?.body?.message ?? ''}`}</p>
                    </div>
                ) : (
                    <div className="max-h-96">
                        <p className="text-overline2 mb-1 text-accent-red">{`- ${error?.message ?? ''}`}</p>
                    </div>
                )}
            </div>
            <div className="border-t-1 p-4 flex flex-row justify-end">
                <PrimaryButton
                    onClick={(e) => {
                        e?.preventDefault();
                        e?.stopPropagation();

                        onClose();
                    }}
                >
                    OK
                </PrimaryButton>
            </div>
        </div>
    );
};

export default ApiErrors;
