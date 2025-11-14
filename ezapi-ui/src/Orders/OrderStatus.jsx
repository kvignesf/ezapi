import ReplayIcon from '@material-ui/icons/Replay';
import Alert from '@mui/material/Alert';
import classNames from 'classnames';
import ReactHoverObserver from 'react-hover-observer';
import Colors from '../shared/colors';
import { isOrderInitiated, isOrderInOtherState, isOrderSuccess } from '../shared/utils';

const OrderStatus = ({ order, onRetry, description }) => {
    if (isOrderInOtherState(order)) {
        return (
            <ReactHoverObserver>
                {({ isHovering }) => {
                    return (
                        <div className="flex flex-row items-center">
                            {isHovering ? (
                                // <p
                                //   className="text-capitalised text-accent-red text-center mr-1 p-1 bg-white bg-opacity-100"
                                //   style={{ width: '70px', borderRadius: '4px' }}
                                //   onClick={(e) => {
                                //     e?.preventDefault();
                                //     e?.stopPropagation();

                                //     if (isOrderInOtherState(order)) {
                                //       onRetry();
                                //     }
                                //   }}
                                // >
                                //   Retry
                                // </p>

                                <Alert severity="error" sx={{ width: '500%', fontSize: '20' }}>
                                    {description}
                                </Alert>
                            ) : (
                                <p
                                    className="text-capitalised text-accent-red text-center mr-1 p-1 bg-accent-redSubtle"
                                    style={{ width: '70px', borderRadius: '4px' }}
                                >
                                    Failure!
                                </p>
                            )}

                            <ReplayIcon
                                style={{
                                    width: '17px',
                                    height: '17px',
                                    color: Colors.brand.secondary,
                                    cursor: 'pointer',
                                }}
                                onClick={(e) => {
                                    e?.preventDefault();
                                    e?.stopPropagation();

                                    onRetry();
                                }}
                            />
                        </div>
                    );
                }}
            </ReactHoverObserver>
        );
    }

    return (
        <div
            className={classNames('p-1', {
                'bg-accent-redSubtle': isOrderInOtherState(order),
                'bg-accent-greenSubtle': isOrderSuccess(order),
                'bg-accent-orangeSubtle': isOrderInitiated(order),
            })}
            style={{ width: '70px', borderRadius: '4px' }}
        >
            <p
                className={classNames('text-capitalised text-center', {
                    'text-accent-green': isOrderSuccess(order),
                    'text-accent-red': isOrderInOtherState(order),
                    'text-accent-orange': isOrderInitiated(order),
                })}
            >
                {isOrderSuccess(order) ? 'Sucesss' : isOrderInitiated(order) ? 'Initiated' : 'Failure'}
            </p>
        </div>
    );
};

export default OrderStatus;
