const mongoose = require('mongoose');

const FilterSchema = new mongoose.Schema({
	filterID: {
		type: String,
		required: true
	},
	columnName: {
		type: String,
		required: true
	},
	conditionKey: {
		type: String,
		required: true
	},
	value: {
		type: String,
		required: true
	},
	relation: {
		type: String
	},
	_id: false
});

const ParameterSchema = new mongoose.Schema({
	customParamID: {
		type: String,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	type: {
		type: String,
		required: true
	},
	description: {
		type: String
	},
	tableName: {
		type: String,
		required: true
	},
	key: {
		type: String,
		required: true
	},
	sourceName: {
		type: String,
		required: true
	},
	paramType: {
		type: String,
		required: true
	},
	columnName: {
		type: String,
		required: true
	},
	functionName: {
		type: String,
		required: true
	},
	required: {
		type: Boolean,
		required: true
	},
	filters: [FilterSchema]
});

const CustomParamatersSchema = new mongoose.Schema({
	projectID: {
		type: String,
		required: true
	},
	data: [ParameterSchema]
});

const CustomParameters = mongoose.model('customParameters', CustomParamatersSchema);

module.exports = CustomParameters;
