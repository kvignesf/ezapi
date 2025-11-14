import { createTheme, MuiThemeProvider } from '@material-ui/core';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { LinkedInPopUp } from 'react-linkedin-login-oauth2';
import { QueryClientProvider } from 'react-query';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import SnackbarProvider from 'react-simple-snackbar';
import { RecoilRoot } from 'recoil';

import ApiGovernance from './ApiGovernance/ApiGovernance';
import Collections from './Collections/Collections';
import Response from './Collections/CollectionTabs/ApiCall/ResponseWorkspace/ResponsePanel';
import { socket, SocketContext } from './Context/socket';
import Landing from './Landing';
import Login from './Login';
import Orders from './Orders/Orders';
import Pricing from './Pricing';
import ProductTour from './ProductTour/ProductTour';
import Project from './Project';
import ProjectPayment from './ProjectPayment/ProjectPayment';
import ProjectPayment2 from './ProjectPayment/ProjectPayment2';
import Projects from './Projects';
import Colors from './shared/colors';
import NotFound from './shared/components/NotFound';
import PrivateRoute from './shared/components/PrivateRoute';
import queryClient from './shared/network/queryClient';
import routes from './shared/routes';
import { isUserLoggedIn } from './shared/utils';

const theme = createTheme({
    palette: {
        primary: {
            main: Colors.brand.primary,
        },
    },
});

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_KEY);

const App = () => {
    const isAuthenticated = () => isUserLoggedIn();

    return (
        <SocketContext.Provider value={socket}>
            <RecoilRoot>
                <QueryClientProvider client={queryClient}>
                    <MuiThemeProvider theme={theme}>
                        <SnackbarProvider>
                            <BrowserRouter>
                                {/* <CookieConsentPopup /> */}

                                <Switch>
                                    {/* Login route */}
                                    <Route exact path={routes.signIn} component={Login}>
                                        <Login />
                                        {/* {!isUserLoggedIn() ? (
                  <Login />
                ) : (
                  <Redirect to={routes.projects} />
                )} */}
                                    </Route>

                                    <PrivateRoute exact path={routes.orders} component={Orders} />
                                    <PrivateRoute exact path={routes.projects} component={Projects} />
                                    <PrivateRoute exact path={routes.pricing} component={Pricing} />
                                    <PrivateRoute exact path={routes.productTour} component={ProductTour} />
                                    {/* <PrivateRoute exact path={routes.docs} component={() => {
                  //window.open('https://docs.conektto.io', '_blank') || window.location.replace('https://docs.conektto.io');
                  //window.location.replace('https://docs.conektto.io');
                  window.open('https://docs.conektto.io', '_blank')
                  return null;
                }}/> */}

                                    <PrivateRoute
                                        exact
                                        path={routes.docs}
                                        component={() => {
                                            window.location.replace('https://docs.conektto.io');
                                            return null;
                                        }}
                                    />

                                    <PrivateRoute exact path={routes.apiGovernance} component={ApiGovernance} />
                                    <PrivateRoute exact path={routes.collections} component={Collections} />
                                    <PrivateRoute exact path={routes.responseTab} component={Response} />
                                    {/*<PrivateRoute exact path={routes.docs} component={ConekttoDocs} />*/}
                                    <Route
                                        path={routes.payment}
                                        render={(props) => {
                                            return (
                                                <>
                                                    {isAuthenticated() ? (
                                                        <Elements stripe={stripePromise}>
                                                            <ProjectPayment2 {...props} />
                                                        </Elements>
                                                    ) : (
                                                        <Redirect
                                                            to={{
                                                                pathname: routes.signIn,
                                                                state: { from: props.location },
                                                            }}
                                                        />
                                                    )}
                                                </>
                                            );
                                        }}
                                    />

                                    <Route
                                        path={routes.paymentForOrder}
                                        render={(props) => {
                                            return (
                                                <>
                                                    {isAuthenticated() ? (
                                                        <Elements stripe={stripePromise}>
                                                            <ProjectPayment />
                                                        </Elements>
                                                    ) : (
                                                        <Redirect
                                                            to={{
                                                                pathname: routes.signIn,
                                                                state: { from: props.location },
                                                            }}
                                                        />
                                                    )}
                                                </>
                                            );
                                        }}
                                    />

                                    <PrivateRoute exact path={routes.project} component={Project} />

                                    <Route exact path="/linkedin" component={LinkedInPopUp} />
                                    {/* Base route */}
                                    <Route exact path="/" component={Landing} />
                                    {/* 404 */}
                                    <Route component={NotFound} />
                                </Switch>
                            </BrowserRouter>
                        </SnackbarProvider>
                    </MuiThemeProvider>
                </QueryClientProvider>
            </RecoilRoot>
        </SocketContext.Provider>
    );
};

export default App;
