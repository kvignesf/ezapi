const express = require('express');
const router = new express.Router();
const authenticate = require('../authentication/authentication');
const SchemaData = require('../models/schemas');
const Matcher = require('../models/matchers');
const UserOvrrdMatches = require('../models/userOvrrdMatches');
const errorMessages = require('../utility/errorMessages');
const getMandatoryMappings = require('../utility/getMandatoryMappings');

router.post('/recommendations', authenticate, async (req, res) => {
	try {
		let projectId = req.body.projectId;
		let schemaName = req.body.schema;
		let requiredAttribute = req.body.attribute;

		// get path
		let schemaData = await SchemaData.findOne({
			projectid: projectId,
			'data.name': schemaName
		});
		if (!schemaData) {
			throw new Error(404).send(errorMessages.SCHEMA_NOT_FOUND);
		}

		schemaData = schemaData.toObject();

		let allAttributes = schemaData.data.attributes;
		let att = allAttributes.find((item) => item.name == requiredAttribute);

		if (!att) {
			throw new Error(errorMessages.ATTRIBUTE_NOT_FOUND);
		}

		let path = getPath(schemaName, att);
		let level = att.level;

		// get recommendations
		let matches = await Matcher.find({ projectid: projectId, schema: schemaName });

		if (!matches) {
			throw new Error(errorMessages.MATCH_DATA_NOT_FOUND);
		}

		let recommendations = getRecommendationByAttName(matches, requiredAttribute);

		let param = {
			projectId,
			schemaName,
			schemaAttribute: requiredAttribute,
			attributePath: path
		};

		let overridenMatch = await getOverriddenMatch(param);
		const expectedResponse = {
			name: requiredAttribute,
			path,
			level,
			recommendations,
			overridenMatch
		};

		res.status(200).send(expectedResponse);
	} catch (error) {
		console.log(error);
		res.status(400).send({ error: error.message });
	}
});

router.post('/schemaRecommendations', authenticate, async (req, res) => {
	try {
		let projectId = req.body.projectId;
		let schemaName = req.body.schema;

		let schemaData = await SchemaData.findOne({
			projectid: projectId,
			'data.name': schemaName
		});

		if (!schemaData) {
			throw new Error(errorMessages.SCHEMA_NOT_FOUND);
		}

		schemaData = schemaData.toObject();

		let allAttributes = schemaData.data.attributes;

		// Get path,level for all child attributes
		let requiredAttList = [];
		for (att of allAttributes) {
			if (att.is_child == true) {
				let path = getPath(schemaName, att);
				let data = {
					name: att.name,
					level: att.level,
					path: path
				};

				requiredAttList.push(data);
			}
		}

		// Get recommendations
		let matches = await Matcher.find({ projectid: projectId, schema: schemaName });
		if (!matches) {
			throw new Error(errorMessages.MATCH_DATA_NOT_FOUND);
		}

		//Add recommendation for child attributes
		for (att of requiredAttList) {
			let attName = att.name;
			let recommendations = getRecommendationByAttName(matches, attName);
			att.recommendations = recommendations;

			let param = {
				projectId,
				schemaName,
				schemaAttribute: attName,
				attributePath: att.path
			};

			let overridenMatch = await getOverriddenMatch(param);
			att.overridenMatch = overridenMatch;
		}

		const expectedResponse = requiredAttList;
		res.status(200).send(expectedResponse);
	} catch (error) {
		console.log(error);
		res.status(400).send({ error: error.message });
	}
});

router.post('/listAllAttributes', authenticate, async (req, res) => {
	try {
		const { projectId } = req.body;
		if (!projectId) {
			throw new Error('ProjectId is required');
		}
		const mandatoryMappings = await getMandatoryMappings(projectId);
		if (mandatoryMappings) {
			return res.status(200).send(mandatoryMappings);
		}
		return res.status(400).send({ message: 'No operation Data' });
	} catch (err) {
		return res.status(400).send({ message: err.message });
	}
});

function getPath(schemaName, attributeData) {
	let parent = attributeData.parent;
	let parentPathStr = parent ? '/' + parent.split('.').join('/') : '';
	let attributeStr = '/' + attributeData.name;
	let path = schemaName + parentPathStr + attributeStr;
	return path;
}

function getRecommendationByAttName(matches, requiredAttribute) {
	let recommendations = [];
	for (matchItem of matches) {
		matchItem = matchItem.toObject();
		let tableName = matchItem.table;
		let attributes = matchItem.attributes;
		for (attributeItem of attributes) {
			if (
				attributeItem.schema_attribute == requiredAttribute &&
				isMatch(attributeItem.match_type)
			) {
				let { table_attribute, match_type } = attributeItem;
				let data = {
					table: tableName,
					table_attribute,
					match_type
				};
				recommendations.push(data);
			}
		}
	}

	return recommendations;
}

async function getOverriddenMatch(params) {
	let overrdData = await UserOvrrdMatches.findOne(params);
	let result = overrdData
		? {
				tableName: overrdData.tableName,
				tableAttribute: overrdData.tableAttribute
		  }
		: {};
	return result;
}

function isMatch(attMatchType) {
	return attMatchType == 'Full' || attMatchType == 'Partial';
}

module.exports = router;
