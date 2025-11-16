const mongoose = require('mongoose');

const isValidOperationId = require('../middlewares/validators/isValidOperationId');

const relationParamSchema = require('./relationParamSchema');

const aggregateMappingSchema = new mongoose.Schema(
	{
		projectId: {
			required: true,
			type: String
		},
		operationId: {
			required: true,
			type: String
		},
		cardId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'aggregate_cards'
		},
		relationsParams: [relationParamSchema],
		relationsRequestBody: [relationParamSchema],
		relationsHeaders: [relationParamSchema]
	},
	{ strict: false }
);

aggregateMappingSchema.pre('save', isValidOperationId);

const AggregateMappings = mongoose.model(
	'aggregate_mappings',
	aggregateMappingSchema,
	'aggregate_mappings'
);

module.exports = AggregateMappings;
