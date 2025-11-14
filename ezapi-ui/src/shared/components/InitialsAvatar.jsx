import _ from 'lodash';

const InitialsAvatar = ({ firstName, lastName, className, ...rest }) => {
    let name = '-';
    if (firstName && !_.isEmpty(firstName)) {
        name = firstName?.charAt(0)?.toUpperCase();
    }

    if (lastName && !_.isEmpty(lastName)) {
        name += lastName?.charAt(0)?.toUpperCase();
    }

    return (
        <div
            style={{
                borderWidth: '1px',
            }}
            className={`rounded-full p-2 bg-brand-primarySubtle flex flex-row max-w-10 ${className}`}
            {...rest}
        >
            <p className="capitalize text-center text-brand-primary text-overline2">{name}</p>
        </div>
    );
};

export default InitialsAvatar;
