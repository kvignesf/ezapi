import CloseIcon from '@material-ui/icons/Close';
import { useHistory } from 'react-router-dom';
import Scrollbar from 'react-smooth-scrollbar';
import { PrimaryButton, TextButton } from '../shared/components/AppButton';
import AppIcon from '../shared/components/AppIcon';
import routes from '../shared/routes';

const ProjectVerificationErrors = ({ onClose, error }) => {
    //console.log("error1", error )
    //console.log("errro", error.message)
    const getLocationName = (responseItem) => {
        let location;

        if (responseItem?.resource_name) {
            location = '/' + responseItem?.resource_name;
        }

        if (responseItem?.path_name) {
            location += '/' + responseItem?.path_name;
        }

        if (responseItem?.operation_name) {
            location += '/' + responseItem?.operation_name;
        }

        return location;
    };
    const history = useHistory();
    //console.log("...",Array.isArray(error?.message))

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

            <div className="p-4">
                <p className="text-overline2 mb-2">
                    Looks like there are a few issues found in this project. Kindly resolve them to proceed.
                </p>

                {/* <div className="max-h-96">
          <p className="text-overline2 mb-1 text-accent-red">{`- ${
            error?.message ?? ""
          }`}</p>
        </div> */}
                {Array.isArray(error?.message) ? (
                    <Scrollbar>
                        <div className="max-h-96">
                            {error?.message?.map((responseItem) => {
                                return (
                                    <div className="mb-2">
                                        {getLocationName(responseItem) && (
                                            <p className="text-overline1 mb-1">{getLocationName(responseItem)}</p>
                                        )}
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
                ) : (
                    <div className="max-h-96">
                        <p className="text-overline2 mb-1 text-accent-red">{`- ${error?.message ?? ''}`}</p>
                    </div>
                )}
            </div>
            <div className="border-t-1 p-4 flex flex-row justify-end">
                {error?.message.includes('upgrade') ? (
                    <>
                        <TextButton
                            onClick={(e) => {
                                e?.preventDefault();
                                e?.stopPropagation();

                                onClose();
                            }}
                        >
                            Cancel
                        </TextButton>

                        <PrimaryButton
                            onClick={() => {
                                history.push(routes.pricing);
                            }}
                        >
                            Upgrade
                        </PrimaryButton>
                    </>
                ) : (
                    <PrimaryButton
                        onClick={(e) => {
                            e?.preventDefault();
                            e?.stopPropagation();

                            onClose();
                        }}
                    >
                        OK
                    </PrimaryButton>
                )}
            </div>
        </div>
    );
};

export default ProjectVerificationErrors;
