import classNames from 'classnames';

const ErrorWithMessage = ({ message, className, contained = false, isError = false }) => {
    return (
        <div
            className={classNames(
                'flex flex-col justify-center items-center',
                {
                    'w-full h-screen': !contained,
                },
                `${className}`,
            )}
            style={isError ? { color: 'red' } : {}}
        >
            <p className="text-overline2">{message}</p>
        </div>
    );
};

export default ErrorWithMessage;
