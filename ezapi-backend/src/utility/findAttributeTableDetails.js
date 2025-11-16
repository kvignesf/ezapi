const Matcher = require('../models/matchers');
const UserOvrrdMatches = require('../models/userOvrrdMatches');
const SchemaData = require('../models/schemas');

async function findAttributeTableDetails(projectId, schemaName, attributeName, operation) {
	let userSelMatches = await UserOvrrdMatches.find({
		projectId,
		schemaName,
		schemaAttribute: attributeName
	}).limit(1)
	.sort({ $natural: -1 })
	.lean();
	if (userSelMatches && userSelMatches.length) {
		userSelMatches = userSelMatches.map((match) => ({
			...match,
			level: match.attributeLevel,
			endpoint: operation.data.endpoint,
			schemaName,
			operationId: operation.data.operationId,
			path: `${schemaName}/${attributeName}`,
			method: operation.data.method
		}));
		return userSelMatches;
	} else {
		const matcherData = await Matcher.find({
			projectid: projectId,
			schema: schemaName,
			'attributes.schema_attribute': attributeName
		}).lean();
		if (matcherData.length) {
			for (const matcherRecord of matcherData) {
				if (matcherRecord.attributes) {
					for (const matcherAttribute of matcherRecord.attributes) {
						if (matcherAttribute.match_type == 'Full') {
							return {
								attribute: attributeName,
								tableName: matcherRecord.key,
								tableAttribute: matcherAttribute.table_attribute,
								schemaName,
								level: matcherAttribute.match_level,
								path: `${schemaName}/${attributeName}`,
								operationId: operation.data.operationId,
								endpoint: operation.data.endpoint,
								method: operation.data.method
							};
						}
					}
				}
			}
		}
		const schemaData = await SchemaData.findOne({
			projectid: projectId,
			'data.name': schemaName,
			'data.attributes.name': attributeName
		}).lean();
		let level;
		if (schemaData) {
			const filteredData = schemaData.data.attributes.find(
				(attr) => attr.name === attributeName
			);
			level = filteredData.level;
		}
		return {
			noMatch: true,
			attribute: attributeName,
			tableName: null,
			tableAttribute: null,
			level,
			schemaName,
			endpoint: operation.data.endpoint,
			operationId: operation.data.operationId,
			path: `${schemaName}/${attributeName}`,
			method: operation.data.method
		};
	}
}

module.exports = findAttributeTableDetails;
