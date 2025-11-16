const mongoose = require('mongoose');

const settingObjectSchema = new mongoose.Schema(
	{
		type: {
			type: String,
			required: true,
			enum: ['code', 'mail']
		},
		values: {
			type: Object,
			required: true
		}
	},
	{ _id: false }
);

const settingsSchema = new mongoose.Schema(
	{
		userId: {
			required: true,
			type: String
		},
		settings: {
			type: [settingObjectSchema],
			required: true
		}
	},
	{ strict: false }
);
const Settings = mongoose.model('settings', settingsSchema, 'settings');

module.exports = Settings;
