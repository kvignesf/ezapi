const Joi = require('joi');

const schemas = {
    // for relational db
	pythonCodegenSchema: Joi.object({

		projectId : Joi.string().required(),
		codegenLang : Joi.string().required(),
        codegenDb : Joi.string().required(),
        dbUserName : Joi.string().required(),
        dbPassword : Joi.string().required(),
        dbHost : Joi.string().required(),
        dbPort : Joi.string().required(), 
        dbName : Joi.string().required()

    })
}
module.exports = schemas;