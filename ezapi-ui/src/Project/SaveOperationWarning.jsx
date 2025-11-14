import CloseIcon from '@material-ui/icons/Close';
import { PrimaryButton, TextButton } from '../shared/components/AppButton';
import AppIcon from '../shared/components/AppIcon';

const SaveOperationWarning = ({ onClose, onDontSave, saveProject }) => {
    return (
        <div>
            <div className="p-4 flex flex-row justify-between border-b-1">
                <p className="text-subtitle2">Save Operation</p>
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
                <p className="text-overline2">Looks like there are some unsaved changes. Do you want to save them ?</p>
            </div>
            <div className="p-4 border-t-1 flex flex-row justify-end">
                <TextButton
                    onClick={(e) => {
                        e?.preventDefault();
                        e?.stopPropagation();

                        onDontSave();
                    }}
                >
                    Don't Save
                </TextButton>

                <PrimaryButton
                    onClick={(e) => {
                        e?.preventDefault();
                        e?.stopPropagation();

                        saveProject();
                    }}
                >
                    Save
                </PrimaryButton>
            </div>
        </div>
    );
};

export default SaveOperationWarning;
