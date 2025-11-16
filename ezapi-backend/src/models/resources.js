const mongoose = require('mongoose');
const METHOD = ['GET', 'POST', 'PUT', 'DELETE', 'TRACE', 'PATCH', 'HEAD'];
const operationSchema = new mongoose.Schema(
	{
		operationId: {
			type: String,
			required: true
			// unique: true
		},
		operationName: {
			type: String,
			required: true
		},
		operationType: { type: String, default: 'GET', enum: METHOD, required: true },
		operationDescription: {
			type: String,
			required: true
		},
		requestData: {
			type: Object
		},
		responseData: {
			type: Object
		}
	},
	{ _id: false }
);

const pathSchema = new mongoose.Schema(
	{
		pathId: {
			type: String,
			required: true
			// unique: true
		},
		pathName: {
			type: String,
			// unique: true,
			required: true
		},
		operations: [operationSchema]
	},
	{ _id: false }
);

const resourceSchema = new mongoose.Schema({
	resourceId: {
		type: String,
		// unique: true,
		required: true
	},
	resourceName: {
		type: String,
		required: true
	},
	path: [pathSchema]
});

const Resource = mongoose.model('resources', resourceSchema);

module.exports = Resource;
