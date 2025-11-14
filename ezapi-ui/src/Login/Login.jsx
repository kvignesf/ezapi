import { CircularProgress } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import GitHubIcon from '@mui/icons-material/GitHub';
import { Form, Formik } from 'formik';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { LinkedIn } from 'react-linkedin-login-oauth2';
import LoginGithub from 'react-login-github';
import { useHistory, useLocation } from 'react-router-dom';
import LoaderWithMessage from '../shared/components/LoaderWithMessage';
import Constants from '../shared/constants';
import { useGithubLogin, useLinkedInLogin } from '../shared/query/authQueries';
import routes from '../shared/routes';
import {
    getRedirectUrl,
    setAccessToken,
    setEmailId,
    setFirstName,
    setLastName,
    setRedirectUrl,
    setUserId,
} from '../shared/storage';
import { isUserLoggedIn } from '../shared/utils';
// image imports
import APIDesignStudio from './images/APIDesignStudio.svg';
import APITestHarness from './images/APITestHarness.svg';
import EnterpriseAPI from './images/EnterpriseAPI.svg';
import EzapiLogo from './images/EzapiLogo.svg';
import googlesvgIcon from './images/GoogleIcon.svg';
import HybridAPIOrchestrator from './images/HybridAPIOrchestrator.svg';
import linkedin from './images/LinkdInLogo.svg';
import sso from './images/SSOLogo.svg';
// css imports
import './Login.css';

