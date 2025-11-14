import classNames from 'classnames';

export const PrimaryButton = ({ disabled, classes, children, style, ...rest }) => {
    let classnames = classNames(
        `px-4 py-2 w-min flex items-center`,
        {
            'cursor-pointer bg-brand-secondary hover:opacity-80': !disabled,
            'bg-neutral-gray4 cursor-not-allowed': disabled,
        },
        classes,
    );

    return (
        <button
            className={classnames}
            style={{ ...style, borderRadius: '4px', border: 'none', outline: 'none' }}
            {...rest}
        >
            <p className="text-mediumLabel text-white whitespace-nowrap text-center w-full">{children}</p>
        </button>
    );
};

export const TextButton = ({ disabled, classes, children, style, ...rest }) => {
    let classnames = classNames(`px-6 py-2 w-min flex items-center ${classes}`, {
        'cursor-pointer hover:opacity-70': !disabled,
        'text-neutral-gray4': disabled,
    });

    return (
        <button className={classnames} style={{ ...style, border: 'none', outline: 'none' }} {...rest}>
            <p className="text-mediumLabel whitespace-nowrap">{children}</p>
        </button>
    );
};

export const OutlineButton = ({ disabled = false, classes, children, style, ...rest }) => {
    let classnames = classNames(`px-4 py-2 w-min flex items-center border-2 text-brand-secondary ${classes}`, {
        'cursor-pointer hover:opacity-70': !disabled,
        'text-neutral-gray4': disabled,
    });

    return (
        <button
            disabled={disabled}
            className={classnames}
            style={{ ...style, borderRadius: '4px', outline: 'none' }}
            {...rest}
        >
            <p className="text-mediumLabel whitespace-nowrap">{children}</p>
        </button>
    );
};
