const mongoose = require('mongoose');

const AttributeSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	schemaName: {
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
	required: {
		type: Boolean,
		required: true
	},
	possibleValues: [String],
	format: { type: String }
});

const RequestBodySchema = new mongoose.Schema(
	{
		ezapi_ref: {
			type: String
			// required: true
		},
		name: {
			type: String
		},
		type: {
			type: String
		}
	},
	{ _id: false }
);

const ResponseSchema = new mongoose.Schema({
	status_code: {
		type: String,
		required: true
	},
	description: {
		type: String
	},
	content: { type: Object },
	headers: [
		{
			type: Map,
			of: AttributeSchema
		}
	],
	links: [String]
});

const DataSchema = new mongoose.Schema({
	endpoint: {
		type: String
	},
	method: {
		type: String,
		required: true
	},
	operationId: {
		type: String,
		required: true
	},
	requestData: {
		authorization: {
			authType: {
				type: String,
				default: 'No Auth',
				enum: ['No Auth', 'Bearer Token']
			},
			tokenType: {
				default: null,
				enum: [null, 'JWT'],
				type: String
			}
		},
		header: [
			{
				type: Map,
				of: AttributeSchema
			}
		],
		path: [
			{
				type: Map,
				of: AttributeSchema
			}
		],
		query: [
			{
				type: Map,
				of: AttributeSchema
			}
		],
		formData: [
			{
				type: Map,
				of: AttributeSchema
			}
		],
		body: { type: Object },
		cookie: [
			{
				type: Map,
				of: AttributeSchema
			}
		]
	},
	responseData: [ResponseSchema]
});

const OperationDataSchema = new mongoose.Schema({
	projectid: {
		type: String,
		required: true
	},
	id: {
		type: String,
		required: true
	},
	data: DataSchema
});

const OperationData = mongoose.model('OperationData', OperationDataSchema);

module.exports = OperationData;
