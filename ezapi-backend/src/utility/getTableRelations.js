const Tables = require('../models/tables');
const TableRelationFilters = require('../models/tableRelationFilters');
const UserSelMatches = require('../models/userOvrrdMatches');
const OperationData = require('../models/operationData');
const Projects = require('../models/projects');

async function getTableRelations(projectId) {
	try {
		const tableRelationsList = await TableRelationFilters.find(
			{ projectid: projectId },
			{ 'relations._id': 0, 'filters._id': 0 }
		).lean();
		let tablesList;
		let relationsData;
		let filtersData;
		if (tableRelationsList && tableRelationsList.length) {
			relationsData = tableRelationsList.filter(
				(record) => record.relationType == 'relations'
			);
			filtersData = tableRelationsList.filter((record) => record.relationType == 'filters');
			if (relationsData && relationsData.length) {
				const { operationDataTables } = relationsData[0];
				let tablesListData = await getTablesList(projectId);
				tablesList = tablesListData.tablesList;
				const isEqual = await areEqual(operationDataTables, tablesList);
				if (isEqual) {
					return {
						projectid: projectId,
						relations:
							relationsData && relationsData.length ? relationsData[0].relations : [],
						filters: filtersData && filtersData.length ? filtersData[0].filters : []
					};
				}
				await TableRelationFilters.updateOne(
					{
						projectid: projectId,
						relationType: 'relations'
					},
					{
						$pull: { relations: { origin: 'derived' } }
					}
				);
			}
		}
		if (!tablesList) {
			let tablesListData = await getTablesList(projectId);
			tablesList = tablesListData.tablesList;
		}
		let { tableRelationsList: tableRelations } = await generateTableRelations(
			tablesList,
			projectId
		);
		tableRelations = filterRelations(tablesList, tableRelations).filteredRelations;
		if (relationsData) {
			await TableRelationFilters.updateOne(
				{
					projectid: projectId,
					relationType: 'relations'
				},
				{
					$push: {
						relations: {
							$each: tableRelations
						}
					},
					operationDataTables: tablesList
				}
			);
		} else {
			if (tableRelations && tableRelations.length) {
				const newTableRelation = new TableRelationFilters({
					projectid: projectId,
					relationType: 'relations',
					relations: tableRelations,
					operationDataTables: tablesList
				});
				await newTableRelation.save();
			}
		}
		relationsData =
			relationsData &&
			relationsData.length &&
			relationsData[0].relations &&
			relationsData[0].relations.length
				? relationsData[0].relations.filter((rel) => rel.origin == 'userInput')
				: [];
		if (relationsData && relationsData.length) {
			tableRelations.push(...relationsData);
		}
		const filters =
			filtersData &&
			filtersData.length &&
			filtersData[0].filters &&
			filtersData[0].filters.length
				? filtersData[0].filters
				: [];

		return {
			projectid: projectId,
			relations: tableRelations || [],
			filters
		};
	} catch (err) {
		return {
			err: err.message
		};
	}
}

async function getTablesList(projectid) {
	try {
		const { projectType } = await Projects.findOne(
			{ projectId: projectid },
			{ projectType: 1 }
		).lean();

		if (projectType === 'both') {
			let tablesList = await UserSelMatches.find(
				{ projectId: projectid },
				{ tableName: 1, _id: 0 }
			).lean();
			tablesList = [...new Set(tablesList.map((table) => table.tableName))];
			return { tablesList };
		} else {
			let operationData = await OperationData.find({ projectid }).lean();
			let tablesList = {};
			let tableRelations = [];
			if (operationData && operationData.length) {
				for (const operation of operationData) {
					const { requestData, responseData } = operation.data;
					const { header, path, query, formData, body } = requestData;
					//for Request Data
					const requestDataList = [header, path, query, formData, body];
					for (const requestField of requestDataList) {
						if (
							requestField == body &&
							(requestField.properties || requestField.name)
						) {
							let requestBodyProperties;
							if (requestField.properties) {
								requestBodyProperties = Object.keys(requestField.properties);
							} else {
								requestBodyProperties = [requestField];
							}
							//loop through req body
							for (const bodyProperty of requestBodyProperties) {
								let bodyFieldObject;
								if (requestField.properties) {
									bodyFieldObject = requestField.properties[bodyProperty];
								} else {
									bodyFieldObject = bodyProperty;
								}
								if (bodyFieldObject.type == 'arrayOfObjects') {
									const arrayKeys =
										bodyFieldObject.items && bodyFieldObject.items.properties
											? Object.keys(bodyFieldObject.items.properties)
											: [];
									for (const eachKey of arrayKeys) {
										const arrayItem = bodyFieldObject.items.properties[eachKey];

										if (
											(arrayItem.tableName || arrayItem.sourceName) &&
											tablesList[arrayItem.tableName || arrayItem.sourceName]
										) {
											continue;
										} else {
											tableRelations.push(arrayItem);
											const key = arrayItem.tableName || arrayItem.sourceName;
											tablesList[key] = true;
										}
									}
								} else {
									if (
										(bodyFieldObject.tableName || bodyFieldObject.name) &&
										(tablesList[bodyFieldObject.tableName] ||
											tablesList[bodyFieldObject.name])
									) {
										continue;
									} else {
										tableRelations.push(bodyFieldObject);
										const tableName =
											bodyFieldObject.tableName || bodyFieldObject.name;
										tablesList[tableName] = true;
									}
								}
							}
						} else {
							if (requestField && requestField.length) {
								//Loop through Other request Fields
								for (const property of requestField) {
									let propertyName = Object.keys(property).length
										? Object.keys(property)[0]
										: null;
									if (propertyName) {
										const tableName =
											property[propertyName].tableName ||
											property[propertyName].name;
										if (tableName && tablesList[tableName]) {
											continue;
										} else {
											tableRelations.push(property[propertyName]);
											tablesList[tableName] = true;
										}
									}
								}
							}
						}
					}
					//for Response Data
					if (responseData && responseData.length) {
						//loop through all statusCodes responses
						for (const response of responseData) {
							let responseHeaders = response.headers || null;
							//for EachStatusCode response header
							if (responseHeaders && responseHeaders.length) {
								for (const header of responseHeaders) {
									let headerProperty = Object.keys(header)[0];
									const tableName = header[headerProperty].tableName;
									if (tableName && tablesList[tableName]) {
										continue;
									} else {
										tableRelations.push(header[headerProperty]);
										tablesList[tableName] = true;
									}
								}
							}
							let responseBodyProperties;
							if (
								response.content &&
								(response.content.properties || response.content.name)
							) {
								if (response.content.properties) {
									responseBodyProperties = Object.keys(
										response.content.properties
									);
								} else {
									responseBodyProperties = [response.content];
								}
								for (const bodyProperty of responseBodyProperties) {
									let bodyFieldObject;
									if (response.content.properties) {
										bodyFieldObject = response.content.properties[bodyProperty];
									} else {
										bodyFieldObject = bodyProperty;
									}

									if (bodyFieldObject.type == 'arrayOfObjects') {
										const arrayKeys =
											bodyFieldObject.items &&
											bodyFieldObject.items.properties
												? Object.keys(bodyFieldObject.items.properties)
												: [];
										for (const eachKey of arrayKeys) {
											const arrayItem =
												bodyFieldObject.items.properties[eachKey];

											if (
												(arrayItem.tableName || arrayItem.sourceName) &&
												tablesList[
													arrayItem.tableName || arrayItem.sourceName
												]
											) {
												continue;
											} else {
												tableRelations.push(arrayItem);
												const key =
													arrayItem.tableName || arrayItem.sourceName;
												tablesList[key] = true;
											}
										}
									} else {
										let { name, tableName } = bodyFieldObject;
										const table = tableName || name;
										if (table && tablesList[table]) {
											continue;
										} else {
											tableRelations.push(bodyFieldObject);
											tablesList[table] = true;
										}
									}
								}
							}
						}
					}
				}
			}
			return { tablesList: Object.keys(tablesList), tableRelations };
		}
	} catch (err) {
		console.log('tablesList error', err.message);
		return { message: err.message };
	}
}

