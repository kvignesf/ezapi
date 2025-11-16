// **********copyright info*****************************************
// This code is copyright of EZAPI LLC. For further info, reach out to rams@ezapi.ai
// *****************************************************************

const moment = require('moment');

const request = require('request');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const Master = require('../models/master');

exports.parseFileData = async (req, res) => {
	filedata = req.file;
	//console.log(filedata)

	filedir = filedata.destination;
	filename = filedata.filename;
	filepath = filedir + filename;

	filename = filename.split('.').slice(0, -1).join('.');
	username = req.user_id || 'user';
	dtstamp = moment.now();
	api_ops_id = uuidv4();

	dbname = [filename, username, dtstamp].join('__');

	// Add data into master collection
	master_doc = {
		userid: username,
		filename: filename,
		dbname: dbname,
		status: null,
		stage: null, // not parsed, parsed, scored, sankey, tests
		api_ops_id: api_ops_id,
		dtstamp: dtstamp
	};

	await Master.insertOne(master_doc);

	const options = {
		method: 'POST',
		url: process.env.APIOPS_MODEL_URL,
		formData: {
			file: fs.createReadStream(filepath),
			dbname: dbname,
			api_ops_id: api_ops_id
		}
	};

	request(options, function (err, ret, body) {
		if (err) {
			res.status(400).json({ success: false, message: err });
		} else {
			body = JSON.parse(body);

			// store body - success, stage into the master_doc
			const filter = { api_ops_id: api_ops_id };
			const options = { upsert: true };

			let api_summary = null;
			if (body.success && body.data) {
				api_summary = body.data['api_summary'] || null;
			}
			const updateDoc = {
				$set: {
					status: body.success,
					stage: body.stage,
					api_summary: api_summary
				}
			};
			(async () => {
				await Master.updateOne(filter, updateDoc, options);
			})();

			res.json(body);
		}

		try {
			fs.unlinkSync(filepath);
			console.log(`${filepath} successfully deleted from the local storage`);
		} catch (err) {
			console.log("err..", err);
		}
	});
};
