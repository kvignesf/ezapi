// Inspiration for this script - https://github.com/axios/axios/issues/2072#issuecomment-552940091

const axios = require('axios');
const Qs = require('qs');


const proxyURL = process.env.REACT_APP_PROXY_URL;

const runData = {
    url: 'https://api.fedex.com/rate/v2/rates/quotes',
    method: 'post',
    headers: [
        {
            key: 'x-locale',
            value: 'en_US',
        },
        {
            key: 'Authorization',
            value: 'Bearer l7xx8daef6fbb1724f21b2ada537e059ad7b',
        },
    ],
    queryParams: [],
    data: {
        rateRequestControlParameters: {
            rateSortOrder: 'COMMITASCENDING',
            returnTransitTimes: true,
            variableOptions: null,
            servicesNeededOnRateFailure: false,
        },
        requestedShipment: {
            shipper: {
                accountNumber: {
                    value: '',
                },
                address: {
                    city: 'Hyderabad',
                    postalCode: '500018',
                    countryCode: 'IN',
                    streetLines: [''],
                    residential: false,
                    stateOrProvinceCode: 'TG',
                },
            },
            recipients: [
                {
                    address: {
                        city: 'New Delhi',
                        postalCode: '110008',
                        countryCode: 'IN',
                        streetLines: [''],
                        residential: false,
                        stateOrProvinceCode: 'DL',
                    },
                },
            ],
            shipTimestamp: '2023-04-18',
            pickupType: 'CONTACT_FEDEX_TO_SCHEDULE',
            packagingType: 'YOUR_PACKAGING',
            shippingChargesPayment: {
                payor: {
                    responsibleParty: {
                        accountNumber: {
                            value: '',
                        },
                        address: {
                            countryCode: 'IN',
                        },
                    },
                },
            },
            blockInsightVisibility: false,
            edtRequestType: 'NONE',
            rateRequestType: ['ACCOUNT', 'LIST'],
            requestedPackageLineItems: [
                {
                    groupPackageCount: 1,
                    physicalPackaging: 'YOUR_PACKAGING',
                    insuredValue: {
                        currency: 'INR',
                        currencySymbol: null,
                        amount: 0,
                    },
                    weight: {
                        units: 'KG',
                        value: 2,
                    },
                },
            ],
            preferredCurrency: 'INR',
            customsClearanceDetail: {
                commodities: [
                    {
                        name: 'NON_DOCUMENTS',
                        numberOfPieces: 1,
                        description: '',
                        countryOfManufacture: '',
                        harmonizedCode: '',
                        harmonizedCodeDescription: '',
                        itemDescriptionForClearance: '',
                        weight: {
                            units: 'KG',
                            value: 2,
                        },
                        quantity: 1,
                        quantityUnits: '',
                        unitPrice: {
                            currency: 'INR',
                            amount: null,
                            currencySymbol: '',
                        },
                        unitsOfMeasures: [
                            {
                                category: '',
                                code: '',
                                name: '',
                                value: '',
                                originalCode: '',
                            },
                        ],
                        excises: [
                            {
                                values: [''],
                                code: '',
                            },
                        ],
                        customsValue: {
                            currency: 'INR',
                            amount: 1,
                            currencySymbol: '',
                        },
                        exportLicenseNumber: '',
                        partNumber: '',
                        exportLicenseExpirationDate: '',
                        getcIMarksAndNumbers: '',
                    },
                ],
                commercialInvoice: {
                    shipmentPurpose: 'GIFT',
                },
            },
        },
        carrierCodes: ['FDXG', 'FDXE'],
        returnLocalizedDateTime: true,
        webSiteCountryCode: 'IN',
    },
};

const headerValues = {};
runData.headers?.forEach((item) => {
    headerValues[item.key] = item.value;
});

const queryParamsValues = {};
runData.queryParams?.forEach((item) => {
    const existingValues = queryParamsValues[item.key] || [];
    existingValues.push(item.value);
    queryParamsValues[item.key] = existingValues;
});

const postData = {
    url: runData.url,
    method: runData.method,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...headerValues,
    },
    data: runData.data,
    params: Qs.stringify(queryParamsValues, { arrayFormat: 'repeat' }),
};

const options = {
    //url: 'http://proxy.ezapi.ai',
    url: proxyURL,
    method: 'post',
    paramsSerializer: (params) => Qs.stringify(params, { arrayFormat: 'repeat' }),
    data: postData,
};

axios
    .request(options)
    .then(function (response) {
        console.log('Response with axios was ok: ' + response.status);

        console.log(response.data);
    })
    .catch(function (error) {
        console.log(error);
    });
