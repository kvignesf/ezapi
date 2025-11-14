import { Dialog, DialogContent } from '@mui/material';
import { ThreeDots } from 'react-loader-spinner';

const LoadingDialog = () => {
    return (
        <Dialog
            open={true}
            disableEscapeKeyDown
            onClose={(event, reason) => {
                if (reason !== 'backdropClick') {
                    // Handle your close dialog logic here
                }
            }}
            PaperProps={{ style: { backgroundColor: 'transparent', boxShadow: 'none' } }}
        >
            <DialogContent>
                <ThreeDots height="30" width="30" color="white" visible={true} />
            </DialogContent>
        </Dialog>
    );
};

export default LoadingDialog;
