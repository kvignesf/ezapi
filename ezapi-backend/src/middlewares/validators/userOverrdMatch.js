const Joi = require('joi');

const requestStructure = {
	overrideAttrMatchReq: Joi.object({
		//password: Joi.string(),
		projectId: Joi.string().required(),
		schema: Joi.string().required(),
		schemaAttribute: Joi.string().required(),
		path: Joi.string().required(),
		level: Joi.required(),
		tableName: Joi.string().required(),
		tableAttribute: Joi.string().required()
	}),
	overrideSchemaMatchReq: Joi.object({
		password: Joi.string(),
		projectId: Joi.string().required(),
		schema: Joi.string(),
		data: Joi.array().items(
			Joi.object({
				name: Joi.string().required(),
				path: Joi.string().required(),
				level: Joi.required(),
				schemaName: Joi.string(),
				overridenMatch: Joi.object({
					tableName: Joi.string().messages({
						'string.empty': 'Please fill all the fields, table cannot be empty'
					}),
					tableAttribute: Joi.string().messages({
						'string.empty': 'Please fill all the fields, column cannot be empty'
					})
				})
			})
		)
	})
};

module.exports = requestStructure;
