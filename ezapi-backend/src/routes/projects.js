const express = require('express');
const router = new express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const request = require('request');
var CryptoJS = require('crypto-js');
const fs = require('fs');

const authenticate = require('../authentication/authentication');
const validator = require('../middlewares/validators/validateRequest');
const schema = require('../middlewares/validators/projects');
const { sendEmail } = require('../services/mailing');
const { capitalizeFirstLetter, removeDuplicateItems } = require('../utility/utilities');
const Projects = require('../models/projects');
const User = require('../models/user');
const Resources = require('../models/resources');
const OperationData = require('../models/operationData');
const SchemaData = require('../models/schemas');
const TableRelationFilters = require('../models/tableRelationFilters');
const Tables = require('../models/tables');
const Products = require('../models/products');
const { encrypt } = require('../utility/encrypt');
let CodegenPrompts = require('../models/codegenPrompts');

const errorMessages = require('../utility/errorMessages');
const testDBConnection = require('../controllers/testDBConnection');
const { getTableRelations } = require('../utility/getTableRelations');
const isAllowPublish = require('../utility/isAllowPublish');
const authorize = require('../authentication/authorization');
let { codeGenpython, generatePyMongoCodeGen } = require('../utility/getPromptsCompletions');
const { sqlNodeCodeGen, mongoCodeGen } = require('../utility/nodeCodeGen');
const { aggregateCodeGen } = require('../utility/aggregateCodeGen');

const dataGenerationUrl = process.env.DATA_GENERATION_URL;
const aiServerURL = process.env.AI_SERVER_URL;
const uploadsDirectory = process.env.FILE_UPLOAD_PATH;
const shardInbxEmailId = process.env.SHAREDINBOX_EMAILID;
const codegenApiURL = process.env.CODE_GEN_SERVER_URL;
let hostPath = aiServerURL.replace(':5000', '');
if (hostPath.includes('instance-1')) {
	hostPath = hostPath.replace('instance-1', 'www');
}
hostPath = hostPath.replace('http', 'https');

router.get('/project', authenticate, async (req, res) => {
	let query = {
		$and: [
			{ $or: [{ author: req.user_id }, { 'members.email': req.user.email }] },
			{ isDeleted: false }
		]
	};

	const projects = await Projects.find(query).sort({ updatedAt: -1 }).lean();
	let nProjectsArr = [];
	let userDataMap = {}; // memorize records for user -> userData map

	res.status(200).send(projects);
});

router.get('/project/:projectId', authenticate, async (req, res) => {
	try {
		const { projectId } = req.params;
		const query = { $and: [{ projectId }, { isDeleted: false }] };
		const project = await Projects.findOne(query);
		if (!project) {
			return res.status(404).send({ error: errorMessages.PROJECT_NOT_FOUND });
		}
		res.status(200).send(project);
	} catch (error) {
		res.status(400).send({ error: error.message });
	}
});

