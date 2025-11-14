import { makeStyles } from '@material-ui/core';
import imageLogo from '../../../../static/images/logo/ConekttoLogoWithText.png';
import KeyBoardShortcuts from './KeyBoardShortcuts';

const useStyles = makeStyles((theme) => ({
    logo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
    },
}));
export default function DefaultPage() {
    const classes = useStyles();
    return (
        <div>
            <div className={classes.logo}>
                <img
                    src={imageLogo}
                    alt="conektto logo"
                    className="p-1"
                    style={{ maxHeight: '55px', padding: '1px' }}
                />
                <h1 style={{ fontSize: '15px' }}>Collections</h1>
            </div>

            <KeyBoardShortcuts />
        </div>
    );
}
