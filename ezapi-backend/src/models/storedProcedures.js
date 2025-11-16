const mongoose = require('mongoose');

const ATTRIBUTE_TYPE_VALUES = ['input', 'output'];

const attributeSchema = new mongoose.Schema({
	datatype: {
		type: String,
		required: true
	},
	decoder: {
		type: Object,
		required: true
	},
	openapi: {
		type: Object,
		required: true
	},
	name: {
		type: String,
		required: true
	}
});

const StoredProceduresSchema = new mongoose.Schema(
	{
		projectid: {
			type: String,
			required: true
		},
		schema: {
			type: String,
			required: true
		},
		storedProcedure: {
			type: String,
			required: true
		},
		inputAttributes: {
			type: Array,
			required: true
		},
		outputAttributes: {
			type: Array,
			required: true
		}
	},
	{ strict: false }
);
const StoredProcedures = mongoose.model('stored_procedures', StoredProceduresSchema);

module.exports = StoredProcedures;
