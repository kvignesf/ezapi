const mongoose = require('mongoose');

//pre existing collection
var databaseOrderSubSchema = new mongoose.Schema({
	tags: [
		{
			type: [String]
		}
	]
});
//const databaseSchema = new mongoose.Schema({}, { strict: false, minimize: false });
const databaseSchema = new mongoose.Schema({
	projectid: {
		type: String,
		unique: true,
		required: true
	},
	schemas: Array,
	tables: Array,
	type: { type: String },
	order: { type: Array }
});
const database = mongoose.model('database', databaseSchema, 'database');

module.exports = database;
