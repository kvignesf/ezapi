const mongoose = require('mongoose');

const isValidOperationId = require('../middlewares/validators/isValidOperationId');

const typeValues = [
	'payloadBuilderNode',
	'filterNode',
	'branchNode',
	'loopNode',
	'externalAPILoopNode',
	'startNode',
	'selectionNode',
	'externalAPINode',
	'mainNode'
];

const keyValuePairSchema = new mongoose.Schema(
	{
		key: {
			type: String
		},
		value: {
			type: String
		}
	},
	{ _id: false }
);

const runDataSchema = new mongoose.Schema(
	{
		url: {
			type: String,
			required: false
		},
		method: {
			required: false,
			type: String,
			enum: ['get', 'post', 'put', 'patch']
		},
		headers: [keyValuePairSchema],
		queryParams: [keyValuePairSchema],
		pathParams: [keyValuePairSchema],
		body: {
			data: {
				type: Object
			}
		},
		output: {
			type: Object
		}
	},
	{ _id: false, minimize: false }
);

const mainDataSchema = new mongoose.Schema(
	{
		headers: [keyValuePairSchema],
		queryParams: [keyValuePairSchema],
		pathParams: [keyValuePairSchema],
		body: {
			data: {
				type: Object
			}
		}
	},
	{ _id: false }
);
const ConditionSchema = new mongoose.Schema(
	{
		conditionId: {
			type: String,
			required: true
		},
		conditionType: {
			type: String,
			required: true
		},
		rawExpression: {
			type: String,
			required: false
		},
		detailedExpression: {
			type: String,
			required: function () {
				return this.rawExpression !== undefined;
			}
		},
		parsedExpression: {
			type: Object,
			required: function () {
				return this.rawExpression !== undefined;
			}
		},
		targetNodeIds: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'aggregate_cards'
			}
		]
	},
	{ _id: false }
);

const branchDataSchema = new mongoose.Schema(
	{
		conditions: [ConditionSchema]
	},
	{ _id: false }
);

const filterFieldsSchema = {
	attributeRef: {
		type: String,
		required: false
	},
	attributeDataType: {
		type: String,
		required: false
	},
	attributeName: {
		type: String,
		required: false
	},
	iterateThroughArray: Boolean,
	originalAttributeRef: String,
	newAttributeRef: String
};
const filterDataSchema = new mongoose.Schema({
	filterType: {
		type: String,
		required: false
	},
	sourceNodeId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'aggregate_cards'
	},
	targetNodeId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'aggregate_cards'
	},
	replacedFields: [filterFieldsSchema],
	excludedFields: [filterFieldsSchema]
});

const responsePayloadDataSchema = {
	customMapping: {
		type: Boolean,
		required: false
	},
	cardId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'aggregate_cards'
	},
	cardName: {
		type: String,
		required: false
	},
	data: {
		body: {
			type: Object
		},
		headers: [keyValuePairSchema]
	}
};

const aggregateCardSchema = new mongoose.Schema(
	{
		projectId: {
			required: true,
			type: String
		},
		operationId: {
			required: true,
			type: String
		},
		type: {
			type: String,
			enum: typeValues
		},
		name: {
			type: String
		},
		parentNode: {
			type: String
		},
		inputNodeIds: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'aggregate_cards'
			}
		],
		runData: {
			type: runDataSchema,
			required: false
		},
		branchData: {
			type: branchDataSchema,
			required: false
		},
		filterData: {
			type: filterDataSchema,
			required: false
		},
		mainData: {
			type: mainDataSchema,
			required: false
		},
		responsePayloadData: {
			type: responsePayloadDataSchema,
			required: false
		},
		systemApi: {
			operationDataId: {
				type: String
			},
			sysProjectId: {
				type: String
			}
		}
	},
	{ strict: false }
);

aggregateCardSchema.pre('save', isValidOperationId);

const AggregateCards = mongoose.model('aggregate_cards', aggregateCardSchema, 'aggregate_cards');

module.exports = AggregateCards;
