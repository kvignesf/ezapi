import { Button } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import Box from '@mui/material/Box';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import _ from 'lodash';
import React, { useEffect } from 'react';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import Dashboard from './Dashboard';
import crossLogo from './icons/cross_logo.png';
import enterpriseLogo from './icons/enterprise_logo.png';
import proLogo from './icons/pro_logo.png';
import tickLogo from './icons/tick_logo.png';
import trialLogo from './icons/trial_logo.png';
import client, { endpoint } from './shared/network/client';
import { queries } from './shared/network/queryClient';
import routes from './shared/routes';
import { getAccessToken } from './shared/storage';
import { ReactComponent as BestValueIcon } from './static/images/BestValue.svg';
const acc_token = getAccessToken();

const pricingData = async () => {
    const { data } = await client.get(endpoint.products2);
    return data;
};

const userProfile = async () => {
    try {
        const { data } = await client.get(endpoint.userProfile, {
            headers: {
                Authorization: acc_token,
            },
        });
        return data;
    } catch (error) {}
};

export const usePricingData = () => {
    return useQuery([queries.products], pricingData, {
        refetchOnWindowFocus: false,
    });
};

const Pricing = () => {
    const history = useHistory();
    const headings = ['PROJECTS', 'API LIFECYCLE', 'CONNECTORS', 'VALIDITY'];
    const rowNames = [
        [
            'Free format API Designs',
            'Data Provider APIs',
            'API Test projects',
            'Aggregate APIs (Coming soon..)',
            'Republish',
            //"No. of Creator Licenses",
            'Collaborators',
            'TEST DATA GEN LIMITS',
            'DATA RETENTION',
            'GITHUB INTEGRATION',
            'LOGIN',
        ],
        ['Specs', 'Code', 'Mock', 'Test Data', 'Functional Tests', 'Performance Tests'],

        ['MS SQL Server', 'Postgres', 'MongoDB', 'MYSQL'],
        ['Validity'],
    ];

    let planData = [];

    var projectsCardData = {
        heading: headings[0],
        rowName: rowNames[0],
        plan_data: [],
        Enterprise: [
            'UNLIMITED',
            'UNLIMITED',
            'UNLIMITED',
            'UNLIMITED',
            'UNLIMITED',
            //"Custom",
            'UNLIMITED',
            'UNLIMITED',
            'UNLIMITED',
            'ENTERPRISE',
            'SSO',
        ],
    };
    var apiLifecycleCardData = {
        heading: headings[1],
        rowName: rowNames[1],
        plan_data: [],
        Enterprise: [true, true, true, true, true, true],
    };
    var connectorsCardData = {
        heading: headings[2],
        rowName: rowNames[2],
        plan_data: [],
        Enterprise: [true, true, true, true],
    };
    var validityCardData = {
        heading: headings[3],
        rowName: rowNames[3],
        plan_data: [],
        Enterprise: ['Contract Based'],
    };

    var cardHeaderData = [];

    const [endSubDate, setEndSubDate] = React.useState();
    const [renewSub, setRenewSub] = React.useState();
    const [regDate, setRegDate] = React.useState();
    const [durationMY, setDurationMY] = React.useState('M');
    const [trialButton, setTrialButton] = React.useState('SUBSCRIBE');
    const [basicButton, setBasicButton] = React.useState('SUBSCRIBE');
    const [pocButton, setPOCButton] = React.useState('SUBSCRIBE');
    const [proButton, setProButton] = React.useState('SUBSCRIBE');
    //const [user_id, setUserId] = useState();

    const planTypeCardData2 = [];

    const { data } = useQuery('userProfileKey', userProfile, {
        refetchOnWindowFocus: false,
    }); // plan details of the loggedIn user

    const pricingData2 = async () => {
        const { data } = await client.get(endpoint.products2);
        return data;
    };

    const usePricingData2 = () => {
        return useQuery([queries.products], pricingData2, {
            refetchOnWindowFocus: false,
        });
    };

    function CalculateTrialExpiryDate(str, index, value) {
        var dateStringArray = (str.substr(0, index) + value + str.substr(index)).split('/');

        var dateObject = new Date(dateStringArray[2], dateStringArray[0] - 1, dateStringArray[1]);
        dateObject.toISOString();
        dateObject.setDate(dateObject.getDate() + 30);
        dateObject = dateObject.toISOString().split('-');
        dateObject = dateObject[1] + '/' + dateObject[2].substring(0, 2) + '/' + dateObject[0];
        return dateObject;
    }

    useEffect(() => {
        if (!_.isEmpty(data)) {
            setEndSubDate(data?.['subscription_ends_at']);
            setRenewSub(data?.['subscription_renews_at']);
            setRegDate(CalculateTrialExpiryDate(data?.['registeredOn'].split(' ')[0], 6, '20'));

            if (data?.['subscribed_plan'] === '') {
                setTrialButton('Subscribed');
            } else {
                setTrialButton('Subscribe');
            }

            if (data?.['stripeCustomerId'] !== '' && data?.['subscribed_plan'] !== '') {
                setProButton('Subscribed');
            } else {
                setProButton('Subscribe');
            }

            if (data?.['stripeCustomerId'] !== '') {
                setBasicButton('Subscribed');
            } else {
                setBasicButton('Subscribe');
            }
        }
    });

    const handleClick = (title, price, buttonTextType) => {
        if (buttonTextType === 'Subscribe') {
            history.push({
                pathname: routes.payment,
                state: { type: title, duration: durationMY, price: price },
            });
        } else if (buttonTextType === 'CONTACT US') {
            window.open('https://www.ezapi.ai/contact');
        }
    };

    const { data: pricing_data } = usePricingData2();

    function setPlanPriceBasedOnDuration(item, index) {
        var durationMatchPlaceHolder;
        if (durationMY === 'M') durationMatchPlaceHolder = 'month';
        else if (durationMY === 'Y') durationMatchPlaceHolder = 'year';

        item?.['stripe'].map((item2, index2) => {
            if (durationMatchPlaceHolder == item2['plan_interval']) {
                planTypeCardData2[index]['price'] = item2?.['plan_price'];
            }
        });
    }

    function setOtherCardDetails() {
        planTypeCardData2.map((item, index) => {
            switch (item['package']) {
                case 'free':
                    item['logo'] = trialLogo;
                    item['description'] = ['Get the Community, free'];
                    item['buttonText'] = trialButton;
                    break;
                case 'paid':
                    item['logo'] = proLogo;
                    item['description'] = ['Everything in Community +'];
                    item['buttonText'] = proButton;
                    break;
            }
        });
    }

    if (!_.isEmpty(pricing_data?.products)) {
        if (pricing_data?.products.length > 0) {
            pricing_data['products'].map((item, index) => {
                planTypeCardData2.push({
                    title: '',
                    description: '',
                    buttonText: '',
                    logo: '',
                    price: '',
                });

                planTypeCardData2[index]['title'] = item['plan_name'];
                projectsCardData[item['plan_name']] = [];
                apiLifecycleCardData[item['plan_name']] = [];
                connectorsCardData[item['plan_name']] = [];
                validityCardData[item['plan_name']] = [];

                if (item.stripe_product_id) {
                    setPlanPriceBasedOnDuration(item, index);
                    planTypeCardData2[index]['package'] = 'paid';
                } else {
                    planTypeCardData2[index]['price'] = 0;
                    planTypeCardData2[index]['package'] = 'free';
                }
                setOtherCardDetails();
            });
            planTypeCardData2.map((item, index) => {
                if (item.stripe_product_id === undefined) {
                    var trialDataPlaceHolder = item;
                    planTypeCardData2.splice(index, 1);
                    planTypeCardData2.unshift(trialDataPlaceHolder);
                }
            });
            planTypeCardData2.push({
                title: 'ENTERPRISE',
                price: 'Custom',
                description: ['Everything in Pro +'],
                buttonText: 'CONTACT US',
                logo: enterpriseLogo,
                package: 'custom',
            });
        }

        pricing_data['products'].map((item, index) => {
            planData.push(item);
            projectsCardData[item['plan_name']].push(
                item['noSpecNoDb'],
                item['designProjects'],
                item['testProjects'],
                item['aggregateProjects'],
                item['no_of_republish'],
                //item["no_of_creator_licenses"],
                item['no_of_collaborators'],
                item['dataGenLimits'],
                item['dataRetention'],
                item['githubIntegration'],
                item['login'],
            );

            apiLifecycleCardData[item['plan_name']].push(
                item['spec'],
                item['code'],
                item['mock'],
                item['test_data'],
                item['functional_tests'],
                item['performance_tests'],
                //item["security_tests"]
            );
            connectorsCardData[item['plan_name']].push(
                item['connectors']['ms_sql'],
                item['connectors']['postgres'],
                item['connectors']['mongo'],
                item['connectors']['my_sql'],
            );
            validityCardData[item['plan_name']].push(item['validity']);
            //otherCardData[]
        });

        cardHeaderData.push(
            projectsCardData,
            apiLifecycleCardData,
            connectorsCardData,
            validityCardData,
            //otherCardData
        );

        cardHeaderData.map((item) => {
            if (item?.['plan_data']?.length == 0) {
                planData.sort((a, b) => a.priority - b.priority);
                planData.map((name) => {
                    item?.['plan_data'].push(item[name.plan_name]);
                });
            }
            item?.['plan_data'].push(item['Enterprise']);
        });

        planTypeCardData2.sort((a, b) => a.price - b.price);
    }

    function handleSwitchChange(event) {
        if (durationMY === 'M') setDurationMY('Y');
        else setDurationMY('M');

        if (durationMY === 'M') {
            document.getElementById('yr').style.color = '#c72c71';
            document.getElementById('mo').style.color = 'black';
        } else if (durationMY === 'Y') {
            document.getElementById('yr').style.color = 'black';
            document.getElementById('mo').style.color = '#c72c71';
        }
    }
    function numberWithCommas(x) {
        return x?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return (
        <Dashboard selectedIndex={3}>
            <div className="flex flex-col items-center justify-center w-full  ">
                {' '}
                <div className="flex flex-col  items-center justify-center w-full px-3 h-full mb-12">
                    <div id="heading" className="container mx-auto pt-4">
                        {' '}
                        <h1 className=" text-customGray text-4xl font-sans font-medium tracking-wide text-center">
                            The Right Pricing Plan for Your Business
                        </h1>
                    </div>

                    <div id="durationMY" className="container mx-auto p-4 ">
                        <div className="flex justify-center ">
                            {' '}
                            <div id="mo" style={{ color: '#c72c71' }} className="mt-1.5">
                                {/* <text style={{ color: '#c72c71' }}>Monthly</text> */}
                                Monthly
                            </div>
                            <Switch color="default" checked={durationMY === 'Y'} onChange={handleSwitchChange} />
                            <div id="yr" className="mt-1.5 text-black-500">
                                Yearly
                            </div>
                        </div>
                    </div>

                    <div id="pricingTypeCards1" className="container mx-auto   p-2 ">
                        {durationMY === 'Y' ? (
                            <div className="grid grid-cols-11 gap-5    ">
                                <Grid className="col-start-6 col-span-2 ">
                                    <div className="flex  justify-center ">
                                        <BestValueIcon />
                                    </div>
                                </Grid>
                                <Grid className="col-start-8 col-span-2 ">
                                    {' '}
                                    <div className="flex  justify-center ">
                                        <BestValueIcon />
                                    </div>
                                </Grid>
                            </div>
                        ) : null}

                        <div className="grid grid-cols-11 gap-5   ">
                            <Grid className="col-span-3 ..."></Grid>
                            {planTypeCardData2.map((tier, index) => (
                                <Grid className="col-span-2 " item key={tier.title}>
                                    <Card className="flex flex-col h-full self-center">
                                        <div className="flex justify-center ..."></div>
                                        <div className="flex justify-center ...">
                                            {' '}
                                            <img src={tier.logo} alt="logo" />
                                        </div>{' '}
                                        <CardHeader
                                            style={{
                                                color:
                                                    index == 0
                                                        ? '#2FDAA1'
                                                        : index == 1
                                                        ? '#9085D3'
                                                        : index == 2
                                                        ? '#40A3E4'
                                                        : index == 3
                                                        ? '#EC6A6C'
                                                        : 'red',
                                            }}
                                            title={tier.title}
                                            titleTypographyProps={{ align: 'center' }}
                                        />
                                        <CardContent className="flex flex-col">
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'baseline',
                                                }}
                                            >
                                                <Typography
                                                    component="h4"
                                                    variant="h6"
                                                    style={{
                                                        color:
                                                            index == 0
                                                                ? '#2FDAA1'
                                                                : index == 1
                                                                ? '#9085D3'
                                                                : index == 2
                                                                ? '#40A3E4'
                                                                : index == 3
                                                                ? '#EC6A6C'
                                                                : 'red',
                                                    }}
                                                >
                                                    {index == 3 ? (
                                                        <div>{tier.price}</div>
                                                    ) : (
                                                        <div>${numberWithCommas(tier.price)}</div>
                                                    )}
                                                </Typography>
                                                <Typography
                                                    variant="h6"
                                                    style={{
                                                        color:
                                                            index == 0
                                                                ? '#2FDAA1'
                                                                : index == 1
                                                                ? '#9085D3'
                                                                : index == 2
                                                                ? '#40A3E4'
                                                                : index == 3
                                                                ? '#EC6A6C'
                                                                : '#40A3E4',
                                                    }}
                                                >
                                                    {index != 3 &&
                                                        index != 0 &&
                                                        (durationMY === 'Y' ? <div>/yr</div> : <div>/mo</div>)}
                                                </Typography>
                                            </Box>
                                            <ul className="flex flex-col h-3">
                                                {tier.description.map((line) => (
                                                    <Typography
                                                        // component="li"
                                                        variant="subtitle1"
                                                        align="center"
                                                        key={line}
                                                        style={{
                                                            color:
                                                                index == 0
                                                                    ? '#2FDAA1'
                                                                    : index == 1
                                                                    ? '#9085D3'
                                                                    : index == 2
                                                                    ? '#40A3E4'
                                                                    : index == 3
                                                                    ? '#EC6A6C'
                                                                    : '#40A3E4',
                                                        }}
                                                    >
                                                        {line}
                                                    </Typography>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardActions className="flex mt-7 ">
                                            <Button
                                                style={{
                                                    color:
                                                        tier.buttonText === 'Subscribed'
                                                            ? 'white'
                                                            : tier.buttonText === 'Expired' ||
                                                              data.subscribed_plan !== ''
                                                            ? 'black'
                                                            : 'white',

                                                    background:
                                                        tier.buttonText === 'Subscribed'
                                                            ? '#c72c71'
                                                            : tier.buttonText === 'Expired' ||
                                                              data.subscribed_plan !== ''
                                                            ? '#9f9f9f'
                                                            : '#0971f1',
                                                }}
                                                onClick={() => {
                                                    handleClick(tier['title'], tier['price'], tier.buttonText);
                                                }}
                                                disabled={
                                                    tier.buttonText === 'Subscribed' ||
                                                    tier.buttonText === 'Expired' ||
                                                    data.subscribed_plan !== ''
                                                }
                                                fullWidth
                                                variant="outlined"
                                            >
                                                {tier.buttonText}
                                            </Button>
                                        </CardActions>
                                        {tier.buttonText === 'Subscribed' && endSubDate !== '' && (
                                            <CardContent className="flex flex-col">
                                                <p
                                                    class=" text-center text-sm ..."
                                                    style={{
                                                        color:
                                                            index == 0
                                                                ? '#2FDAA1'
                                                                : index == 1
                                                                ? '#9085D3'
                                                                : index == 2
                                                                ? '#40A3E4'
                                                                : index == 3
                                                                ? '#EC6A6C'
                                                                : 'red',
                                                    }}
                                                >
                                                    {tier.package === 'free'
                                                        ? 'Subscription Ends at ' + regDate
                                                        : 'Subscription Ends at ' + endSubDate}
                                                </p>
                                            </CardContent>
                                        )}
                                        {tier.buttonText === 'Subscribed' && endSubDate === '' && (
                                            <CardContent className="flex flex-col">
                                                <p
                                                    class=" text-center text-sm ..."
                                                    style={{
                                                        color:
                                                            index == 0
                                                                ? '#2FDAA1'
                                                                : index == 1
                                                                ? '#9085D3'
                                                                : index == 2
                                                                ? '#40A3E4'
                                                                : index == 3
                                                                ? '#EC6A6C'
                                                                : 'red',
                                                    }}
                                                >
                                                    {tier.package != 'free' && 'Subscription Renews at ' + renewSub}
                                                </p>
                                            </CardContent>
                                        )}
                                    </Card>
                                </Grid>
                            ))}
                        </div>
                    </div>

                    <div id="pricingDataTables" className="container mx-auto   px-2 ">
                        {cardHeaderData.map((card, cardIndex) => (
                            <Card className="p-2 mb-3">
                                <div className="bg-gray-100">
                                    <h4
                                        className="text-neutral-gray2 uppercase text-base tracking-normal font-bold px-2 "
                                        align="left"
                                    >
                                        {card?.['heading']}
                                    </h4>
                                </div>
                                <div className="grid grid-flow-row grid-cols-11 pt-2 gap-4">
                                    <Grid item className="col-span-3">
                                        {card?.['rowName'].map((row) => (
                                            <h6
                                                className=" uppercase text-base tracking-normal font-medium px-2 py-2"
                                                align="left"
                                            >
                                                {row}
                                            </h6>
                                        ))}
                                    </Grid>
                                    {card?.['plan_data'].map((row, index) => (
                                        <Grid className="col-span-2" item>
                                            {}
                                            {row.map((row2, index2) => (
                                                <div
                                                    className="uppercase text-base tracking-normal font-medium px-2 py-2"
                                                    align="center"
                                                >
                                                    {(cardIndex == 0 || cardIndex == 3) && row2 === 999
                                                        ? 'UNLIMITED'
                                                        : row2}

                                                    {(cardIndex == 1 || cardIndex == 2) &&
                                                        (row2 == true ? (
                                                            <img src={tickLogo} />
                                                        ) : (
                                                            <img src={crossLogo} />
                                                        ))}
                                                </div>
                                            ))}
                                        </Grid>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default Pricing;