router.post('/project', authenticate, validator(schema.projectsSchema), async (req, res) => {
	const author = req.user.user_id;
	const projectId = uuidv4();
	const isDefaultSpecDb =
		req.body.isDefaultClaimSpec ||
		req.body.isDefaultAdvSpec ||
		req.body.isDefaultAdvWorks ||
		req.body.isDefaultMflix;

	const project = new Projects({ ...req.body, author, projectId, isDefaultSpecDb });

	try {
		const { invites, projectName } = req.body;
		const { firstName, lastName, email: authorEmail } = req.user;
		const authorName = capitalizeFirstLetter(firstName) + ' ' + capitalizeFirstLetter(lastName);
		let members = [];

		const user = await User.findOne({ user_id: req.user_id });
		let superuserFlag = user.is_superuser || false;

		// Adding guest members to project
		let emailsArray = invites ? invites.map((item) => item.email) : [];

		// Remove duplicates frome emails array
		// And avoid adding admin as guest member
		emailsArray = removeDuplicateItems(emailsArray);
		emailsArray = emailsArray.filter((item) => item !== authorEmail);

		let inviteCount = emailsArray.length;

		let subscribedPlan = user.subscribed_plan;

		let guestLimit;
		//Setting Guest Limit,publish Limit && project BillingPlan:

		let subscribedProduct;

		if (subscribedPlan) {
			subscribedProduct = await Products.findOne({
				stripe_product_id: subscribedPlan
			});
		} else {
			subscribedProduct = await Products.findOne({
				stripe_product_id: { $exists: false }
			});
		}

		if (subscribedProduct) {
			project.publishLimit = subscribedProduct.no_of_republish;
			project.projectBillingPlan = subscribedProduct.plan_name;
			guestLimit = subscribedProduct.no_of_collaborators;
		}

		//Checking Collaborator limit:
		if (!superuserFlag) {
			if (inviteCount > guestLimit) {
				return res.status(400).send({
					errorType: 'COLLABRATOR_LIMIT_REACHED',
					message: errorMessages.COLLABRATOR_LIMIT_REACHED
				});
			}
		}

		for (email of emailsArray) {
			let invitedData = await sendInvite(email, projectName, authorName);
			members.push(invitedData);
		}

		// Add author as admin member
		let author = {
			accepted: true,
			email: req.user.email,
			user: req.user.user_id,
			role: 'admin',
			firstName: firstName,
			lastName: lastName
		};

		members.push(author);

		// Geting products pricing version active while project is created
		let pricingVersions = [];
		const products = await Products.find({ isActive: 1 });
		if (products) {
			pricingVersions = products.map((productItem) => {
				return { productName: productItem.name, productVersion: productItem.version };
			});
		}

		project.members = members;
		project.pricingVersions = pricingVersions;
		project.membersLimit = guestLimit - inviteCount;
		if (isDefaultSpecDb) {
			if (req.body.isDefaultAdvSpec) {
				let currentSampleProjCnt = 0;
				if (user.sampleProjCount) {
					currentSampleProjCnt = user.sampleProjCount;
				}
				user.sampleProjCount = currentSampleProjCnt + 1;
			}

			if (req.body.isDefaultAdvWorks) {
				let advWrksDBCrntCnt = 0;
				if (user.sampleAdvWorksDBProjCnt) {
					advWrksDBCrntCnt = user.sampleAdvWorksDBProjCnt;
				}
				user.sampleAdvWorksDBProjCnt = advWrksDBCrntCnt + 1;
			}

			if (req.body.isDefaultMflix) {
				let mFlixDBCrntCnt = 0;
				if (user.sampleMFlixDBProjCnt) {
					mFlixDBCrntCnt = user.sampleMFlixDBProjCnt;
				}
				user.sampleMFlixDBProjCnt = mFlixDBCrntCnt + 1;
			}
			await user.save();
		}
		await project.save();
		res.status(201).send(project);
	} catch (error) {
		console.log('error-post-proj', error);
		res.status(400).send({ error: error.message });
	}
});

router.post('/db_to_python', authenticate, authorize, async (req, res) => {
	try {
		const {
			authdb,
			projectId,
			sslMode,
			server,
			username,
			database,
			dbtype,
			portNo,
			certPath,
			keyPath,
			rootPath
		} = req.body;

		const query = { $and: [{ projectId: projectId }, { isDeleted: false }] };
		const project = await Projects.findOne(query);
		const freeFlowOrProcessApi =
			project.projectType === 'noinput' || project.projectType === 'aggregate';
		if (project && project.projectType && freeFlowOrProcessApi) {
			return res.status(400).send({ error: 'Aggregate or free flow' });
		}

		let type = 'db';
		if (type == 'db') {
			if (!project.projectType) {
				project.projectType = 'db';
			} else {
				project.projectType = 'both';
			}
		} else if (type == 'apiSpec') {
			if (!project.projectType) {
				project.projectType = 'schema';
			} else {
				project.projectType = 'both';
			}
		}
		project.isConnectDB = true;
		project.datagen_count = 0;
		project.datagen_perf_count = 0;
		await project.save();

		let { password } = req.body;
		let port = portNo;

		var bytes = CryptoJS.AES.decrypt(password, process.env.AES_ENCRYPTION_KEY);
		password = bytes.toString(CryptoJS.enc.Utf8);

		let typeOfdb = dbtype;

		let url = aiServerURL + '/db_extractor';

		if (dbtype == 'mongo') {
			url = aiServerURL + '/mongo_extractor';
		}

		if (password) {
			var passwordToEncrypt = 'ezapidbpwdhandshake';
			encrypt(password, passwordToEncrypt, function (encoded) {
				password = encoded;
			});
		} else {
			password = '';
		}

		return new Promise((resolve, reject) => {
			let reqBody = {
				authdb: authdb,
				projectid: projectId,
				server: server,
				username: username,
				password: password,
				portNo: portNo,
				database: database,
				dbtype: dbtype,
				sslMode: sslMode,
				certPath: certPath,
				keyPath: keyPath,
				rootPath: rootPath
			};

			let options = {
				url: url,
				body: reqBody,
				json: true
			};

			request.post(options, async function (err, httpResponse, body) {
				if (err) {
					resolve({
						success: false,
						message: 'Error occured while calling API'
					});
				} else {
					const { isDesign } = project;
					let dbDetails;
					if (!isDesign) {
						callSpecParserApi(projectId);
					}
					delete reqBody.password;
					delete reqBody.projectid;
					dbDetails = reqBody;
					const ipAddressRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
					if (server.match(ipAddressRegex) && portNo == '') {
						port = '27017';
					} else if (server.includes('.mongodb.net')) {
						port = '';
					}
					dbDetails.portNo = port;
					project.dbDetails = dbDetails;
					await project.save();
					resolve(body);
					res.status(httpResponse.statusCode).send({ body, projectId: projectId });
				}
			});
		});
	} catch (err) {
		return res.status(500).send({ error: err.message });
	}
});

