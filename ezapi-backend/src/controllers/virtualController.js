// **********copyright info*****************************************
// This code is copyright of EZAPI LLC. For further info, reach out to rams@ezapi.ai
// *****************************************************************

const Virtual = require('../models/virtual');

exports.getVirtualData = async (req, res) => {
	let dbname = res.locals.dbname;
	let api_ops_id = req.query.api_ops_id;

	let queryField = { api_ops_id: api_ops_id };
	if (req.query.endpoint) queryField['endpoint'] = endpoint;
	if (req.query.statusCode) queryField['responseStatusCode'] = responseStatusCode;

	data = await Virtual.find(queryField).toArray();
	res.status(200).json({ success: true, data: data });
};
