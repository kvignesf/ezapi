const Joi = require('joi');

const requests = {
	schemaListRequest: Joi.object({
		projectId: Joi.string().required()
	}),
	subSchemaRequest: Joi.object({
		projectId: Joi.string().required(),
		name: Joi.string().required(),
		type: Joi.string().required(),
		ref: Joi.string().required()
	})
};

module.exports = requests;
