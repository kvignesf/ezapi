const Sequelize = require('sequelize');
var fs = require('fs');
var spawn = require('child_process').spawn;
const mysqldump = require('mysqldump');
const { execute } = require('@getvim/execute');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const msSqlDump = (username, password, database, host) => {
	var wstream = fs.createWriteStream('./uploads/backup.sql');
	var sqldump = spawn('sqldump', ['-h', host, '-u', username, '-p', password, database]);

	sqldump.stdout
		.pipe(wstream)
		.on('finish', function () {
			console.log('Completed');
		})
		.on('error', function (err) {
			console.log('Backup error is ', err);
		});
};

const mySQLDump = async (user, password, database, host, projectId, typeOfdb, timestamp) => {
	const fileName = `uploads/${projectId}_${typeOfdb}_${timestamp}.sql`;
	return new Promise(function (resolve, reject) {
		resolve(
			mysqldump({
				connection: {
					user,
					password,
					database,
					host
				},
				dumpToFile: `${fileName}`,
				dump: {
					data: false
				}
			})
		);
	});
	//	console.log('MYSQL DB DUMP FILE CREATED');
};

const postgresDump = async (
	username,
	password,
	database,
	host,
	port,
	projectId,
	typeOfdb,
	timestamp
) => {
	const fileName = `uploads/${projectId}_${typeOfdb}_${timestamp}.sql`;
	try {
		const { stdout, stderr } = await exec(
			`pg_dump -s "port=${port} host=${host} user=${username} dbname=${database} password=${password}" | awk 'RS="";/CREATE TABLE[^;]*;/;/ADD CONSTRAINT[^;]*;/;/CREATE TYPE[^;]*;/;/CREATE DOMAIN[^;]*;/' > ${fileName}`
		);
		console.log('POSTGRES DB DUMP FILE CREATED', stdout);
		console.log('stderr:', stderr);
	} catch (error) {
		console.log('ERROR!', error);
	}
};

const postgresDumpSsl = async (username, database, host, port, projectId, typeOfdb, timestamp) => {
	const certFile = 'sslkeys/postgres.pem';
	const fileName = `uploads/${projectId}_${typeOfdb}_${timestamp}.sql`;
	try {
		const { stdout, stderr } = await exec(
			// `pg_dump -s "port=${port} host=${host} user=${username} dbname=${database} sslcert=${certFile} sslkey=${certFile} sslrootcert=${certFile} sslmode=verify-ca" > ${fileName}`
			`pg_dump -s "port=${port} host=${host} user=${username} dbname=${database} password=${password}" | awk 'RS="";/CREATE TABLE[^;]*;/' > ${fileName}`
		);
		console.log('POSTGRES SSL DB DUMP FILE CREATED', stdout);
		console.log('stderr:', stderr);
	} catch (error) {
		console.log('ERROR!', error);
	}
};

// const postgresDump = (user, password, database, host) => {
// 	const fileName = __dirname + '\\pgdump.sql';
// 	console.log(fileName);
// 	execute(`set PGPASSWORD=${password}`)
// 		.then(() => {
// 			console.log('SEt password succesful');
// 		})
// 		.catch((err) => console.log('error setting PGPASSWORD', err));
// 	execute(`pg_dump -U ${user} -h ${host} -d ${database} -f ${fileName} -s`)
// 		.then(async () => {
// 			console.log('Dumped Succesfully...');
// 		})
// 		.catch((err) => {
// 			console.log('Error dumping to postgres', err);
// 		});
// };

module.exports = {
	msSqlDump,
	mySQLDump,
	postgresDump,
	postgresDumpSsl
};
