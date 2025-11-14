import classNames from 'classnames';
import { useHistory } from 'react-router-dom';
import routes, { generateRoute } from '../shared/routes';
import { isOrderInOtherState } from '../shared/utils';
import OrderStatus from './OrderStatus';

const OrderRow = ({ order }) => {
    const history = useHistory();

    const orderCreatedDate = new Date(order?.createdAt)
        .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
        .replace(/ /g, '-');

    const navigateToProject = () => {
        history.push(generateRoute(routes.projects, order?.projectData?.projectId));
    };

    const navigateToOrderRetry = () => {
        history.push({
            pathname: routes.payment,
            state: { type: 'Basic', duration: false, price: '699' },
        });
    };

    return (
        <tr className="text-overline2">
            {/* <td className='py-2'>{order?.projectData?.projectId}</td> */}
            {/* <td
        className="py-3 hover:opacity-75 cursor-pointer text-brand-secondary"
        onClick={(e) => {
          e?.preventDefault();
          e?.stopPropagation();

          navigateToProject();
        }}
      >
        {order?.projectData?.projectName}
      </td> */}
            {/* <td className="py-3">{order?.productName}</td> */}
            {/* <td className="p-3">dummyData</td> */}
            <td align="left" className="text-clip overflow-hidden ...">
                {order?.id}
            </td>
            <td align="left">{order?.created}</td>

            {/* <td className="py-3">{order?.description}</td> */}
            <td
                align="left"
                className={classNames({
                    'hover:opacity-75 cursor-pointer': isOrderInOtherState(order),
                })}
                onClick={(e) => {
                    e?.preventDefault();
                    e?.stopPropagation();

                    if (isOrderInOtherState(order)) {
                        navigateToOrderRetry();
                    }
                }}
            >
                <OrderStatus order={order} onRetry={navigateToOrderRetry} description={order?.failure_message} />
            </td>
            <td align="left" className="py-3">
                ${order?.amount}
            </td>
            <td align="left" className="text-clip overflow-hidden ...">
                <a className=" text-blue-500" target="_blank" href={order?.receipt_url}>
                    Click Here
                </a>
            </td>
        </tr>
    );
};

export default OrderRow;
