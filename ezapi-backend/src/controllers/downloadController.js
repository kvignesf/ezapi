// **********copyright info*****************************************
// This code is copyright of EZAPI LLC. For further info, reach out to rams@ezapi.ai
// *****************************************************************

const { exec } = require('child_process');
const AdmZip = require('adm-zip');
const fs = require('fs');
const { Storage } = require('@google-cloud/storage');
const currentdeployenv = process.env.DEPLOYMENT_ENV;
const Master = require('../models/master');

const removeLocalStorgae = (filepath) => {
	try {
		fs.unlinkSync(filepath);
		console.log(`${filepath} successfully deleted from the local storage`);
	} catch (err) {
		console.log(`Error deleting ${filepath} - ${err}`);
	}
};

const uploadAndGetSignedURL = async (bucketName, bucketFolder, uploadPath, filename) => {
	const projectId = 'civic-access-286104';
	const keyFilename = 'creds.json';

	const storage = new Storage({ projectId, keyFilename });
	//const storage = new Storage();
	const filepath = `${bucketFolder}/${filename}`;

	await storage.bucket(bucketName).upload(uploadPath, {
		destination: filepath,
		gzip: true,
		metadata: {
			cacheControl: 'public, max-age=31536000'
		}
	});

	const options = {
		version: 'v4',
		action: 'read',
		expires: Date.now() + 15 * 60 * 1000 // 15 minutes
	};

	const [url] = await storage.bucket(bucketName).file(filepath).getSignedUrl(options);

	return url;
};

exports.downloadImage = async (req, res) => {
	const dbname = res.locals.dbname;
	const dbfilename = res.locals.filename;
	const api_ops_id = req.query.api_ops_id;
	const os_type = req.query.os_type;

	let master_dump = await Master.findOne({ api_ops_id: api_ops_id });

	if (master_dump) {
		delete master_dump['_id'];

		//const mongo_url = process.env.MONGO_CONNECTION + "/" + dbname
		const mongo_url = process.env.MONGO_CONNECTION;
		console.log('mongo_url ', mongo_url);
		//const mongo_url = "mongodb+srv://ezapimongoadmin:JRVvuh9D5V0IZxCW@cluster0.z8ggg.gcp.mongodb.net" + "/" + dbname
		let cmd = `mongodump --uri='${mongo_url}' --forceTableScan --archive='${dbname}'`;
		if (os_type && os_type == 'windows') {
			cmd = `mongodump --uri="${mongo_url}" --forceTableScan --archive="${dbname}"`;
		}

		const dump_filename = dbname;

		exec(cmd, (error, stdout, stderr) => {
			if (error) {
				console.log(`error: ${error.message}`);
				res.status(500).json({ success: false, message: 'Unable to generate package' });
				return;
			}
			if (stderr) {
				console.log(`stderr: ${stderr}`);
			}

			const master_filename = dbname + '.json';
			fs.writeFile(master_filename, JSON.stringify(master_dump), (err) => {
				if (err) {
					res.status(500).json({ success: false, message: err });
					console.log(`error: ${err}`);
					return;
				}

				let zip = new AdmZip();
				const outfile = process.env.DUMP_PATH + dbname + '.zip';
				const shellfile = process.env.DUMP_PATH + 'offlinedeploy';
				if (currentdeployenv == 'lower') {
					shellfile = process.env.DUMP_PATH + currentdeployenv + '/' + 'offlinedeploy';
				}
				console.log('shellfilepath', shellfile);
				const constantsfile = process.env.DUMP_PATH + 'Constants.js';
				if (os_type && os_type == 'windows') {
					zip.addLocalFile(shellfile + '.ps1');
				} else {
					zip.addLocalFile(shellfile + '.sh');
					zip.addLocalFile(constantsfile);
				}
				zip.addLocalFile(dump_filename);
				zip.addLocalFile(master_filename);
				zip.writeZip(outfile);

				removeLocalStorgae(dump_filename);
				removeLocalStorgae(master_filename);

				const bucketName = process.env.EZAPI_BUCKET;
				const bucketFolder = dbname;
				const filepath = outfile;
				const filename = dbfilename + '_apiops_image.zip';

				uploadAndGetSignedURL(bucketName, bucketFolder, filepath, filename)
					.then((value) => {
						res.status(200).json({ success: true, url: value });
						removeLocalStorgae(filepath);
					})
					.catch((err) => {
						res.status(500).json({ success: false, message: err });
						removeLocalStorgae(filepath);
					});
			});
		});
	} else {
		res.status(404).json({ success: false, message: 'not found' });
	}
};
