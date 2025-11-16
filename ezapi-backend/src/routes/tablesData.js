const express = require('express');
const shortid = require('shortid');
const _ = require('lodash');
const router = new express.Router();

const MongoCollections = require('../models/mongoCollections');
const Projects = require('../models/projects');
const TablesData = require('../models/tables');
const Database = require('../models/database');

const authenticate = require('../authentication/authentication');
const validator = require('../middlewares/validators/validateRequest');
const requests = require('../middlewares/validators/schemas');
const { tableData } = require('../utility/getTableData');

router
	.route('/tables')
	.get(authenticate, async (req, res) => {
		try {
			const { projectId } = req.query || req.params;
			if (!projectId) throw new Error('projectId is required..');
			const data = await TablesData.find({ projectid: projectId });
			res.status(200).send(data);
		} catch (err) {
			return res.status(400).send({ message: err.message });
		}
	})
	.post(authenticate, async (req, res) => {
		try {
			const newTablesData = await TablesData.insertMany(req.body, { returnOriginal: false });
			return res.send(newTablesData);
		} catch (err) {
			return res.status(400).send({ err: err.message });
		}
	});

router
	.route('/database')
	.get(authenticate, async (req, res) => {
		try {
			const { projectId } = req.query || req.params;
			if (!projectId) throw new Error('projectId is required..');
			const data = await Database.findOne({ projectid: projectId }, { _id: 0 });
			res.status(200).send(data);
		} catch (err) {
			return res.status(400).send({ message: err.message });
		}
	})
	.post(authenticate, async (req, res) => {
		try {
			const newDbData = new Database(req.body);
			await newDbData.save();
			return res.send(newDbData);
		} catch (err) {
			return res.status(300).send({ err: err.message });
		}
	});

router
	.route('/mongo_collections')
	.get(authenticate, async (req, res) => {
		try {
			const { projectId } = req.query || req.params;
			if (!projectId) throw new Error('projectId is required..');
			const data = await MongoCollections.find({ projectid: projectId }, { _id: 0 });
			res.status(200).send(data);
		} catch (err) {
			return res.status(400).send({ message: err.message });
		}
	})
	.post(authenticate, async (req, res) => {
		try {
			const newMongoCollectionsData = await MongoCollections.insertMany(req.body, {
				returnOriginal: false
			});
			return res.send(newMongoCollectionsData);
		} catch (err) {
			return res.status(300).send({ err: err.message });
		}
	});

router
	.route('/tables')
	.get(authenticate, async (req, res) => {
		try {
			const { projectId } = req.query || req.params;
			if (!projectId) throw new Error('projectId is required..');
			const data = await TablesData.find({ projectid: projectId });
			res.status(200).send(data);
		} catch (err) {
			return res.status(400).send({ message: err.message });
		}
	})
	.post(authenticate, async (req, res) => {
		try {
			const newTablesData = await TablesData.insertMany(req.body, { returnOriginal: false });
			return res.send(newTablesData);
		} catch (err) {
			return res.status(400).send({ err: err.message });
		}
	});

router
	.route('/database')
	.get(authenticate, async (req, res) => {
		try {
			const { projectId } = req.query || req.params;
			if (!projectId) throw new Error('projectId is required..');
			const data = await Database.findOne({ projectid: projectId }, { _id: 0 });
			res.status(200).send(data);
		} catch (err) {
			return res.status(400).send({ message: err.message });
		}
	})
	.post(authenticate, async (req, res) => {
		try {
			const newDbData = new Database(req.body);
			await newDbData.save();
			return res.send(newDbData);
		} catch (err) {
			return res.status(300).send({ err: err.message });
		}
	});

router
	.route('/mongo_collections')
	.get(authenticate, async (req, res) => {
		try {
			const { projectId } = req.query || req.params;
			if (!projectId) throw new Error('projectId is required..');
			const data = await MongoCollections.find({ projectid: projectId }, { _id: 0 });
			res.status(200).send(data);
		} catch (err) {
			return res.status(400).send({ message: err.message });
		}
	})
	.post(authenticate, async (req, res) => {
		try {
			const newMongoCollectionsData = await MongoCollections.insertMany(req.body, {
				returnOriginal: false
			});
			return res.send(newMongoCollectionsData);
		} catch (err) {
			return res.status(300).send({ err: err.message });
		}
	});

