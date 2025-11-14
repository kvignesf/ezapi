import { TextField } from '@material-ui/core';
import classNames from 'classnames';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import { postcodeValidator, postcodeValidatorExistsForCountry } from 'postcode-validator';
import React, { useEffect } from 'react';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useQuery } from 'react-query';
import client, { endpoint } from '../shared/network/client';
import { getAccessToken } from '../shared/storage';
import billingDetailsSchema from './billingDetailsSchema';

const acc_token = getAccessToken();
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

const BillingDetailsForm = ({ disabled = false, formRef }) => {
    const { data } = useQuery('userProfileKey', userProfile, {
        refetchOnWindowFocus: false,
    });

    const [cityName, setCityName] = React.useState('');
    const [countryName, setCountryName] = React.useState('');
    const [line1Name, setLine1Name] = React.useState('');
    const [stateName, setStateName] = React.useState('');
    const [zipValidator, setZipValidator] = React.useState(true);
    const [postalCodeName, setPostalCodeName] = React.useState('');

    useEffect(() => {
        setCityName(data?.['billing_address']?.['city']);
        setCountryName(data?.['billing_address']?.['country']);
        setStateName(data?.['billing_address']?.['state']);
        setLine1Name(data?.['billing_address']?.['line1']);
        setPostalCodeName(data?.['billing_address']?.['postal_code']);
    });

    return (
        <div className="mb-8">
            <p className="text-subtitle1 mb-3">Billing Details</p>

            <Formik
                initialValues={{
                    fullName: '',
                    company: '',
                    country: countryName,
                    addressLine1: line1Name,
                    zip: postalCodeName,
                    city: cityName,
                    state: stateName,
                    email: '',

                    addressLine2: '',

                    phone: '',
                }}
                enableReinitialize
                validationSchema={billingDetailsSchema}
                innerRef={formRef}
            >
                {({ values, errors, touched, setFieldValue }) => {
                    if (postcodeValidatorExistsForCountry(values.country)) {
                        if (postcodeValidator(values.zip, values.country)) {
                            setZipValidator(true);
                        } else setZipValidator(false);
                    } else {
                        setZipValidator(true);
                        // console.log("Country-Zip Validation Not available");
                    }
                    // console.log(zipValidator);

                    // }
                    // console.log(values.country);
                    // console.log(postcodeValidatorExistsForCountry(values.country));

                    return (
                        <Form>
                            <div className="mb-4">
                                <p className="text-overline2 mb-2">Full Name</p>

                                <Field
                                    id="fullName"
                                    name="fullName"
                                    fullWidth
                                    // value="fulllnameee"
                                    value={values.fullName}
                                    color="primary"
                                    variant="outlined"
                                    disabled={disabled}
                                    error={touched.fullName && Boolean(errors.fullName)}
                                    helperText={<ErrorMessage name="fullName" />}
                                    onKeyUp={(e) => {}}
                                    inputProps={{
                                        style: {
                                            height: '6px',
                                        },
                                    }}
                                    as={TextField}
                                />
                            </div>

                            <div className="mb-4">
                                <p className="text-overline2 mb-2">
                                    Company Name
                                    <span className="text-overline2 text-neutral-gray4 ml-1">(optional)</span>
                                </p>

                                <Field
                                    id="company"
                                    name="company"
                                    fullWidth
                                    color="primary"
                                    variant="outlined"
                                    disabled={disabled}
                                    error={touched.company && Boolean(errors.company)}
                                    helperText={<ErrorMessage name="company" />}
                                    onKeyUp={(e) => {}}
                                    inputProps={{
                                        style: {
                                            height: '6px',
                                        },
                                    }}
                                    as={TextField}
                                />
                            </div>

                            <div className="mb-4">
                                <p className="text-overline2 mb-2">Country</p>

                                <div
                                    className={classNames(
                                        'border-1 rounded-md p-1',
                                        {
                                            'border-accent-red': touched?.country && Boolean(errors?.country),
                                            'border-neutral-gray5': !(touched?.country && Boolean(errors?.country)),
                                        },
                                        'focus-within:border-brand-primary focus-within:border-2',
                                    )}
                                >
                                    <Field
                                        labelId="country-select-label"
                                        id="country"
                                        name="country"
                                        // value={countryName}
                                        value={values.country}
                                        disabled={disabled}
                                        variant="outlined"
                                        error={touched.country && Boolean(errors.country)}
                                        helperText={<ErrorMessage name="country" />}
                                        style={{
                                            width: '100%',
                                            height: '2.25rem',
                                        }}
                                        as={CountryDropdown}
                                        onChange={(v) => {
                                            setFieldValue('country', v);
                                        }}
                                        valueType="short"
                                        classes={'outline-none'}
                                        defaultOptionLabel=""
                                    />
                                </div>
                                {touched?.country && Boolean(errors?.country) && (
                                    <p
                                        className="py-1"
                                        style={{
                                            fontSize: '0.75rem',
                                            marginLeft: '1rem',
                                            color: '#f44336',
                                        }}
                                    >
                                        {errors?.country}
                                    </p>
                                )}
                            </div>

                            <div className="mb-4">
                                <p className="text-overline2 mb-2">Address Line 1</p>

                                <Field
                                    id="addressLine1"
                                    name="addressLine1"
                                    fullWidth
                                    color="primary"
                                    variant="outlined"
                                    // value={line1Name}
                                    disabled={disabled}
                                    error={touched.addressLine1 && Boolean(errors.addressLine1)}
                                    helperText={<ErrorMessage name="addressLine1" />}
                                    onKeyUp={(e) => {}}
                                    inputProps={{
                                        style: {
                                            height: '6px',
                                        },
                                    }}
                                    as={TextField}
                                />
                            </div>

                            <div className="mb-4">
                                <p className="text-overline2 mb-2">
                                    Address Line 2
                                    <span className="text-overline2 text-neutral-gray4 ml-1">(optional)</span>
                                </p>

                                <Field
                                    id="addressLine2"
                                    name="addressLine2"
                                    fullWidth
                                    color="primary"
                                    variant="outlined"
                                    disabled={disabled}
                                    error={touched.addressLine2 && Boolean(errors.addressLine2)}
                                    helperText={<ErrorMessage name="addressLine2" />}
                                    onKeyUp={(e) => {}}
                                    inputProps={{
                                        style: {
                                            height: '6px',
                                        },
                                    }}
                                    as={TextField}
                                />
                            </div>

                            <div className="flex flex-row mb-3 w-full">
                                <div className="flex-1 mr-3">
                                    <p className="text-overline2 mb-2">Zipcode</p>

                                    <Field
                                        id="zip"
                                        name="zip"
                                        fullWidth
                                        color="primary"
                                        // value={postalCodeName}
                                        variant="outlined"
                                        disabled={disabled}
                                        error={(touched.zip && Boolean(errors.zip)) || !zipValidator}
                                        helperText={
                                            values.zip
                                                ? !zipValidator
                                                    ? 'Invalid Zipcode'
                                                    : null
                                                : 'Please fill this field'
                                        }
                                        onKeyUp={(e) => {}}
                                        inputProps={{
                                            style: {
                                                height: '6px',
                                            },
                                        }}
                                        // onChange={(v) => {
                                        //   setFieldValue("zip", v.target.value);
                                        // }}
                                        onChange={(e) => {
                                            const re = /^[A-Z a-z0-9\b]+$/;

                                            if (e?.target?.value?.trim() === '' || re.test(e?.target?.value)) {
                                                setFieldValue('zip', e.target.value);
                                            }
                                        }}
                                        as={TextField}
                                    />
                                </div>

                                <div className="flex-1 mr-3">
                                    <p className="text-overline2 mb-2">City</p>

                                    <Field
                                        id="city"
                                        name="city"
                                        fullWidth
                                        color="primary"
                                        // value={cityName}
                                        variant="outlined"
                                        disabled={disabled}
                                        error={touched.city && Boolean(errors.city)}
                                        helperText={<ErrorMessage name="city" />}
                                        onKeyUp={(e) => {}}
                                        inputProps={{
                                            style: {
                                                height: '6px',
                                            },
                                        }}
                                        as={TextField}
                                    />
                                </div>

                                <div className="flex-1">
                                    <p className="text-overline2 mb-2">State</p>

                                    <div
                                        className={classNames(
                                            'border-1 rounded-md p-1',
                                            {
                                                'border-accent-red': touched?.state && Boolean(errors?.state),
                                                'border-neutral-gray5': !(touched?.state && Boolean(errors?.state)),
                                            },
                                            'focus-within:border-brand-primary focus-within:border-2',
                                        )}
                                    >
                                        <Field
                                            id="state"
                                            name="state"
                                            fullWidth
                                            color="primary"
                                            // value={stateName}
                                            variant="outlined"
                                            disabled={disabled}
                                            error={touched.state && Boolean(errors.state)}
                                            helperText={<ErrorMessage name="state" />}
                                            onKeyUp={(e) => {}}
                                            style={{
                                                width: '100%',
                                                height: '2.1rem',
                                            }}
                                            value={values?.state}
                                            as={RegionDropdown}
                                            country={values?.country}
                                            onChange={(v) => {
                                                setFieldValue('state', v);
                                            }}
                                            countryValueType="short"
                                            classes={'outline-none'}
                                            defaultOptionLabel=""
                                            blankOptionLabel=""
                                        />
                                    </div>
                                    {touched?.state && Boolean(errors?.state) && (
                                        <p
                                            className="py-1"
                                            style={{
                                                fontSize: '0.75rem',
                                                marginLeft: '1rem',
                                                color: '#f44336',
                                            }}
                                        >
                                            {errors?.state}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-row">
                                <div className="mr-3 w-full">
                                    <p className="text-overline2 mb-2">Email Address</p>

                                    <Field
                                        id="email"
                                        name="email"
                                        fullWidth
                                        color="primary"
                                        variant="outlined"
                                        disabled={disabled}
                                        error={touched.email && Boolean(errors.email)}
                                        helperText={<ErrorMessage name="email" />}
                                        onKeyUp={(e) => {}}
                                        inputProps={{
                                            style: {
                                                height: '6px',
                                            },
                                        }}
                                        as={TextField}
                                    />
                                </div>

                                <div className="w-full">
                                    <p className="text-overline2 mb-2">
                                        Phone Number
                                        <span className="text-overline2 text-neutral-gray4 ml-1">(optional)</span>
                                    </p>

                                    <Field
                                        id="phone"
                                        name="phone"
                                        fullWidth
                                        color="primary"
                                        variant="outlined"
                                        disabled={disabled}
                                        error={touched.phone && Boolean(errors.phone)}
                                        helperText={<ErrorMessage name="phone" />}
                                        onKeyUp={(e) => {}}
                                        inputProps={{
                                            style: {
                                                height: '42px',
                                                width: '100%',
                                            },
                                        }}
                                        value={values?.phone}
                                        country={'us'}
                                        onChange={(phone) => setFieldValue('phone', phone)}
                                        as={PhoneInput}
                                    />
                                </div>
                            </div>
                        </Form>
                    );
                }}
            </Formik>
        </div>
    );
};

export default BillingDetailsForm;
