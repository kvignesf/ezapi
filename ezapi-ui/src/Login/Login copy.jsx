import { CircularProgress } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import { Form, Formik } from 'formik';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { LinkedIn } from 'react-linkedin-login-oauth2';
import linkedin from 'react-linkedin-login-oauth2/assets/linkedin.png';
import { useHistory } from 'react-router-dom';
import sso from '../icons/ssoLogo3.svg';
import LoaderWithMessage from '../shared/components/LoaderWithMessage';
import Constants from '../shared/constants';
import { useLogin } from '../shared/query/authQueries';
import routes from '../shared/routes';
import { getAccessToken, setAccessToken, setEmailId, setFirstName, setLastName, setUserId } from '../shared/storage';
import { isUserLoggedIn } from '../shared/utils';
import Logo from '../static/images/logo/connectoLogoWithName.svg';
import './Login.css';

const acc_token = getAccessToken();
const Login = () => {
    const formRef = useRef();
    const [ssoLoggedIn, setSsoLoggedIn] = useState(false);
    const [dialog, setDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [ssoError, setSsoError] = useState();
    const history = useHistory();
    const redirect_uri = `${window.location.origin}/linkedin`;
    // console.log(formValues);
    const {
        error: loginError,
        isLoading: isLoggingIn,
        isSuccess: isLoginSuccess,
        mutate: login,
        reset: resetLogin,
    } = useLogin();

    const handleSuccess = (data) => {
        if (data?.code && !_.isEmpty(data?.code)) {
            login({ linkedInAuthToken: data?.code, redirect_uri: redirect_uri });
        }
    };

    useEffect(() => {
        if (isUserLoggedIn()) {
            history.push({
                pathname: routes.projects,
                state: { allow: false },
            });
        }
    }, []);

    useEffect(() => {
        if (isUserLoggedIn()) {
            history.push({
                pathname: routes.projects,
                state: { allow: false },
            });
        }
    }, [ssoLoggedIn]);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');
        // const error = queryParams.get("error");
        // console.log("error: " + error);
        // console.log(code);
        if (code) {
            setIsLoading(true);
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code }),
            };
            fetch(
                process.env.REACT_APP_API_URL + '/auth_workos',
                // "http://localhost:7744/auth_workos",
                requestOptions,
            )
                .then((response) => response.json())
                .then((data) => {
                    if ('jwtToken' in data && 'userData' in data) {
                        setAccessToken(data?.jwtToken);
                        setFirstName(data?.userData?.firstName);
                        setLastName(data?.userData?.lastName);
                        setUserId(data?.userData?.user_id);
                        setEmailId(data?.userData?.email);
                        setSsoLoggedIn(true);
                        setIsLoading(false);
                    } else {
                        setIsLoading(false);
                    }
                });
        } else {
            setIsLoading(false);
        }
    }, []);

    function SSOLogin(values) {
        setIsLoading(true);
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: values.email,
            }),
        };
        fetch(
            process.env.REACT_APP_API_URL + '/sso_url',
            // "http://localhost:7744/sso_url",
            requestOptions,
        )
            .then((response) => response.json())

            .then((data) => {
                // console.log(data);
                if (!data?.url && data?.error) {
                    // console.log("inside error");

                    setSsoError(data?.error);
                    setIsLoading(false);
                }
                if (data?.url) {
                    setSsoError();
                    window.location = data?.url;
                    // setIsLoading(false);
                }
            });
    }

    const handleFailure = (error) => {
        resetLogin();
        setAccessToken(null);
    };

    if (isLoginSuccess && !isLoggingIn && !loginError) {
        history.replace({
            pathname: routes.projects,
            state: { allow: false },
        });
        return null;
    }
    const handleCloseDialog = () => {
        setDialog(false);
    };

    return (
        <div className="login-page">
            {' '}
            <div className="h-screen flex justify-center items-center">
                <Card className="w-1/2 max-w-sm flex flex-col justify-center items-center p-5">
                    {!isLoading && (
                        <img src={Logo} alt="conektto logo" className="mb-4 p-3" style={{ maxWidth: '128px' }} />
                    )}

                    {!isLoading && !dialog && (
                        <>
                            {!isLoggingIn && (
                                <div className="mb-2 flex flex-col ">
                                    <LinkedIn
                                        className="mb-2"
                                        clientId={Constants.linkedClientId}
                                        onFailure={handleFailure}
                                        onSuccess={handleSuccess}
                                        redirectUri={encodeURIComponent(redirect_uri)}
                                        redirectPath={'/signin'}
                                        scope="r_liteprofile r_emailaddress"
                                    >
                                        <img
                                            src={linkedin}
                                            alt="Log in with Linked In"
                                            style={{ maxWidth: '180px' }}
                                            className="w-full"
                                        />
                                    </LinkedIn>

                                    <img
                                        src={sso}
                                        onClick={() => {
                                            setDialog(true);
                                        }}
                                        alt="Log in with SSO"
                                        style={{ maxWidth: '180px' }}
                                        className="w-full cursor-pointer ... "
                                    />
                                </div>
                            )}

                            {isLoggingIn && (
                                <div>
                                    <CircularProgress size={20} />
                                </div>
                            )}

                            {loginError && <p className="text-overline2 text-accent-red">{loginError?.message}</p>}
                        </>
                    )}

                    {isLoading && <LoaderWithMessage message="Loading data" />}

                    {!isLoading && dialog && (
                        <>
                            <div className="mb-2 flex flex-col">
                                {' '}
                                <Formik
                                    initialValues={{ email: '' }}
                                    validate={(values) => {
                                        const errors = {};
                                        if (!values.email) {
                                            errors.email = 'Required';
                                        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
                                            errors.email = 'Invalid email address';
                                        }
                                        return errors;
                                    }}
                                    onSubmit={(values, errors) => {
                                        SSOLogin(values);
                                    }}
                                    // validateOnChange={false}
                                    // validateOnBlur={false}
                                >
                                    {(props) => {
                                        const {
                                            values,
                                            touched,
                                            errors,

                                            dirty,
                                            isSubmitting,
                                            handleChange,
                                            handleBlur,
                                            handleSubmit,
                                            handleReset,
                                        } = props;
                                        return (
                                            <Form
                                                onSubmit={handleSubmit}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSubmit();
                                                    }
                                                }}
                                            >
                                                <label htmlFor="email" style={{ display: 'block' }}>
                                                    Email
                                                </label>
                                                <input
                                                    id="email"
                                                    placeholder="Enter your email"
                                                    type="text"
                                                    value={values.email}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    className={
                                                        errors.email && touched.email
                                                            ? 'text-input error'
                                                            : 'text-input'
                                                    }
                                                />
                                                {errors.email && touched.email && (
                                                    <div className="input-feedback">{errors.email}</div>
                                                )}
                                                {ssoError && (
                                                    <p className=" mt-5 text-overline2 text-accent-red ml-5 my-2">
                                                        {ssoError}
                                                    </p>
                                                )}
                                                <div className="flex flex-row place-content-end gap-2">
                                                    {' '}
                                                    <button
                                                        id="button1"
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setDialog(false);
                                                            setSsoError('');
                                                        }}
                                                        // disabled={isSubmitting}
                                                    >
                                                        Back
                                                    </button>
                                                    <button type="submit" id="button2">
                                                        Next
                                                    </button>
                                                </div>
                                            </Form>
                                        );
                                    }}
                                </Formik>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Login;
