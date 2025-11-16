const Joi = require('joi');

const requests = {
	initiateOrderRequest: Joi.object({
		projectId: Joi.string().required(),
		productId: Joi.string().required(),
		orderId: Joi.string()
	})
};

module.exports = requests;
