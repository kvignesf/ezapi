import { CircularProgress } from '@material-ui/core';
import classNames from 'classnames';
import Colors from '../colors';

const LoaderWithMessage = ({ message, contained = false, className = '', ...rest }) => {
    return (
        <div
            className={classNames(
                'flex flex-col items-center justify-center',
                {
                    'h-screen w-full': !contained,
                },
                `${className}`,
            )}
            {...rest}
        >
            <CircularProgress size="32px" style={{ marginBottom: '0.5rem', color: `${Colors.brand.secondary}` }} />
            <p className="text-largeLabel">{message}</p>
        </div>
    );
};

export default LoaderWithMessage;
