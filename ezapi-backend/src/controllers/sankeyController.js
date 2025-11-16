// **********copyright info*****************************************
// This code is copyright of EZAPI LLC. For further info, reach out to rams@ezapi.ai
// *****************************************************************

const Sankey = require('../models/sankey');

exports.getSankeyData = async (req, res) => {
	let dbname = res.locals.dbname;
	let api_ops_id = req.query.api_ops_id;

	sankey_data = await Sankey.findOne({ api_ops_id: api_ops_id });

	if (sankey_data) res.status(200).json({ success: true, data: sankey_data.data });
	else res.status(404).json({ success: false, message: 'not found' });
};
