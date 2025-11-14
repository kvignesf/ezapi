import { IconButton } from '@material-ui/core';

const AppIcon = ({ children, size, color, style, ...rest }) => {
    return (
        <IconButton
            disableTouchRipple
            style={{
                padding: 0,
                margin: 0,
                border: 'none',
                outline: 'none',
                width: size ?? 'min-content',
                height: size ?? 'min-content',
                color: color ?? null,
                ...style,
            }}
            {...rest}
        >
            {children}
        </IconButton>
    );
};
export default AppIcon;
