const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
	{
		type: {
			type: String,
			required: true
		},
		format: {
			type: String
		}
	},
	{ _id: false }
);

const dataTypeSchema = mongoose.Schema({
	dataTypes: {
		type: Map,
		of: itemSchema
	}
});

const DataTypes = mongoose.model('datatypes', dataTypeSchema);

module.exports = DataTypes;
