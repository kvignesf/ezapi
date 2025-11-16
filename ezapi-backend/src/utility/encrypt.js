var crypto = require('crypto');

var encrypt = function (input, password, callback) {
	var m = crypto.createHash('md5');
	m.update(password);
	var key = m.digest('hex');

	m = crypto.createHash('md5');
	m.update(password + key);
	var iv = m.digest('hex');

	var data = Buffer.from(input, 'utf8').toString('binary');

	var cipher = crypto.createCipheriv('aes-256-cbc', key, iv.slice(0, 16));

	// UPDATE: crypto changed in v0.10
	// https://github.com/joyent/node/wiki/Api-changes-between-v0.8-and-v0.10
	var nodev = process.version.match(/^v(\d+)\.(\d+)/);
	var encrypted;

	if (nodev[1] === '0' && parseInt(nodev[2]) < 10) {
		encrypted = cipher.update(data, 'binary') + cipher.final('binary');
	} else {
		encrypted = cipher.update(data, 'utf8', 'binary') + cipher.final('binary');
	}

	var encoded = Buffer.from(encrypted, 'binary').toString('base64');

	callback(encoded);
};

module.exports = {
	encrypt
};
