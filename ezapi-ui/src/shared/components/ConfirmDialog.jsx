import { Dialog, DialogContent, DialogTitle, Typography } from '@material-ui/core';
import { PrimaryButton, TextButton } from './AppButton';

const ConfirmDialog = ({ title, description, onCancel, onConfirm }) => {
    return (
        <Dialog open={true} maxWidth="sm" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Typography>{description}</Typography>
            </DialogContent>
            <div className="border-t-2 border-neutral-gray7 flex flex-row items-center justify-end p-4 mt-3">
                <TextButton
                    onClick={() => {
                        onCancel();
                    }}
                    classes="mr-3"
                >
                    Cancel
                </TextButton>

                <PrimaryButton
                    type="submit"
                    classes="bg-accent-red"
                    onClick={() => {
                        onConfirm();
                    }}
                >
                    Delete
                </PrimaryButton>
            </div>
        </Dialog>
    );
};

export default ConfirmDialog;
