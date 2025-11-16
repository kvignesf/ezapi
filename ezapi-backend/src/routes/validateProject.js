const express = require('express');
const router = new express.Router();

const Projects = require('../models/projects');
const OperationData = require('../models/operationData');
const Resources = require('../models/resources');

const authenticate = require('../authentication/authentication');
const checkUserAccessToProject = require('../middlewares/validators/checkUserAccessToProject');
const errorMessages = require('../utility/errorMessages');
const isAllowPublish = require('../utility/isAllowPublish');
const checkUnmappedFields = require('../utility/checkUnmappedFields');
const UserSelMatches = require('../models/userOvrrdMatches');
const getMandatoryMappings = require('../utility/getMandatoryMappings');

router.post(
	'/projectValidate',
	authenticate,
	checkUserAccessToProject,
	isAllowPublish,
	async (req, res) => {
		try {
			const projectId = req.body.projectId;
			const project = await Projects.findOne({ projectId: projectId }).lean();
			const resources = project.resources;
			const resourcesIds = [];
			const response = [];
			let atleastOneOpernDataAdded = false;

			for (i = 0; i < resources.length; i++) {
				resourcesIds.push(resources[i].resource);
			}

			for (resourceId of resourcesIds) {
				const resource = await Resources.findOne({ resourceId: resourceId }).lean();
				const paths = resource.path;

				for (path of paths) {
					var operations = path.operations;
					for (operation of operations) {
						if (operation.operationId != null) {
							atleastOneOpernDataAdded = true;
							// operationIds.push(operation.operationId);
							let errors = await checkOperation(operation.operationId);
							if (errors.length > 0) {
								var item = {
									resource_name: resource.resourceName,
									path_name: path.pathName,
									operation_name: operation.operationName,
									errors: errors
								};
								response.push(item);
							}
						}
					}
				}
			}
			//console.log(response);

			if (!atleastOneOpernDataAdded) {
				const errorMsg = errorMessages.PROJ_WITH_NO_API;
				let err = { errors: [errorMsg] };
				response.push(err);

				//return res.status(400).send({ message: errorMsg });
			}

			if (project.githubCommit === 'CommitInProgress') {
				const errorMsg = errorMessages.GITHUB_COMMIT_INPROGRESS;
				let err = { errors: [errorMsg] };
				response.push(err);
				//return res.status(400).send({ message: errorMsg });
			}

			if (response.length > 0) {
				return res.send({ message: response });
			}

			if (project.projectType == 'both') {
				const unmappedFields = await checkUnmappedFields(projectId);
				if (unmappedFields) {
					if (unmappedFields.error) {
						return res.status(500).send(unmappedFields);
					}
					return res.status(400).send({ message: errorMessages.UNMAPPED_FIELDS });
				}
			}

			if (project.projectType == 'both') {
				const mandatoryMappings = await getMandatoryMappings(projectId);
				const newMappings = [];
				mandatoryMappings.forEach(async (item) => {
					if (item.tableName && item.tableAttribute) {
						let data = {
							projectId: projectId,
							schemaName: item.schemaName || schema,
							schemaAttribute: item.attribute || item.schemaAttribute,
							attributePath: item.path,
							attributeLevel: item.level,
							tableName: item.tableName,
							tableAttribute: item.tableAttribute,
							isDesignChange: false,
							updatedby: req.user_id
						};

						let nItem = new UserSelMatches(data);
						newMappings.push(nItem);
					}
				});
				console.log('newMappings', newMappings);
				await UserSelMatches.insertMany(newMappings);
			}
			return res.status(200).send({ message: '' });
		} catch (err) {
			return res.status(400).send({ message: err.message });
		}
	}
);

async function checkOperation(id) {
	const operation = await OperationData.findOne({ id: id }).lean();
	const { requestData, responseData: response } = operation.data;
	//const response = operation.data.responseData;
	var isStatusCode200Exists = false;
	var errors = [];

	//check for empty object
	const requestBodyData = requestData.body.properties || {};
	/* const reqBodyProps = Object.keys(requestData.body).length
		? Object.keys(requestData.body.properties)
		: []; */
	const reqBodyProps = Object.keys(requestBodyData);

	if (reqBodyProps.length) {
		//const requestBodyData = requestData.body.properties || {};
		for (item of reqBodyProps) {
			const isPropertiesExist =
				requestBodyData[item].properties &&
				Object.keys(requestBodyData[item].properties).length;
			const isItemsNotExist =
				requestBodyData[item].items &&
				(Object.keys(requestBodyData[item].items).length == 0 ||
					(requestBodyData[item].items.properties &&
						Object.keys(requestBodyData[item].items.properties).length == 0));
			if (requestBodyData[item].schemaName && requestBodyData[item].schemaName === 'global') {
				if (requestBodyData[item].type === 'object' && !isPropertiesExist) {
					let msg = errorMessages.EMPTY_OBJECT;
					msg = msg.replace('placeholder', 'Request body');
					errors.push(msg);
					//break;
				}

				if (requestBodyData[item].type === 'arrayOfObjects' && isItemsNotExist) {
					let msg = errorMessages.EMPTY_ARRAY_OBJECT;
					msg = msg.replace('placeholder', 'Request body');
					errors.push(msg);
					//break;
				}
			}
		}
	}

	for (item of response) {
		if (item.status_code == 200) {
			isStatusCode200Exists = true;
		}
		if (!item.description) {
			let msg = errorMessages.STATUS_CODE_REQUIRES_DESC + item.status_code;
			errors.push(msg);
		}
		if (!item.content) {
			let msg = errorMessages.STATUS_CODE_RESP_BODY + item.status_code;
			errors.push(msg);
		}
		const responseData = item.content.properties || {};
		const responseProperties = Object.keys(responseData);
		if (responseProperties.length) {
			for (let item of responseProperties) {
				const isPropertiesExist =
					responseData[item].properties &&
					Object.keys(responseData[item].properties).length;
				const isItemsNotExist =
					responseData[item].items &&
					(Object.keys(responseData[item].items).length == 0 ||
						(responseData[item].items.properties &&
							Object.keys(responseData[item].items.properties).length == 0));
				if (responseData[item].schemaName && responseData[item].schemaName === 'global') {
					if (responseData[item].type === 'object' && !isPropertiesExist) {
						let msg = errorMessages.EMPTY_OBJECT;
						msg = msg.replace('placeholder', 'Response body');
						errors.push(msg);
						//break;
					}
					if (responseData[item].type === 'arrayOfObjects' && isItemsNotExist) {
						let msg = errorMessages.EMPTY_ARRAY_OBJECT;
						msg = msg.replace('placeholder', 'Response body');
						errors.push(msg);
						//break;
					}
				}
			}
		}
	}
	if (!isStatusCode200Exists) {
		let msg = errorMessages.STATUS_CODE_200_REQUIRED;
		errors.push(msg);
	}

	// var responseCode200 = response.find((item) => {
	// 	if (item.status_code == 200) return item;
	// });
	//console.log(errors);
	return errors;
}

module.exports = router;
