var CryptoJS = require('crypto-js');
const Sequelize = require('sequelize');
const mongoose = require('mongoose');

const httpGet = async (url) => {
	return new Promise((resolve, reject) => {
		const http = require('http'),
			https = require('https');

		let client = http;

		if (url.toString().indexOf('https') === 0) {
			client = https;
		}

		client
			.get(url, (resp) => {
				let chunks = [];

				// A chunk of data has been recieved.
				resp.on('data', (chunk) => {
					chunks.push(chunk);
				});

				// The whole response has been received. Print out the result.
				resp.on('end', () => {
					resolve(Buffer.concat(chunks));
				});
			})
			.on('error', (err) => {
				reject(err);
			});
	});
};

const testDBConnection = async (
	authdb,
	port,
	username,
	password,
	database,
	host,
	dialect,
	sslFlag,
	certPath,
	keyPath,
	rootPath
) => {
	try {
		if (password) {
			var bytes = CryptoJS.AES.decrypt(password, process.env.AES_ENCRYPTION_KEY);
			password = bytes.toString(CryptoJS.enc.Utf8);
		}
		if (!username && !password && !database && !host && !dialect) {
			return { code: 200, status: 'no_dbdetails', message: 'no db details passed' };
		} else if (dialect === 'mongo') {
			let authSourceDB = 'admin';
			const ipAddressRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
			if (host.match(ipAddressRegex) && port == '') {
				port = 27017;
			} else if (host.includes('.mongodb.net')) {
				port = '';
			}
			if (authdb) {
				authSourceDB = database;
			}
			const options =
				'authSource=' +
				authSourceDB +
				'&readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false';
			//handle authSource non-admin database
			console.log('options..', options);
			let connectionString = `mongodb://${username}:${password}@${host}:${port}/${database}?${options}`;

			if (port == '') {
				connectionString = `mongodb+srv://${username}:${password}@${host}/${database}`;
			}

			//console.log("connectionString..", connectionString)
			const res = mongoose
				.createConnection(connectionString, {
					useNewUrlParser: true,
					useCreateIndex: true,
					useUnifiedTopology: true
				})
				.then(() => {
					return { code: 200, status: 'success' };
				})
				.catch((err) => {
					return { code: 400, status: 'failure', message: err.message };
				});
			return res;
		} else if (dialect === 'mssql' || dialect === 'oracle') {
			const sequelize = new Sequelize(`${database}`, `${username}`, `${password}`, {
				host: `${host}`,
				dialect: `${dialect}`,
				port: `${port}`,
				dialectOptions: {
					options: {
						encrypt: true
					}
				}
			});

			const resp = sequelize
				.authenticate()
				.then((err) => {
					return { code: 200, status: 'success' };
				})
				.catch((err) => {
					return { code: 400, status: 'failure', message: err.parent.message };
				});

			return resp;
		} else if (dialect === 'mysql' || dialect === 'postgres') {
			const sequelize = new Sequelize(
				`${database}`,
				`${username}`,
				`${password}` || 'password',
				{
					host: `${host}`,
					dialect: `${dialect}`,
					operatorsAliases: false,
					port,
					dialectOptions: {
						//if sslFlag is true then only add these values to the dialectOptions object:
						...(sslFlag && {
							ssl: {
								require: true,
								rejectUnauthorized: false,
								key: (await httpGet(keyPath)).toString('utf-8'),
								cert: (await httpGet(certPath)).toString('utf-8'),
								ca: (await httpGet(rootPath)).toString('utf-8')
							}
						})
					},
					pool: {
						max: 5,
						min: 0,
						acquire: 3000,
						idle: 10000
					}
				}
			);

			const resp = sequelize
				.authenticate()
				.then(async (err) => {
					return { code: 200, status: 'success' };
				})
				.catch((err) => {
					return { code: 400, status: 'failure', message: err.parent.message };
				});

			return resp;
		} else {
			return { code: 400, status: 'failure', message: 'wrong db type!' };
		}
	} catch (err) {
		console.log('DB Connection Error:', err.message);
		return { code: 500, status: 'failure', message: err.message };
	}
};

module.exports = testDBConnection;
