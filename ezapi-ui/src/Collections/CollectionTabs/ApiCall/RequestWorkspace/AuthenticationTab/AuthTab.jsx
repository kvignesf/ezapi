import { Divider, FormControl, MenuItem, OutlinedInput, Select } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';
import { useRecoilState } from 'recoil';
import { accessToken, authFormData } from '../../../../CollectionsAtom';
const authTypes = ['No Auth', 'Basic Auth', 'Bearer Token', 'OAuth 2.0', 'API Key'];

const grantTypes = ['Grant Type', 'Authorization Code', 'Implicit', 'Client Credentials', 'Password Credentials'];

const useStyles = makeStyles((theme) => ({
    formControl: {
        margin: theme.spacing(1),
        minWidth: 100,
    },
    container: {
        display: 'flex',
        flexDirection: 'column',
    },
    select: {
        fontSize: '12px',
        padding: '8px',
        height: '35px',
        fontWeight: 500,
        width: '7rem',
        marginTop: theme.spacing(1),
        marginRight: theme.spacing(5),
        marginBottom: theme.spacing(1),
    },
    fieldsContainer: {
        display: 'flex',
        flexDirection: 'column',
        marginTop: theme.spacing(1),
        marginLeft: theme.spacing(5),
        marginBottom: theme.spacing(1),
        width: '25rem',
    },
    textField: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
        height: '35px',
        width: '20rem',
        fontSize: '14px',
    },
}));

