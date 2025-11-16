const fs = require('fs');
var jwt = require('jsonwebtoken');
var publicKEY = fs.readFileSync('./public.key', 'utf8');
var config = require('../authentication/config');

checkValidToken = (token) => {
	let isValid;
	try {
		jwt.verify(token, publicKEY, config.verifyOptions);
		isValid = true;
	} catch (err) {
		isValid = false;
	}
	return isValid;
};

module.exports = { checkValidToken };
