import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import React from 'react';
import { useQuery } from 'react-query';
import { PrimaryButton } from '../shared/components/AppButton';
import client, { endpoint } from '../shared/network/client';
import { queries } from '../shared/network/queryClient';
import { ReactComponent as StripeLogo } from '../static/images/stripe_purple.svg';

const pricingData = async () => {
    /* const user_id = getUserId();

  const { data } = await client.get(endpoint.products2, {
    headers: {
      user_id: user_id
    }
  }); */
    const { data } = await client.get(endpoint.products2);
    // priceIDFinder(data);
    // console.log(data);
    return data;
};
export const usePricingData = () => {
    return useQuery([queries.products], pricingData, {
        refetchOnWindowFocus: false,
    });
};
const ProductDetails = ({ type, duration, priceId, product, project, disabled = false, onPurchaseClick }) => {
    var defType;
    var defSub;
    switch (type) {
        case 'COMMUNITY':
            defType = 10;
            break;
        case 'Basic':
            defType = 20;
            break;
        case 'PRO':
            defType = 30;
            break;
        default:
            defType = 10;
    }
    switch (duration) {
        case 'mo':
            defSub = 10;
            break;
        case 'yr':
            defSub = 20;
            break;
        default:
            defType = 10;
    }

    const { data: pricing_data } = usePricingData();

    const [planType, setPlanType] = React.useState(defType);

    const [subscriptionType, setSubscriptionType] = React.useState(defSub);
    const [price, setPrice] = React.useState(priceId);
    const handleChange = (event) => {
        setPlanType(event.target.value);
        priceFinder(event.target.value, subscriptionType);
    };
    const handleChange2 = (event) => {
        setSubscriptionType(event.target.value);
        priceFinder(planType, event.target.value);
    };

    function priceFinder(type, duration) {
        switch (type) {
            case 10:
                type = 'COMMUNITY';
                break;
            case 20:
                type = 'Basic';
                break;
            case 30:
                type = 'PRO';
                break;
            default:
                defType = 10;
        }
        switch (duration) {
            case 10:
                duration = 'month';
                break;
            case 20:
                duration = 'year';
                break;
            default:
                defType = 10;
        }
        // console.log("inside");
        if (pricing_data?.products.length > 0) {
            pricing_data['products'].map((item, index) => {
                if (type === item['plan_name']) {
                    durationFinder(item, duration);
                }
            });
        }
    }

    function durationFinder(item, duration) {
        if (item['stripe'].length > 0) {
            item['stripe'].map((item2, index2) => {
                if (duration === item2['plan_interval']) {
                    setPrice(item2['plan_price']);
                }
            });
        }
    }
    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return (
        <div className="flex flex-col fixed pl-6">
            <div className="bg-brand-primarySubtle rounded-md p-8 w-full max-w-md mb-3">
                <div className="flex flex-row items-center">
                    <FormControl variant="standard" sx={{ m: 1, minWidth: 200 }}>
                        <InputLabel id="demo-simple-select-standard-label">Plan Type</InputLabel>
                        <Select
                            labelId="demo-simple-select-standard-label"
                            id="demo-simple-select-standard"
                            value={planType}
                            disabled={false}
                            onChange={handleChange}
                            label="Plan Type"
                            defaultValue={30}
                        >
                            {/* <MenuItem value={20}>Basic</MenuItem> */}
                            <MenuItem value={30}>Pro</MenuItem>
                        </Select>
                    </FormControl>
                    <p className="text-body2 ml-2">{product?.name}</p>
                </div>
                <div className="flex flex-row items-center">
                    {/* <p className="text-overline2">Subscription Type:</p> */}
                    <FormControl variant="standard" sx={{ m: 1, minWidth: 200 }}>
                        <InputLabel id="demo-simple-select-standard-label">Subscription Type</InputLabel>
                        <Select
                            labelId="demo-simple-select-standard-label"
                            id="demo-simple-select-standard"
                            value={subscriptionType}
                            onChange={handleChange2}
                            label="Subscription Type"
                            defaultValue={10}
                        >
                            {/* <MenuItem value="">
                <em>None</em>
              </MenuItem> */}
                            <MenuItem value={10}>Monthly</MenuItem>
                            <MenuItem value={20}>Yearly</MenuItem>
                            {/* <MenuItem value={30}>Pro</MenuItem> */}
                        </Select>
                    </FormControl>
                </div>

                <div className="border-t-1 border-b-1 border-neutral-gray5 py-3 flex flex-row justify-between items-center my-6">
                    <p className="text-body1">Total Amount : ${numberWithCommas(price)}</p>
                    {/* <h4>{priceIDFinder(planType, subscriptionType)}</h4> */}
                </div>

                <PrimaryButton
                    style={{ width: '100%' }}
                    disabled={disabled}
                    onClick={(e) => {
                        e?.preventDefault();
                        e?.stopPropagation();

                        if (!disabled) {
                            onPurchaseClick(planType, subscriptionType);
                        }
                    }}
                >
                    Subscribe Now
                </PrimaryButton>
            </div>

            <div className="flex flex-row items-center justify-end">
                <StripeLogo className="w-24" />

                <div className="mx-2 h-4 bg-neutral-gray4" style={{ width: '1px' }}></div>

                <a
                    href=" https://stripe.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-overline3 text-brand-secondary cursor-pointer hover:opacity-75"
                >
                    Privacy
                </a>
            </div>
        </div>
    );
};

export default ProductDetails;
