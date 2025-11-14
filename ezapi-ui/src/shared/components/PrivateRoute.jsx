import { Redirect, Route } from 'react-router';
import routes from '../routes';
import { isUserLoggedIn } from '../utils';

const PrivateRoute = ({ component: Component, restricted: boolean, ...rest }) => {
    const isAuthenticated = () => isUserLoggedIn();

    return (
        <Route
            {...rest}
            render={(props) => {
                return (
                    <>
                        {isAuthenticated() ? (
                            <Component {...props} />
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
    );
};

export default PrivateRoute;