router.delete('/project/:projectId', authenticate, authorize, async (req, res) => {
	try {
		const project = req.project;

		project.isDeleted = true;
		await project.save();
		res.status(200).send({ message: 'Deleted', project });
	} catch (err) {
		res.status(400).send({ err: err.message });
	}
});

const attachProject = async (req, res, next) => {
	const projectId = req.params.id;
	const project = await Projects.findOne({ projectId });
	if (!project) {
		return res.status(404).send({ error: errorMessages.PROJECT_NOT_FOUND });
	} else {
		const isFreeFlow =
			project.projectType === 'no_input' || project.projectType === 'aggregate';
		if (project.projectType && isFreeFlow) {
			return res.status(200).send({ error: 'Aggregate Project or free flow', message: 'ok' });
		}
		req.project = project;
		next();
	}
};

router.patch(
	'/project/:id/update',
	authenticate,
	validator(schema.projectsUpdateReq),
	async (req, res) => {
		try {
			const authorEmail = req.user.email;
			const userId = req.user.user_id;
			const projectId = req.params.id;
			const query = { author: userId, isDeleted: false, projectId };
			const project = await Projects.findOne(query);
			if (!project) {
				return res.status(404).send({ error: errorMessages.PROJECT_NOT_FOUND });
			}

			const projectName = project.projectName;
			const authorName =
				capitalizeFirstLetter(req.user.firstName) +
				' ' +
				capitalizeFirstLetter(req.user.lastName);
			const updates = Object.keys(req.body);

			for (item of updates) {
				if (item == 'invites') {
					let emailsArray = req.body['invites'];

					// Remove duplicates frome emails array
					// And avoid adding admin as guest member
					emailsArray = removeDuplicateItems(emailsArray);
					emailsArray = emailsArray.filter((item) => item !== authorEmail);

					// Validatation: dont allow adding more than #membersLimit collabrators
					let membersCount = project.members.length;
					let inviteCount = emailsArray.length;
					let membersLimit = project.membersLimit;
					if (membersCount + inviteCount > membersLimit) {
						return res.status(400).send({
							errorType: 'COLLABRATOR_LIMIT_REACHED',
							error: errorMessages.COLLABRATOR_LIMIT_REACHED
						});
					}

					// Add guest
					for (email of emailsArray) {
						const isAlreadyInvited = project.members.some(function (el) {
							return el.email === email;
						});

						if (!isAlreadyInvited) {
							let invitedData = await sendInvite(email, projectName, authorName);
							project.members = [...project.invites, invitedData];
						}
					}
				} else if (item == 'removeInvites') {
					let emailsArray = req.body['removeInvites'];
					let removalCount = 0;

					// Remove duplicates from emails array
					emailsArray = removeDuplicateItems(emailsArray);
					// And avoid removing admin member
					emailsArray = emailsArray.filter((item) => item !== authorEmail);

					project.members = project.members.filter((item) => {
						let exists = emailsArray.includes(item.email);
						if (exists) {
							removalCount = removalCount + 1;
						} else return !exists;
					});
					project.membersLimit = project.membersLimit - removalCount;
				} else {
					project[item] = req.body[item];
				}
			}

			await project.save();
			res.send({ message: 'update sucessful!', project });
		} catch (error) {
			res.status(400).send({ error: error.message });
		}
	}
);

router.post(
	'/invite_collabrator',
	authenticate,
	validator(schema.invitaionRequest),
	inviteController
);

router.post('/projects/:id/uploads', attachProject, uploadController);

router.post('/publish', authenticate, authorize, isAllowPublish, publishController);

let clients = [];
router.get('/sse', authenticate, (req, res) => {
	const projectId = null;
	const enableIcon = false;
	res.write('event: dataGenCompleted\n');
	res.write(`data: {projectId:${projectId},enableIcon:${enableIcon}}`);
	res.write('\n\n');
	clients.push({ userId: req.user.user_id, res });
	req.on('close', () => {
		clients = clients.filter((client) => client.userId !== req.user.user_id);
	});
});

router.post('/data_gen_status', async (req, res) => {
	const { projectId, enableIcon } = req.body;
	const project = await Projects.findOne({ projectId });
	if (project) {
		res.status(200).json({ message: 'Success' });
		return sendEventsToClients({ projectId, enableIcon });
	} else {
		res.status(400).json({ message: 'Invalid projectId or project does not exist' });
	}
});

router.post('/getTablesRelations', authenticate, authorize, async (req, res) => {
	try {
		const { projectId } = req.body;
		if (!projectId) {
			throw new Error('Project Id is missing');
		}
		const entityMappingRelations = await getTableRelations(projectId);
		return res.status(200).json(entityMappingRelations);
	} catch (err) {
		return res.send({ err: err.message });
	}
});

