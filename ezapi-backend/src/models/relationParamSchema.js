const relationParamSchema = {
	relation: {
		type: String,
		required: true,
		default: 'equals'
	},
	attributeName: {
		type: String,
		required: true
	},
	attributeAPI: {
		type: String,
		required: true
	},
	attributeType: {
		type: String,
		required: true
	},
	attributeDataType: {
		type: String,
		required: true
	},
	attributeRef: {
		type: String,
		required: false
	},
	mappedAttributeName: {
		type: String,
		required: true
	},
	mappedAttributeType: {
		type: String,
		required: true
	},
	mappedAttributeAPI: {
		type: String,
		required: true
	},
	mappedAttributeDataType: {
		type: String,
		required: true
	},
	mappedAttributeRef: {
		type: String,
		required: false
	},
	bearer: Boolean
};

module.exports = relationParamSchema;