export default function AuthTab() {
    const classes = useStyles();
    const [authToken, setAuthToken] = useRecoilState(accessToken);
    const [formData, setFormData] = useRecoilState(authFormData);

    //Handle change functions
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };
    const handleToken = () => {
        if (
            formData.authType === 'Basic Auth' &&
            formData.baseAuthUsername &&
            formData.baseAuthUsername.length > 0 &&
            formData.baseAuthPassword &&
            formData.baseAuthPassword.length > 0
        ) {
            const data = `${formData.baseAuthUsername}:${formData.baseAuthPassword}`;
            const encodedData = btoa(data);
            setAuthToken(encodedData);
        } else if (formData.authType === 'Bearer Token' && formData.bearerToken && formData.bearerToken.length > 0) {
            setAuthToken(formData.bearerToken);
        } else if (formData.authType === 'API Key' && formData.apiKey && formData.apiKey.length > 0) {
            setAuthToken(formData.apiKey);
        } else if (formData.authType === 'OAuth 2.0') {
            if (
                formData.grantType === 'Authorization Code' &&
                formData.authCodeClientID &&
                formData.authCodeClientID.length > 0 &&
                formData.authCodeClientSecret &&
                formData.authCodeClientSecret.length > 0 &&
                formData.authCodeRedirUri &&
                formData.authCodeRedirUri.length > 0 &&
                formData.authCodeCode &&
                formData.authCodeCode.length > 0 &&
                formData.authEndpoint &&
                formData.authEndpoint.length > 0
            ) {
                const type = 'authorization_code';
                const clientId = formData.authCodeClientID;
                const clientSecret = formData.authCodeClientSecret;
                const redirectUri = formData.authCodeRedirUri;
                const authorizationCode = formData.authCodeCode;
                const endpoint = formData.authEndpoint;
                const scope = formData.authCodeScope; // Optional
                axios({
                    method: 'POST',
                    url: endpoint,
                    params: {
                        grant_type: type,
                        code: authorizationCode,
                        redirect_uri: redirectUri,
                        client_id: clientId,
                        client_secret: clientSecret,
                        scope: scope, // Optional
                    },
                })
                    .then((response) => {
                        setAuthToken(response.data.access_token);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
            if (
                formData.grantType === 'Implicit' &&
                formData.implicitAuthEndpoint &&
                formData.implicitAuthEndpoint.length > 0 &&
                formData.implicitRedirUri &&
                formData.implicitRedirUri.length > 0 &&
                formData.implicitAuthEndpoint &&
                formData.implicitAuthEndpoint.length > 0
            ) {
                const clientId = formData.implicitAuthEndpoint;
                const responseType = 'token';
                const redirectUri = formData.implicitRedirUri;
                const endpoint = formData.implicitAuthEndpoint;
                const scope = formData.implicitScope; // Optional
                const state = formData.implicitState; // Optional
                axios({
                    method: 'GET',
                    url: endpoint,
                    params: {
                        client_id: clientId,
                        response_type: responseType,
                        redirect_uri: redirectUri,
                        scope: scope, // Optional
                        state: state, // Optional
                    },
                })
                    .then((response) => {
                        // Extract the access token from the redirect URI fragment
                        const token = response.request.responseURL.split('access_token=')[1].split('&')[0];
                        setAuthToken(token);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
            if (
                formData.grantType === 'Client Credentials' &&
                formData.ccTokenEndpoint &&
                formData.ccTokenEndpoint.length > 0 &&
                formData.ccClientID &&
                formData.ccClientID.length > 0 &&
                formData.ccClientSecret &&
                formData.ccClientSecret.length > 0
            ) {
                const endpoint = formData.ccTokenEndpoint;
                const clientId = formData.ccClientID;
                const clientSecret = formData.ccClientSecret;
                const grantType = 'client_credentials';
                axios({
                    method: 'POST',
                    url: endpoint,
                    auth: {
                        username: clientId,
                        password: clientSecret,
                    },
                    params: {
                        grant_type: grantType,
                    },
                })
                    .then((response) => {
                        const token = response.data.access_token;
                        setAuthToken(token);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
            if (
                formData.grantType === 'Password Credentials' &&
                formData.pcTokenEndpoint &&
                formData.pcTokenEndpoint.length > 0 &&
                formData.pcClientID &&
                formData.pcClientID.length > 0 &&
                formData.pcClientSecret &&
                formData.pcClientSecret.length > 0 &&
                formData.pcUsername &&
                formData.pcUsername.length > 0 &&
                formData.pcPassword &&
                formData.pcPassword.length > 0
            ) {
                const endpoint = formData.pcTokenEndpoint;
                const clientId = formData.pcClientID;
                const clientSecret = formData.pcClientSecret;
                const grantType = 'password';
                const username = formData.pcUsername;
                const password = formData.pcPassword;
                axios({
                    method: 'POST',
                    url: endpoint,
                    auth: {
                        username: clientId,
                        password: clientSecret,
                    },
                    params: {
                        grant_type: grantType,
                        username: username,
                        password: password,
                    },
                })
                    .then((response) => {
                        const token = response.data.access_token;
                        setAuthToken(token);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        }
    };

    const OAuth2Fields = () => {
        switch (formData.grantType) {
            case 'Authorization Code':
                return (
                    <div onChange={handleToken}>
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Authorization Code"
                            value={formData.authCodeCode}
                            name="authCodeCode"
                            onChange={handleChange}
                            required
                        />
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Client ID"
                            onChange={handleChange}
                            name="authCodeClientID"
                            value={formData.authCodeClientID}
                            required
                        />
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Client Secret"
                            onChange={handleChange}
                            name="authCodeClientSecret"
                            type="password"
                            value={formData.authCodeClientSecret}
                            required
                        />
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Authorization Endpoint"
                            value={formData.authEndpoint}
                            name="authEndpoint"
                            onChange={handleChange}
                            required
                        />
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Redirect URI"
                            onChange={handleChange}
                            name="authCodeRedirUri"
                            value={formData.authCodeRedirUri}
                            required
                        />
                        <OutlinedInput
                            className={classes.textField}
                            onChange={handleChange}
                            name="authCodeScope"
                            value={formData.authCodeScope}
                            placeholder="Scope (optional)"
                        />
                    </div>
                );
            case 'Implicit':
                return (
                    <div onChange={handleToken}>
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Client ID"
                            onChange={handleChange}
                            name="implicitClientID"
                            value={formData.implicitClientID}
                            required
                        />
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Authorization Endpoint"
                            onChange={handleChange}
                            name="implicitAuthEndpoint"
                            value={formData.implicitAuthEndpoint}
                            required
                        />

                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Redirect URI"
                            onChange={handleChange}
                            name="implicitRedirUri"
                            value={formData.implicitRedirUri}
                            required
                        />
                        <OutlinedInput
                            className={classes.textField}
                            onChange={handleChange}
                            name="implicitScope"
                            value={formData.implicitScope}
                            placeholder="Scope (Optional)"
                        />
                        <OutlinedInput
                            className={classes.textField}
                            onChange={handleChange}
                            name="implicitState"
                            value={formData.implicitState}
                            placeholder="State (Optional)"
                        />
                    </div>
                );
            case 'Client Credentials':
                return (
                    <div onChange={handleToken}>
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Client ID"
                            onChange={handleChange}
                            name="ccClientID"
                            value={formData.ccClientID}
                            required
                        />
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Client Secret"
                            onChange={handleChange}
                            name="ccClientSecret"
                            type="password"
                            value={formData.ccClientSecret}
                            required
                        />
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Token Endpoint"
                            onChange={handleChange}
                            name="ccTokenEndpoint"
                            value={formData.ccTokenEndpoint}
                            required
                        />
                        <OutlinedInput
                            className={classes.textField}
                            onChange={handleChange}
                            name="ccScope"
                            value={formData.ccScope}
                            placeholder="Scope (Optional)"
                        />
                    </div>
                );
            case 'Password Credentials':
                return (
                    <div onChange={handleToken}>
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Client ID"
                            onChange={handleChange}
                            name="pcClientID"
                            value={formData.pcClientID}
                            required
                        />
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Client Secret"
                            onChange={handleChange}
                            name="pcClientSecret"
                            type="password"
                            value={formData.pcClientSecret}
                            required
                        />
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Token Endpoint"
                            name="pcTokenEndpoint"
                            onChange={handleChange}
                            value={formData.pcTokenEndpoint}
                            required
                        />
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Username"
                            onChange={handleChange}
                            name="pcUsername"
                            value={formData.pcUsername}
                            required
                        />
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Password"
                            onChange={handleChange}
                            name="pcPassword"
                            value={formData.pcPassword}
                            required
                        />
                        <OutlinedInput
                            className={classes.textField}
                            onChange={handleChange}
                            name="pcScope"
                            value={formData.pcScope}
                            placeholder="Scope (Optional)"
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    const renderAuthFields = () => {
        switch (formData.authType) {
            case 'Basic Auth':
                return (
                    <div className={classes.fieldsContainer} onChange={handleToken}>
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Username"
                            onChange={handleChange}
                            name="baseAuthUsername"
                            value={formData.baseAuthUsername}
                        />
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Password"
                            onChange={handleChange}
                            name="baseAuthPassword"
                            type="password"
                            value={formData.baseAuthPassword}
                        />
                    </div>
                );
            case 'Bearer Token':
                return (
                    <div className={classes.fieldsContainer} onChange={handleToken}>
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="Token"
                            onChange={handleChange}
                            name="bearerToken"
                            value={formData.bearerToken}
                        />
                    </div>
                );
            case 'OAuth 2.0':
                return (
                    <div className={classes.fieldsContainer}>
                        <Select
                            className={classes.textField}
                            labelId="req-method-label"
                            id="req-method-select"
                            value={formData.grantType}
                            onChange={handleChange}
                            name="grantType"
                            variant="outlined"
                        >
                            {grantTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </Select>
                        {OAuth2Fields()}
                    </div>
                );
            case 'API Key':
                return (
                    <div className={classes.fieldsContainer} onChange={handleToken}>
                        <OutlinedInput
                            className={classes.textField}
                            placeholder="API Key"
                            onChange={handleChange}
                            value={formData.apiKey}
                            name="apiKey"
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={classes.container}>
            <form className="flex">
                <FormControl variant="outlined" className={classes.formControl}>
                    <Select
                        className={classes.select}
                        labelId="req-method-label"
                        id="req-method-select"
                        value={formData.authType}
                        onChange={handleChange}
                        name="authType"
                        variant="outlined"
                    >
                        {authTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Divider orientation="vertical" flexItem />
                <div>{renderAuthFields()}</div>
            </form>
        </div>
    );
}
