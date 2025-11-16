const Joi = require('joi');

const schemas = {
	generateModelPromptSchema: Joi.object({
		projectId: Joi.string().required(),
		codegenLang: Joi.string().required(),
		codegenDb: Joi.string().required()
	}),
	generateModelCodeSchema: Joi.object({
		projectId: Joi.string().required(),
		codegenPrompt: Joi.string().required()
	}),
	generateODPromptSchema: Joi.object({
		projectId: Joi.string().required(),
		codegenLang: Joi.string().required(),
		codegenDb: Joi.string().required()
	}),
	generateODCodeSchema: Joi.object({
		modelPrompt: Joi.string().required(),
		projectId: Joi.string().required(),
		prompt: Joi.string().required()
	}),
	arrangeFilesSchema: Joi.object({
		dbUserName: Joi.string().required(),
		dbPassword: Joi.string().required(),
		dbHost: Joi.string().required(),
		dbPort: Joi.number().required(),
		dbName: Joi.string().required(),
		genCode: Joi.string()
			.regex(/(?=.*\.env)(?=.*requirements\.txt)/)
			.required()
			.error(new Error('Unable to generate .env file and requirements.txt file"'))
			.when(
				Joi.string()
					.regex(/(?=.*\.env)/)
					.required(),
				{
					then: Joi.string()
						.regex(/(?=.*requirements\.txt)/)
						.required()
						.error(new Error('Unable to generate requirements.txt file'))
				}
			)
			.when(
				Joi.string()
					.regex(/(?=.*requirements\.txt)/)
					.required(),
				{
					then: Joi.string()
						.regex(/(?=.*\.env)/)
						.required()
						.error(new Error('Unable to generate .env file'))
				}
			)
			.options({ abortEarly: false }),
		projectId: Joi.string().required()
	}),
	genPythonProjSchema: Joi.object({
		projectId: Joi.string().required(),
		codegenLang: Joi.string().required(),
		codegenDb: Joi.string().required(),
		dbUserName: Joi.string().required(),
		dbPassword: Joi.string().required(),
		dbHost: Joi.string().required(),
		dbPort: Joi.number().required(),
		dbName: Joi.string().required()
	}),
	nodeCodeGenSchema: Joi.object({
		projectId: Joi.string().required(),
		codegenLang: Joi.string().valid('node').required(),
		codegenDb: Joi.string().required(),
		dbUserName: Joi.string().required(),
		dbPassword: Joi.string().required(),
		dbHost: Joi.string().required(),
		dbPort: Joi.number().required(),
		dbName: Joi.string().required()
	}),
	pythonMongoCodeGenSchema: Joi.object({
		projectId: Joi.string().required(),
		dbUserName: Joi.string().required(),
		dbPassword: Joi.string().required(),
		dbHost: Joi.string().required(),
		dbPort: Joi.number().required(),
		dbName: Joi.string().required()
	})
};

module.exports = schemas;
