import { TextField } from '@material-ui/core';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import classNames from 'classnames';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import cardDetailsSchema from './cardDetailsSchema';

const CardDetailsForm = ({ disabled, formRef }) => {
    const stripe = useStripe();
    const elements = useElements();
    async function generateToken() {
        const { token, error } = await stripe.createToken(elements.getElement(CardElement), {
            headers: {
                Authorization: process.env.REACT_APP_STRIPE_KEY,
            },
        });
        console.log(token?.['id']);
    }
    return (
        <div>
            <p className="text-subtitle1 mb-3">Card Details</p>

            <Formik
                initialValues={{
                    cardHolderName: '',
                    card: false,
                }}
                validationSchema={cardDetailsSchema}
                innerRef={formRef}
            >
                {({ errors, touched, setFieldValue }) => {
                    return (
                        <Form>
                            <div className="mb-4">
                                <p className="text-overline2 mb-2">Card Holder Name</p>

                                <Field
                                    id="cardHolderName"
                                    name="cardHolderName"
                                    fullWidth
                                    color="primary"
                                    variant="outlined"
                                    disabled={disabled}
                                    error={touched.cardHolderName && Boolean(errors.cardHolderName)}
                                    helperText={<ErrorMessage name="cardHolderName" />}
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
                                <CardElement
                                    className={classNames('border-1 rounded-md p-3', {
                                        'border-accent-red': touched?.card && Boolean(errors?.card),
                                        'border-neutral-gray5': !(touched?.card && Boolean(errors?.card)),
                                    })}
                                    onChange={(e) => {
                                        setFieldValue('card', e?.complete);
                                    }}
                                    options={{
                                        hidePostalCode: true,
                                    }}
                                />
                                {touched?.card && Boolean(errors?.card) && (
                                    <p
                                        className="py-1"
                                        style={{
                                            fontSize: '0.75rem',
                                            marginLeft: '1rem',
                                            color: '#f44336',
                                        }}
                                    >
                                        {errors?.card}
                                    </p>
                                )}
                            </div>
                            {/* <button onClick={generateToken}>Generate Token</button> */}
                        </Form>
                    );
                }}
            </Formik>

            {/* <CardElement
        className={"border-1 border-neutral-gray5 rounded-md p-3"}
        onChange={(e) => {
          if (e?.empty !== isCardSet) {
            setIsCardSet(e?.empty);
          }
        }}

        options={{
          hidePostalCode: true,
        }}
      /> */}
        </div>
    );
};

export default CardDetailsForm;