async function generateTableRelations(tablesListArray, projectid) {
	try {
		let tableRelationsList = [];
		const allTables = [...tablesListArray];
		const mainMappings = await getEntityMappingsAndLinkedTables(
			tablesListArray,
			projectid,
			allTables
		);

		tableRelationsList.push(...mainMappings.tableRelationsList);

		let linkedTablesData = mainMappings.linkedTables;

		while (linkedTablesData.length > 0) {
			allTables.push(...linkedTablesData);
			const linkedMappings = await getEntityMappingsAndLinkedTables(
				linkedTablesData,
				projectid,
				allTables
			);
			tableRelationsList.push(...linkedMappings.tableRelationsList);
			linkedTablesData = linkedMappings.linkedTables;
		}

		tableRelationsList = tableRelationsList.filter((item, index, self) => {
			return (
				index ===
				self.findIndex((t) => {
					return JSON.stringify(t) === JSON.stringify(item);
				})
			);
		});
		return { tableRelationsList };
	} catch (err) {
		return { err: err.message };
	}
}

async function getEntityMappingsAndLinkedTables(tablesListArray, projectid, allTables) {
	try {
		let linkedTables = [];
		let tableRelationsList = [];
		const tablesData = await Tables.find(
			{
				projectid,
				$and: [
					{ table: { $in: tablesListArray } },
					{ 'attributes.foreign': { $exists: true } }
				]
			},
			{ table: 1, schema: 1, attributes: 1 }
		).lean();

		tablesData.forEach((tableObj) => {
			const filteredAttributes = tableObj.attributes.filter((col) => col.foreign);
			for (const column of filteredAttributes) {
				const {
					table: dependentTable,
					schema: dependentTableSchema,
					column: dependentTableColumn
				} = column.foreign;
				if (
					!tablesListArray.includes(dependentTable) &&
					!linkedTables.includes(dependentTable) &&
					!allTables.includes(dependentTable)
				) {
					linkedTables.push(dependentTable);
				}
				const tableRelation = {
					mainTable: tableObj.table,
					mainTableSchema: tableObj.schema,
					mainTableColumn: column.name,
					dependentTable,
					dependentTableColumn,
					dependentTableSchema,
					origin: 'derived',
					relation: 'equals'
				};
				tableRelationsList.push(tableRelation);
			}
		});

		return {
			linkedTables,
			tableRelationsList
		};
	} catch (err) {
		return {
			err: err.message,
			linkedTables: [],
			tableRelationsList
		};
	}
}

async function areEqual(array1, array2) {
	try {
		if (array1 && array2) {
			if (array1.length === array2.length) {
				return array1.every((element) => {
					if (array2.includes(element)) {
						return true;
					}

					return false;
				});
			}
		}

		return false;
	} catch (err) {
		return { err: err.message };
	}
}

function filterRelations(tables, relations) {
	//Filter Relations in which mainTable and dependentTable present in tables array
	try {
		const filteredRelations = relations.filter((rel) => {
			return tables.includes(rel.mainTable) && tables.includes(rel.dependentTable);
		});
		const result = filteredRelations.length ? filteredRelations : relations;
		return { filteredRelations: result };
	} catch (err) {
		return { err };
	}
}

module.exports = { getTableRelations, getTablesList };
