const mongoose = require('mongoose');

const isValidOperationId = require('../middlewares/validators/isValidOperationId');

const relationParamSchema = require('./relationParamSchema');

const aggregateResponseMappingSchema = new mongoose.Schema(
	{
		projectId: {
			required: true,
			type: String
		},
		operationId: {
			required: true,
			type: String
		},
		responseHeaders: [relationParamSchema],
		responseBody: [relationParamSchema]
	},
	{ strict: false }
);

aggregateResponseMappingSchema.pre('save', isValidOperationId);

const AggregateResponseMappings = mongoose.model(
	'aggregate_response_mapping',
	aggregateResponseMappingSchema,
	'aggregate_response_mapping'
);

module.exports = AggregateResponseMappings;
