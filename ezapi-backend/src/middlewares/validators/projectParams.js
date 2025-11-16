const Joi = require('joi');

const ParamsSchema = Joi.object({
	id: Joi.string(),
	description: Joi.string().required(),
	name: Joi.string().required(),
	possibleValues: Joi.array().items(Joi.string()),
	required: Joi.boolean().required(),
	type: Joi.string().required()
});

const ProjectParamsSchema = Joi.object({
	projectId: Joi.string().required(),
	data: Joi.array().items(ParamsSchema)
});

module.exports = ProjectParamsSchema;
