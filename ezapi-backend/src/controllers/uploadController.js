// **********copyright info*****************************************
// This code is copyright of EZAPI LLC. For further info, reach out to rams@ezapi.ai
// *****************************************************************

const Master = require('../models/master');

exports.getUploadHistory = async (req, res) => {
	let username = req.user_id || 'user';
	const limit = Number(req.query.limit) || null;
	if (req.query.user_id && req.query.user_id != '') {
		username = req.query.user_id;
	}

	if (username) {
		let result;
		if (limit) {
			result = await Master.find({ userid: username })
				.sort({ _id: -1 })
				.limit(limit)
				.toArray();
		} else {
			result = await Master.find({ userid: username }).sort({ _id: -1 }).toArray();
		}

		if (result) res.status(200).json({ success: true, data: result });
		else res.status(404).json({ success: true, message: 'not found' });
	} else {
		res.status(400).json({ success: false, message: 'some paramters are missing' });
	}
};
