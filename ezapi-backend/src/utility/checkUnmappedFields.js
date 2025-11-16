const OperationData = require('../models/operationData');
const SchemaData = require('../models/schemas');

const findAttributeTableDetails = require('./findAttributeTableDetails');

async function checkUnmappedFields(projectId) {
	try {
		let operationData = await OperationData.find({ projectid: projectId }).lean();
		if (operationData.length) {
			for (const operation of operationData) {
				const { requestData, responseData } = operation.data;
				const { header, path, query, formData, body } = requestData;
				//for Request Data
				const requestDataList = [header, path, query, formData, body];
				for (const requestField of requestDataList) {
					if (requestField == body && requestField.properties) {
						let requestBodyProperties = Object.keys(requestField.properties);
						//loop through req body
						for (const bodyProperty of requestBodyProperties) {
							const bodyFieldObject = requestField.properties[bodyProperty];
							if (bodyFieldObject.ezapi_ref && bodyFieldObject.name) {
								const schemaData = await SchemaData.findOne({
									projectid: projectId,
									'data.name': bodyFieldObject.name
								}).lean();
								if (schemaData && schemaData.data && schemaData.data.attributes) {
									const attributes = schemaData.data.attributes;
									const schemaName = schemaData.data.name;
									for (const attribute of attributes) {
										let attributeName = attribute.name;
										const tableDetailsObject = await findAttributeTableDetails(
											projectId,
											schemaName,
											attributeName,
											operation
										);
										let result = Array.isArray(tableDetailsObject);
										if (!result) {
											if (tableDetailsObject.noMatch) {
												return true;
											}
										}
									}
								} else {
									return true;
								}
							} else {
								const schemaName = bodyFieldObject.schemaName;
								const attributeName = bodyFieldObject.name;
								const tableDetailsObject = await findAttributeTableDetails(
									projectId,
									schemaName,
									attributeName,
									operation
								);
								let result = Array.isArray(tableDetailsObject);
								if (!result) {
									if (tableDetailsObject.noMatch) {
										return true;
									}
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
									const { schemaName, name: attributeName } =
										property[propertyName];
									const tableDetailsObject = await findAttributeTableDetails(
										projectId,
										schemaName,
										attributeName,
										operation
									);
									let result = Array.isArray(tableDetailsObject);
									if (!result) {
										if (tableDetailsObject.noMatch) {
											return true;
										}
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
						if (responseHeaders) {
							for (const header of responseHeaders) {
								let headerProperty = Object.keys(header)[0];
								const { schemaName, name: attributeName } = headerProperty;
								const tableDetailsObject = await findAttributeTableDetails(
									projectId,
									schemaName,
									attributeName,
									operation
								);
								let result = Array.isArray(tableDetailsObject);
								if (!result) {
									if (tableDetailsObject.noMatch) {
										return true;
									}
								}
							}
						}
						let responseBody = response.content;
						let responseBodyProperties;
						if (responseBody && responseBody.properties) {
							responseBodyProperties = Object.keys(responseBody.properties);
							for (const bodyProperty of responseBodyProperties) {
								const bodyFieldObject = responseBody.properties[bodyProperty];
								if (bodyFieldObject.ezapi_ref && bodyFieldObject.name) {
									const schemaData = await SchemaData.findOne({
										projectid: projectId,
										'data.name': bodyFieldObject.name
									}).lean();
									if (
										schemaData &&
										schemaData.data &&
										schemaData.data.attributes
									) {
										const attributes = schemaData.data.attributes;
										const schemaName = schemaData.data.name;
										for (const attribute of attributes) {
											let attributeName = attribute.name;
											const tableDetailsObject =
												await findAttributeTableDetails(
													projectId,
													schemaName,
													attributeName,
													operation
												);
											let result = Array.isArray(tableDetailsObject);
											if (!result) {
												if (tableDetailsObject.noMatch) {
													return true;
												}
											}
										}
									}
								} else {
									const schemaName = bodyFieldObject.schemaName;
									const attributeName = bodyFieldObject.name;
									const tableDetailsObject = await findAttributeTableDetails(
										projectId,
										schemaName,
										attributeName,
										operation
									);
									let result = Array.isArray(tableDetailsObject);
									if (!result) {
										if (tableDetailsObject.noMatch) {
											return true;
										}
									}
								}
							}
						}
					}
				}
			}
		}
		return false;
	} catch (err) {
		console.log('error', err.message);
		return { error: err.message };
	}
}

module.exports = checkUnmappedFields;
