const Projects = require('../../models/projects');
const Resources = require('../../models/resources');
const errorMessages = require('../../utility/errorMessages');

var checkUserAccessToProject = async (req, res, next) => {
	const projectId = req.body.projectId ? req.body.projectId : req.params.projectId;
	const resourceId = req.body.resourceId ? req.body.resourceId : req.params.resourceId;
	const pathId = req.body.pathId ? req.body.pathId : req.params.pathId;
	const operationId = req.body.operationId ? req.body.operationId : req.params.operationId;

	var isAuthorized = false;

	const user = req.user;
	const query = { $and: [{ projectId: projectId }, { isDeleted: false }] };
	const project = req.project || (await Projects.findOne(query));
	if (project) {
		if (project.author != user.user_id) {
			project.members.find((item) => {
				if (item.email == user.email) {
					isAuthorized = true;
					return;
				}
			});
			if (!isAuthorized) {
				res.status(403).send({ error: errorMessages.UNAUTHORIZED_USER });
				return;
			}
		} else {
			console.log('Authorized User for this project:', projectId);
		}
	} else {
		return res.status(400).send({ error: errorMessages.PROJECT_NOT_FOUND });
	}

	if (resourceId) {
		const projectResources = project.resources;
		const checkResource = projectResources.find((item) => {
			if (item.resource == resourceId) {
				return item;
			}
		});
		if (!checkResource) {
			return res.status(400).send({ error: errorMessages.RESOURCE_ID_NOT_VALID });
		}
		//console.log('Resource exists');
	}

	if (pathId) {
		const resource = await Resources.findOne({ resourceId: resourceId });
		const paths = await resource.path;
		const path = paths.find((item) => {
			if (item.pathId == pathId) return item;
		});
		if (!path) {
			return res.status(400).send({ error: errorMessages.PATH_ID_NOT_VALID });
		} else if (operationId) {
			const operations = await path.operations;
			const operation = operations.find((item) => {
				if (item.operationId == operationId) return item;
			});
			if (!operation) {
				return res.status(400).send({ error: errorMessages.OPERATION_ID_NOT_VALID });
			} else {
				//console.log('Operation Exists');
			}
			req.pathName = path.pathName;
			//console.log("pathname..", path.pathName);
		}
	}

	next();
};

module.exports = checkUserAccessToProject;
