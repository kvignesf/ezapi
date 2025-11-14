import CloseIcon from '@material-ui/icons/Close';
import { PrimaryButton } from '../shared/components/AppButton';
import AppIcon from '../shared/components/AppIcon';

const RepublishInfo = ({ project, onClose }) => {
    return (
        <div>
            <div className="p-4 flex flex-row justify-between border-b-1">
                <p className="text-subtitle2">Republish Limit</p>
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
                <p className="text-overline3 uppercase mb-3">
                    Republish Limit:
                    <span className="text-accent-red ml-2">{`${project?.publishCount}/${project?.publishLimit}`}</span>
                </p>
                <p className="text-overline2">
                    For a published project, you can
                    <span className="font-bold ml-1">
                        Republish {project?.publishLimit - project?.publishCount} more times
                    </span>
                </p>
            </div>
            <div className="p-4 border-t-1 flex flex-row justify-end">
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

export default RepublishInfo;