router.post('/tableMappings', authenticate, authorize, async (req, res) => {
	try {
		const { projectId, relations, filters } = req.body;
		if (!projectId) {
			return res.status(400).send('projectId is missing');
		}
		// const { projectType } = await Projects.findOne({ projectId }, { projectType: 1 }).lean();
		/* if (!(projectType == 'db')) {
			return res.status(400).send('Operation Data tables applicable only for db only flow');
		} */
		if (relations && relations.length) {
			await TableRelationFilters.updateOne(
				{
					projectid: projectId,
					relationType: 'relations'
				},
				{
					$set: { relations }
				},
				{
					upsert: true
				}
			);
		}
		if (filters && filters.length) {
			await TableRelationFilters.updateOne(
				{
					projectid: projectId,
					relationType: 'filters'
				},
				{
					$set: { filters }
				},
				{
					upsert: true
				}
			);
		}

		const newTableRelationsList = await TableRelationFilters.findOne({
			projectid: projectId,
			relationType: 'relations',
			'relations.origin': 'userInput'
		}).lean();
		let usrInputRelations;
		if (newTableRelationsList) {
			usrInputRelations = newTableRelationsList.relations.filter(
				(rec) => rec.origin == 'userInput'
			);
		}
		if (usrInputRelations && usrInputRelations.length) {
			for (const usrInputRltn of usrInputRelations) {
				const {
					mainTable,
					mainTableSchema,
					mainTableColumn,
					dependentTable,
					dependentTableColumn,
					dependentTableSchema
				} = usrInputRltn;
				await Tables.updateOne(
					{
						projectid: projectId,
						key: mainTableSchema + '.' + mainTable,
						'attributes.name': mainTableColumn
					},
					{
						$set: {
							'attributes.$.logicalKey': {
								key: 'customKey',
								schema: dependentTableSchema,
								table: dependentTable,
								column: dependentTableColumn
							}
						}
					}
				);
			}
		}
		//await publishController(req, res);
		return res.status(200).send({ message: 'Entity mappings saved successfully' });
	} catch (err) {
		return res.status(400).send({ err: err.message });
	}
});

router.put('/project/:projectId', async (req, res) => {
	try {
		const projectId = req.params.projectId;
		const query = { isDeleted: false, projectId };
		let project = await Projects.findOne(query);
		if (!project) {
			return res.status(404).send({ error: errorMessages.PROJECT_NOT_FOUND });
		}
		const updatedProject = req.body;
		result = await Projects.findOneAndUpdate(
			{ isDeleted: false, projectId },
			{
				$set: {
					updatedProject
				}
			},
			{ returnOriginal: true }
		);
	} catch (err) {
		res.send(err);
	}
});
const sendEventsToClients = async (responseData) => {
	const { projectId } = responseData;
	const project = await Projects.findOne({ projectId });
	let authorId;
	if (project) {
		authorId = project.author;
	}
	clients.every((client) => {
		if (client.userId === authorId) {
			client.res.write(`event: dataGenCompleted\n`);
			client.res.write(`data: ${JSON.stringify(responseData)}\n\n`);
			return false;
		}
	});
};
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadsDirectory);
	}
});

