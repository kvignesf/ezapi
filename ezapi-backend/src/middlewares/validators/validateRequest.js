const validateRequest =
	(schema, body = true) =>
	(req, res, next) => {
		const property = body ? req.body : req;
		const { error } = schema.validate(property);
		if (!error) return next();

		const { details } = error;
		const message = details.map((i) => i.message).join(',');
		console.log('msg ', message);

		res.status(400).json({ message: message });
	};
module.exports = validateRequest;
