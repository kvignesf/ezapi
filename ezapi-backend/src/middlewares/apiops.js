// **********copyright info*****************************************
// This code is copyright of EZAPI LLC. For further info, reach out to rams@ezapi.ai
// *****************************************************************

const Master = require('../models/master');

exports.getDbName = async (req, res, next) => {
	let api_ops_id = req.query.api_ops_id || null;

	if (api_ops_id) {
		let data = await Master.findOne({ api_ops_id: api_ops_id });

		if (!data) {
			res.status(404).json({ success: false, message: 'not found' });
			return;
		}

		res.locals.dbname = data.dbname;
		res.locals.filename = data.filename;
		next();
	} else {
		res.status(400).json({ success: false, message: 'some paramters are missing' });
	}
};

exports.checkUser = async (req, res, next) => {
	let api_ops_id = req.query.api_ops_id || null;
	let user_id = req.user_id || null;

	if (api_ops_id && user_id) {
		let data = await Master.findOne({ api_ops_id: api_ops_id });

		if (!data) {
			res.status(404).json({ success: false, message: 'not found' });
			return;
		}

		if (user_id != data.user_id) {
			res.status(401).json({
				success: false,
				message: 'Unauthorized to retrieve/update this record'
			});
			return;
		}

		res.locals.dbname = data.dbname;

		next();
	} else {
		res.status(400).json({ success: false, message: 'some paramters are missing' });
	}
};
