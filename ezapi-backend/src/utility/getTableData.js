const Projects = require('../models/projects');
const tablesData = require('../models/tables');
const MongoCollections = require('../models/mongoCollections');
const shortid = require('shortid');
const _ = require('lodash');

async function tableData(projectId) {
	let returnCollection = []
	try {
		const project = await Projects.findOne({ projectId });
		if (!project) {
			throw new Error('No Project found for this projectId');
		}
		
		if (project.dbDetails && project.dbDetails.dbtype && project.dbDetails.dbtype === 'mongo') {
			const mongoCollections = await MongoCollections.find(
				{ projectid: projectId },
				{ attributes: 1, collection: 1 }
			).lean();
			let mongoCollectionData = [];
			for (item of mongoCollections) {
				//item = item.toObject();
				let modifiedAttributes = await getNoSQLAttributes(item.attributes, item.collection, '');
				let data = {
					name: item.collection,
					sourceName: item.collection,
					key: item.collection,
					type: 'ezapi_collection',
					payloadId: shortid.generate(),
					selectedColumns: modifiedAttributes
				};
				mongoCollectionData.push(data);
			}
			returnCollection = mongoCollectionData;
		} else {
			const tables = await tablesData
				.find({ projectid: projectId }, { attributes: 1, table: 1, key: 1 })
				.lean();
			if (!tables) {
				throw new Error('No tables found for this projectId');
			}
			let tableData = [];
			for (item of tables) {
				//item = item.toObject();
				let modifiedAttributes = await modify(item.attributes, item.table, item.key);
				let data = {
					name: item.table,
					sourceName: item.table,
					key: item.key,
					type: 'ezapi_table',
					payloadId: shortid.generate(),
					selectedColumns: modifiedAttributes
				};
				tableData.push(data);
			}
			returnCollection = tableData;
		}
		return returnCollection;
	} catch (error) {
		console.log(error);
		return [{error: error.message}]
	}
}

async function getNoSQLAttributes(attributes, collectionName, key){
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

async function modify(attributes, tableName, key) {
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



module.exports = {tableData,getNoSQLAttributes,modify};