async function uploadController(req, res) {
	//this request may take around 10 mins to complete
	let timeout = 10 * 60 * 1000;
	req.socket.setTimeout(timeout);
	const project = req.project;

	try {
		let upload = multer({
			storage: storage,
			limits: { fileSize: 52428800, fieldSize: 52428800 } // 52428800
		}).array('upload');

		upload(req, res, async function (err) {
			//try {
			if (err) {
				console.log('err while uploading', err);
				await removeProject(project);
				res.status(400).send({ error: 'Error uploading file.' });
				req.socket.destroy();
				return;
			} else {
				// validate file upload request
				const { error } = schema.schemaUploadReq.validate(req.body);
				const valid = error == null;
				if (!valid) {
					const { details } = error;
					const message = details.map((i) => i.message).join(',');
					await removeProject(project);
					res.status(400).send(error);
					req.socket.destroy();
					return;
				}

				//extracting file data in appropriate form
				const filesList = req.files.map((item) => {
					return {
						name: item.originalname,
						file: item.filename
					};
				});

				let resp;
				const type = req.body.type;
				const dbtype = req.body.dbtype;

				let projectId = req.params.id;

				if (type == 'apiSpec') {
					project.apiSpec = filesList;
				} else if (type == 'db') {
					project.dbSchema = filesList;
				}

				await project.save();
				let projectObj = project;

				if (type == 'db') {
					let len = projectObj.dbSchema.length;
					if (len == 0) {
						throw new Error('No DB file found for this project');
					}

					let file = projectObj.dbSchema[len - 1]['file']; // taking the last uploaded db file, because nultiple file parsing is not supported currently
					let fileName = projectObj.dbSchema[len - 1]['name'];
					let url = aiServerURL + '/ddl_parser';

					try {
						resp = await uploadFileToAiServer({
							url,
							file,
							fileName,
							type,
							dbtype,
							projectId
						});
					} catch (e) {
						await removeProject(project);
						res.status(400).send(e);
						req.socket.destroy();
						return;
					}
				} else if (type == 'apiSpec') {
					let len = projectObj.apiSpec.length;
					if (len == 0) {
						throw new Error('No Spec file found for this project');
					}

					let file = projectObj.apiSpec[len - 1]['file']; // taking the last uploaded spec file
					let fileName = projectObj.apiSpec[len - 1]['name'];
					let url = aiServerURL + '/spec_parser';

					try {
						resp = await uploadFileToAiServer({
							url,
							file,
							fileName,
							type,
							dbtype,
							projectId
						});
					} catch (e) {
						await removeProject(project);
						res.status(400).send(e);
						req.socket.destroy();
						return;
					}
				}

				//Updating project status
				if (resp.status == 200) {
					project.status = 'IN_PROGRESS';
				} else {
					// Parsing error
					await removeProject(project);
					let error = {
						projectId: project.projectId,
						aiResponse: resp
					};
					res.status(400).send(error);
					req.socket.destroy();
					return;
				}
				if (type == 'db') {
					if (!project.projectType) {
						project.projectType = 'db';
					} else {
						project.projectType = 'both';
					}
				} else if (type == 'apiSpec') {
					if (!project.projectType) {
						project.projectType = 'schema';
					} else {
						project.projectType = 'both';
					}
				}
				await project.save();

				let statusCode = resp.status ? resp.status : 400;
				res.status(statusCode).send({
					projectId: project.projectId,
					aiResponse: resp
				});
				req.socket.destroy();
				return;
			}
			/* } catch (error) {
			await removeProject(project);
			res.status(400).send(error.message);
			req.socket.destroy();
			return;
		} */
		});
	} catch (error) {
		await removeProject(project);
		res.status(400).send(error.message);
		req.socket.destroy();
		return;
	}
}

async function removeProject(project) {
	try {
		console.log('Removing project');
		// Delete related files from file system if any
		let relatedFilesList = [];
		if (project.apiSpec.length > 0) {
			relatedFilesList = project.apiSpec;
		}

		if (project.dbSchema.length > 0) {
			relatedFilesList = [...relatedFilesList, ...project.dbSchema];
		}

		for (item of relatedFilesList) {
			let fileName = item.file;
			let filePath = uploadsDirectory + fileName;
			console.log('Removing dbSchema', filePath);
			fs.unlinkSync(filePath);
			console.log(`${filePath} successfully deleted from the local storage`);
		}

		const user = await User.findOne({ user_id: project.author });
		const allowedProjects = user.allowedProjects;
		//user.allowedProjects = allowedProjects + 1;

		await user.save();

		// Delete project
		await project.remove();
	} catch (err) {
		console.log(`Error deleting project`, err);
	}
}

async function inviteController(req, res) {
	try {
		//find user
		const userId = req.user_id;
		const user = await User.findOne({ user_id: userId });
		const projectId = req.body.projectId;
		let emailsArray = req.body.emails;
		let projectQuery = { author: userId, isDeleted: false, projectId: projectId };
		const project = await Projects.findOne(projectQuery);
		let actualEmailsArray = [];

		if (!project) {
			return res.status(404).send({ error: errorMessages.PROJECT_NOT_FOUND });
		}

		if (!user) {
			return res.status(400).send({ error: errorMessages.USER_ID_NOT_VALID });
		}

		actualEmailsArray = emailsArray.filter(function (obj) {
			return !project.members.some(function (obj2) {
				return obj === obj2.email;
			});
		});

		let inviteeCount = actualEmailsArray.length;
		let superuserFlag = user.is_superuser ? user.is_superuser : false;
		if (!superuserFlag) {
			if (inviteeCount > project.membersLimit) {
				return res.status(400).send({
					errorType: 'COLLABRATOR_LIMIT_REACHED',
					message:
						errorMessages.COLLABRATOR_LIMIT_REACHED +
						' You have only ' +
						project.membersLimit +
						' remaining Collaborators for your current subscription'
				});
			}
		}

		if (actualEmailsArray.length === 0) {
			return res.status(200).send({
				members: project.members,
				membersLimit: project.membersLimit
			});
		}
		const projectName = project.projectName;
		const authorName =
			capitalizeFirstLetter(user.firstName) + ' ' + capitalizeFirstLetter(user.lastName);

		for (email of actualEmailsArray) {
			let invitedData = await sendInvite(email, projectName, authorName);
			project.members = [...project.members, invitedData];
		}

		project.membersLimit = project.membersLimit - inviteeCount;
		await project.save();
		const projectObj = await getProjectsWithUserData(project);
		res.status(200).send({
			members: projectObj.members,
			membersLimit: project.membersLimit
		});
	} catch (error) {
		res.status(400).send({ error: error.message });
	}
}

