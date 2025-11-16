const Joi = require('joi');

const schemas = {
	projectsSchema: Joi.object({
		projectName: Joi.string().required(),
		dbType: Joi.string().optional(),
		status: Joi.string().valid('IN_PROGRESS'),
		projectType: Joi.string().optional(),
		dbdetails: Joi.object({
			port: Joi.number().optional(),
			username: Joi.string().optional(),
			password: Joi.string().optional(),
			database: Joi.string().optional(),
			host: Joi.string().optional(),
			type: Joi.string().optional(),
			ssl: Joi.object({
				sslFlag: Joi.boolean().optional()
			}).optional()
		}).optional(),
		codeFramework: Joi.object({
			node: Joi.string().valid('express', 'nestjs'),
			python: Joi.string().default('flask'),
			dotnet: Joi.string().default('dotnetcore 6'),
			java: Joi.string().default('springboot')
		}).custom((value, helpers) => {
			const fields = ['node', 'python', 'dotnet', 'java'];
			const validFieldsCount = fields.reduce(
				(count, field) => count + (value[field] ? 1 : 0),
				0
			);

			if (validFieldsCount !== 1) {
				return helpers.error('any.only', {
					message:
						'Exactly one field among node, python, dotnet, and java should have a valid string value'
				});
			}

			return value;
		}, 'customValidation'),
		isDesign: Joi.boolean().optional(),
		isAggregate: Joi.boolean().optional(),
		isDefaultClaimSpec: Joi.boolean().optional(),
		isDefaultAdvSpec: Joi.boolean().optional(),
		isDefaultAdvWorks: Joi.boolean().optional(),
		isDefaultMflix: Joi.boolean().optional(),
		invites: Joi.array().items(Joi.object({ email: Joi.string().email().required() }))
	}),
	dbdetailSchema: Joi.object({
		//port: Joi.number.optional(),
		authdb: Joi.boolean().optional(),
		port: Joi.alternatives().try(Joi.number(), Joi.string().valid('')).optional(),
		username: Joi.string().optional(),
		password: Joi.string().optional(),
		database: Joi.string().optional(),
		connectionString: Joi.string().optional(),
		host: Joi.string().optional(),
		type: Joi.string().valid('mssql', 'oracle', 'mongo', 'mysql', 'postgres').required(),
		ssl: Joi.object({
			sslFlag: Joi.boolean().optional(),
			certPath: Joi.string().optional(),
			keyPath: Joi.string().optional(),
			rootPath: Joi.string().optional()
		}).optional()
	}),
	projectsUpdateReq: Joi.object({
		projectName: Joi.string(),
		status: Joi.string().valid('IN_PROGRESS'),
		invites: Joi.array().items(Joi.string().email()),
		linkedProjects: Joi.array().optional(),
		removeInvites: Joi.array().items(Joi.string().email())
	}),
	invitaionRequest: Joi.object({
		emails: Joi.array().items(Joi.string().email().required()).required(),
		projectId: Joi.string().required()
	}),
	schemaUploadReq: Joi.object({
		type: Joi.string().valid('db', 'apiSpec').required(),
		dbtype: Joi.string().valid('postgres', 'mssql', 'mysql', 'spec').optional(),
		upload: Joi.array()
	})
};
module.exports = schemas;
