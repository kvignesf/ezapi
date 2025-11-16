const Projects = require('../models/projects');

const errorMessages = require('../utility/errorMessages');

const authorization = async (req, res, next) => {
	try {
		const projectId = req.body.projectId || req.query.projectId || req.params.projectId;
		if (!projectId) throw new Error('projectId is required');
		const project = await Projects.findOne({
			author: req.user_id,
			projectId,
			isDeleted: false
		});
		if (project) {
			req.project = project;
			next();
		} else {
			return res.status(401).send({ message: errorMessages.PROJECT_NOT_FOUND });
		}
	} catch (err) {
		return res.status(400).send({ message: err.message });
	}
};
module.exports = authorization;
