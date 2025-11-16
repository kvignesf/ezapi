const { Router } = require('express');
const router = new Router();
const shortid = require('shortid');

const ProjectParams = require('../models/projectParams');

const authenticate = require('../authentication/authentication');
const checkUserAccessToProject = require('../middlewares/validators/checkUserAccessToProject');
const validate = require('../middlewares/validators/validateRequest');
const projectParamsSchema = require('../middlewares/validators/projectParams');
const errorMessages = require('../utility/errorMessages');

const DataTypeTable = {
	array: {
		type: 'array',
		format: 'array'
	},
	object: {
		type: 'object',
		format: 'object'
	},
	integer: {
		type: 'integer',
		format: 'int32'
	},
	long: {
		type: 'integer',
		format: 'int64'
	},
	float: {
		type: 'number',
		format: 'float'
	},
	double: {
		type: 'number',
		format: 'double'
	},
	string: {
		type: 'string',
		format: 'string'
	},
	byte: {
		type: 'string',
		format: 'byte'
	},
	binary: {
		type: 'string',
		format: 'binary'
	},
	arrayOfObjects: {
		type: 'arrayOfObjects',
		format: 'arrayOfObjects'
	},
	boolean: {
		type: 'boolean',
		format: 'boolean'
	},
	date: {
		type: 'string',
		format: 'date'
	},
	dateTime: {
		type: 'string',
		format: 'date-time'
	},
	password: {
		type: 'string',
		format: 'password'
	}
};

router.get(
	'/projectParams/get/:projectId',
	authenticate,
	checkUserAccessToProject,
	async (req, res) => {
		try {
			const projectId = req.params.projectId;
			const parameters = await ProjectParams.findOne({ projectId });
			//console.log("parameters..", parameters);
			if (!parameters) {
				return res.status(200).send([]);
			} else {
				return res.status(200).send(parameters);
			}
		} catch (error) {
			res.status(400).send({ error: error.message });
		}
	}
);

router.post('/projectParams/add', authenticate, checkUserAccessToProject, async (req, res) => {
	try {
		const projectId = req.body.projectId;
		const body = req.body.data;
		const data = {
			id: shortid.generate(),
			name: body.name,
			type: DataTypeTable[body.type].type,
			commonName: body.type,
			format: DataTypeTable[body.type].format,
			description: body.description,
			required: body.required,
			possibleValues: body.possibleValues || null
		};
		const checkRecord = await ProjectParams.findOne({ projectId });

		var projectParam;
		if (!checkRecord) {
			projectParam = new ProjectParams({ projectId: projectId });
			projectParam.data.push(data);
			projectParam.save();
			res.status(200).send(projectParam);
		} else {
			const duplicateAttributeName = checkRecord.data.find((ob) => ob.name === data.name);

			if (duplicateAttributeName) {
				return res.status(400).send({ error: errorMessages.DUPLICATE_ATTRIBUTE_NAME });
			}
			checkRecord.data.push(data);
			checkRecord.save();
			res.status(200).send(checkRecord);
		}
	} catch (error) {
		console.log(error);
		res.status(400).send({ error: error.message });
	}
});

router.post(
	'/projectParams/bulk',
	authenticate,
	checkUserAccessToProject,
	validate(projectParamsSchema),
	async (req, res) => {
		try {
			const { projectId, data } = req.body;
			const isDuplicateNamesExist = (values) => {
				const valueArr = values.map((item) => {
					return item.name;
				});
				const isDuplicate = valueArr.some((item, idx) => {
					return valueArr.indexOf(item) != idx;
				});
				return isDuplicate;
			};
			if (isDuplicateNamesExist(data))
				throw new Error(errorMessages.DUPLICATE_ATTRIBUTE_NAME);

			const paramsData = data.map((obj) => {
				obj.id = obj.id || shortid.generate();
				obj.commonName = obj.type;
				obj.type = DataTypeTable[obj.type].type;
				obj.format = DataTypeTable[obj.type].format;
				return obj;
			});

			const updatedParamData = await ProjectParams.findOneAndUpdate(
				{
					projectId
				},
				{ $set: { data: paramsData } },
				{ upsert: true, new: true, returnDocument: 'after' }
			);

			res.status(200).send(updatedParamData);
		} catch (error) {
			console.log(error);
			res.status(400).send({ error: error.message });
		}
	}
);

router.patch('/projectParams/delete', authenticate, checkUserAccessToProject, async (req, res) => {
	try {
		const { projectId, paramId } = req.body;
		const projectParam = await ProjectParams.findOne({ projectId });
		if (!projectParam) {
			return res.status(400).send({ error: 'No record exists' });
		}
		const params = projectParam.data;
		// console.log(params);

		const param = params.find((item) => {
			if (item.id == paramId) {
				//console.log("param item..", item);
				return item;
			}
		});

		const index = params.indexOf(param);
		if (index > -1) {
			params.splice(index, 1);
		}
		projectParam.save();
		return res.status(200).send(params);
	} catch (error) {
		res.status(400).send({ error: error.message });
	}
});

router.patch('/projectParams/edit', authenticate, checkUserAccessToProject, async (req, res) => {
	try {
		const projectId = req.body.projectId;

		var paramId = req.body.data.paramId;
		var name = req.body.data.name;
		var type = DataTypeTable[req.body.data.type].type;
		var commonName = req.body.data.type;
		var format = DataTypeTable[req.body.data.type].format;
		var description = req.body.data.description;
		var required = req.body.data.required;
		var possibleValues = req.body.data.possibleValues;
		const record = await ProjectParams.findOne({ projectId });

		if (!record) {
			return res.status(200).send([]);
		}
		const data = record.data;
		const parameter = data.find((item) => {
			if (item.id == paramId) {
				return item;
			}
		});
		if (!parameter) {
			return res.status(200).send([]);
		}
		if (parameter.name === name) {
			parameter.name = name ? name : parameter.name;
			parameter.type = type ? type : DataTypeTable[parameter.type].type;
			parameter.commonName = commonName ? commonName : parameter.commonName;
			parameter.format = format ? format : DataTypeTable[parameter.format].format;
			parameter.description = description ? description : parameter.description;
			parameter.required = required;
			parameter.possibleValues = possibleValues ? possibleValues : parameter.possibleValues;
		} else {
			const duplicateAttributeName = record.data.find((ob) => ob.name === name);

			if (duplicateAttributeName) {
				return res.status(400).send({ error: errorMessages.DUPLICATE_ATTRIBUTE_NAME });
			}
			parameter.name = name ? name : parameter.name;
			parameter.type = type ? type : DataTypeTable[parameter.type].type;
			parameter.commonName = commonName ? commonName : parameter.commonName;
			parameter.format = format ? format : DataTypeTable[parameter.format].format;
			parameter.description = description ? description : parameter.description;
			parameter.required = required;
			parameter.possibleValues = possibleValues ? possibleValues : parameter.possibleValues;
		}
		record.save();
		res.status(200).send(parameter);
	} catch (error) {
		console.error(error);
		res.status(400).send({ error: error.message });
	}
});

module.exports = router;
