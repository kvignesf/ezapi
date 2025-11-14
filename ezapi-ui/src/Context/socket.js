import React from 'react';
import { io } from 'socket.io-client';

// let originUrl = window.location.href;
// console.log('originUrl', originUrl);
// if (originUrl.includes('/projects')) {
//     originUrl = originUrl.replace('/projects', '');
// } else {
//     originUrl = originUrl.split('/signin')[0];
// }
// console.log('originUrl2', originUrl);

export const socket = io(process.env.REACT_APP_SOCKET_URI, {
    transports: ['websocket'],
});
// export const socket = io('http://localhost:7744/socket.io/', {
//     transports: ['websocket'],
// });
export const SocketContext = React.createContext(socket);
