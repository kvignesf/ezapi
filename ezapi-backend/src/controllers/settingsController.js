const Settings = require('../models/settings');

//get Settings of a user
const getSettings = async (req, res) => {
	try {
		const { user_id: userId } = req;
		const settingsOfAUser = await Settings.findOne({ userId }).lean();
		res.status(200).json({ data: settingsOfAUser });
	} catch (error) {
		res.status(500).json({ error: 'Internal Server Error', message: error.message });
	}
};

//update settings of a user
const putSettings = async (req, res) => {
	try {
		const { user_id: userId } = req;
		const { type, values } = req.body;
		const updatedSettings = await Settings.findOneAndUpdate(
			{
				userId,
				'settings.type': type
			},
			{
				$set: {
					'settings.$.values': values
				}
			},
			{ new: true }
		);
		res.status(200).json({ data: updatedSettings });
	} catch (error) {
		res.status(500).json({ error: 'Internal Server Error', message: error.message });
	}
};

module.exports = {
	getSettings,
	putSettings
};
