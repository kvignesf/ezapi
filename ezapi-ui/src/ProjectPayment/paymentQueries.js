import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import Messages from '../shared/messages';
import client, { endpoint } from '../shared/network/client';
import { queries } from '../shared/network/queryClient';
import { getAccessToken } from '../shared/storage';
import { delay, getApiError } from '../shared/utils';

const getProducts = async () => {
    try {
        const { data } = await client.get(endpoint.products);
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetProducts = (options = {}) => {
    const query = useQuery([queries.products], getProducts, {
        refetchOnWindowFocus: false,
        ...options,
    });

    return query;
};

const getBasicProduct = async () => {
    try {
        const { data } = await client.get(endpoint.basicProduct);
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetBasicProduct = (options = {}) => {
    const query = useQuery([queries.basicProduct], getBasicProduct, {
        refetchOnWindowFocus: false,
        ...options,
    });

    return query;
};

const getBillingDetails = async ({ projectId }) => {
    try {
        const { data } = await client.post(endpoint.billingDetails, {
            projectId,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetBillingDetails = () => {
    return useMutation(getBillingDetails);
};

const initiatePayment = async ({ currentPlan, token, priceIDData, billingDetails }) => {
    // return true;
    var update_planFlag;
    try {
        const addCardResponse = await client.post(
            endpoint.addCard,
            {
                stripe_token: token,
                billing_address: {
                    city: billingDetails?.city,
                    country: billingDetails?.country,
                    line1: billingDetails?.addressLine1,
                    line2: billingDetails?.addressLine2,
                    state: billingDetails?.state,
                    postal_code: billingDetails?.zip,
                },
            },
            {
                headers: {
                    Authorization: acc_token,
                },
            },
        );
        await delay(1000);
        // console.log(currentPlan);
        if (currentPlan == '') {
            update_planFlag = false;
        } else {
            update_planFlag = true;
        }
        // console.log(update_planFlag);
        const subscribeData = await client.post(
            endpoint.subscribe,
            {
                update_plan: update_planFlag,
                price_id: priceIDData,
            },
            {
                headers: {
                    Authorization: acc_token,
                },
            },
        );
        // console.log(addCardResponse);
        // console.log(subscribeData);
        return [addCardResponse, subscribeData];
    } catch (error) {
        throw getApiError(error);
    }
};

// const initiatePayment2 = async ({ initiatePaymentData }) => {
//   // return true;
//   try {
//     const defaultCardResponse = await client.post(
//       endpoint.defaultCard,
//       {
//         cardId: initiatePaymentData?.['data']?.['card']?.['id'],
//       },
//       {
//         headers: {
//           Authorization: acc_token,
//         },
//       }
//     );

//     await delay(2000);

//     return initiatePayment2;
//   } catch (error) {
//     throw getApiError(error);
//   }
// };

export const useInitiatePayment = () => {
    return useMutation(initiatePayment);
};

const acc_token = getAccessToken();
const confirmPayment = async ({ priceIDData, addCardResponse, token, card, billingDetails, secret, stripe }) => {
    // console.log(token);
    try {
        const subscribeData = await client.post(
            endpoint.subscribe,
            {
                update_plan: true,
                price_id: priceIDData,
            },
            {
                headers: {
                    Authorization: acc_token,
                },
            },
        );

        await delay(10000);

        return subscribeData;
    } catch (error) {
        throw Error(Messages.PAYMENT_FAILURE);
    }
};

export const useConfirmPayment = () => {
    const queryClient = useQueryClient();
    const { projectId } = useParams();

    return useMutation(confirmPayment, {
        onSuccess: (data) => {
            // console.log(data);
            // if (data?.paymentIntent?.status?.toLowerCase() === "succeeded") {
            //   queryClient.invalidateQueries(`${queries.projects}-${projectId}`);
            // }
        },
    });
};