async function getProjectsWithUserData(project, userDataMap = {}) {
	let nProjectObj = project.toObject();

	for (inviteItem of nProjectObj.members) {
		let userD = userDataMap[inviteItem.user];
		if (!!userD) {
			inviteItem['user_data'] = userD;
		} else {
			let userf = await User.findOne({ user_id: inviteItem.user });
			if (userf) {
				userf = userf.getPublicProfile();

				userDataMap[inviteItem.user] = userf;
				inviteItem['user_data'] = userf;
			}
		}
	}
	return nProjectObj;
}

async function sendInvite(email, projectName = '', authorName = '') {
	let user = await User.findOne({ email });
	let invitedData = {};

	const mailOptions = {
		//from: `EZAPI <admin@ezapi.ai>`,
		from: shardInbxEmailId,
		to: email,
		subject: 'Invited for Collaboration',
		text: `Hi There!\n\nYou have been invited by ${authorName} to collaborate on ${projectName} project.\nRegister on https://www.conektto.io/ to collabrate.\n\nThanks.`
	};
	sendEmail(mailOptions);

	if (user) {
		invitedData = {
			email: email,
			user: user.user_id,
			accepted: true,
			firstName: user.firstName,
			lastName: user.lastName
		};
	} else {
		invitedData = { email: email };
	}

	return invitedData;
}

async function uploadFileToAiServer(params) {
	const { url, file, fileName, type, dbtype, projectId } = params;
	console.log('FILE UPLOAD STARTING...');
	let uploadField;
	if (type == 'db') {
		uploadField = 'ddl_file';
	} else if (type == 'apiSpec') {
		uploadField = 'spec_file';
	}

	return new Promise(function (resolve, reject) {
		const callback = (error, httpResponse, body) => {
			let statusCode;
			if (httpResponse && httpResponse.statusCode) {
				statusCode = httpResponse.statusCode;
			}

			if (error) {
				console.log('Error!', error);
				resolve({ status: statusCode, message: 'Error', error: error });
			} else {
				if (statusCode == '200') {
					body = JSON.parse(body);
					//console.log('JSON Response: ' + body);
					resolve(body);
				} else {
					reject(body);
				}
			}
		};

		let req1 = request.post(url, callback);

		//	let filePath = path.join(__dirname, '../../uploads/' + file);
		let filePath = 'uploads/' + file;
		//		let fileData = fs.createReadStream(filePath);
		let fileData;

		async function read(inputFilePath) {
			fileData = fs.createReadStream(inputFilePath, {
				encoding: 'utf8',
				highWaterMark: 1024
			});

			for await (const chunk of fileData) {
				//console.log('>>> ' + chunk);
				//console.log('reading file data')
			}
			console.log('### DONE ###');
		}
		read(filePath);

		var form = req1.form();
		form.append(uploadField, fileData, {
			filename: fileName
		});
		form.append('dbtype', dbtype);
		form.append('projectid', projectId);
	});
}

function getGeneratorStatus(res) {
	result = {
		success: !!res && res.success == true ? res.success : false,
		message: !!res && res.message ? res.message : ''
	};
	return result;
}

function callGeneratorApi(projectId, endpoint, dbType) {
	return new Promise((resolve, reject) => {
		let url;
		let body;
		if (endpoint == 'generate') {
			url = dataGenerationUrl + '/' + endpoint;
			body = { projectid: projectId, type: 'functional', mode: 'online', dbtype: dbType };
		} else {
			url = aiServerURL + '/' + endpoint;
			//console.log('dbType', dbType);
			if (dbType == 'mongo' && endpoint == 'artefacts') {
				url = aiServerURL + '/' + 'artefacts_mongo';
			}
			if (dbType == 'nodb') {
				url = aiServerURL + '/' + endpoint;
			}
			body = { projectid: projectId };
		}
		let options = {
			url: url,
			body: body,
			json: true
		};
		request.post(options, async function (err, httpResponse, body) {
			if (err) {
				console.log({ endpoint, err });
				resolve({
					success: false,
					message: 'Error occured while calling API'
				});
			} else {
				//console.log({ endpoint, body });
				resolve(body);
			}
		});
	});
}

