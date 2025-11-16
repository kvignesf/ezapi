const mongoose = require('mongoose');
const RELATION_TYPE_VALUES = ['relations', 'filters'];
const ORIGIN_VALUES = ['derived', 'userInput'];

const relationSchema = new mongoose.Schema({
	mainTable: {
		type: String,
		required: true
	},
	mainTableSchema: {
		type: String,
		required: true
	},
	mainTableColumn: {
		type: String,
		required: true
	},
	dependentTable: {
		type: String,
		required: true
	},
	dependentTableSchema: {
		type: String,
		required: true
	},
	dependentTableColumn: {
		type: String,
		required: true
	},
	relation: {
		type: String,
		required: true
	},
	origin: {
		type: String,
		required: true,
		enum: ORIGIN_VALUES
	}
});

const filterSchema = new mongoose.Schema({
	tableName: {
		required: true,
		type: String
	},
	schemaName: {
		required: true,
		type: String,
		default: "dbo"
	},
	columnName: {
		required: true,
		type: String
	},
	filterCondition: {
		required: true,
		type: String
	},
	value: {
		type: String,
		required: true
	}
});

const tableRelationSchema = new mongoose.Schema(
	{
		projectid: {
			required: true,
			type: String
		},
		relationType: {
			required: true,
			type: String,
			enum: RELATION_TYPE_VALUES
		},
		relations: [relationSchema],
		filters: [filterSchema],
		operationDataTables: {
			type: Array
		}
	},
	{ strict: false }
);
const tableRelationFilters = mongoose.model(
	'table_reltns_fltrs',
	tableRelationSchema,
	'table_reltns_fltrs'
);

module.exports = tableRelationFilters;
