const Projects = require('../models/projects');
const errorMessages = require('./errorMessages');
const { getFormattedUtcDateTime } = require('./utilities');

async function allowPublish(req, res, next) {
	const { projectId } = req.body;
	const user = req.user;
	const query = {
		$and: [{ projectId }, { author: req.user_id }, { isDeleted: false }]
	};
	const project = req.project || (await Projects.findOne(query));
	if (!project) {
		const errorMsg = errorMessages.PROJECT_NOT_FOUND;
		return res.status(400).send({ message: errorMsg });
	}

	const publishLeft = project.publishLimit - project.publishCount;
	const projectType = project.projectType;

	if (publishLeft <= 0 && !user.is_superuser && projectType !== 'noinput') {
		const errorMsg = errorMessages.PUBLISH_LIMIT_REACHED;
		return res.status(400).send({ message: errorMsg });
	}

	//if user is on trial/community plan , get users registered date,  get current date..find currentdate - registered date.. > 30 days -> update counts
	//if user is on trial/community plan , get users registered date - get current date..find currentdate - registered date.. < 30 days and below..
	const resetDate = new Date(user.resetOn);
	const currentDate = new Date(getFormattedUtcDateTime());
	const diffTime = currentDate - resetDate;
	const diffDays = diffTime / (1000 * 60 * 60 * 24);
	if (!user.subscribed_plan && diffDays <= 30) {
		if (
			user.designProjects <= 0 &&
			!user.is_superuser &&
			project.isDesign &&
			project.publishCount == 0 &&
			!project.isDefaultSpecDb &&
			project.projectType != 'noinput'
		) {
			const errorMsg = errorMessages.FREE_DESIGN_PROJECTS_EXHAUSTED;

			return res.status(400).send({ message: errorMsg });
		}

		if (
			user.testProjects <= 0 &&
			!user.is_superuser &&
			!project.isDesign &&
			project.publishCount == 0 &&
			!project.isDefaultSpecDb &&
			project.projectType != 'noinput'
		) {
			const errorMsg = errorMessages.FREE_TEST_PROJECTS_EXHAUSTED;
			return res.status(400).send({ message: errorMsg });
		}

		if (
			user.aggregateProjects <= 0 &&
			!user.is_superuser &&
			project.isAggregate &&
			project.publishCount == 0 &&
			!project.isDefaultSpecDb &&
			project.projectType != 'noinput'
		) {
			const errorMsg = errorMessages.FREE_AGGREGATE_PROJECTS_EXHAUSTED;
			return res.status(400).send({ message: errorMsg });
		}
	}

	req.project = project;
	next();
}

module.exports = allowPublish;
