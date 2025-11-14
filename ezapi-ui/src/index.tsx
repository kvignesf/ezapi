import React from 'react';
import ReactDOM from 'react-dom';

import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';

import App from './App';

ReactDOM.render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
            <App />
        </GoogleOAuthProvider>
        ;
    </React.StrictMode>,
    document.getElementById('root'),
);