function callCodegenApi(projectId) {
	try {
		let endpoint = 'codegen';
		let url = aiServerURL + '/' + endpoint;
		let options = {
			url: url,
			body: { projectid: projectId },
			json: true
		};

		request.post(options, async function (err, httpResponse, body) {
			if (err) {
				console.log({ endpoint, err });
			} else {
				console.log({ endpoint, body });
				/* Projects.findOneAndUpdate(
					{ projectId: projectId },
					{ $set: { githubCommit: 'ReadyForPush' } }
				); */
			}
		});
	} catch (error) {
		console.log(
			'Error while calling codegen for projectId: ',
			projectId,
			', Error: ',
			error.message
		);
	}
}

function callSpecParserApi(projectId) {
	try {
		let endpoint = 'raw_spec_parser';
		let url = aiServerURL + '/' + endpoint;
		let options = {
			url: url,
			body: { projectid: projectId },
			json: true
		};

		request.post(options, async function (err, httpResponse, body) {
			if (err) {
				return { SPEC_PARSER: 'Failure' };
			} else {
				const { statusCode } = httpResponse;
				if (statusCode != 200) {
					return { SPEC_PARSER: 'failure' };
				}
				/* Projects.findOneAndUpdate(
					{ projectId: projectId },
					{ $set: { githubCommit: 'ReadyForPush' } }
				); */
				return { SPEC_PARSER: 'success' };
			}
		});
	} catch (error) {
		console.log(
			'Error while calling spec-parser for projectId: ',
			projectId,
			', Error: ',
			error.message
		);
	}
}

function callGenDotNetCodeApi(body) {
	try {
		let endpoint = 'genDotNetCodeFrmTemplates';
		let url = codegenApiURL + '/' + endpoint;
		let newbody = {
			projectid: body.projectid,
			DataUpload: 'Y',
			dbserver: body.server,
			dbname: body.database,
			username: body.username,
			password: body.password
		};
		let options = {
			url,
			body: newbody,
			json: true
		};

		request.post(options, async function (err, httpResponse, body) {
			if (err) {
				console.log({ endpoint, err });
			} else {
				console.log({ endpoint, body });
				/* Projects.updateOne(
					{ projectId: newbody.projectid },
					{ $set: { githubCommit: 'ReadyForPush' } }
				); */
			}
		});
	} catch (error) {
		console.log(
			'Error while calling dotnetgen for projectId: ',
			projectId,
			', Error: ',
			error.message
		);
	}
}