router.post('/tablesLookup', authenticate, async (req, res) => {
	try {
		let { projectId, tableFilter } = req.body;
		if (!projectId) {
			throw new Error('projectId is missing');
		}
		const project = await Projects.findOne({ projectId });
		if (!project) {
			throw new Error('No Project found for this projectId');
		}
		let tables;
		let lookupData = [];
		if (project && project.dbDetails && project.dbDetails.dbtype == 'mongo') {
			tables = await MongoCollections.find(
				{ projectid: projectId },
				{ attributes: 1, collection: 1 }
			).lean();
			for (item of tables) {
				let modifiedAttributes = getNoSQLAttributes(item.attributes, item.collection, '');
				let data = {
					name: item.collection,
					type: 'ezapi_collection',
					data: modifiedAttributes
				};
				lookupData.push(data);
			}
		} else {
			tables = await TablesData.find(
				{ projectid: projectId },
				{ attributes: 1, schema: 1, table: 1 }
			).lean();
			if (!tableFilter) {
				lookupData = [];
				for (item of tables) {
					let modifiedAttributes = modify(item.attributes);
					let data = {
						name: item.schema + '.' + item.table,
						type: 'ezapi_table',
						data: modifiedAttributes
					};
					lookupData.push(data);
				}
			} else {
				tables.find((item) => {
					if (item.table == tableFilter) {
						lookupData = {
							name: item.schema + '.' + item.table,
							type: 'ezapi_table',
							data: modify(item.attributes)
						};
					}
				});
			}
		}
		if (!tables) {
			throw new Error('No tables or collections found for this projectId');
		}
		return res.status(200).send(lookupData);
	} catch (error) {
		//console.log(error);
		res.status(400).send({ error: error.message });
	}
});

router.post(
	'/tableSubSchema',
	authenticate,
	validator(requests.subSchemaRequest),
	async (req, res) => {
		try {
			let { projectId, type: refType, ref } = req.body;
			let schemaData;
			let refArr = ref.split('.');
			let collectionName = refArr.shift();
			let refPath = refArr.join('.');
			// elmntPath = elmntPath + '.ezapi_object';
			let queryCondition;
			let query = {
				projectid: projectId,
				collection: collectionName
			};
			let retrieveInfo = {};
			queryCondition = refPath;
			query[queryCondition] = { $exists: true };
			retrieveInfo[queryCondition] = 1;

			schemaData = await MongoCollections.findOne(query, retrieveInfo).lean();
			if (!schemaData) {
				throw new Error(`Could not find sub schema : ${collectionName}`);
			}
			let temp = _.get(schemaData, queryCondition);
			let modifiedAttributes = getNoSQLAttributes(temp, collectionName, refType);
			return res.status(200).send({ data: modifiedAttributes });
		} catch (error) {
			console.log(error);
			res.status(400).send({ error: error.message, message: 'ref or projectId mismatch' });
		}
	}
);

router.post('/tablesData', authenticate, async (req, res) => {
	try {
		let projectId = req.body.projectId;
		if (!projectId) {
			throw new Error('ProjectId is missing..');
		}
		/* const project = await Projects.findOne({ projectId });
		if (!project) {
			throw new Error('No Project found for this projectId');
		} */
		let finalCollection = [];
		finalCollection = await tableData(projectId);
		return res.status(200).send(finalCollection);
	} catch (error) {
		console.log(error);
		res.status(400).send({ error: error.message });
	}
});

function getNoSQLAttributes(attributes, collectionName, key) {
	var data = [];
	var listofattributes = Object.keys(attributes);
	/* if (key && key === "array") {
		listofattributes = Object.keys(attributes);
	} else  {
		listofattributes = Object.keys(attributes);
	} */
	for (attribute of listofattributes) {
		if (attribute) {
			var temp = {
				name: attribute,
				auto: false,
				required: false,
				type: attributes[attribute].ezapi_type,
				format: attributes[attribute].ezapi_type
			};

			if (attributes[attribute].ezapi_type == 'object') {
				temp.is_child = false;
			} else if (attributes[attribute].ezapi_type == 'array') {
				if (attributes[attribute].ezapi_array.ezapi_object) {
					temp.is_child = false;
				} else {
					temp.is_child = true;
				}
			} else {
				temp.is_child = true;
			}

			if (collectionName) {
				temp.sourceName = attribute;
				temp.key = collectionName;
				temp.tableName = collectionName;
				temp.paramType = 'documentField';
				temp.payloadId = shortid.generate();
			}

			data.push(temp);
		}
	}
	return data;
}

function modify(attributes, tableName, key) {
	var data = [];
	for (attribute of attributes) {
		if (attribute) {
			var temp = {
				auto: attribute.auto,
				name: attribute.name,
				required: attribute.valueconstraint ? true : false,
				type: attribute.openapi ? attribute.openapi.type : 'string',
				format: attribute.openapi ? attribute.openapi.format : null
			};
			if (attribute.foreign) {
				temp.foreign = attribute.foreign;
			}
			if (attribute.keyType) {
				temp.keyType = attribute.keyType;
			}
			// adding table name, frontend needs table name for each column
			if (tableName) {
				temp.sourceName = attribute.name;
				temp.key = key;
				temp.tableName = tableName;
				temp.paramType = 'column';
				temp.payloadId = shortid.generate();
			}

			data.push(temp);
		}
	}
	return data;
}

module.exports = router;
