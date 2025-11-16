var jwt = require('jsonwebtoken');
const fs = require('fs');
var config = require('./config');
var publicKEY = fs.readFileSync('./public.key', 'utf8');
const User = require('../models/user');

const authentication = async (req, res, next) => {
	var bearerToken = req.headers['x-access-token'] || req.headers['authorization'];

	var msg = { auth: false, message: 'Authroization header is missing.' };
	if (!bearerToken) {
		return res.status(401).send(msg);
	}

	var token = bearerToken.split(' ')[1];

	//var legit = jwt.verify(token, publicKEY, config.verifyOptions);

	jwt.verify(token, publicKEY, config.verifyOptions, async function (err, decoded) {
		var msg = { auth: false, message: 'Invalid token. Please try login again.' };
		if (err) {
			return res.status(401).send(msg);
		}

		try {
			var currentTimeInSeconds = Date.now();
			let addedUser = await User.findOne({ user_id: decoded.user, tokens: token });

			// console.log('auth user exists :',addedUser)
			if (addedUser) {
				req.user_id = decoded.user;
				req.user = addedUser;
				req.token = token;
			} else {
				return res.status(401).send(msg);
			}
			//logic to check if linkeding expiration date is reached.
			if (req.isDBCheck) {
				if (addedUser.linkedinToken) {
					if (addedUser.expiresOn < currentTimeInSeconds) {
						msg.message = 'Linkedin token expired. Please try login again.';
						return res.status(401).send(msg);
					}
				} else {
					msg.message = 'Linkedin token is missing. Please try login again.';
					return res.status(401).send(msg);
				}
			}
		} catch (error) {
			return res.status(401).send(msg);
		}

		next();
	});
};

module.exports = authentication;
