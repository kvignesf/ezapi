const mongoose = require('mongoose');

const userOvrrdMatchSchema = new mongoose.Schema(
	{
		projectId: {
			type: String,
			required: true
		},
		schemaName: {
			type: String,
			required: true
		},
		schemaAttribute: {
			type: String,
			required: true
		},
		attributePath: {
			type: String,
			required: true
		},
		attributeLevel: {
			type: String,
			required: false
		},
		tableName: {
			type: String,
			required: true
		},
		tableAttribute: {
			type: String,
			required: true
		},
		isDesignChange: {
			type: Boolean,
			required: false,
			default: true
		},
		updatedby: {
			type: String,
			required: true
		}
	},
	{ timestamps: true }
);

const userOvrrdMatch = mongoose.model('user_ovrrd_match', userOvrrdMatchSchema);

module.exports = userOvrrdMatch;
