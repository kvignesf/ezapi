const Joi = require('joi');

const requests = {
	resourceAddRequest: Joi.object({
		projectId: Joi.string().required(),
		resourceName: Joi.string().required()
	}),
	deleteResourceReq: Joi.object({
		projectId: Joi.string()
	}),
	renameResourceReq: Joi.object({
		resourceName: Joi.string()
	}),

	addPathRequest: Joi.object({
		resourceId: Joi.string().required(),
		pathName: Joi.string().required()
	}),
	renamePathRequest: Joi.object({
		resourceId: Joi.string().required(),
		pathName: Joi.string().required(),
		pathId: Joi.string().required()
	}),
	deletePathRequest: Joi.object({
		resourceId: Joi.string().required(),
		pathId: Joi.string().required()
	}),

	addOperationRequest: Joi.object({
		projectId: Joi.string().required(),
		resourceId: Joi.string().required(),
		pathId: Joi.string().required(),
		operationName: Joi.string().required(),
		operationType: Joi.string().required(),
		operationDescription: Joi.string().required()
	}),
	editOperationRequest: Joi.object({
		projectId: Joi.string().required(),
		resourceId: Joi.string().required(),
		pathId: Joi.string().required(),
		operationName: Joi.string(),
		operationType: Joi.string(),
		operationDescription: Joi.string()
	}),
	deleteOperationRequest: Joi.object({
		resourceId: Joi.string().required(),
		pathId: Joi.string().required()
	})
};

module.exports = requests;
