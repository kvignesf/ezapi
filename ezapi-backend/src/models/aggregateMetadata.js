const mongoose = require('mongoose');

const isValidOperationId = require('../middlewares/validators/isValidOperationId');

const typeValues = [
	'payloadBuilderNode',
	'filterNode',
	'branchNode',
	'loopNode',
	'startNode',
	'selectionNode',
	'externalAPILoopNode',
	'externalAPINode',
	'mainNode'
];

const nodeSchema = {
	cardId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'aggregate_cards'
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
	position: {
		x: {
			type: Number,
			required: true
		},
		y: {
			type: Number,
			required: true
		}
	},
	width: {
		type: Number
	},
	height: {
		type: Number
	},
	nonDeletable: Boolean,
	selected: Boolean,
	positionAbsolute: {
		x: Number,
		y: Number
	},
	dragging: Boolean,
	dragHandle: {
		type: String,
		required: false,
		default: '.custom-drag-handle'
	}
};

const edgeSchema = {
	id: {
		type: String,
		required: true
	},
	source: {
		type: String,
		required: true
	},
	target: {
		type: String,
		required: true
	},
	sourceHandle: {
		type: String
	},
	targetHandle: {
		type: String
	},
	selected: Boolean,
	animated: Boolean
};

const aggregateMetaDataSchema = new mongoose.Schema({
	projectId: {
		required: true,
		type: String
	},
	operationId: {
		required: true,
		type: String
	},
	nodes: [nodeSchema],
	edges: [edgeSchema]
});

aggregateMetaDataSchema.pre('save', isValidOperationId);

const AggregateMetaData = mongoose.model(
	'aggregate_metadata',
	aggregateMetaDataSchema,
	'aggregate_metadata'
);

module.exports = AggregateMetaData;
