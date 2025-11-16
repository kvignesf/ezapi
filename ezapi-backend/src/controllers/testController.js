// **********copyright info*****************************************
// This code is copyright of EZAPI LLC. For further info, reach out to rams@ezapi.ai
// *****************************************************************

const Testcases = require('../models/testcases');

const addTestData = async (api_ops_id, testdata, db, test_id = null) => {
	let user_generated = false;

	if (!test_id) {
		tmp_document = await Testcases.find({ api_ops_id: api_ops_id })
			.sort({ testcaseId: -1 })
			.limit(1)
			.toArray(); // for MAX

		test_id = tmp_document[0]['testcaseId'] + 1;
		filename = tmp_document[0]['filename'];
	} else {
		filename = testdata['filename'];
	}

	let blank_input_data = {
		path: {},
		query: {},
		header: {},
		form: {},
		body: {}
	};

	let blank_assertion_data = {
		status: testdata['status'] || null,
		body: {}
	};

	let newTestData = {
		api_ops_id: api_ops_id,
		testcaseId: test_id,
		filename: filename || null,
		user_generated: true,
		test_case_name: testdata['test_case_name'] || null,
		description: testdata['description'] || null,
		resource: testdata['resource'] || null,
		operation_id: testdata['operation_id'] || null,
		endpoint: testdata['endpoint'],
		method: testdata['method'],
		test_case_type: 'F',
		delete: false,
		requestSchema: testdata['requestSchema'] || null,
		responseSchema: testdata['responseSchema'] || null,
		status: testdata['status'] || null,
		inputData: testdata['inputData'] || blank_input_data,
		assertionData: testdata['assertionData'] || blank_assertion_data
	};

	return newTestData;
};

exports.getTestGrid = async (req, res) => {
	let dbname = res.locals.dbname;
	let api_ops_id = req.query.api_ops_id;

	let project_fields = {
		testcaseId: 1,
		endpoint: 1,
		method: 1,
		status: 1,
		description: 1,
		test_case_name: 1,
		operation_id: 1,
		delete: 1,
		resource: 1
	};
	data = await Testcases.find({ api_ops_id: api_ops_id, delete: false })
		.sort({ testcaseId: 1 })
		.project(project_fields)
		.toArray();

	if (data) res.status(200).json({ success: true, data: data });
	else res.status(404).json({ success: false, message: 'not found' });
};

exports.getTestDetails = async (req, res) => {
	let dbname = res.locals.dbname;
	let api_ops_id = req.query.api_ops_id;
	let test_id = parseInt(req.params.test_id) || null;

	if (test_id) {
		data = await Testcases.findOne({
			api_ops_id: api_ops_id,
			testcaseId: test_id,
			delete: false
		});

		if (data) res.status(200).json({ success: true, data: data });
		else res.status(404).json({ success: false, message: 'not found' });
	} else {
		res.status(400).json({ success: false, message: 'some parameters (test_id) are missing' });
	}
};

exports.updateTestDetails = async (req, res) => {
	let dbname = res.locals.dbname;
	let api_ops_id = req.query.api_ops_id;
	let test_id = parseInt(req.params.test_id);
	let updated_values = req.body;

	if (test_id) {
		if (updated_values) {
			await Testcases.updateOne(
				{ api_ops_id: api_ops_id, testcaseId: test_id, delete: false },
				{ $set: { delete: true } }
			);
			let newTestData = await addTestData(api_ops_id, updated_values, db, test_id);
			let ret = await Testcases.insertOne(newTestData);

			if (ret)
				res.status(200).json({
					success: true,
					message: 'test details updated successfully'
				});
			else
				res.status(500).json({
					success: false,
					message: 'testcase updation error'
				});
		} else {
			res.status(200).json({ success: true, message: 'nothing to update' });
		}
	} else {
		res.status(400).json({ success: false, message: 'some parameters (test_id) are missing' });
	}
};

exports.deleteTest = async (req, res) => {
	let locals = res.locals;
	let dbname = locals.dbname || null;
	let api_ops_id = req.query.api_ops_id || null;
	let test_id = parseInt(req.params.test_id) || null;

	if (dbname && test_id) {
		let ret = await Testcases.updateOne(
			{ api_ops_id: api_ops_id, testcaseId: test_id, delete: false },
			{ $set: { delete: true } }
		);

		if (ret) res.status(200).json({ success: true, message: 'successfully deleted' });
		else res.status(500).json({ success: false, message: 'testcase deletion error' });
	} else {
		res.status(404).json({ success: false, message: 'not found' });
	}
};

exports.addNewTest = async (req, res) => {
	let dbname = res.locals.dbname;
	let api_ops_id = req.query.api_ops_id;
	let testdata = req.body;

	let newTestData = await addTestData(api_ops_id, testdata, db);
	let ret = await Testcases.insertOne(newTestData);

	if (ret) res.status(200).json({ success: true, message: 'successfully added new test' });
	else res.status(500).json({ success: false, message: 'error adding testcase data' });
};
