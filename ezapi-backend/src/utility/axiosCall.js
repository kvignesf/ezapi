const axios = require('axios');

const axiosCall = async (url, headers, method, data) => {
	try {
		method = method.toLowerCase();
		const axiosArguments = method === 'get' ? [url, { headers }] : [url, data, { headers }];
		const response = await axios[method](...axiosArguments);
		return {
			statusCode: response.status,
			data: response.data
		};
	} catch (error) {
		console.log('tpprxy error: ', error.response.data);
		return {
			statusCode: error.response.status,
			data: error.response.data
		};
	}
};

module.exports = axiosCall;