// login component
const Login = () => {
    const [dialog, setDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [ssoError, setSsoError] = useState();
    const history = useHistory();

    // basic login setup
    const isUserLogged = isUserLoggedIn();

    const location = useLocation();
    const { state: locationState } = location;

    // basic login setup
    const redirectFromPathName = locationState?.from?.pathname;

    if (!isUserLogged && redirectFromPathName && redirectFromPathName !== routes.signIn) {
        setRedirectUrl(redirectFromPathName);
    }

    const loginSuccessCallback = () => {
        const pathName = getRedirectUrl();

        history.push({
            pathname: pathName || routes.projects,
            state: { allow: false },
        });
    };

    // linkedin login setup
    const linkedInRedirectUri = `${window.location.origin}/linkedin`;

    const onLinkedInSuccess = (data) => {
        if (data?.code && !_.isEmpty(data?.code)) {
            linkedInLogin({
                linkedInAuthToken: data?.code,
                redirect_uri: linkedInRedirectUri,
            });
        }
    };

    const {
        error: linkedInLoginError,
        isLoading: isLinkedInLoginLoading,
        isSuccess: isLinkedInLoginSuccess,
        mutate: linkedInLogin,
        reset: resetLinkedInLogin,
    } = useLinkedInLogin();

    const onLinkedInFailure = (error) => {
        resetLinkedInLogin();
        setAccessToken(null);
    };

    // github login
    const {
        error: githubLoginError,
        isLoading: isGitHubLoginLoading,
        isSuccess: isGitHubLoginSuccess,
        mutate: githubLogin,
        reset: resetGitHubLogin,
    } = useGithubLogin();

    const onGitHubSuccess = async (data) => {
        if (data?.code && !_.isEmpty(data?.code)) {
            githubLogin({
                code: data?.code,
                redirect_uri: process.env.REACT_APP_REDIRECT_URI,
            });
        }
    };

    const onGitHubFailure = (error) => {
        resetGitHubLogin();
        setAccessToken(null);
    };
    //const socket = useContext(SocketContext);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');
        if (isUserLogged) {
            loginSuccessCallback();
            setIsLoading(false);
        } else if (code) {
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code }),
            };

            fetch(
                //process.env.REACT_APP_API_URL + `/auth_workos?code=${code}`,
                process.env.REACT_APP_API_URL + `/auth_workos`,
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
                        setIsLoading(false);
                    } else {
                        setIsLoading(false);
                    }
                })
                .catch(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, [isUserLogged]);

    // google login
    function GoogleoAuthLogin(data) {
        fetch(process.env.REACT_APP_API_URL + '/google-signin', { method: 'GET' })
            .then((response) => response.json())
            .then((response) => {
                window.location.replace(response.url);
            })
            .catch(function (err) {
                console.info(err + ' url: ');
            });
    }

    // sso login
    function SSOLogin(values) {
        setIsLoading(true);
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: values.email,
            }),
        };
        fetch(process.env.REACT_APP_API_URL + '/sso_url', requestOptions)
            .then((response) => response.json())

            .then((data) => {
                if (!data?.url && data?.error) {
                    setSsoError(data?.error);
                    setIsLoading(false);
                }
                if (data?.url) {
                    setSsoError();
                    window.location = data?.url;
                }
            });
    }

    // render logic
    return (
        <div className="login-page grid h-screen grid-cols-6">
            <div className="col-span-4 flex flex-col items-center justify-center">
                <div className="grid grid-rows-5 mt-10 w-full h-full">
                    <div className="flex justify-center align-middle row-start-1 row-span-2">
                        {' '}
                        <div className="flex flex-col items-center justify-center mb-8">
                            <img id="conekttoLogo" src={EzapiLogo} alt="conektto logo" />
                            <p id="prodDes" className="mt-3">
                                Design, build, test and deploy API in minutes!
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col justify-start justify-items-center items-center align-top row-start-3 row-span-3 gap-7">
                        <Card
                            className="flex w-3/4 max-w-sm p-3 place-items-center justify-center items-center align-middle justify-items-center"
                            style={{ minHeight: '150px', maxHeight: '400px' }}
                        >
                            {' '}
                            {/* selection card */}
                            {!isLoading && !dialog && (
                                <>
                                    {!isLinkedInLoginLoading && (
                                        <div className="flex flex-col items-center justify-center gap-2 mb-6">
                                            <p className="mb-2">Login / Sign Up to continue to Conektto</p>
                                            <LinkedIn
                                                className="mb-2"
                                                clientId={Constants.linkedClientId}
                                                onFailure={onLinkedInFailure}
                                                onSuccess={onLinkedInSuccess}
                                                redirectUri={encodeURIComponent(linkedInRedirectUri)}
                                                redirectPath={'/signin'}
                                                scope="r_liteprofile r_emailaddress"
                                                height="49"
                                            >
                                                <img
                                                    src={linkedin}
                                                    alt="Log in with Linked In"
                                                    style={{ width: '260px', height: '45px' }}
                                                    className="w-full"
                                                />
                                            </LinkedIn>

                                            <div className="relative flex items-center justify-center align-middle"></div>

                                            <LoginGithub
                                                clientId={process.env.REACT_APP_GITHUB_CLIENT_ID}
                                                redirectUri={process.env.REACT_APP_REDIRECT_URI}
                                                onSuccess={onGitHubSuccess}
                                                onFailure={onGitHubFailure}
                                                className="github-login-button"
                                            >
                                                <div className="mt-2 flex w-4"></div>
                                                <GitHubIcon style={{ height: '24px', width: '24px' }} />
                                                <div className="mt-2 flex w-12"></div>
                                                <div className="pr-12">Continue with Github</div>
                                            </LoginGithub>

                                            <div className="relative flex items-center justify-center align-middle"></div>

                                            <div className="mt-1 flex w-4"></div>
                                            <button className="google-login-button" onClick={() => GoogleoAuthLogin()}>
                                                <div className="mt-2 flex w-4"></div>
                                                <img src={googlesvgIcon} style={{ height: '24px', width: '24px' }} />
                                                <div className="mt-2 flex w-12"></div>
                                                <div className="pr-12">Continue with Google</div>
                                            </button>

                                            {/*
                      below is google button using npm lib
                      <GoogleButton onClick={() => GoogleoAuthLogin()} type='light' style={{ width: "260px", height: "46px", fontSize:"12px", align:"center"}}>
                      </GoogleButton>
                      */}

                                            <div className="relative flex items-center justify-center align-middle">
                                                <div className="mt-2 flex w-14 border-t border-black"></div>
                                                <span className="mt-2 flex-shrink px-2">or</span>
                                                <div className="mt-2 flex w-14 border-t border-black"></div>
                                            </div>

                                            <img
                                                src={sso}
                                                onClick={() => {
                                                    setDialog(true);
                                                }}
                                                alt="Log in with SSO"
                                                style={{ width: '260px', height: '45px' }}
                                                className="w-full mt-2 cursor-pointer ... "
                                            />
                                        </div>
                                    )}
                                    {(isLinkedInLoginLoading || isGitHubLoginLoading) && (
                                        <div className="flex justify-center align-middle items-center">
                                            <CircularProgress size={20} />
                                        </div>
                                    )}
                                    {(linkedInLoginError || githubLoginError) && (
                                        <p className="text-overline2 text-accent-red">
                                            {linkedInLoginError?.message || githubLoginError?.message}
                                        </p>
                                    )}
                                </>
                            )}
                            {isLoading && <LoaderWithMessage message="Loading data" />}
                            {/* SSO Card */}
                            {!isLoading && dialog && (
                                <>
                                    <div className=" flex flex-col">
                                        {' '}
                                        <Formik
                                            initialValues={{ email: '' }}
                                            validate={(values) => {
                                                const errors = {};
                                                if (!values.email) {
                                                    errors.email = 'Required';
                                                } else if (
                                                    !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
                                                ) {
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
                                                            // style={{ border: "1px solid red" }}
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

                        <p className=" flex items-center justify-center text-overline3">
                            © {new Date().getFullYear()} Conektto INC. All Rights Reserved.
                        </p>
                    </div>
                </div>
            </div>
            <div className="col-span-2" style={{ backgroundColor: '#2C71C7' }}>
                <div className="grid h-screen grid-cols-2 p-2">
                    <div className="grid grid-rows-5 mt-5">
                        {' '}
                        <div className="flex flex-col justify-items-center align-middle row-start-1 row-span-2 ">
                            <img className="justify-center align-top " src={EnterpriseAPI} alt="conektto logo" />
                            <p className="flex mt-4 ml-7 imgDes justify-center">Enterprise API SDLC</p>
                        </div>
                        <div className=" flex flex-col justify-items-center align-middle row-start-3 row-span-2 ">
                            <img className="justify-center align-top " src={APITestHarness} alt="conektto logo" />
                            <p className="flex mt-4 ml-7 imgDes justify-center">API Test Harness</p>
                        </div>
                    </div>
                    <div className="grid grid-rows-5 mt-5">
                        {' '}
                        <div className=" flex flex-col justify-items-center align-middle row-start-2 row-span-2 ">
                            <img className="justify-center align-top " src={APIDesignStudio} alt="conektto logo" />
                            <p className="flex mt-4 ml-7 imgDes justify-center">API Design Studio</p>
                        </div>
                        <div className=" flex flex-col justify-items-center align-middle row-start-4 row-span-2 ">
                            <img
                                className="justify-center align-top "
                                src={HybridAPIOrchestrator}
                                alt="conektto logo"
                            />
                            <div className="flex flex-col mt-4  imgDes justify-items-center ">
                                <p className="flex imgDe justify-center ">Hybrid API Orchestrator</p>
                                <p className="flex imgDesCS justify-center mt-2">Coming Soon</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