async function publishController(req, res) {
	try {
		const { project, user } = req;
		let { projectId, password, certPath, keyPath, rootPath } = req.body;
		const dbDetails = project.dbDetails || {};
		const { portNo, username, database, server, dbtype, authdb } = dbDetails;
		if (project.isConnectDB && project.dbDetails.dbtype !== 'mongo') {
			const sslMode = certPath && keyPath && rootPath;
			if (!password && !sslMode) {
				throw new Error('Password or ssl Files is required to publish..');
			}
			const response = await testDBConnection(
				authdb,
				portNo,
				username,
				password,
				database,
				server,
				dbtype,
				sslMode,
				certPath,
				keyPath,
				rootPath
			);
			if (response) {
				if (response.status !== 'success') {
					return res.status(400).json({
						status: 'publish Failure',
						message: 'Wrong password or db connection error'
					});
				}
			}
		}

		if (password) {
			var bytes = CryptoJS.AES.decrypt(password, process.env.AES_ENCRYPTION_KEY);
			password = bytes.toString(CryptoJS.enc.Utf8);
		}

		// Validate project can be published
		const currPublishCount = project.publishCount;

		let dbType;
		// Reset all flags to default
		project.codegen = false;
		project.dotnetcodegen = false;
		project.pythoncodegen = false;
		project.nodecodegen = false;
		project.status = 'IN_PROGRESS';
		project.githubCommit = 'PublishInProgress';
		project.publishStatus = {
			ArtefactGeneration: { success: false, message: '' },
			SankyGeneration: { success: false, message: '' },
			SpecGeneration: { success: false, message: '' },
			dataGeneration: { success: false, message: '' }
		};
		await project.save();
		let dbInfo = {
			dbUserName: dbDetails.username,
			dbPassword: password,
			dbHost: dbDetails.server,
			dbPort: dbDetails.portNo,
			dbName: dbDetails.database
		};

		if (project.projectType === 'aggregate') {
			aggregateCodeGen(req.user_id, projectId, req.body, 'dotnet', project.projectName);
			aggregateCodeGen(req.user_id, projectId, req.body, 'python', project.projectName);
			aggregateCodeGen(req.user_id, projectId, req.body, 'node', project.projectName);
		}
		//Call codegen api & gendotnet api w/o awaiting for response
		if (project.projectType !== 'noinput' && project.projectType !== 'aggregate') {
			CodegenPrompts.findOne({ projectId: projectId }, function (err, doc) {
				if (err) throw err;
				if (!doc) {
					CodegenPrompts.create({ projectId: projectId, prompts: [] });
				}
			});
			if (project.dbDetails.dbtype === 'mongo') {
				generatePyMongoCodeGen(projectId, 'python', project.dbDetails.dbtype, dbInfo);
				mongoCodeGen(projectId, 'node', project.dbDetails.dbtype, dbInfo, req.user_id);
			} else {
				codeGenpython(projectId, 'python', dbtype, dbInfo);
				sqlNodeCodeGen(projectId, 'node', dbtype, dbInfo, req.user_id);
			}
			callCodegenApi(projectId);
			callGenDotNetCodeApi({ projectid: projectId, password, ...dbDetails });
		}

		//Call Spec gen, sankey, artefact  & data gen apis
		let apiEndpoints = ['spec_generator', 'sankey', 'artefacts', 'generate'];
		let apiResp;
		const isFreeFlow = project.projectType === 'noinput' || project.projectType === 'aggregate';
		if (isFreeFlow) {
			apiResp = await Promise.all([callGeneratorApi(projectId, apiEndpoints[0], 'nodb')]);
		} else if (project.isConnectDB) {
			dbType = project.dbDetails.dbtype;
			apiResp = await Promise.all([
				callGeneratorApi(projectId, apiEndpoints[0], dbType),
				callGeneratorApi(projectId, apiEndpoints[1], dbType),
				callGeneratorApi(projectId, apiEndpoints[2], dbType),
				callGeneratorApi(projectId, apiEndpoints[3], dbType)
			]);
		} else {
			apiResp = await Promise.all([
				callGeneratorApi(projectId, apiEndpoints[0], dbType),
				callGeneratorApi(projectId, apiEndpoints[1], dbType),
				callGeneratorApi(projectId, apiEndpoints[2], dbType)
			]);
		}
		let genApiResp = {
			SpecGeneration: apiResp[0],
			SankyGeneration: apiResp[1] || null,
			ArtefactGeneration: apiResp[2] || null,
			DataGeneration: apiResp[3] || null
		};

		// Parse resp and get success status of gen APIs, for updating Project's publish status
		let publishStatus = {
			SpecGeneration: getGeneratorStatus(apiResp[0]),
			SankyGeneration: apiResp[1] ? getGeneratorStatus(apiResp[1]) : {},
			ArtefactGeneration: apiResp[2] ? getGeneratorStatus(apiResp[2]) : {},
			DataGeneration: apiResp[3] ? getGeneratorStatus(apiResp[3]) : {}
		};

		// if spec generation is success or ( artifact generation + sankey generation) is success, project status is complete
		let successStatus;
		let message = '';
		const allCallsSuccess =
			publishStatus.SpecGeneration.success &&
			publishStatus.SankyGeneration.success &&
			publishStatus.ArtefactGeneration.success;

		if ((publishStatus.SpecGeneration.success && isFreeFlow) || allCallsSuccess) {
			project.status = 'COMPLETE';
			successStatus = true;

			//maintain publish count
			project.publishCount = project.publishCount + 1;
			project.githubCommit = 'ReadyForPush';
			if (currPublishCount === 0 && !project.isDefaultSpecDb) {
				if (!user.subscribedPlan) {
					if (project.projectType === 'noinput') {
						user.noSpecNoDb -= 1;
					} else if (project.isDesign) {
						user.designProjects -= 1;
					} else if (project.isAggregate || project.projectType === 'aggregate') {
						user.aggregateProjects -= 1;
					} else {
						user.testProjects -= 1;
					}
				}
				user.initializeFlag = false;
				await user.save();
			}
		} else if (
			publishStatus.SpecGeneration &&
			publishStatus.SpecGeneration.success &&
			publishStatus.ArtefactGeneration &&
			!publishStatus.ArtefactGeneration.success
		) {
			successStatus = false;
			message = errorMessages.SPEC_GENERATED_ARTIFACT_ERROR;
		} else if (
			publishStatus.ArtefactGeneration &&
			!publishStatus.ArtefactGeneration.success &&
			publishStatus.SpecGeneration &&
			!publishStatus.SpecGeneration.success
		) {
			successStatus = false;
			message = errorMessages.SPEC_ARTIFACT_GEN_ERROR;
		} else if (
			publishStatus.ArtefactGeneration &&
			publishStatus.ArtefactGeneration.success &&
			publishStatus.SpecGeneration &&
			!publishStatus.SpecGeneration.success
		) {
			successStatus = false;
			message = errorMessages.SPEC_GEN_ERROR;
		} else if (publishStatus.DataGeneration && !publishStatus.DataGeneration.success) {
			successStatus = false;
			message = errorMessages.DATA_GENERATED_ERROR;
		}

		// Save project status and publish status
		project.publishStatus = publishStatus;
		await project.save();

		let result = {
			success: successStatus,
			message: message,
			generatorApiResp: genApiResp
		};

		return res.status(200).send(result);
	} catch (error) {
		return res.status(400).send({ error: error.message });
	}
}

module.exports = router;
