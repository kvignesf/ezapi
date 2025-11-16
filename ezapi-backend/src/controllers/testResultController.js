// **********copyright info*****************************************
// This code is copyright of EZAPI LLC. For further info, reach out to rams@ezapi.ai
// *****************************************************************

const moment = require('moment');

const Testresult = require('../models/test_result');

exports.addTestResult = async (req, res) => {
	let locals = res.locals;
	let dbname = locals.dbname;

	let api_ops_id = req.query.api_ops_id;
	let body = req.body || null;

	if (body instanceof Array) {
		let data = await Testresult.findOne({ api_ops_id: api_ops_id });

		if (data) {
			let run1 = data['run1'];
			let run2 = data['run2'];

			let newRun3 = run2;
			let newRun2 = run1;
			let newRun1 = {
				executionTime: moment.now(),
				result: body
			};

			let ret = await Testresult.updateOne(
				{ api_ops_id: api_ops_id },
				{ $set: { run1: newRun1, run2: newRun2, run3: newRun3 } }
			);

			if (ret) res.status(200).json({ success: true });
			else res.status(500).json({ success: false, message: 'error saving test result' });
		} else {
			res.status(404).json({ success: false, message: 'not found' });
		}
	} else {
		res.status(400).json({ success: false, message: 'Bad request (body should be an array)' });
	}
};

exports.getTestResult = async (req, res) => {
	let dbname = res.locals.dbname;
	let api_ops_id = req.query.api_ops_id;

	let data = await Testresult.findOne({ api_ops_id: api_ops_id });

	if (data) res.status(200).json({ success: true, data: data });
	else res.status(404).json({ success: false, message: 'not found' });
};

exports.getTestReport = async (req, res) => {
	let locals = res.locals;
	let dbname = locals.dbname;

	let api_ops_id = req.query.api_ops_id;

	// Array filter
	let endpoint = req.query.endpoint || null;
	let http_method = req.query.http_method || null;
	let status_code = req.query.status_code || null;

	let data = await Testresult.findOne({ api_ops_id: api_ops_id });
	let run_data = data['run1'];

	let run_execution_time = run_data['executionTime'];
	let run_result = run_data['result'];

	let report = {
		passed: 0,
		failed: 0,
		'not executed': 0
	};

	for (let i = 0; i < run_result.length; ++i) {
		let r = run_result[i];
		let re = r.endpoint;
		let rm = r.method;
		let rs = r.status;

		if (
			(!endpoint || endpoint.includes(re)) &&
			(!http_method || http_method.includes(rm)) &&
			(!status_code || status_code.includes(rs))
		) {
			if (r['result'] == 'passed') report['passed'] += 1;
			else if (r['result'] == 'failed') report['failed'] += 1;
			else if (r['result'] == 'not executed') report['not executed'] += 1;
		}
	}

	res.status(200).json({ success: true, data: report });
};
