let fs = require('fs');
let OperationData = require('../models/operationData');
let axios = require('axios');
let Projects = require('../models/projects');
let { get_encoding, encoding_for_model } = require('@dqbd/tiktoken');
let MongoCollections = require('../models/mongoCollections');
let TablesData = require('../models/tables');
let { getTableRelations, getTablesList } = require('../utility/getTableRelations');
const shortid = require('shortid');
let { tableData } = require('./getTableData');
let CodegenPrompts = require('../models/codegenPrompts');
let ChatGptGenCode = require('../models/chatGptGenCode');
let Settings = require('../models/settings');

let {
	findAttribute,
	assortIntoFilesV2,
	assortIntoFilesMongoV2
} = require('../utility/promptsCompletionV2');

const {
	NESTJSPROMPT,
	NESTJSDBCONNECTION,
	NODEJSPROMPT,
	NODEJSDBCONNECTION
} = require('../constants/prompts');

let ORMmodelsforOracle = false;

/** code to generate prompt for table models - SQL:RDBMS */
async function modelPromptController(projectId, codegenLang, codegenDb, userId) {
	try {
		// gets the tables list that user dragged and dropped
		let tablesRelations = await getTableRelations(projectId);
		let relations;
		try {
			relations = tablesRelations.relations;
		} catch (e) {
			// no relations , continue
		}
		let codeFramework = await getCodeFramework(projectId, userId);
		let requiredTables = [];
		if (relations.length > 0) {
			for (let tr = 0; tr < relations.length; tr++) {
				if (!requiredTables.includes(relations[tr].mainTable)) {
					requiredTables.push(relations[tr].mainTable);
				}

				if (!requiredTables.includes(relations[tr].dependentTable)) {
					requiredTables.push(relations[tr].dependentTable);
				}
			}
		} else {
			let tablesListData = await getTablesList(projectId);
			requiredTables = tablesListData.tablesList;
			console.log('requiredTables..', requiredTables);
		}

		const data = { projectId: projectId };

		let responseData;

		let prompt;

		if (codegenLang.toLowerCase().includes('node')) {
			if (codegenDb === 'mssql' || codegenDb === 'mysql') {
				prompt =
					'Give me ' +
					codegenLang +
					` code for ORM model class using ${codeFramework} and sequelize package with ` +
					codegenDb +
					' as database for the following schemas and tables : ';
			} else if (codegenDb === 'postgres') {
				if (codeFramework === 'nestjs') {
					prompt = `
					Give me ${codegenLang} code using ${codeFramework} and typeORM with ${codegenDb} as database for the following schemas and tables:
					
					`;
				} else {
					prompt =
						'Give me ' +
						codegenLang +
						` code for ORM model class using ${codeFramework} and pg with ` +
						codegenDb +
						' as database for the following schemas and tables : ';
				}
			} else if (codegenDb === 'oracle') {
				prompt =
					'Give me ' +
					codegenLang +
					` code for ORM model class using ${codeFramework} and oracledb library with ` +
					codegenDb +
					' as database for the following schemas and tables : ';
			}
		} else if (codegenLang.toLowerCase().includes('python')) {
			if (codegenDb === 'mssql' || codegenDb === 'mysql') {
				prompt =
					'Give me ' +
					codegenLang +
					' code for model class using flask, sql_alchemy and pymssql with ' +
					codegenDb +
					" as database , with __table_args. Don't use sqlalchemy metadata. The tables with their db schemas are below :";
			} else if (codegenDb === 'postgres') {
				prompt =
					'Give me ' +
					codegenLang +
					' code for model class using flask, sql_alchemy with ' +
					codegenDb +
					" as database , with __table_args. Don't use sqlalchemy metadata. The tables with their db schemas are below :";
			} else if (codegenDb === 'oracle') {
				prompt =
					'Give me ' +
					codegenLang +
					' code for model class using flask, cx_oracle with ' +
					codegenDb +
					' as database , with __table_args. The tables with their db schemas are below :';
			}
			//prompt = "Write a "+codegenLang+" code for ORM model class using flask and sql_alchemy with appdb as database for the following schemas and tables : ";
		}
		responseData = await tableData(projectId);
		//console.log("responseData...", responseData)
		if (responseData.length == 1 && responseData[0].error) {
			throw new Error(responseData[0].error);
		}
		for (let i = 0; i < responseData.length; i++) {
			// generates for only tables that user dragged and dropped
			if (
				requiredTables.includes(responseData[i].key) ||
				requiredTables.includes(responseData[i].name)
			) {
				prompt +=
					'The table name is ' +
					responseData[i].name +
					' and schema name is ' +
					responseData[i].key.split('.')[0] +
					'. ';
				let fields = responseData[i].selectedColumns;
				prompt += 'The table has ' + fields.length + ' fields.';
				for (let j = 0; j < fields.length; j++) {
					prompt += 'The table has ' + (j + 1) + '.' + fields[j].name;
					prompt += ' of type ' + fields[j].type;
					//prompt+=" of format "+fields[j].format+". ";
					let formattype = fields[j].format;
					//if (formattype == "sql_server_nchar") { formattype = "string"}
					if (fields[j].keyType === 'primary') {
						prompt += ' of format ' + formattype + ', ';
						prompt += 'which is a primary key';
						if (fields[j].foreign) {
							prompt +=
								', and also is a foreign key referencing ' +
								fields[j].foreign.column +
								' from ' +
								fields[j].foreign.table +
								' table.';
						}
					} else if (fields[j].keyType === 'composite') {
						//let compKeys = await getCompositeKeys(projectId, responseData[i].key)
						//console.log("compKeys..", compKeys)
						prompt += ' of format ' + formattype + ', ';
						prompt += 'which is a primary key';
						if (fields[j].foreign) {
							prompt +=
								', and also is a foreign key referencing ' +
								fields[j].foreign.column +
								' from ' +
								fields[j].foreign.table +
								' table.';
						}
					} else if (fields[j].foreign) {
						prompt += ' of format ' + formattype + ', ';
						prompt +=
							', which is a foreign key referencing ' +
							fields[j].foreign.column +
							' from ' +
							fields[j].foreign.table +
							' table.';
					} else {
						prompt += ' of format ' + formattype + '.';
					}
				}
				prompt += ' Consider another table. ';
			}
		}

		if (relations.length > 0) {
			let userInputRelationCount = 0;
			for (let r = 0; r < relations.length; r++) {
				if (relations[r].origin == 'userInput') {
					if (userInputRelationCount == 0) {
						prompt += 'Also consider these relations : ';
					}
					let mainTable = relations[r].mainTable;
					let mainTableColumn = relations[r].mainTableColumn;
					let dependentTable = relations[r].dependentTable;
					let dependentTableColumn = relations[r].dependentTableColumn;
					let mainTableSchema = relations[r].mainTableSchema;
					let dependentTableSchema = relations[r].dependentTableSchema;
					let relation = relations[r].relation;
					userInputRelationCount++;
					prompt +=
						userInputRelationCount +
						') ' +
						'The column ' +
						mainTableColumn +
						' of ' +
						mainTable +
						' table ' +
						'under the schema ' +
						mainTableSchema +
						' is ' +
						relation +
						' to ' +
						dependentTableColumn +
						' of ' +
						dependentTable +
						' table under ' +
						dependentTableSchema +
						' schema. ';
				}
			}
		}
		// replacing custom types to generic types - mssql
		prompt = prompt.replace(/sql_server_nvarchar/g, 'NVARCHAR');
		prompt = prompt.replace(/sql_server_varchar/g, 'VARCHAR');
		prompt = prompt.replace(/sql_server_char/g, 'CHAR');
		prompt = prompt.replace(/sql_server_nchar/g, 'NCHAR');
		prompt = prompt.replace(/sql_server_geography/g, 'Geography');
		prompt = prompt.replace(/sql_server_uniqueidentifier/g, 'Uniqueidentifier');
		prompt = prompt.replace(/sql_server_hierarchyid/g, 'Hierarchyid');
		prompt = prompt.replace(/sql_server_xml/g, 'XML');
		prompt = prompt.replace(/sql_server_ntext/g, 'ntext');

		// for postgreSQL db
		prompt = prompt.replace(/postgres_character/g, 'character');
		prompt = prompt.replace(/postgres_text/g, 'text');
		prompt = prompt.replace(/postgres_USER-DEFINED/g, 'USER-DEFINED');
		prompt = prompt.replace(/postgres_timestamp/g, 'timestamp');
		prompt = prompt.replace(/postgres_ARRAY/g, 'ARRAY');
		prompt = prompt.replace(/postgres_tsvector/g, 'tsvector');

		let lastIndex = prompt.lastIndexOf('Consider another table.');

		if (lastIndex !== -1) {
			prompt =
				prompt.slice(0, lastIndex) +
				prompt.slice(lastIndex).replace('Consider another table.', '');
		}
		prompt += "Don't provide any comments";
		return { prompt };
	} catch (errMdlPrmpt) {
		return { errMdlPrmpt };
	}
}

/** code to generate prompt for table models - SQL:RDBMS*/
async function getCompositeKeys(projectid, key) {
	try {
		if (!projectid || !key) throw new Error('projectid or key is required..');
		const data = await TablesData.aggregate([
			{
				$match: {
					projectid: projectid,
					key: key,
					'attributes.keyType': 'composite'
				}
			},
			{
				$project: {
					_id: 0,
					key: 1,
					schema: 1,
					table: 1,
					attributes: {
						$filter: {
							input: '$attributes',
							as: 'attributes',
							cond: {
								$eq: ['$$attributes.keyType', 'composite']
							}
						}
					}
				}
			}
		]);
		if (!data) throw new Error('no data found');
		return { data: data[0] };
	} catch (err) {
		return { err: err.message };
	}
}

/** code to generate model code using model prompt - SQL:RDBMS*/
async function modelCodeGenerator(projectId, codegenPrompt) {
	let codegenUrl = 'https://api.openai.com/v1/chat/completions';
	let codegenResponse, gencode;
	const openAiKey = process.env.OPENAI_API_KEY;

	try {
		const response = await axios.post(
			codegenUrl,
			{
				model: 'gpt-3.5-turbo',
				temperature: 0,
				messages: [
					{
						role: 'user',
						content: codegenPrompt
					}
				]
			},
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer ' + process.env.OPENAI_API_KEY
				}
			}
		);
		codegenResponse = response.data;
		let directory = process.env.DIRECTORY_LOCATION + '/' + projectId + '/pythoncode';
		// create a directory if not found
		if (!fs.existsSync(directory)) {
			fs.mkdirSync(directory, { recursive: true });
		}

		// create a new file and write the JSON response in it
		fs.writeFile(
			directory + '/models.py',
			codegenResponse.choices[0].message.content,
			(err) => {
				if (err) {
					console.log('error while writing code to files' + err);
				}
			}
		);
		gencode = codegenResponse.choices[0].message.content;
		return { gencode };
	} catch (error) {
		console.error('Error:', error);
		return { error };
	}
}

/** code to generate prompt for controllers - SQL:RDBMS*/
async function ODPromptController(projectId, codegenLang, codegenDb, userId) {
	let prompt, finalprompt, selectedColumnsData;
	try {
		let codeFramework = await getCodeFramework(projectId, userId);
		if (codegenLang.toLowerCase().includes('node')) {
			if (codegenDb === 'mssql' || codegenDb === 'mysql') {
				if (codeFramework === 'nestjs') {
					prompt = `Write a 
					${codegenLang}
					 code using ${codeFramework} and Sequelize library with 
					${codegenDb} 
					 as database with the following data : `;
				} else {
					prompt = `Write a 
					codegenLang 
					 code using ${codeFramework} and Sequelize with 
					${codegenDb} 
					 as database for index.js file with the following data : `;
				}
			} else if (codegenDb === 'postgres') {
				if (codeFramework === 'nestjs') {
					prompt = `Write a 
					${codegenLang}
					 code using ${codeFramework} and Sequelize library with 
					${codegenDb} 
					 as database with the following data : `;
				} else {
					prompt =
						'Write a ' +
						codegenLang +
						` code using ${codeFramework} and pg with ` +
						codegenDb +
						' as database for index.js file with the following data : ';
				}
			} else if (codegenDb === 'oracle') {
				prompt =
					'Write a ' +
					codegenLang +
					` code using ${codeFramework} and oracledb with ` +
					codegenDb +
					' as database for index.js file with the following data : ';
			}
		} else if (codegenLang.toLowerCase().includes('python')) {
			if (codegenDb === 'mssql' || codegenDb === 'mysql') {
				prompt =
					'Give me ' +
					codegenLang +
					' code using flask, sql_alchemy and pymssql with ' +
					codegenDb +
					' as database for app.py file with the following endpoints : ';
				//prompt = "Write a "+codegenLang+" code using flask and sql_alchemy with appdb as database for app.py file with the following data : ";
			} else if (codegenDb === 'postgres') {
				prompt =
					'Give me ' +
					codegenLang +
					' code using flask, sql_alchemy create_engine, along with models classes with ' +
					codegenDb +
					' as database for app.py file with the following endpoints : ';
			} else if (codegenDb === 'oracle') {
				prompt =
					'Give me ' +
					codegenLang +
					' code using flask, cx_oracle with ' +
					codegenDb +
					' as database for app.py file with the following endpoints : ';
				if (ORMmodelsforOracle) {
					prompt =
						'Give me ' +
						codegenLang +
						' code along with models class using flask, sqlalchemy, cx_oracle with ' +
						codegenDb +
						' as database for app.py file with the following endpoints : ';
				}
			}
		}

		const docs = await OperationData.find({ projectid: projectId });
		if (docs.length == 1) {
			prompt += 'There is ' + docs.length + ' endpoint. ';
		} else {
			prompt += 'There are ' + docs.length + ' endpoints. ';
		}
		for (let i = 0; i < docs.length; i++) {
			prompt += 'The method is ' + docs[i].data.method + ' method. ';
			prompt += 'The endpoint is ' + docs[i].data.endpoint + '. ';
			prompt += 'The Request data is as follows :';

			let authorizationUsed = docs[i].data.requestData.authorization.authType;

			if (authorizationUsed !== 'No Auth') {
				prompt += 'The authorization include a ' + authorizationUsed + '.';
			}

			let headersUsed = docs[i].data.requestData.header;

			if (headersUsed && headersUsed.length > 0) {
				prompt += 'There are ' + headersUsed.length + ' headers used.';

				for (let i = 0; i < headersUsed.length; i++) {
					let key = Array.from(headersUsed[i].keys())[i];
					if (key) {
						let name = headersUsed[i].get(key).name ? headersUsed[i].get(key).name : '';
						let type = headersUsed[i].get(key).type ? headersUsed[i].get(key).type : '';
						let format = headersUsed[i].get(key).format
							? headersUsed[i].get(key).format
							: '';
						let required = headersUsed[i].get(key).required
							? headersUsed[i].get(key).required
							: '';

						prompt +=
							'The header is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required header.';
						}
					}
				}
			}

			let pathUsed = docs[i].data.requestData.path;

			if (pathUsed && pathUsed.length > 0) {
				if (pathUsed.length == 1) {
					prompt += 'There is ' + pathUsed.length + ' path parameter used. ';
					let key = Array.from(pathUsed[0].keys())[0];
					let name = pathUsed[0].get(key).name ? pathUsed[0].get(key).name : '';
					let type = pathUsed[0].get(key).type ? pathUsed[0].get(key).type : '';
					let format = pathUsed[0].get(key).format ? pathUsed[0].get(key).format : '';
					prompt +=
						'The path parameter is ' +
						name +
						' with the type ' +
						type +
						' and of format ' +
						format +
						'.';
				} else {
					prompt += 'There are ' + pathUsed.length + ' path parameters used.';
					prompt += 'The path parameters are : ';
					for (let i = 0; i < pathUsed.length; i++) {
						let key = Array.from(pathUsed[i].keys())[i];
						if (key) {
							let name = pathUsed[i].get(key).name ? pathUsed[i].get(key).name : '';
							let type = pathUsed[i].get(key).type ? pathUsed[i].get(key).type : '';
							let format = pathUsed[i].get(key).format
								? pathUsed[i].get(key).format
								: '';
							let required = pathUsed[i].get(key).required
								? pathUsed[i].get(key).required
								: '';

							//prompt+="The path parameter is "+name+" with the type "+type+" and of format "+format+".";
							if (i == pathUsed.length - 1) {
								prompt +=
									name +
									' with the type ' +
									type +
									' and of format ' +
									format +
									'. ';
							} else {
								prompt +=
									name +
									' with the type ' +
									type +
									' and of format ' +
									format +
									', ';
							}

							/*  if(required){
                                prompt+=" It is a required path."
                            } */
						}
					}
				}
			}

			let queryUsed = docs[i].data.requestData.query;

			if (queryUsed && queryUsed.length > 0) {
				prompt += 'There are ' + queryUsed.length + ' queries used.';

				for (let i = 0; i < queryUsed.length; i++) {
					let key = Array.from(queryUsed[i].keys())[i];
					if (key) {
						let name = queryUsed[i].get(key).name ? queryUsed[i].get(key).name : '';
						let type = queryUsed[i].get(key).type ? queryUsed[i].get(key).type : '';
						let format = queryUsed[i].get(key).format
							? queryUsed[i].get(key).format
							: '';
						let required = queryUsed[i].get(key).required
							? queryUsed[i].get(key).required
							: '';

						prompt +=
							'The query is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required query.';
						}
					}
				}
			}

			let formDataUsed = docs[i].data.requestData.formData;

			if (formDataUsed && formDataUsed.length > 0) {
				prompt += 'There are ' + formDataUsed.length + ' form datas are used.';

				for (let i = 0; i < formDataUsed.length; i++) {
					let key = Array.from(formDataUsed[i].keys())[i];
					if (key) {
						let name = formDataUsed[i].get(key).name
							? formDataUsed[i].get(key).name
							: '';
						let type = formDataUsed[i].get(key).type
							? formDataUsed[i].get(key).type
							: '';
						let format = formDataUsed[i].get(key).format
							? formDataUsed[i].get(key).format
							: '';
						let required = formDataUsed[i].get(key).required
							? formDataUsed[i].get(key).required
							: '';

						prompt +=
							'The query is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required formData.';
						}
					}
				}
			}

			// no request body for GET methods

			if (docs[i].data.method.toLowerCase() != 'get') {
				prompt += ' The request body include :';
				let requestDataHeader;
				if (requestDataHeader && requestDataHeader.length > 0) {
					prompt += 'There are ' + requestDataHeader.length + ' response headers used.';
					for (let i = 0; i < requestDataHeader.length; i++) {
						let key = Array.from(requestDataHeader[i].keys())[i];
						if (key) {
							let name = requestDataHeader[i].get(key).name
								? requestDataHeader[i].get(key).name
								: '';
							let type = requestDataHeader[i].get(key).type
								? requestDataHeader[i].get(key).type
								: '';
							let format = requestDataHeader[i].get(key).format
								? requestDataHeader[i].get(key).format
								: '';
							let required = requestDataHeader[i].get(key).required
								? requestDataHeader[i].get(key).required
								: '';

							prompt +=
								'The header is ' +
								name +
								' with the type ' +
								type +
								' and of format ' +
								format +
								'.';

							if (required) {
								prompt += ' It is a required request header.';
							}
						}
					}
				} // headers end

				// request body starts
				let innerObjectNames;
				let requestBodyExist = true;
				try {
					innerObjectNames = Object.keys(docs[i].data.requestData.body.properties);
				} catch (e) {
					requestBodyExist = false;
				}
				if (requestBodyExist) {
					for (let ib = 0; ib < innerObjectNames.length; ib++) {
						let innerObject =
							docs[i].data.requestData.body.properties[innerObjectNames[ib]];
						if (innerObject.type == 'arrayOfObjects') {
							prompt += 'The JSON attribute include : ';
							prompt += '' + (ib + 1) + ') ';
							let propertiesObject = innerObject.items.properties;
							const innerObjectNames = Object.keys(propertiesObject);
							for (let ion = 0; ion < innerObjectNames.length; ion++) {
								//prompt+=""+(ib+1)+"."+(ion+1)+")";  // nesting variables
								if (propertiesObject[innerObjectNames[ion]].type == 'ezapi_table') {
									// get the selected column
									try {
										selectedColumnsData = findSelectedColumns(
											docs[i].data.requestData.body
										);
									} catch (e) {
										// no selected columns data , continue
									}
									prompt += 'The ' + innerObject.name;
									if (selectedColumnsData) {
										prompt += ' as an array and it contains : ';
										prompt += '' + (ib + 1) + '.' + (ion + 1) + ')';
										prompt +=
											innerObjectNames[ion] +
											' as object and contains ' +
											selectedColumnsData.length +
											' fields :';

										for (let k = 0; k < selectedColumnsData.length; k++) {
											let name = selectedColumnsData[k].name;
											let table = selectedColumnsData[k].key;
											prompt +=
												ib +
												1 +
												'.' +
												(ion + 1) +
												'.' +
												(k + 1) +
												')' +
												name +
												' from ' +
												table;
										}
									}
								} else {
									let innerObject = propertiesObject[innerObjectNames[ion]];
									let name = innerObject.name;
									let column = innerObject.sourceName;
									let table = innerObject.key; // schema included here
									prompt +=
										name +
										' from ' +
										column +
										' field of ' +
										table +
										' table as ' +
										innerObjectNames[ion] +
										'.';
								}
							}
						} else {
							if (innerObject.type === 'ezapi_table') {
								//console.log("unhandled. table structure") //code to be written
								let sourceName = innerObject.sourceName;
								selectedColumnsData = findSelectedColumns(innerObject);

								prompt += '1) The ' + sourceName;

								if (selectedColumnsData) {
									prompt += ' as an object and it contains : ';
									for (let k = 0; k < selectedColumnsData.length; k++) {
										let name = selectedColumnsData[k].name;
										let table = selectedColumnsData[k].key;
										prompt +=
											'1.' + (k + 1) + ') ' + name + ' from ' + table + '. ';
									}
								}
							} else {
								prompt += '' + (ib + 1) + ') '; // nesting variables
								let name = innerObject.name;
								let column = innerObject.sourceName;
								let table = innerObject.key; // schema included here
								prompt +=
									' ' +
									name +
									' from ' +
									column +
									' field of ' +
									table +
									' table.';
							}
						}
					}
				} else {
					// only one array or object exist
					let type = docs[i].data.requestData.body.type;
					if (type === 'ezapi_table') {
						// get the selected column
						let sourceName = docs[i].data.requestData.body.sourceName;
						// get the selected column
						selectedColumnsData = findSelectedColumns(docs[i].data.requestData.body);

						prompt += '1) The ' + sourceName;

						if (selectedColumnsData) {
							prompt += ' as an object and it contains : ';
							for (let k = 0; k < selectedColumnsData.length; k++) {
								let name = selectedColumnsData[k].name;
								let table = selectedColumnsData[k].key;
								prompt += '1.' + (k + 1) + ') ' + name + ' from ' + table + '. ';
							}
						}
					} else {
						let name = docs[i].data.requestData.body.name;
						let column = docs[i].data.requestData.body.sourceName;
						let table = docs[i].data.requestData.body.key; // schema included here
						prompt += '1) ';
						prompt += name + ' from ' + column + ' field of ' + table + ' table. ';
					}
				}
			}

			// request data ends here

			// response data
			prompt += ' The response data is as follows : ';
			let ResponseHeadersUsed;
			for (let j = 0; j < docs[i].data.responseData.length; j++) {
				// get staus_code and status message
				prompt +=
					'The status code is ' +
					docs[i].data.responseData[j].status_code +
					' with status message as ' +
					docs[i].data.responseData[j].description +
					'.';
				//resp headers begin
				ResponseHeadersUsed = docs[i].data.responseData[j].headers;
				if (ResponseHeadersUsed && ResponseHeadersUsed.length > 0) {
					prompt += 'There are ' + ResponseHeadersUsed.length + ' response headers used.';
					for (let i = 0; i < ResponseHeadersUsed.length; i++) {
						let key = Array.from(ResponseHeadersUsed[i].keys())[i];
						if (key) {
							let name = ResponseHeadersUsed[i].get(key).name
								? ResponseHeadersUsed[i].get(key).name
								: '';
							let type = ResponseHeadersUsed[i].get(key).type
								? ResponseHeadersUsed[i].get(key).type
								: '';
							let format = ResponseHeadersUsed[i].get(key).format
								? ResponseHeadersUsed[i].get(key).format
								: '';
							let required = ResponseHeadersUsed[i].get(key).required
								? ResponseHeadersUsed[i].get(key).required
								: '';

							prompt +=
								'The header is ' +
								name +
								' with the type ' +
								type +
								' and of format ' +
								format +
								'.';

							if (required) {
								prompt += ' It is a required response header.';
							}
						}
					}
				}
				// resp headers end

				function findSelectedColumns(obj) {
					if (Array.isArray(obj)) {
						// If obj is an array, recursively call this function for each item in the array
						for (let i = 0; i < obj.length; i++) {
							const result = findSelectedColumns(obj[i]);
							if (result) {
								return result;
							}
						}
					} else if (typeof obj === 'object' && obj !== null) {
						// If obj is an object, recursively call this function for each property of the object
						for (const prop in obj) {
							if (prop === 'selectedColumns') {
								// If the property name is 'selectedCoulmns', return the value
								return obj[prop];
							} else {
								const result = findSelectedColumns(obj[prop]);
								if (result) {
									return result;
								}
							}
						}
					}
					// If 'selectedCoulmns' is not found, return null
					return null;
				}

				// resp body starts

				let innerObjectNames;
				if (
					docs[i].data.responseData[j].content &&
					docs[i].data.responseData[j].content.properties
				) {
					console.log('response data has properties..');
					innerObjectNames = Object.keys(docs[i].data.responseData[j].content.properties);
				}
				//resp body content has properties ( mix of any 2 params are used, direct columns from tables ,  full tables are used)
				//responseData => content => properties
				if (innerObjectNames) {
					prompt += ' The response body JSON object is : ';
					console.log('getting ready to iterate through fields in properties..');
					//loop through resp body content properties
					for (let ib = 0; ib < innerObjectNames.length; ib++) {
						console.log('for each field in properties..' + innerObjectNames[ib]);
						let innerObject =
							docs[i].data.responseData[j].content.properties[innerObjectNames[ib]];
						// params are used and type is AOO or Object
						//responseData => content => properties => {} -> type:AOO / object
						if (innerObject.type == 'arrayOfObjects' || innerObject.type == 'object') {
							//prompt+="The JSON attribute include : "
							prompt += '' + (ib + 1) + ') ';
							let propertiesObject;
							//responseData => content => properties => {} -> type:AOO -> items.properties
							propertiesObject = innerObject.items.properties;

							if (typeof propertiesObject == 'undefined') {
								//responseData => content => properties => {} -> type: object  -> properties
								propertiesObject = innerObject.properties;
							}

							const innerObjectNames = Object.keys(propertiesObject);
							//AOO or Obj contain either table, or anther AOO / obj, direct columns
							for (let ion = 0; ion < innerObjectNames.length; ion++) {
								console.log(
									'for each field inside AOO / obj ..' + innerObjectNames[ion]
								);
								// if its a table
								//responseData => content => properties => {} -> type:AOO / object  => {} -> type:ezapi_table  ref: 6e2e3ec5-46d0-4154-8bb2-4d9481a8eede
								if (propertiesObject[innerObjectNames[ion]].type == 'ezapi_table') {
									console.log('field inside AOO/obj is ezapi_table');
									// get the selected column
									try {
										selectedColumnsData = findSelectedColumns(
											docs[i].data.responseData[j].content
										);
									} catch (e) {
										// no selected columns data , continue
									}
									prompt += 'The ' + innerObject.name;
									if (selectedColumnsData) {
										prompt += ' as an array and it contains : ';
										prompt += '' + (ib + 1) + '.' + (ion + 1) + ') ';
										prompt +=
											innerObjectNames[ion] +
											' as object and contains ' +
											selectedColumnsData.length +
											' fields :';

										for (let k = 0; k < selectedColumnsData.length; k++) {
											let name = selectedColumnsData[k].name;
											let table = selectedColumnsData[k].key;
											prompt +=
												ib +
												1 +
												'.' +
												(ion + 1) +
												'.' +
												(k + 1) +
												') ' +
												name +
												' from ' +
												table +
												'. ';
										}
									}
									/// AOO or obj
									//responseData => content => properties => {} -> type:AOO / object  => {} -> type:AOO / object
								} else if (
									propertiesObject[innerObjectNames[ion]].type ==
										'arrayOfObjects' ||
									propertiesObject[innerObjectNames[ion]].type == 'object'
								) {
									console.log('field inside AOO/obj is AOO or obj');
									//responseData => content => properties => {} -> type: object  > {} -> type: AOO -> items.properties
									let inObjNames;
									if (propertiesObject[innerObjectNames[ion]].items) {
										inObjNames = Object.keys(
											propertiesObject[innerObjectNames[ion]].items.properties
										);
									}
									if (typeof inObjNames == 'undefined') {
										//responseData => content => properties => {} -> type: object  > {} -> type: object -> properties
										inObjNames = Object.keys(
											propertiesObject[innerObjectNames[ion]].properties
										);
									}
									for (let nesIon = 0; nesIon < inObjNames.length; nesIon++) {
										// table inside AOO / obj
										//responseData => content => properties => {} -> type:AOO / object  => {} -> type:AOO / object -> {} -> type:ezapi_table
										if (
											propertiesObject[innerObjectNames[ion]].properties[
												inObjNames[nesIon]
											].type == 'ezapi_table'
										) {
											console.log(
												'field inside AOO/obj => AOO / obj => is ezapi_table'
											);
											let selColumns =
												propertiesObject[innerObjectNames[ion]].properties[
													inObjNames[nesIon]
												].selectedColumns;
											prompt +=
												'The ' +
												propertiesObject[innerObjectNames[ion]].properties[
													inObjNames[nesIon]
												].sourceName;

											if (selColumns) {
												prompt += ' as an object and it contains : ';
												for (let k = 0; k < selColumns.length; k++) {
													let name = selColumns[k].name;
													let table = selColumns[k].key;
													prompt +=
														'1.' +
														(k + 1) +
														') ' +
														name +
														' from ' +
														table +
														'. ';
												}
											}
											// direct columns
											//responseData => content => properties => {} -> type:AOO / object  => {} -> type:AOO / object -> {} -> type:<individualdatatypes>
										} else {
											console.log(
												'field inside AOO/obj => AOO / obj => is column'
											);
											let name =
												propertiesObject[innerObjectNames[ion]].properties[
													inObjNames[nesIon]
												].sourceName.name;
											let column =
												propertiesObject[innerObjectNames[ion]].properties[
													inObjNames[nesIon]
												].sourceName.sourceName;
											let table =
												propertiesObject[innerObjectNames[ion]].properties[
													inObjNames[nesIon]
												].sourceName.key; // schema included here
											prompt += '' + (ib + 1) + '.' + (ion + 1) + ') ';
											prompt +=
												name +
												' from ' +
												column +
												' field of ' +
												table +
												' table as ' +
												innerObjectNames[ion] +
												'. ';
										}
									}
									//direct columns
									//responseData => content => properties => {} -> type:AOO / object  => {} -> type:AOO / object -> {} -> type:<individualatatypes>
								} else {
									console.log('field inside AOO/obj is column');
									let name, column, table, vals;
									let innerObject = propertiesObject[innerObjectNames[ion]];
									if (innerObject.sourceName && innerObject.key) {
										name = innerObject.name;
										column = innerObject.sourceName;
										table = innerObject.key; // schema included here
										prompt += '' + (ib + 1) + '.' + (ion + 1) + ') ';
										prompt +=
											name +
											' from ' +
											column +
											' field of ' +
											table +
											' table as ' +
											innerObjectNames[ion] +
											'. ';
									} else if (
										innerObject.schemaName === 'global' &&
										innerObject.possibleValues
									) {
										name = innerObject.name;
										vals = innerObject.possibleValues[0];
										prompt += '' + (ib + 1) + '.' + (ion + 1) + ') ';
										prompt +=
											' field ' + name + ' with value as ' + vals + ' .';
									}
								}
							}
							// table is used directly
							//responseData => content => properties => {} -> type:ezapi_table
						} else if (innerObject.type == 'ezapi_table') {
							console.log('type of field..is ezapi_table');
							// get the selected column
							let sourceName = innerObject.sourceName;
							// get the selected column
							selectedColumnsData = findSelectedColumns(innerObject);

							prompt += '1) The ' + sourceName;

							if (selectedColumnsData) {
								prompt += ' as an object and it contains : ';
								for (let k = 0; k < selectedColumnsData.length; k++) {
									let name = selectedColumnsData[k].name;
									let table = selectedColumnsData[k].key;
									prompt +=
										'1.' + (k + 1) + ') ' + name + ' from ' + table + '. ';
								}
							}
							// columns from table are dragged and dropped
							//responseData => content => properties => {} -> type:<individualatatypes> : refId 55454792-b719-40b1-a19f-fe09f17fe0e8
						} else {
							console.log('type of field..is any column');
							prompt += '' + (ib + 1) + ') '; // nesting variables
							let name = innerObject.name;
							let column = innerObject.sourceName;
							let table = innerObject.key; // schema included here
							prompt +=
								' ' + name + ' from ' + column + ' field of ' + table + ' table.';
						}
					}
				} else {
					console.log('response data has no properties object..');
					//only table exists in response data
					let type = docs[i].data.responseData[j].content.type;
					//responseData => content => type:ezapi_table ref : 0dc7366c-2ecb-4fbb-9e53-64bb4521bcb5
					if (type == 'ezapi_table') {
						console.log('response data has a table directly..');
						if (docs[i].data.responseData[j].content.isArray == true) {
							prompt += ' The response body JSON array is : ';
						} else {
							prompt += ' The response body JSON object is : ';
						}
						// get the selected column
						let sourceName = docs[i].data.responseData[j].content.sourceName;
						// get the selected column
						selectedColumnsData = findSelectedColumns(
							docs[i].data.responseData[j].content
						);

						prompt += '1) The ' + sourceName;

						if (selectedColumnsData) {
							prompt += ' as an object and it contains : ';
							for (let k = 0; k < selectedColumnsData.length; k++) {
								let name = selectedColumnsData[k].name;
								let table = selectedColumnsData[k].key;
								prompt += '1.' + (k + 1) + ') ' + name + ' from ' + table + '. ';
							}
						}
					} else {
						console.log('response data has columns directly..');
						prompt += ' The response body JSON object is : ';
						let name = docs[i].data.responseData[j].content.name;
						let column = docs[i].data.responseData[j].content.sourceName;
						let table = docs[i].data.responseData[j].content.key; // schema included here
						prompt += '1) ';
						prompt += name + ' from ' + column + ' field of ' + table + ' table. ';
					}
				}
			} // response data ends
		} // all operations ends

		// Setting filtering conditions
		let tablesRelations = await getTableRelations(projectId);
		let filters = tablesRelations.filters;
		let filterCount = 1;
		if (filters.length > 0) {
			// For TPOLICY table under the schema dbo HISTORYFLAG should be equal to 0.
			prompt += ' Consider these filtering conditions for querying : ';
			const tables = filters.reduce((acc, obj) => {
				const { tableName, ...rest } = obj;
				if (!acc[tableName]) {
					acc[tableName] = [];
				}
				acc[tableName].push(rest);
				return acc;
			}, {});

			for (const [tableName, attributes] of Object.entries(tables)) {
				let tableSchemaCompleted = false;
				for (const { schemaName, columnName, filterCondition, value } of attributes) {
					if (attributes.length == 1) {
						prompt +=
							filterCount +
							') ' +
							'For ' +
							tableName +
							' table ' +
							'under the schema ' +
							schemaName +
							' ' +
							columnName +
							' should be ' +
							(filterCondition == 'equals' ? 'equal' : filterCondition) +
							' to ' +
							value +
							'. ';
						filterCount++;
					} else {
						if (!tableSchemaCompleted) {
							prompt +=
								filterCount +
								') ' +
								'For ' +
								tableName +
								' table ' +
								'under the schema ' +
								schemaName +
								' ' +
								columnName +
								' should be ' +
								(filterCondition == 'equals' ? 'equal' : filterCondition) +
								' to ' +
								value +
								' ';
							tableSchemaCompleted = true;
							filterCount++;
						} else {
							prompt +=
								'and ' +
								columnName +
								' should be ' +
								(filterCondition == 'equals' ? 'equal' : filterCondition) +
								' to ' +
								value +
								'. ';
						}
					}
				}
			}
			//prompt+=" "+filterCount+") "+"No filter conditions on other tables.";
			prompt +=
				' ' + filterCount + ') ' + 'Avoid any other filter conditions on other tables';
		}
		// end of filters
		if (codegenLang.toLowerCase().includes('python')) {
			//prompt+=" Give me .env to hold all database configuration and use decouple for injecting the environment variables into the code. Give me requirements.txt for all the python libraries used. Don't provide any comments."
			if (codegenDb === 'mssql' || codegenDb === 'mysql') {
				prompt +=
					" Don't use legacy sqlalchemy relational parameters with backref, instead use db session.Additionally, give me requirements.txt for all the python libraries used. Don't provide any comments.";
			} else if (codegenDb === 'postgres') {
				prompt +=
					' Dont use legacy sqlalchemy backref, Use db session and sessionmaker for querying.Additionally, give me requirements.txt for all the python libraries used.';
			} else if (codegenDb === 'oracle') {
				if (ORMmodelsforOracle) {
					prompt +=
						" Don't use db models, instead use cursor.Additionally, give me requirements.txt for all the python libraries used. Don't provide any comments.";
				} else {
					prompt +=
						" Don't use cursor, instead use Base, session and models.Additionally, give me requirements.txt for all the python libraries used. Don't provide any comments.";
				}
			}
		} else if (codegenLang.toLowerCase().includes('node')) {
			prompt +=
				'Include primary key & foreign key relations also. Dont use associations or complex sequelize queries instead manually make multiple calls. ';
			if (codeFramework === 'express') {
				prompt += NODEJSPROMPT;
				let { projectName } = await Projects.findOne(
					{ projectId },
					{ projectName: 1 }
				).lean();
				projectName = projectName.replaceAll('_', '');
				projectName = projectName.toUpperCase();
				prompt = prompt.replaceAll('{projectName}', projectName);
				prompt += NODEJSDBCONNECTION;
			}
			if (codeFramework === 'nestjs') {
				prompt += NESTJSPROMPT;
				prompt += NESTJSDBCONNECTION;
			}
		}

		// for mssql db
		prompt = prompt.replace(/sql_server_nvarchar/g, 'VARCHAR');
		prompt = prompt.replace(/sql_server_varchar/g, 'VARCHAR');
		prompt = prompt.replace(/sql_server_char/g, 'VARCHAR');

		// for postgreSQL db
		prompt = prompt.replace(/postgres_character/g, 'character');
		prompt = prompt.replace(/postgres_text/g, 'text');
		prompt = prompt.replace(/postgres_USER-DEFINED/g, 'USER-DEFINED');
		prompt = prompt.replace(/postgres_timestamp/g, 'timestamp');
		prompt = prompt.replace(/postgres_ARRAY/g, 'ARRAY');
		prompt = prompt.replace(/postgres_tsvector/g, 'tsvector');

		//res.json({prompt:prompt})
		finalprompt = prompt;

		/*})
        .catch(err => {
            console.log(err);
            //return res.status(500).json({message:"Something went wrong"})
            throw err;
        });*/
		return { finalprompt };
	} catch (errODPrmpt) {
		console.log(errODPrmpt);
		return { errODPrmpt };
	}
}

/** code to generate code using controller prompt - SQL:RDBMS*/
async function ODCodeGenerator(projectId, codegenLang, codegenPrompt, modelPrompt) {
	let promptData = {
		modelPrompt: modelPrompt,
		opDataPrompt: codegenPrompt,
		codegenLang: codegenLang
	};
	try {
		CodegenPrompts.findOne({ projectId: projectId }, function (err, doc) {
			if (err) throw err;
			if (doc) {
				CodegenPrompts.findOneAndUpdate(
					{ projectId: projectId },
					{ $push: { prompts: promptData } },
					{ useFindAndModify: false },
					function (error, success) {
						if (error) {
							console.log('error while writing prompts to db');
						} else {
							console.log('Updated db with new prompts for : ' + codegenLang);
						}
					}
				);
			} else {
				//CodegenPrompts.create({projectId:projectId,prompts:promptData});
			}
		});

		let codegenUrl = 'https://api.openai.com/v1/chat/completions';
		let codegenResponse, gencode;

		const response = await axios.post(
			codegenUrl,
			{
				model: 'gpt-4',
				temperature: 0,
				messages: [
					{
						role: 'user',
						content: modelPrompt
						//content : "This is the model  :" + modelPrompt
					},
					{
						role: 'user',
						content: codegenPrompt
						//content: "For the above model, " + codegenPrompt
					}
				]
			},
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer ' + process.env.OPENAI_API_KEY
				}
			}
		);
		codegenResponse = response.data;
		gencode = codegenResponse.choices[0].message.content;
		//console.log("gencode1..",gencode)
		return { gencode };
	} catch (errODCdPrmpt) {
		console.error('Error:', errODCdPrmpt);
		return { errODCdPrmpt };
	}
}

/** code to arrange generated code into files - old route (only python - SQL:RDBMS)*/
async function assortIntoFiles(projectId, genCode, codegenDb, reqData) {
	try {
		console.log('genCode..', genCode);
		console.log('backtick occurences..', (genCode.match(/```/g) || []).length);
		let directory = process.env.DIRECTORY_LOCATION + '/' + projectId + '/pythoncode';
		// words that are observed when a codegen fails , keep adding more based on chatgpt response
		let codegenFailMsgs = [
			'i apologize',
			'unfortunately',
			'as a ai model',
			'unclear',
			'sample implemenatation',
			'sorry',
			' my capabilities'
		];
		let failMsgCount = 0;
		let defenvreqContent;
		if (codegenDb === 'mongo') {
			defenvreqContent =
				'``` MONGO_URI=mongodb://localhost:27017/sampleMongodb' +
				'\n' +
				'```' +
				'\n' +
				'Here is the content of the `requirements.txt` file:' +
				'```' +
				'\n' +
				'Flask==2.0.1' +
				'\n' +
				'Flask-PyMongo==2.3.0' +
				'\n' +
				'python-dotenv==0.19.0' +
				'\n' +
				'```';
		} else {
			defenvreqContent =
				'``` DATABASE_URI=mssql+pymssql://localhost:1433/sampleMSSQLdb' +
				'\n' +
				'```' +
				'\n' +
				'Here is the content of the `requirements.txt` file:' +
				'```' +
				'\n' +
				'Flask==2.0.1' +
				'\n' +
				'Flask-SQLAlchemy==2.5.1' +
				'\n' +
				'python-dotenv==0.19.0' +
				'\n' +
				'pymssql==2.2.1' +
				'\n' +
				'```';
		}

		for (let f = 0; f < codegenFailMsgs.length; f++) {
			if (String(genCode).toLowerCase().includes(codegenFailMsgs[f])) {
				failMsgCount++;
			}
		}
		let CHAT_GPT_ERROR = 'UNEXPECTED_CHATGPT_RESPONSE';
		if (failMsgCount > 0) {
			return { CHAT_GPT_ERROR };
		}

		let envAndReqContent;
		let envContent;
		let reqContent;
		let appCode;
		const escpCharsMatch = genCode.match(/\\"/g);
		if (escpCharsMatch) {
			genCode = genCode.replace(/\\"/g, '"');
		}

		const matchEnvReq = genCode.match(/\.env.*?\n(.+)/s);
		if (matchEnvReq && matchEnvReq[1].includes('requirements')) {
			envAndReqContent = matchEnvReq[1];
		} else {
			envAndReqContent = defenvreqContent;
		}
		// envAndReqContent has env file and requirement file
		// Below is the regex to get the code between first occurrence of (```) and second occurence of (```) which is the env content
		const getEnvRegex = /```([\s\S]*?)```/;
		const matchEnv = envAndReqContent.match(getEnvRegex);

		if (matchEnv) {
			envContent = matchEnv[1];
		}

		if (envContent.toLowerCase().includes('mongo')) {
			envContent = envContent.split('=')[0];
			if (reqData.dbHost.includes('.mongodb.net')) {
				envContent =
					envContent +
					'=mongodb+srv://' +
					reqData.dbUserName +
					':' +
					reqData.dbPassword +
					'@' +
					reqData.dbHost +
					'/' +
					reqData.dbName +
					'?ssl=true&ssl_cert_reqs=CERT_NONE';
			} else {
				envContent =
					envContent +
					'=mongodb://' +
					reqData.dbUserName +
					':' +
					reqData.dbPassword +
					'@' +
					reqData.dbHost +
					':' +
					reqData.dbPort +
					'/' +
					reqData.dbName +
					'?authSource=admin&readPreference=primary&directConnection=true&ssl=false';
			}
		} else {
			if (envContent.toLowerCase().includes('pymssql')) {
				envContent = envContent.split('//')[0];
				envContent =
					envContent +
					'//' +
					reqData.dbUserName +
					':' +
					reqData.dbPassword +
					'@' +
					reqData.dbHost +
					':' +
					reqData.dbPort +
					'/' +
					reqData.dbName;
			} else {
				//envContent = "mssql+pymssql://"+reqData.dbUserName+":"+reqData.dbPassword+"@"+reqData.dbHost+":"+reqData.dbPort+"/"+reqData.dbName
				vrbList = envContent.replace(/\r\n/g, '\r').replace(/\n/g, '\r').split(/\r/);
				let newEnvContent;
				console.log('vrbList..', vrbList);
				for (let h = 0; h < vrbList.length; h++) {
					if (typeof vrbList[h] != '') {
						if (vrbList[h].includes('server') || vrbList[h].includes('host')) {
							if (newEnvContent) {
								newEnvContent =
									newEnvContent +
									vrbList[h].split('=')[0] +
									'=' +
									reqData.dbHost +
									'\n';
							} else {
								newEnvContent =
									vrbList[h].split('=')[0] + '=' + reqData.dbHost + '\n';
							}
						}
						if (
							(vrbList[h].includes('mydatabase') ||
								vrbList[h].includes('database name') ||
								vrbList[h].includes('_name')) &&
							!vrbList[h].includes('server')
						) {
							if (newEnvContent) {
								newEnvContent =
									newEnvContent +
									vrbList[h].split('=')[0] +
									'=' +
									reqData.dbName +
									'\n';
							} else {
								newEnvContent =
									vrbList[h].split('=')[0] + '=' + reqData.dbName + '\n';
							}
						}
						if (vrbList[h].includes('username') || vrbList[h].includes('user')) {
							if (newEnvContent) {
								newEnvContent =
									newEnvContent +
									vrbList[h].split('=')[0] +
									'=' +
									reqData.dbUserName +
									'\n';
							} else {
								newEnvContent =
									vrbList[h].split('=')[0] + '=' + reqData.dbUserName + '\n';
							}
						}
						if (vrbList[h].includes('password')) {
							if (newEnvContent) {
								newEnvContent =
									newEnvContent +
									vrbList[h].split('=')[0] +
									'=' +
									reqData.dbPassword +
									'\n';
							} else {
								newEnvContent =
									vrbList[h].split('=')[0] + '=' + reqData.dbPassword + '\n';
							}
						}
						if (vrbList[h].includes('port')) {
							if (newEnvContent) {
								newEnvContent =
									newEnvContent +
									vrbList[h].split('=')[0] +
									'=' +
									reqData.dbPort +
									'\n';
							} else {
								newEnvContent =
									vrbList[h].split('=')[0] + '=' + reqData.dbPort + '\n';
							}
						}
						console.log('newEnvContent..', newEnvContent);
					}
				}
				envContent = newEnvContent;
				/*envContent.replace("<server_name>", reqData.dbHost).replace("<database host>", reqData.dbHost);
                envContent.replace("<database_name>", reqData.dbName).replace("<database name>", reqData.dbName);
                envContent.replace("<username>", reqData.dbUserName).replace("<database username>", reqData.dbUserName);
                envContent.replace("<password>", reqData.dbPassword).replace("<database password>", reqData.dbPassword);
                envContent.replace("<port>", reqData.dbPort).replace("<database port>", reqData.dbPort); */
			}
		}
		// creating and writing to .envfiles
		let { respMsg, errWrtFile } = writeToFiles(directory, '.env', envContent);
		if (!respMsg) throw errWrtFile;

		// regext to get the content between third occurence of (```) and 4th occurence of (```) - requirements.txt file content
		const regex = /```[\s\S]*?```[\s\S]*?```([\s\S]*?)```/;
		const match = envAndReqContent.match(regex);

		if (match) {
			reqContent = match[1];
		} else {
			reqContent = envAndReqContent;
		}
		// creating and writing to req.txt files
		({ respMsg, errWrtFile } = writeToFiles(directory, 'requirement.txt', reqContent));
		if (!respMsg) throw errWrtFile;

		// get the content between first occurence of "from" and last occurence of 'app.run()';
		const regexApp = /from[\s\S]*?```/;
		const matchApp = genCode.match(regexApp);

		if (matchApp) {
			appCode = matchApp[0];
		}

		if (appCode.includes('app.run')) {
			console.log('appCode has run..');
		} else {
			const regexApp = /```[\s\S]*?```[\s\S]*?```([\s\S]*?)```/;
			const appCodeMatch = genCode.match(regexApp);
			if (appCodeMatch) {
				appCode = appCode + '\n' + appCodeMatch[0];
			}
			appCode = appCode + '\n' + 'if __name__ == "__main__":' + '\n' + '\t' + 'app.run()';
		}

		if (!appCode) {
			// if regex fail , paste the whole code in app.py file
			appCode = genCode;
		}
		appCode = appCode.replace('```', '');
		// chatgpt missing app.run() sometimes , adding manually if not found
		/* if(!appCode.includes("app.run")){
            appCode = appCode+"\nif __name__ == '__main__':\n    app.run(debug=True)";
        } */
		({ respMsg, errWrtFile } = writeToFiles(directory, 'app.py', appCode));
		if (!respMsg) throw errWrtFile;

		let responseMsg = 'success';
		return { responseMsg };
	} catch (errAssrtFile) {
		console.log('errAssrtFile : ', errAssrtFile);
		return { errAssrtFile };
	}
}

/** code to arrange generated code into files - latest (only python - SQL:RDBMS) */
async function assortIntoFilesModules(projectId, genCode, codegenDb, reqData, prompt) {
	try {
		let directory = process.env.DIRECTORY_LOCATION + '/' + projectId + '/pythoncode';
		let reqContent;
		let appCode;
		let matchApp;
		let defEnvContent, defReqContent;
		let finalModelCode, modelCode, modelsCode;
		const defReqMSSQL =
			'Flask==2.0.1 \nSQLAlchemy==1.4.20 \npymssql==2.2.1 \npython-decouple==3.4';
		const defReqORCL = 'Flask==2.0.1 \ncx_oracle==8.3.0 \npython-decouple==3.4';
		const defReqPostgres =
			'Flask==2.0.1 \nSQLAlchemy==2.0.7 \npython-decouple==3.4 \npsycopg2-binary==2.9.1';
		if (codegenDb == 'mssql') {
			defReqContent = defReqMSSQL; // assign MSSQL requirements
		} else if (codegenDb == 'oracle') {
			defReqContent = defReqORCL; // assign ORACLE requirements
		} else if (codegenDb == 'postgres') {
			defReqContent = defReqPostgres;
		}
		if (
			(codegenDb =
				'mssql' || codegenDb == 'oracle' || codegenDb == 'postgres' || codegenDb == 'mysql')
		) {
			defEnvContent =
				'DB_USER=' +
				reqData.dbUserName +
				'\nDB_PASSWORD=' +
				reqData.dbPassword +
				'\nDB_HOST=' +
				reqData.dbHost +
				'\nDB_PORTNO=' +
				reqData.dbPort +
				'\nDB_NAME=' +
				reqData.dbName +
				'\n';
		}
		console.log('genCode..', genCode);
		const escpCharsMatch = genCode.match(/\\"/g);
		if (escpCharsMatch) {
			console.log('removing quote-escapechars');
			genCode = genCode.replace(/\\"/g, '"');
		}
		const regExNCSection = /[rR]equirements.*?\n(.+)/s;
		const dataNCSection = genCode.match(regExNCSection);
		if (dataNCSection) {
			console.log('found requirements');
			reqContent = dataNCSection[1];
		} else {
			reqContent = defReqContent;
		}

		//if req occurs first
		if (reqContent.includes('@app')) {
			console.log('found requirements b4 @app');
			let regexApp = /from[\s\S]*?```/; //get all content b/w from and first occ. of ```
			matchApp = genCode.match(regexApp);
			if (matchApp) {
				console.log('found code between from and next first occurence of ```');
				appCode = matchApp[0];
			}
			if (appCode.includes('class') && !appCode.includes('@app')) {
				console.log('found class only and not @app');
				let mdlCode = appCode;
				genCode = genCode.replace(appCode, '');
				regexApp = /from[\s\S]*?```/;
				matchApp = genCode.match(regexApp);
				if (matchApp) {
					appCode = matchApp[0];
				}
				appCode = mdlCode + '\n' + appCode;
				//appCode = appCode.replaceAll("```","");
				appCode = appCode.replace(/```/g, '');
			} else {
				console.log('found only @app');
				//appCode = appCode.replaceAll("```","");
				appCode = appCode.replace(/```/g, '');
			}
		} else {
			//if req occurs last
			console.log('found requirements at the end');
			if (genCode.includes('from models import')) {
				//if code has "from models import" statement indication that model classes are generated separately
				console.log('found models import sttmt');
				appCode = genCode;

				if (appCode.indexOf('app.py') > appCode.indexOf('model.py')) {
					console.log('found models before app.py - rearragning');
					regExMatchApppy = /(?=app.py:)[\s\S]*(?=(?:[rR]equirements))/gm;
					dataMatchApppy = appCode.match(regExMatchApppy);
					tempAppCode = dataMatchApppy[0];
					appCode = appCode.replace(dataMatchApppy[0], '');
					appCode = tempAppCode + '\n' + appCode;
				}

				if (appCode.includes('app.py')) {
					// if there is app.py text replace it and also correct any bad indentations
					console.log('found app.py and removing');
					dataLabel1 = appCode.match(/(app.py*.*)/gm);
					appCode = appCode.replace(dataLabel1[0], '');
					const correctedCode = appCode.replace(/^\s+/gm, (match) => {
						return match.replace(/\t/g, '    ');
					});

					appCode = correctedCode;
				}

				if (appCode.includes('models.py')) {
					// check for models.py and then parse the content
					console.log('found models.py');
					dataLabel1 = appCode.match(/(models.py*.*)/gm);
					modelsCode = appCode.split(dataLabel1);
					appCode = modelsCode[0];
					modelCode = modelsCode[1];
					console.log('modelCode..', modelCode);
					if (modelCode.includes('requirements.txt')) {
						// if requirements exist after models.py pick content b/w from and requirements
						console.log('found requirements after models.py');
						modelCode = modelCode.match(/(from)[\s\S]*?(?=(?:[rR]equirements|```))/gm);
						finalModelCode = modelCode[0].replace(/```.*/g, '');
						console.log('extracted model content b/w from and requirements');
					} else {
						finalModelCode = modelCode.replace(/```.*/g, ''); // no requirements after models.py pick everything after models.py
						console.log('extracted model content after models.py');
					}

					let { respMsg, errWrtFile } = writeToFiles(
						directory,
						'models.py',
						finalModelCode
					); // write it to models.py file
					if (!respMsg) throw errWrtFile;
				} else {
					// no models.py doesnt exist in the generated code - so generate model code
					const { gencode, error } = await modelCodeGenerator(projectId, prompt);
					console.log('generating model code and generating a models.py');
					if (!gencode) throw error;
					finalModelCode = gencode;
					if (
						appCode.includes('requirements.txt') ||
						appCode.includes('Requirements.txt') ||
						appCode.includes('requirements')
					) {
						// if requirements exist after models.py pick content b/w from and requirements
						console.log('found requirements after app.py');
						appCode = appCode.match(/(from)[\s\S]*?(?=(?:[rR]equirements|```))/gm);
						console.log('removed requirements and its content at the end');
						appCode = appCode[0];
					}
				}
				appCode = appCode.replace(/```.*/g, '');
			} else {
				// Models are nt generated seperately
				console.log('model classes are in the code ');

				genCode = genCode.replace(reqContent, '');
				let dlmtrOccrnce = (genCode.match(/```/g) || []).length;
				if (dlmtrOccrnce === 2) {
					// check for delimiters, if they are 2: pick content b/w from and next first occurence of ``` as appcode
					console.log(
						'found 2 delimiters - extracting content b/w from and next 1st occurence of ```'
					);
					const regexApp = /from[\s\S]*?```/;
					matchApp = genCode.match(regexApp);
					if (matchApp) {
						appCode = matchApp[0];
					} else {
						appCode = genCode;
					}
					//appCode = appCode.replaceAll("```","");
					appCode = appCode.replace(/```/g, '');
				} else if (dlmtrOccrnce === 1) {
					// check for delimiters, if only 1: pick content b/w from and requirements.txt as appcode
					console.log(
						'found 1 delimiter - extracting content b/w from and next 1st occurence of requirements.txt'
					);
					const regexApp = /from[\s\S]*?[rR]equirements/;
					matchApp = genCode.match(regexApp);
					if (matchApp) {
						appCode = matchApp[0];
					} else {
						appCode = genCode;
					}
					//appCode = appCode.replaceAll("```","");
					appCode = appCode.replace(/```/g, '');
				} else if (dlmtrOccrnce === 0) {
					// check for delimiters, if none : pick content b/w from and app.run
					console.log(
						'found no delimiters - extracting content b/w from and next 1st occurence of app.run'
					);
					const regexApp = /from[\s\S]*?app.run/;
					matchApp = genCode.match(regexApp);
					if (matchApp) {
						appCode = matchApp[0];
					} else {
						appCode = genCode;
					}
				}

				//delete models.py
				let { respMsg, errDeleteFile } = await deleteFile(directory, 'models.py');
			}
		}
		reqContent = reqContent.replace(/```/g, '');
		if (!reqContent.includes('=')) {
			console.log(
				'requirements from gen code doesnt have = : indicating no version for the lib to be installed'
			);
			reqContent = defReqContent;
		} else {
			console.log('no. of pkgs in default ', defReqPostgres.split('\n').length);
			console.log(
				'no. of pkgs in requirements from gen code, ',
				reqContent.split('\n').length
			);
			if (defReqPostgres.split('\n').length == reqContent.split('\n').length) {
			} else {
				console.log('requirements from gen code doesnt match with default');
				reqContent = defReqContent;
			}
		}
		let { respMsg, errWrtFile } = writeToFiles(directory, 'requirement.txt', reqContent);
		if (!respMsg) throw errWrtFile;

		if (appCode.includes('app.run')) {
			console.log('appCode has run..');
		} else {
			appCode = appCode + '\n' + 'if __name__ == "__main__":' + '\n' + '\t' + 'app.run()';
		}

		let { finalappCode, errReplaceErr } = replaceDBParams(
			appCode,
			codegenDb,
			directory,
			prompt
		);
		if (!finalappCode) throw errReplaceErr;

		//({finalappCode, errReplaceCustErr}) = replaceCustomCode(finalappCode, reqData, directory)
		//if (!finalappCode) throw errReplaceCustErr;

		({ respMsg, errWrtFile } = writeToFiles(directory, 'app.py', finalappCode));
		if (!respMsg) throw errWrtFile;

		({ respMsg, errWrtFile } = writeToFiles(directory, '.env', defEnvContent));
		if (!respMsg) throw errWrtFile;

		let responseMsg = 'success';
		return { responseMsg };
	} catch (errAssrtFile) {
		console.log('errAssrtFile : ', errAssrtFile);
		return { errAssrtFile };
	}
}

/** code to replace db parameters in the generated code - SQL:RDBMS*/
function replaceDBParams(appCode, codegenDb, directory, prompt) {
	try {
		let finalDBConn;
		let finalappCode;
		let regexDBConfig;
		let dataDBConfig;
		let defLoadPwd;
		console.log('appCode..', appCode);
		defLoadPwd =
			"csPasswd = config('DB_PASSWORD') \nencoded_passwd = urllib.parse.quote_plus(csPasswd)";
		//defEnvDBConfig = "'mssql+pymssql://"+reqData.dbUserName+":"+reqData.dbPassword+"@"+reqData.dbHost+":"+reqData.dbPort+"/"+reqData.dbName + "'"
		if (codegenDb == 'mssql' || codegenDb === 'mysql') {
			defEnvDBConfig =
				"f\"mssql+pymssql://{config('DB_USER')}:{encoded_passwd}@{config('DB_HOST')}:{config('DB_PORTNO')}/{config('DB_NAME')}\"";
		} else if (codegenDb === 'postgres') {
			defEnvDBConfig =
				"f\"postgresql://{config('DB_USER')}:{encoded_passwd}@{config('DB_HOST')}:{config('DB_PORTNO')}/{config('DB_NAME')}\"";
		} else if (codegenDb == 'oracle') {
			defEnvDBConfig =
				"dsn_tns = cx_Oracle.makedsn(config('DB_HOST'), config('DB_PORTNO'), service_name=config('DB_NAME')) \nconn = cx_Oracle.connect(user=config('DB_USER'), password=encoded_passwd, dsn=dsn_tns) \ncur = conn.cursor()";
		} else if (codegenDb == 'mongo') {
			//defEnvDBConfig = defEnvDBConfig.replace("mssql+pymssql","mongodb") + "\+\"?authSource=admin&readPreference=primary&directConnection=true&ssl=false\"";
			defEnvDBConfig =
				"mongodb://{config('DB_USER')}:{encoded_passwd}@{config('DB_HOST')}:{config('DB_PORTNO')}/?authSource=admin&readPreference=primary&directConnection=true&ssl=false";
		}
		appCode = '\n' + 'import urllib' + '\nfrom decouple import config \n' + appCode;

		if (codegenDb == 'mssql' || codegenDb == 'mysql') {
			if (appCode.includes('app.config[')) {
				regexDBConfig = /^(.*app\.config\[\S*\].*pymssql.*)$/gm;
				dataDBConfig = appCode.match(regexDBConfig);
				if (dataDBConfig) {
					dbconfig = dataDBConfig[0];
					finalDBConn = dbconfig.split('=')[0] + ' = ' + defEnvDBConfig;
					appCode = appCode.replace(dbconfig, finalDBConn);
				}
			} else if (appCode.includes('pymssql.connect')) {
			}
			if (appCode.includes('create_engine')) {
				regexDBConfig = /^(.*create\_engine\(\S*.*\).*)$/gm;
				dataDBConfig = appCode.match(regexDBConfig);
				if (dataDBConfig) {
					dbconfig = dataDBConfig[0];
					finalDBConn =
						dbconfig.split('=')[0] + ' = ' + 'create_engine(' + defEnvDBConfig + ')';
					appCode = appCode.replace(dbconfig, finalDBConn);
				}
			}
		} else if (codegenDb == 'postgres') {
			if (appCode.includes('create_engine')) {
				regexDBConfig = /^(.*create\_engine\(\S*.*\).*)$/gm;
				dataDBConfig = appCode.match(regexDBConfig);
				if (dataDBConfig) {
					dbconfig = dataDBConfig[0];
					finalDBConn =
						dbconfig.split('=')[0] + ' = ' + 'create_engine(' + defEnvDBConfig + ')';
					appCode = appCode.replace(dbconfig, finalDBConn);
				}
				//anything extra in b/w create_enginer and DatabaseConfiguration comment to be cleared out
				if (
					appCode.indexOf('create_engine') > appCode.indexOf('# Database Configuration')
				) {
					regexextracnfg =
						/(?=# Database Configuration)[\s\S]*(?=\n[^\n]*create_engine)/g;
					dbextracnfg = appCode.match(regexextracnfg);
					if (dbextracnfg) {
						appCode = appCode.replace(dbextracnfg[0], '');
					}
				}
			}
		} else if (codegenDb == 'oracle') {
			if (appCode.toLowerCase().includes('cx_oracle')) {
				//regexDBConfig = /^(.*cx_Oracle*.*\(\S*.*\))$/gm
				//regexDBConfig = /(?<=__name__\)\n)[\s\S]*?(?=\n@app)/g
				regexDBConfig = /(?<=__name__\)\n)[\s\S]*?(?=\n(?:@app|class))/g;
				dataDBConfig = appCode.match(regexDBConfig);
				console.log('dataDBConfig..', dataDBConfig);
				if (dataDBConfig) {
					if (dataDBConfig[0].includes('def ')) {
						regexDBconfigFunc = /(?<=\(\)\:)[\s\S]*?(?=return)/g;
						dataDBconfigFunc = dataDBConfig[0].match(regexDBconfigFunc);
						defEnvDBConfig = defEnvDBConfig.replace(
							'conn = ',
							dataDBconfigFunc[0].split('=')[0]
						);

						appCode = appCode.replace(dataDBconfigFunc[0], defEnvDBConfig);
					} else {
						if (dataDBConfig[0].includes('\n')) {
							listDBConfig = dataDBConfig[0].split(/\n/);
							let connKey, tnskey;
							for (let i = 0; i < listDBConfig.length; i++) {
								console.log('listDBConfig..', listDBConfig[i]);
								if (listDBConfig[i].includes('makedsn')) {
									tnskey = listDBConfig[i].split('=')[0];
									defEnvDBConfig = defEnvDBConfig.replace('dsn_tns', tnskey);
								}
								if (listDBConfig[i].includes('connect(')) {
									connKey = listDBConfig[i].split('=')[0].trim();
									console.log('connKey..', connKey);
									defEnvDBConfig = defEnvDBConfig
										.replace('conn ', connKey)
										.replace('dsn_tns', tnskey);
								}
								if (listDBConfig[i].includes('.cursor')) {
									defEnvDBConfig = defEnvDBConfig
										.replace('cur ', listDBConfig[i].split('=')[0])
										.replace('conn.', connKey + '.');
								}
							}
						}
						appCode = appCode.replace(dataDBConfig[0], defEnvDBConfig);
					}
				}
			}
		}

		if (appCode.includes('Flask(__name__)')) {
			regexFlaskName = /^(.*Flask\(__name__\)*)$/gm;
			dataFlaskName = appCode.match(regexFlaskName);
			if (dataFlaskName) {
				const newImport = dataFlaskName[0] + '\n' + defLoadPwd + '\n';
				appCode = appCode.replace(dataFlaskName[0], newImport);
			} else {
				appCode = appCode;
			}
		}

		finalappCode = appCode;
		return { finalappCode };
	} catch (errReplaceErr) {
		console.log('errReplaceErr : ', errReplaceErr);
		return { errReplaceErr };
	}
}

function replaceCustomCode(appCode, reqData, directory) {
	regexCCode = /^(.*relationship\(\S*.*\).*)$/gm;
	dataCCdode = appCode.match(regexCCode);
}
/** code to write the final version of generated code into files */
let writeToFiles = (directory, file, code) => {
	let respMsg;
	code = code ? code : 'UTG';
	try {
		if (!fs.existsSync(directory)) {
			fs.mkdirSync(directory, { recursive: true });
		}

		fs.writeFile(directory + '/' + file, code, (err) => {
			if (err) {
				console.log('error while writing code to files' + err);
				throw new Error('error while creating code files' + file);
			}
		});
		respMsg = 'filesCreated';
		return { respMsg };
	} catch (errWrtFile) {
		//return res.status(500).json({message:"Error while writing into file"});
		return { errWrtFile };
	}
};

let deleteFile = async (directory, file) => {
	let respMsg;
	const filePath = directory + '/' + file;
	try {
		if (fs.existsSync(filePath)) {
			fs.unlink(filePath, (err) => {
				if (err) {
					console.error(err);
					return;
				}
				console.log(`File ${filePath} has been deleted`);
			});
			respMsg = 'filesDeleted';
		} else {
			console.log(`File ${filePath} does not exist`);
			respMsg = 'NothingToDelete';
		}
		return { respMsg };
	} catch (errDeleteFile) {
		return { errDeleteFile };
	}
};

/** code to call diff functions to generate code and arrange into files (only python - SQL:RDBMS) */
async function codeGenpython(projectId, codegenLang, codegenDb, reqData) {
	try {
		//let responseMsg, errAssrtFile, CHAT_GPT_ERROR, errCodeGenV2;
		let finalResponseMsg;
		const { prompt, errMdlPrmpt } = await modelPromptController(
			projectId,
			codegenLang,
			codegenDb
		);
		if (!prompt) throw errMdlPrmpt;
		console.log('received prompt for model');
		//console.log("prompt: ", prompt)
		const { finalprompt, errODPrmpt } = await ODPromptController(
			projectId,
			codegenLang,
			codegenDb
		);
		if (!finalprompt) throw errODPrmpt;
		//console.log("finalprompt: ", finalprompt)
		//console.log("prompt,,", prompt)
		console.log('received prompt for controller');
		const encoding = encoding_for_model('gpt-3.5-turbo');
		const modelTokens = encoding.encode(prompt).length;
		const opDataTokens = encoding.encode(finalprompt).length;
		const totalTokens = modelTokens + opDataTokens;
		console.log('total tokens : ', totalTokens);
		encoding.free();
		if (totalTokens <= 2048) {
			const { gencode, errODCdPrmpt } = await ODCodeGenerator(
				projectId,
				codegenLang,
				finalprompt,
				prompt
			);
			if (!gencode) throw errODCdPrmpt;
			console.log('received cd for app - V1');
			//console.log("gencode: ", gencode)
			//const {responseMsg, errAssrtFile , CHAT_GPT_ERROR} = await assortIntoFiles(projectId, gencode, codegenDb, reqData);
			let { responseMsg, errAssrtFile } = await assortIntoFilesModules(
				projectId,
				gencode,
				codegenDb,
				reqData,
				prompt
			);
			//if(CHAT_GPT_ERROR=="UNEXPECTED_CHATGPT_RESPONSE") throw CHAT_GPT_ERROR;
			if (!responseMsg) throw errAssrtFile;
			console.log('files generated');
			finalResponseMsg = responseMsg;
		} else {
			console.log('received cd for app - V2');
			let { responseMsg, errCodeGenV2 } = await genPythonCodegenV2(
				projectId,
				reqData,
				codegenLang,
				codegenDb
			);
			if (!responseMsg) throw errCodeGenV2;
			console.log('files generated', responseMsg);
			finalResponseMsg = responseMsg;
		}

		await Projects.updateOne({ projectId }, { $set: { pythoncodegen: true } });
		return { finalResponseMsg };
	} catch (errCodeGen) {
		console.log('errCodeGen : ', errCodeGen);
		return { errCodeGen };
	}
}
/** code to call diff functions to generate code and arrange into files (only python - SQL:RDBMS) */
async function codeGenpythonV1(projectId, codegenLang, codegenDb, reqData) {
	try {
		const { prompt, errMdlPrmpt } = await modelPromptController(
			projectId,
			codegenLang,
			codegenDb
		);
		if (!prompt) throw errMdlPrmpt;
		console.log('received prompt for model');
		//console.log("prompt: ", prompt)
		const { finalprompt, errODPrmpt } = await ODPromptController(
			projectId,
			codegenLang,
			codegenDb
		);
		if (!finalprompt) throw errODPrmpt;
		//console.log("finalprompt: ", finalprompt)
		//console.log("prompt,,", prompt)
		console.log('received prompt for controller');
		const encoding = encoding_for_model('gpt-3.5-turbo');
		const modelTokens = encoding.encode(prompt).length;
		const opDataTokens = encoding.encode(finalprompt).length;
		const totalTokens = modelTokens + opDataTokens;
		console.log('total tokens : ', totalTokens);
		encoding.free();
		const { gencode, errODCdPrmpt } = await ODCodeGenerator(
			projectId,
			codegenLang,
			finalprompt,
			prompt
		);
		if (!gencode) throw errODCdPrmpt;
		console.log('received cd for app');
		//console.log("gencode: ", gencode)
		//const {responseMsg, errAssrtFile , CHAT_GPT_ERROR} = await assortIntoFiles(projectId, gencode, codegenDb, reqData);
		const { responseMsg, errAssrtFile, CHAT_GPT_ERROR } = await assortIntoFilesModules(
			projectId,
			gencode,
			codegenDb,
			reqData,
			prompt
		);
		if (CHAT_GPT_ERROR == 'UNEXPECTED_CHATGPT_RESPONSE') throw CHAT_GPT_ERROR;
		if (!responseMsg) throw errAssrtFile;
		console.log('files generated');

		await Projects.updateOne({ projectId }, { $set: { pythoncodegen: true } });
		return { responseMsg };
	} catch (errCodeGen) {
		console.log('errCodeGen : ', errCodeGen);
		return { errCodeGen };
	}
}

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

let tablesData = async (projectId) => {
	try {
		if (!projectId) {
			throw new Error('ProjectId is missing..');
		}
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
				let modifiedAttributes = getNoSQLAttributes(item.attributes, item.collection, '');
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
			return mongoCollectionData;
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
				let modifiedAttributes = modify(item.attributes, item.table, item.key);
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
			return tableData;
		}
	} catch (err) {
		return err;
	}
};

/** code to generate prompt for table models - NOSQL:MONGO */
async function genPyMongoModelPrompt(projectId, codegenLang) {
	let prompt;
	try {
		prompt =
			'Write a ' +
			codegenLang +
			' code for model class using flask and pymongo for the following mongoDB collections and documents : ';

		let tblList = await getTablesList(projectId);

		const mongoCollections = await MongoCollections.find(
			{ projectid: projectId },
			{ attributes: 1, collection: 1, relations: 1 }
		).lean();

		let requiredCollections = tblList.tablesList;

		for (let i = 0; i < mongoCollections.length; i++) {
			if (requiredCollections.includes(mongoCollections[i].collection)) {
				let attributes = mongoCollections[i].attributes;
				let documents = Object.keys(attributes);
				prompt +=
					'The ' +
					mongoCollections[i].collection +
					' collection include ' +
					documents.length +
					' documents , they are :';

				for (let j = 0; j < documents.length; j++) {
					let innerDoc = mongoCollections[i].attributes[documents[j]];
					if (innerDoc.ezapi_type == 'array') {
						// get the ezapi_array object
						let arrayType = innerDoc.ezapi_array.ezapi_type;
						// traverseArray(innerDoc);
						if (arrayType != 'object') {
							//prompt+=" (line 1029) "
							prompt +=
								j +
								1 +
								') ' +
								documents[j] +
								' of type array of ' +
								arrayType +
								's. ';
						} else {
							// array of objects case

							let innerNestedDocNames = Object.keys(
								innerDoc.ezapi_array.ezapi_object
							);

							for (let m = 0; m < innerNestedDocNames.length; m++) {
								let nsInnerType =
									innerDoc.ezapi_array.ezapi_object[innerNestedDocNames[m]]
										.ezapi_type;
								//prompt+=" (line 1037) "
								prompt +=
									j +
									1 +
									') ' +
									innerNestedDocNames[m] +
									' of type ' +
									nsInnerType +
									'. ';
							}
						}
					} else if (innerDoc.ezapi_type == 'object') {
						prompt += j + 1 + ') ' + documents[j] + ' of type object and it includes :';
						let innerObjNames = Object.keys(innerDoc.ezapi_object);

						for (let k = 0; k < innerObjNames.length; k++) {
							let type = innerDoc.ezapi_object[innerObjNames[k]].ezapi_type;

							if (type != 'object' && type != 'array') {
								//prompt+=" (line 1048) "
								prompt +=
									j +
									1 +
									'.' +
									(k + 1) +
									') ' +
									innerObjNames[k] +
									' of type ' +
									type +
									'. ';
							} else if (type == 'object') {
								//prompt+=" (line 1052) "
								prompt +=
									j +
									1 +
									'.' +
									(k + 1) +
									') ' +
									innerObjNames[k] +
									' of type ' +
									type +
									' which contains : ';
								let nestedInnerDoc = Object.keys(
									innerDoc.ezapi_object[innerObjNames[k]].ezapi_object
								);

								for (let l = 0; l < nestedInnerDoc.length; l++) {
									let innerType =
										innerDoc.ezapi_object[innerObjNames[k]].ezapi_object[
											nestedInnerDoc[l]
										].ezapi_type;

									if (innerType != 'array' && innerType != 'object') {
										//prompt+=" (line 1059) "
										prompt +=
											j +
											1 +
											'.' +
											(k + 1) +
											'.' +
											(l + 1) +
											') ' +
											nestedInnerDoc[l] +
											' of type ' +
											innerType +
											'. ';
									} else if (innerType == 'object') {
										// nested object logic
										let innerNestedDocNames = Object.keys(
											innerDoc.ezapi_object[innerObjNames[k]].ezapi_object[
												nestedInnerDoc[l]
											].ezapi_object
										);
										for (let m = 0; m < innerNestedDocNames.length; m++) {
											let nsInnerType =
												innerDoc.ezapi_object[innerObjNames[k]]
													.ezapi_object[nestedInnerDoc[l]].ezapi_object
													.innerNestedDocNames[m].ezapi_type;
											//prompt+=" (line 1066) "
											prompt +=
												k +
												1 +
												'.' +
												(j + 1) +
												'.' +
												(l + 1) +
												'.' +
												(m + 1) +
												') ' +
												innerNestedDocNames[m] +
												' of type ' +
												nsInnerType +
												'. ';
										}
									} else {
										// type is array
										//prompt+=" (line 1084) "
										let arrayType =
											innerDoc.ezapi_object[innerObjNames[k]].ezapi_object[
												nestedInnerDoc[l]
											].ezapi_array.ezapi_type;
										prompt +=
											k +
											1 +
											'.' +
											(l + 1) +
											' ' +
											nestedInnerDoc[l] +
											' of type array of ' +
											arrayType;
									}
								}
							}
						}
					} else {
						// oid , date , string , integer etc
						//prompt+=" (line 1077) "
						prompt +=
							j + 1 + ') ' + documents[j] + ' of type ' + innerDoc.ezapi_type + '. ';
					}
				}
			}
		}

		// tables that are used
		// contains required collection
		/*
        let allCollectionDocs = await MongoCollections.find({projectid : projectId});
        console.log("lengthhh",allCollectionDocs.length);
        console.log(allCollectionDocs);
        console.log("requirevcd vollle",requiredCollections)
        for(let i=0;i<allCollectionDocs.length;i++){
            console.log("pppppp")
            console.log(allCollectionDocs[i].collection)
            if(requiredCollections.includes(allCollectionDocs[i].data)){
                console.log("kkkkkkkkkkkkkkkkkk")
                console.log(allCollectionDocs[i].collection)
            }
        }
        */

		/*
                                let collectionCount = 1;
                                let documentCount = 1;
                                for(let i=0;i<tblData.length;i++){

                                    if(requiredCollection.includes(tblData[i].name)){
                                        prompt+=(collectionCount)+") The collection name is "+tblData[i].name+". It has following documents :";
                                        let selColumns = tblData[i].selectedColumns;
                                        
                                        for(let j=0;j<selColumns.length;j++){
                                            prompt+=(collectionCount)+"."+(documentCount)+") "+selColumns[j].name+" of type "+selColumns[j].type+". ";
                                            documentCount++;
                                        }
                                        collectionCount++;
                                        documentCount = 1;
                                    }
                                }
                                */
	} catch (errMdlPrmpt) {
		return { errMdlPrmpt };
	}
	return { prompt };
}

/** code to generate prompt for controllers - NOSQL:MONGO */
async function genPyMongoOpDataPrompt(projectId, codegenLang) {
	let prompt = '',
		opDataPrompt;
	try {
		prompt +=
			'Write a ' +
			codegenLang +
			' code using flask and flask_pymongo using mongoDB as database for the following operations :';

		const docs = await OperationData.find({ projectid: projectId });
		prompt += 'There are ' + docs.length + ' endpoints.';
		for (let i = 0; i < docs.length; i++) {
			prompt += 'The method is ' + docs[i].data.method + ' method.';
			prompt += 'The endpoint is ' + docs[i].data.endpoint + '. ';
			prompt += 'The Request data is as follows :';

			let authorizationUsed = docs[i].data.requestData.authorization.authType;

			if (authorizationUsed !== 'No Auth') {
				prompt += 'The authorization include a ' + authorizationUsed + '.';
			}

			let headersUsed = docs[i].data.requestData.header;

			if (headersUsed && headersUsed.length > 0) {
				prompt += 'There are ' + headersUsed.length + ' headers used.';

				for (let i = 0; i < headersUsed.length; i++) {
					let key = Array.from(headersUsed[i].keys())[i];
					if (key) {
						let name = headersUsed[i].get(key).name ? headersUsed[i].get(key).name : '';
						let type = headersUsed[i].get(key).type ? headersUsed[i].get(key).type : '';
						let format = headersUsed[i].get(key).format
							? headersUsed[i].get(key).format
							: '';
						let required = headersUsed[i].get(key).required
							? headersUsed[i].get(key).required
							: '';

						prompt +=
							'The header is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required header.';
						}
					}
				}
			}

			let pathUsed = docs[i].data.requestData.path;

			if (pathUsed && pathUsed.length > 0) {
				prompt += 'There are ' + pathUsed.length + ' path used.';

				for (let i = 0; i < pathUsed.length; i++) {
					let key = Array.from(pathUsed[i].keys())[i];
					if (key) {
						let name = pathUsed[i].get(key).name ? pathUsed[i].get(key).name : '';
						let type = pathUsed[i].get(key).type ? pathUsed[i].get(key).type : '';
						let format = pathUsed[i].get(key).format ? pathUsed[i].get(key).format : '';
						let required = pathUsed[i].get(key).required
							? pathUsed[i].get(key).required
							: '';

						prompt +=
							'The path is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required path.';
						}
					}
				}
			}

			let queryUsed = docs[i].data.requestData.query;

			if (queryUsed && queryUsed.length > 0) {
				prompt += 'There are ' + queryUsed.length + ' queries used.';

				for (let i = 0; i < queryUsed.length; i++) {
					let key = Array.from(queryUsed[i].keys())[i];
					if (key) {
						let name = queryUsed[i].get(key).name ? queryUsed[i].get(key).name : '';
						let type = queryUsed[i].get(key).type ? queryUsed[i].get(key).type : '';
						let format = queryUsed[i].get(key).format
							? queryUsed[i].get(key).format
							: '';
						let required = queryUsed[i].get(key).required
							? queryUsed[i].get(key).required
							: '';

						prompt +=
							'The query is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required query.';
						}
					}
				}
			}

			let formDataUsed = docs[i].data.requestData.formData;

			if (formDataUsed && formDataUsed.length > 0) {
				prompt += 'There are ' + formDataUsed.length + ' form datas are used.';

				for (let i = 0; i < formDataUsed.length; i++) {
					let key = Array.from(formDataUsed[i].keys())[i];
					if (key) {
						let name = formDataUsed[i].get(key).name
							? formDataUsed[i].get(key).name
							: '';
						let type = formDataUsed[i].get(key).type
							? formDataUsed[i].get(key).type
							: '';
						let format = formDataUsed[i].get(key).format
							? formDataUsed[i].get(key).format
							: '';
						let required = formDataUsed[i].get(key).required
							? formDataUsed[i].get(key).required
							: '';

						prompt +=
							'The query is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required formData.';
						}
					}
				}
			}

			// no request body for GET methods

			if (docs[i].data.method.toLowerCase() != 'get') {
				prompt += ' The request body include :';
				let requestDataHeader;
				if (requestDataHeader && requestDataHeader.length > 0) {
					prompt += 'There are ' + requestDataHeader.length + ' response headers used.';
					for (let i = 0; i < requestDataHeader.length; i++) {
						let key = Array.from(requestDataHeader[i].keys())[i];
						if (key) {
							let name = requestDataHeader[i].get(key).name
								? requestDataHeader[i].get(key).name
								: '';
							let type = requestDataHeader[i].get(key).type
								? requestDataHeader[i].get(key).type
								: '';
							let format = requestDataHeader[i].get(key).format
								? requestDataHeader[i].get(key).format
								: '';
							let required = requestDataHeader[i].get(key).required
								? requestDataHeader[i].get(key).required
								: '';

							prompt +=
								'The header is ' +
								name +
								' with the type ' +
								type +
								' and of format ' +
								format +
								'.';

							if (required) {
								prompt += ' It is a required request header.';
							}
						}
					}
				} // headers end

				// request body starts

				let innerObjects = Object.keys(docs[i].data.requestData.body.properties);

				for (let ib = 0; ib < innerObjects.length; ib++) {
					let documentField =
						docs[i].data.requestData.body.properties[innerObjects[ib]].name;
					let collectionUsed =
						docs[i].data.requestData.body.properties[innerObjects[ib]].key;
					prompt +=
						ib + 1 + ') ' + documentField + ' from ' + collectionUsed + ' collection. ';
				}
			}

			// request data ends here

			// response data
			prompt += ' The response data is as follows : ';
			let ResponseHeadersUsed;
			for (let j = 0; j < docs[i].data.responseData.length; j++) {
				// get staus_code and status message
				prompt +=
					'The status code is ' +
					docs[i].data.responseData[j].status_code +
					' with status message as ' +
					docs[i].data.responseData[j].description +
					'.';
				ResponseHeadersUsed = docs[i].data.responseData[j].headers;
				if (ResponseHeadersUsed && ResponseHeadersUsed.length > 0) {
					prompt += 'There are ' + ResponseHeadersUsed.length + ' response headers used.';
					for (let i = 0; i < ResponseHeadersUsed.length; i++) {
						let key = Array.from(ResponseHeadersUsed[i].keys())[i];
						if (key) {
							let name = ResponseHeadersUsed[i].get(key).name
								? ResponseHeadersUsed[i].get(key).name
								: '';
							let type = ResponseHeadersUsed[i].get(key).type
								? ResponseHeadersUsed[i].get(key).type
								: '';
							let format = ResponseHeadersUsed[i].get(key).format
								? ResponseHeadersUsed[i].get(key).format
								: '';
							let required = ResponseHeadersUsed[i].get(key).required
								? ResponseHeadersUsed[i].get(key).required
								: '';

							prompt +=
								'The header is ' +
								name +
								' with the type ' +
								type +
								' and of format ' +
								format +
								'.';

							if (required) {
								prompt += ' It is a required response header.';
							}
						}
					}
				} // headers end

				// rsponse body starts

				prompt += ' The response body data : ';

				let resInnerObjects = Object.keys(docs[i].data.responseData[j].content.properties);

				for (let ib = 0; ib < resInnerObjects.length; ib++) {
					let documentField =
						docs[i].data.responseData[j].content.properties[resInnerObjects[ib]].name;
					let collectionUsed =
						docs[i].data.responseData[j].content.properties[resInnerObjects[ib]].key;
					prompt +=
						ib + 1 + ') ' + documentField + ' from ' + collectionUsed + ' collection. ';
				}
			} // response data ends
		} // all operations ends

		// Removing filtering logic assuming its not supported for mongoDB

		/*
            
            // Setting filtering conditions
            let tablesRelations = await getTableRelations(projectId);
            let filters = tablesRelations.filters;     
            let filterCount = 1;
            if(filters.length>0){
                // For TPOLICY table under the schema dbo HISTORYFLAG should be equal to 0.
                prompt+=" Consider these filtering conditions for querying : ";
                const tables = filters.reduce((acc, obj) => {
                    const { tableName, ...rest } = obj;
                    if (!acc[tableName]) {
                        acc[tableName] = [];
                    }
                    acc[tableName].push(rest);
                    return acc;
                }, {});
    
                for (const [tableName, attributes] of Object.entries(tables)) {                    
                    let tableSchemaCompleted = false;                    
                    for (const { schemaName, columnName, filterCondition, value } of attributes) {
                        if(attributes.length==1){
                            prompt+=(filterCount)+") "+"For "+tableName+" table "+"under the schema "+schemaName+" "+columnName+" should be "+(filterCondition=="equals"?"equal":filterCondition)+" to "+value+". ";
                            filterCount++;
                        } else {
                            if(!tableSchemaCompleted){
                                prompt+=(filterCount)+") "+"For "+tableName+" table "+"under the schema "+schemaName+" "+columnName+" should be "+(filterCondition=="equals"?"equal":filterCondition)+" to "+value+" ";
                                tableSchemaCompleted = true;
                                filterCount++;
                            }else{
                                prompt+="and "+columnName+" should be "+(filterCondition=="equals"?"equal":filterCondition)+" to "+value+". ";
                            }
                        }                            
                    }
                }
                prompt+=" "+filterCount+") "+"No filter conditions on other tables.";
            }
            // end of filters
            */
		prompt +=
			' Generate a .env to hold all database configuration and use decouple for injecting the environment variables into the code. Generate a requirements.txt for all the python libraries used.';

		opDataPrompt = prompt;
		return { opDataPrompt };
	} catch (errODPrmpt) {
		console.log(errODPrmpt);
		return { errODPrmpt };
	}
}

/** code to call diff functions to generate code and arrange into files (only python - SQL:RDBMS) */
async function generatePyMongoCodeGen(projectId, codegenLang, codegenDb, reqData) {
	try {
		const { prompt, errMdlPrmpt } = await genPyMongoModelPrompt(projectId, codegenLang);
		if (!prompt) throw errMdlPrmpt;
		console.log('python-mongo model prompt done ');
		console.log(prompt);
		const { opDataPrompt, errOpDataPrompt } = await genPyMongoOpDataPrompt(
			projectId,
			codegenLang
		);
		console.log('python-mongo opData prompt done');
		console.log(opDataPrompt);
		if (!opDataPrompt) throw errOpDataPrompt;
		console.log();
		const { gencode, errODCdPrmpt } = await ODCodeGenerator(
			projectId,
			codegenLang,
			opDataPrompt,
			prompt
		);
		console.log(gencode);
		if (!gencode) throw errODCdPrmpt;
		console.log('received cd for app');
		const { responseMsg, errAssrtFile, CHAT_GPT_ERROR } = await assortIntoFiles(
			projectId,
			gencode,
			codegenDb,
			reqData
		);
		if (CHAT_GPT_ERROR == 'UNEXPECTED_CHATGPT_RESPONSE') throw CHAT_GPT_ERROR;
		if (!responseMsg) throw errAssrtFile;
		console.log('files generated');

		await Projects.updateOne({ projectId }, { $set: { pythoncodegen: true } });
		return { responseMsg };
	} catch (errCodeGen) {
		return { errCodeGen };
	}
}

async function genPythonCodegenV2(projectId, reqData, codegenLang, codegenDb) {
	let requiredTables = [];
	let prompt = '';
	//let {codegenDb} = reqData;
	let responseData;
	let modelPrompt;

	let tablesRelations = await getTableRelations(projectId);
	let relations;
	try {
		relations = tablesRelations.relations;
		const chtgptDocs = await ChatGptGenCode.findOne(
			{ projectId: projectId },
			{ chtgptRunId: 1 }
		).sort({ chtgptRunId: -1 });
		let chtgptRunId = chtgptDocs ? chtgptDocs.chtgptRunId + 1 : 1;
		const chtgptRunDoc = await ChatGptGenCode.create({
			projectId: projectId,
			chtgptRunId: chtgptRunId,
			generatedCode: []
		});
		console.log('chtgptRunDoc.chtgptRunId1 ', chtgptRunDoc.chtgptRunId);

		//**code to insert a record into chatgptgencodes */
		const docs = await OperationData.find({ projectid: projectId });
		let noOfOps = docs.length;
		console.log('noOfOps..', noOfOps);
		// looping thru endpoints
		for (let i = 0; i < docs.length; i++) {
			for (let j = 0; j < docs[i].data.responseData.length; j++) {
				let schemaTable = findAttribute(docs[i].data.responseData[j].content, 'key');
				// incase of bikestore , no 'key' attributr found , then search for 'schemaName
				let schemaName;
				if (schemaTable == null) {
					schemaName = findAttribute(docs[i].data.responseData[j].content, 'schemaName');
				}
				// if schema.table(key) is found and if it doesnt exist already in requiredTabele , then add it
				if (schemaTable && !requiredTables.includes(schemaTable)) {
					requiredTables.push(schemaTable);
				}

				if (schemaName && !requiredTables.includes(schemaName)) {
					requiredTables.push(schemaName);
				}

				//console.log("Initial required tables :")
				//console.log(requiredTables);
			}

			for (let r = 0; r < relations.length; r++) {
				let mainTbl = relations[r].mainTableSchema + '.' + relations[r].mainTable;

				// for schema.table name case
				if (mainTbl) {
					if (requiredTables.includes(mainTbl)) {
						let depTbl =
							relations[r].dependentTableSchema + '.' + relations[r].dependentTable;
						if (!requiredTables.includes(depTbl)) {
							requiredTables.push(depTbl);
						}
					}
				}

				// for tablesname only case (bikestore)
				let mainTable = relations[r].mainTable;
				if (mainTable) {
					if (requiredTables.includes(mainTable)) {
						requiredTables.push(relations[r].dependentTable);
					}
				}

				// to traverse second time , needed to get all dependent tables
				if (r == relations.length) {
					r = 0;
				}
			}

			//console.log("All depedent tables (updated):");
			//console.log(requiredTables);

			if (codegenLang.toLowerCase().includes('node')) {
				modelPrompt =
					'Give me a ' +
					codegenLang +
					' code for ORM model class using express and Sequelize with ' +
					codegenDb +
					' as database for the following schemas and tables : ';
			} else if (codegenLang.toLowerCase().includes('python')) {
				modelPrompt =
					'Give me a ' +
					codegenLang +
					' code for ORM model class using flask and sql_alchemy with ' +
					codegenDb +
					' as database for the following schemas and tables : ';
				//modelPrompt = "Write a "+codegenLang+" code for ORM model class using flask and sql_alchemy with appdb as database for the following schemas and tables : ";
			}
			responseData = await tableData(projectId);
			//console.log("responseData...", responseData)
			if (responseData.length == 1 && responseData[0].error) {
				throw new Error(responseData[0].error);
			}
			for (let i = 0; i < responseData.length; i++) {
				// generates for only tables that user dragged and dropped
				if (
					requiredTables.includes(responseData[i].key) ||
					requiredTables.includes(responseData[i].name)
				) {
					modelPrompt +=
						'The table name is ' +
						responseData[i].name +
						' under the schema ' +
						responseData[i].key.split('.')[0] +
						'.';
					let fields = responseData[i].selectedColumns;
					modelPrompt += 'The table has ' + fields.length + ' fields.';
					for (let j = 0; j < fields.length; j++) {
						modelPrompt += 'The table has ' + (j + 1) + '.' + fields[j].name;
						modelPrompt += ' of type ' + fields[j].type;
						modelPrompt += ' of format ' + fields[j].format + '.';
						if (fields[j].keyType === 'primary') {
							modelPrompt += ' which is a primary key. ';
						}
						if (fields[j].foreign) {
							modelPrompt +=
								' which is a foreign key referencing ' +
								fields[j].foreign.column +
								' from ' +
								fields[j].foreign.table +
								' table.';
						}
					}
					modelPrompt += ' Consider another table.';
				}
			}

			// replacing custom types to generic types - mssql
			modelPrompt = modelPrompt.replace(/sql_server_nvarchar/g, 'NVARCHAR');
			modelPrompt = modelPrompt.replace(/sql_server_varchar/g, 'VARCHAR');
			modelPrompt = modelPrompt.replace(/sql_server_char/g, 'CHAR');
			modelPrompt = modelPrompt.replace(/sql_server_nchar/g, 'NCHAR');
			modelPrompt = modelPrompt.replace(/sql_server_geography/g, 'Geography');
			modelPrompt = modelPrompt.replace(/sql_server_uniqueidentifier/g, 'Uniqueidentifier');
			modelPrompt = modelPrompt.replace(/sql_server_hierarchyid/g, 'Hierarchyid');
			modelPrompt = modelPrompt.replace(/sql_server_xml/g, 'XML');
			modelPrompt = modelPrompt.replace(/sql_server_ntext/g, 'ntext');

			// for postgreSQL db
			modelPrompt = modelPrompt.replace(/postgres_character/g, 'character');
			modelPrompt = modelPrompt.replace(/postgres_text/g, 'text');
			modelPrompt = modelPrompt.replace(/postgres_USER-DEFINED/g, 'USER-DEFINED');
			modelPrompt = modelPrompt.replace(/postgres_timestamp/g, 'timestamp');
			modelPrompt = modelPrompt.replace(/postgres_ARRAY/g, 'ARRAY');
			modelPrompt = modelPrompt.replace(/postgres_tsvector/g, 'tsvector');

			let lastIndex = modelPrompt.lastIndexOf('Consider another table.');

			if (lastIndex !== -1) {
				modelPrompt =
					modelPrompt.slice(0, lastIndex) +
					modelPrompt.slice(lastIndex).replace('Consider another table.', '');
			}
			modelPrompt += "Don't give me any comments";

			console.log('Model prompt generated ');
			//console.log(modelPrompt);

			if (codegenLang.toLowerCase().includes('node')) {
				prompt =
					'Give me a ' +
					codegenLang +
					' code using express and Sequelize with ' +
					codegenDb +
					' as database the folowing endpoint : ';
			} else if (codegenLang.toLowerCase().includes('python')) {
				prompt =
					'Give me a ' +
					codegenLang +
					' code using flask and sql_alchemy with ' +
					codegenDb +
					' as database for the folowing endpoint : ';
				//prompt = "Write a "+codegenLang+" code using flask and sql_alchemy with appdb as database for app.py file with the following data : ";
			}
			let methodName = docs[i].data.method;
			let endPoint = docs[i].data.endpoint;
			// prompt is operational data prompt
			prompt += 'The method is ' + docs[i].data.method + ' method.';
			prompt += 'The endpoint is ' + docs[i].data.endpoint + '. ';
			prompt += 'The Request data is as follows :';

			let authorizationUsed = docs[i].data.requestData.authorization.authType;

			if (authorizationUsed !== 'No Auth') {
				prompt += 'The authorization include a ' + authorizationUsed + '.';
			}

			let headersUsed = docs[i].data.requestData.header;

			if (headersUsed && headersUsed.length > 0) {
				prompt += 'There are ' + headersUsed.length + ' headers used.';

				for (let i = 0; i < headersUsed.length; i++) {
					let key = Array.from(headersUsed[i].keys())[i];
					if (key) {
						let name = headersUsed[i].get(key).name ? headersUsed[i].get(key).name : '';
						let type = headersUsed[i].get(key).type ? headersUsed[i].get(key).type : '';
						let format = headersUsed[i].get(key).format
							? headersUsed[i].get(key).format
							: '';
						let required = headersUsed[i].get(key).required
							? headersUsed[i].get(key).required
							: '';

						prompt +=
							'The header is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required header.';
						}
					}
				}
			}

			let pathUsed = docs[i].data.requestData.path;

			if (pathUsed && pathUsed.length > 0) {
				prompt += 'There are ' + pathUsed.length + ' path used.';

				for (let i = 0; i < pathUsed.length; i++) {
					let key = Array.from(pathUsed[i].keys())[i];
					if (key) {
						let name = pathUsed[i].get(key).name ? pathUsed[i].get(key).name : '';
						let type = pathUsed[i].get(key).type ? pathUsed[i].get(key).type : '';
						let format = pathUsed[i].get(key).format ? pathUsed[i].get(key).format : '';
						let required = pathUsed[i].get(key).required
							? pathUsed[i].get(key).required
							: '';

						prompt +=
							'The path is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required path.';
						}
					}
				}
			}

			let queryUsed = docs[i].data.requestData.query;

			if (queryUsed && queryUsed.length > 0) {
				prompt += 'There are ' + queryUsed.length + ' queries used.';

				for (let i = 0; i < queryUsed.length; i++) {
					let key = Array.from(queryUsed[i].keys())[i];
					if (key) {
						let name = queryUsed[i].get(key).name ? queryUsed[i].get(key).name : '';
						let type = queryUsed[i].get(key).type ? queryUsed[i].get(key).type : '';
						let format = queryUsed[i].get(key).format
							? queryUsed[i].get(key).format
							: '';
						let required = queryUsed[i].get(key).required
							? queryUsed[i].get(key).required
							: '';

						prompt +=
							'The query is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required query.';
						}
					}
				}
			}

			let formDataUsed = docs[i].data.requestData.formData;

			if (formDataUsed && formDataUsed.length > 0) {
				prompt += 'There are ' + formDataUsed.length + ' form datas are used.';

				for (let i = 0; i < formDataUsed.length; i++) {
					let key = Array.from(formDataUsed[i].keys())[i];
					if (key) {
						let name = formDataUsed[i].get(key).name
							? formDataUsed[i].get(key).name
							: '';
						let type = formDataUsed[i].get(key).type
							? formDataUsed[i].get(key).type
							: '';
						let format = formDataUsed[i].get(key).format
							? formDataUsed[i].get(key).format
							: '';
						let required = formDataUsed[i].get(key).required
							? formDataUsed[i].get(key).required
							: '';

						prompt +=
							'The query is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required formData.';
						}
					}
				}
			}

			// no request body for GET methods

			if (docs[i].data.method.toLowerCase() != 'get') {
				prompt += ' The request body include :';
				let requestDataHeader;
				if (requestDataHeader && requestDataHeader.length > 0) {
					prompt += 'There are ' + requestDataHeader.length + ' response headers used.';
					for (let i = 0; i < requestDataHeader.length; i++) {
						let key = Array.from(requestDataHeader[i].keys())[i];
						if (key) {
							let name = requestDataHeader[i].get(key).name
								? requestDataHeader[i].get(key).name
								: '';
							let type = requestDataHeader[i].get(key).type
								? requestDataHeader[i].get(key).type
								: '';
							let format = requestDataHeader[i].get(key).format
								? requestDataHeader[i].get(key).format
								: '';
							let required = requestDataHeader[i].get(key).required
								? requestDataHeader[i].get(key).required
								: '';

							prompt +=
								'The header is ' +
								name +
								' with the type ' +
								type +
								' and of format ' +
								format +
								'.';

							if (required) {
								prompt += ' It is a required request header.';
							}
						}
					}
				} // headers end

				// request body starts
				let innerObjectNames;
				let requestBodyExist = true;
				try {
					innerObjectNames = Object.keys(docs[i].data.requestData.body.properties);
				} catch (e) {
					requestBodyExist = false;
				}
				if (requestBodyExist) {
					for (let ib = 0; ib < innerObjectNames.length; ib++) {
						let innerObject =
							docs[i].data.requestData.body.properties[innerObjectNames[ib]];
						if (innerObject.type == 'arrayOfObjects') {
							prompt += 'The JSON attribute include : ';
							prompt += '' + (ib + 1) + ') ';
							let propertiesObject = innerObject.items.properties;
							const innerObjectNames = Object.keys(propertiesObject);
							for (let ion = 0; ion < innerObjectNames.length; ion++) {
								//prompt+=""+(ib+1)+"."+(ion+1)+")";  // nesting variables
								if (propertiesObject[innerObjectNames[ion]].type == 'ezapi_table') {
									// get the selected column
									try {
										selectedColumnsData = findSelectedColumns(
											docs[i].data.requestData.body
										);
									} catch (e) {
										// no selected columns data , continue
									}

									prompt += 'The ' + innerObject.name;
									if (selectedColumnsData) {
										prompt += ' as an array and it contains : ';
										prompt += '' + (ib + 1) + '.' + (ion + 1) + ')';
										prompt +=
											innerObjectNames[ion] +
											' as object and contains ' +
											selectedColumnsData.length +
											' fields :';

										for (let k = 0; k < selectedColumnsData.length; k++) {
											let name = selectedColumnsData[k].name;
											let table = selectedColumnsData[k].key;
											prompt +=
												ib +
												1 +
												'.' +
												(ion + 1) +
												'.' +
												(k + 1) +
												')' +
												name +
												' from ' +
												table;
										}
									}
								} else {
									let innerObject = propertiesObject[innerObjectNames[ion]];
									let name = innerObject.name;
									let column = innerObject.sourceName;
									let table = innerObject.key; // schema included here
									prompt +=
										name +
										' from ' +
										column +
										' field of ' +
										table +
										' table as ' +
										innerObjectNames[ion] +
										'.';
								}
							}
						} else {
							if (innerObject.type === 'ezapi_table') {
								//console.log("unhandled. table structure") //code to be written
								let sourceName = innerObject.sourceName;
								selectedColumnsData = findSelectedColumns(innerObject);

								prompt += '1) The ' + sourceName;

								if (selectedColumnsData) {
									prompt += ' as an object and it contains : ';
									for (let k = 0; k < selectedColumnsData.length; k++) {
										let name = selectedColumnsData[k].name;
										let table = selectedColumnsData[k].key;
										prompt +=
											'1.' + (k + 1) + ') ' + name + ' from ' + table + '. ';
									}
								}
							} else {
								prompt += '' + (ib + 1) + ') '; // nesting variables
								let name = innerObject.name;
								let column = innerObject.sourceName;
								let table = innerObject.key; // schema included here
								prompt +=
									' ' +
									name +
									' from ' +
									column +
									' field of ' +
									table +
									' table.';
							}
						}
					}
				} else {
					// only one array or object exist
					let type = docs[i].data.requestData.body.type;
					if (type === 'ezapi_table') {
						// get the selected column
						let sourceName = docs[i].data.requestData.body.sourceName;
						// get the selected column
						selectedColumnsData = findSelectedColumns(docs[i].data.requestData.body);

						prompt += '1) The ' + sourceName;

						if (selectedColumnsData) {
							prompt += ' as an object and it contains : ';
							for (let k = 0; k < selectedColumnsData.length; k++) {
								let name = selectedColumnsData[k].name;
								let table = selectedColumnsData[k].key;
								prompt += '1.' + (k + 1) + ') ' + name + ' from ' + table + '. ';
							}
						}
					} else {
						let name = docs[i].data.requestData.body.name;
						let column = docs[i].data.requestData.body.sourceName;
						let table = docs[i].data.requestData.body.key; // schema included here
						prompt += '1) ';
						prompt += name + ' from ' + column + ' field of ' + table + ' table. ';
					}
				}
			}

			// request data ends here

			// response data
			prompt += ' The response data is as follows : ';
			let ResponseHeadersUsed;
			for (let j = 0; j < docs[i].data.responseData.length; j++) {
				// get staus_code and status message
				prompt +=
					'The status code is ' +
					docs[i].data.responseData[j].status_code +
					' with status message as ' +
					docs[i].data.responseData[j].description +
					'.';
				ResponseHeadersUsed = docs[i].data.responseData[j].headers;
				if (ResponseHeadersUsed && ResponseHeadersUsed.length > 0) {
					prompt += 'There are ' + ResponseHeadersUsed.length + ' response headers used.';
					for (let i = 0; i < ResponseHeadersUsed.length; i++) {
						let key = Array.from(ResponseHeadersUsed[i].keys())[i];
						if (key) {
							let name = ResponseHeadersUsed[i].get(key).name
								? ResponseHeadersUsed[i].get(key).name
								: '';
							let type = ResponseHeadersUsed[i].get(key).type
								? ResponseHeadersUsed[i].get(key).type
								: '';
							let format = ResponseHeadersUsed[i].get(key).format
								? ResponseHeadersUsed[i].get(key).format
								: '';
							let required = ResponseHeadersUsed[i].get(key).required
								? ResponseHeadersUsed[i].get(key).required
								: '';

							prompt +=
								'The header is ' +
								name +
								' with the type ' +
								type +
								' and of format ' +
								format +
								'.';

							if (required) {
								prompt += ' It is a required response header.';
							}
						}
					}
				} // headers end

				// rsponse body starts

				function findSelectedColumns(obj) {
					if (Array.isArray(obj)) {
						// If obj is an array, recursively call this function for each item in the array
						for (let i = 0; i < obj.length; i++) {
							const result = findSelectedColumns(obj[i]);
							if (result) {
								return result;
							}
						}
					} else if (typeof obj === 'object' && obj !== null) {
						// If obj is an object, recursively call this function for each property of the object
						for (const prop in obj) {
							if (prop === 'selectedColumns') {
								// If the property name is 'selectedCoulmns', return the value
								return obj[prop];
							} else {
								const result = findSelectedColumns(obj[prop]);
								if (result) {
									return result;
								}
							}
						}
					}
					// If 'selectedCoulmns' is not found, return null
					return null;
				}

				prompt += ' The response body data : ';
				let innerObjectNames;
				if (
					docs[i].data.responseData[j].content &&
					docs[i].data.responseData[j].content.properties
				) {
					innerObjectNames = Object.keys(docs[i].data.responseData[j].content.properties);
				}

				if (innerObjectNames) {
					for (let ib = 0; ib < innerObjectNames.length; ib++) {
						let innerObject =
							docs[i].data.responseData[j].content.properties[innerObjectNames[ib]];
						if (innerObject.type == 'arrayOfObjects' || innerObject.type == 'object') {
							prompt += 'The JSON attribute include : ';
							prompt += '' + (ib + 1) + ') ';
							let propertiesObject;
							propertiesObject = innerObject.items.properties;

							if (typeof propertiesObject == 'undefined') {
								propertiesObject = innerObject.properties;
							}

							const innerObjectNames = Object.keys(propertiesObject);

							for (let ion = 0; ion < innerObjectNames.length; ion++) {
								if (propertiesObject[innerObjectNames[ion]].type == 'ezapi_table') {
									// get the selected column
									try {
										selectedColumnsData = findSelectedColumns(
											docs[i].data.responseData[j].content
										);
									} catch (e) {
										// no selected columns data , continue
									}
									prompt += 'The ' + innerObject.name;
									if (selectedColumnsData) {
										prompt += ' as an array and it contains : ';
										prompt += '' + (ib + 1) + '.' + (ion + 1) + ') ';
										prompt +=
											innerObjectNames[ion] +
											' as object and contains ' +
											selectedColumnsData.length +
											' fields :';

										for (let k = 0; k < selectedColumnsData.length; k++) {
											let name = selectedColumnsData[k].name;
											let table = selectedColumnsData[k].key;
											prompt +=
												ib +
												1 +
												'.' +
												(ion + 1) +
												'.' +
												(k + 1) +
												') ' +
												name +
												' from ' +
												table +
												'. ';
										}
									}
								} else if (
									propertiesObject[innerObjectNames[ion]].type ==
										'arrayOfObjects' ||
									propertiesObject[innerObjectNames[ion]].type == 'object'
								) {
									const inObjNames = Object.keys(
										propertiesObject[innerObjectNames[ion]].properties
									);
									for (let nesIon = 0; nesIon < inObjNames.length; nesIon++) {
										if (
											propertiesObject[innerObjectNames[ion]].properties[
												inObjNames[nesIon]
											].type == 'ezapi_table'
										) {
											let selColumns =
												propertiesObject[innerObjectNames[ion]].properties[
													inObjNames[nesIon]
												].selectedColumns;
											prompt +=
												'The ' +
												propertiesObject[innerObjectNames[ion]].properties[
													inObjNames[nesIon]
												].sourceName;

											if (selColumns) {
												prompt += ' as an object and it contains : ';
												for (let k = 0; k < selColumns.length; k++) {
													let name = selColumns[k].name;
													let table = selColumns[k].key;
													prompt +=
														'1.' +
														(k + 1) +
														') ' +
														name +
														' from ' +
														table +
														'. ';
												}
											}
										} else {
											let name =
												propertiesObject[innerObjectNames[ion]].properties[
													inObjNames[nesIon]
												].sourceName.name;
											let column =
												propertiesObject[innerObjectNames[ion]].properties[
													inObjNames[nesIon]
												].sourceName.sourceName;
											let table =
												propertiesObject[innerObjectNames[ion]].properties[
													inObjNames[nesIon]
												].sourceName.key; // schema included here
											prompt += '' + (ib + 1) + '.' + (ion + 1) + ') ';
											prompt +=
												name +
												' from ' +
												column +
												' field of ' +
												table +
												' table as ' +
												innerObjectNames[ion] +
												'. ';
										}
									}
								} else {
									let innerObject = propertiesObject[innerObjectNames[ion]];
									let name = innerObject.name;
									let column = innerObject.sourceName;
									let table = innerObject.key; // schema included here
									prompt += '' + (ib + 1) + '.' + (ion + 1) + ') ';
									prompt +=
										name +
										' from ' +
										column +
										' field of ' +
										table +
										' table as ' +
										innerObjectNames[ion] +
										'. ';
								}
							}
						} else if (innerObject.type == 'ezapi_table') {
							// get the selected column
							let sourceName = innerObject.sourceName;
							// get the selected column
							selectedColumnsData = findSelectedColumns(innerObject);

							prompt += '1) The ' + sourceName;

							if (selectedColumnsData) {
								prompt += ' as an object and it contains : ';
								for (let k = 0; k < selectedColumnsData.length; k++) {
									let name = selectedColumnsData[k].name;
									let table = selectedColumnsData[k].key;
									prompt +=
										'1.' + (k + 1) + ') ' + name + ' from ' + table + '. ';
								}
							}
						} else {
							prompt += '' + (ib + 1) + ') '; // nesting variables
							let name = innerObject.name;
							let column = innerObject.sourceName;
							let table = innerObject.key; // schema included here
							prompt +=
								' ' + name + ' from ' + column + ' field of ' + table + ' table.';
						}
					}
				} else {
					// only one array or object exist

					let type = docs[i].data.responseData[j].content.type;
					if (type == 'ezapi_table') {
						// get the selected column
						let sourceName = docs[i].data.responseData[j].content.sourceName;
						// get the selected column
						selectedColumnsData = findSelectedColumns(
							docs[i].data.responseData[j].content
						);

						prompt += '1) The ' + sourceName;

						if (selectedColumnsData) {
							prompt += ' as an object and it contains : ';
							for (let k = 0; k < selectedColumnsData.length; k++) {
								let name = selectedColumnsData[k].name;
								let table = selectedColumnsData[k].key;
								prompt += '1.' + (k + 1) + ') ' + name + ' from ' + table + '. ';
							}
						}
					} else {
						let name = docs[i].data.responseData[j].content.name;
						let column = docs[i].data.responseData[j].content.sourceName;
						let table = docs[i].data.responseData[j].content.key; // schema included here
						prompt += '1) ';
						prompt += name + ' from ' + column + ' field of ' + table + ' table. ';
					}
				}
			} // response data ends

			// Setting filtering conditions
			let tablesRelations = await getTableRelations(projectId);
			let filters = tablesRelations.filters;
			let filterCount = 1;
			if (filters.length > 0) {
				// For TPOLICY table under the schema dbo HISTORYFLAG should be equal to 0.
				prompt += ' Consider these filtering conditions for querying : ';
				const tables = filters.reduce((acc, obj) => {
					const { tableName, ...rest } = obj;
					if (!acc[tableName]) {
						acc[tableName] = [];
					}
					acc[tableName].push(rest);
					return acc;
				}, {});

				for (const [tableName, attributes] of Object.entries(tables)) {
					let tableSchemaCompleted = false;
					for (const { schemaName, columnName, filterCondition, value } of attributes) {
						if (attributes.length == 1) {
							prompt +=
								filterCount +
								') ' +
								'For ' +
								tableName +
								' table ' +
								'under the schema ' +
								schemaName +
								' ' +
								columnName +
								' should be ' +
								(filterCondition == 'equals' ? 'equal' : filterCondition) +
								' to ' +
								value +
								'. ';
							filterCount++;
						} else {
							if (!tableSchemaCompleted) {
								prompt +=
									filterCount +
									') ' +
									'For ' +
									tableName +
									' table ' +
									'under the schema ' +
									schemaName +
									' ' +
									columnName +
									' should be ' +
									(filterCondition == 'equals' ? 'equal' : filterCondition) +
									' to ' +
									value +
									' ';
								tableSchemaCompleted = true;
								filterCount++;
							} else {
								prompt +=
									'and ' +
									columnName +
									' should be ' +
									(filterCondition == 'equals' ? 'equal' : filterCondition) +
									' to ' +
									value +
									'. ';
							}
						}
					}
				}
				prompt += ' ' + filterCount + ') ' + 'No filter conditions on other tables.';
			}

			if (codegenLang.toLowerCase().includes('python')) {
				prompt += 'Also Give me a requirements.txt for all the python libraries used.';
			} else if (codegenLang.toLowerCase().includes('node')) {
				prompt += 'Also Give me a package.json file.';
			}

			// for mssql db
			prompt = prompt.replace(/sql_server_nvarchar/g, 'NVARCHAR');
			prompt = prompt.replace(/sql_server_varchar/g, 'VARCHAR');
			prompt = prompt.replace(/sql_server_char/g, 'CHAR');
			prompt = prompt.replace(/sql_server_nchar/g, 'NCHAR');
			// for postgreSQL db
			prompt = prompt.replace(/postgres_character/g, 'character');
			prompt = prompt.replace(/postgres_text/g, 'text');
			prompt = prompt.replace(/postgres_USER-DEFINED/g, 'USER-DEFINED');
			prompt = prompt.replace(/postgres_timestamp/g, 'timestamp');
			prompt = prompt.replace(/postgres_ARRAY/g, 'ARRAY');
			prompt = prompt.replace(/postgres_tsvector/g, 'tsvector');

			console.log('Operation prompt done');
			//console.log(prompt);

			const { gencode, errODCdPrmpt } = await ODCodeGenerator(
				projectId,
				codegenLang,
				prompt,
				modelPrompt
			);
			if (!gencode) throw errODCdPrmpt;
			console.log('Receive code for app');
			//console.log(gencode)

			/*
        const {responseMsg, errAssrtFile , CHAT_GPT_ERROR} = await assortIntoFilesV2(projectId,gencode,codegenDb,reqData)
        if(CHAT_GPT_ERROR=="UNEXPECTED_CHATGPT_RESPONSE") throw CHAT_GPT_ERROR;
        if (!responseMsg) throw errAssrtFile;
        console.log("files generated")
        */

			// After code is generated , clear both modelprompt and opDataPrompt for new ednpoint prompt
			prompt = '';
			modelPrompt = '';

			console.log('chtgptRunDoc.chtgptRunId2 ', chtgptRunDoc.chtgptRunId);
			let endpointinfo = methodName + '__' + endPoint;
			await ChatGptGenCode.findOneAndUpdate(
				{ projectId: projectId, chtgptRunId: chtgptRunDoc.chtgptRunId },
				{ $push: { generatedCode: { codeResponse: gencode }, endpointinfo: endpointinfo } }
				//{ upsert: true, new: true, returnDocument: 'after' }
			);

			// storing the code in mongo db for sp
			/* await ChatGptGenCode.findOne({ projectId: projectId }, async function(err, doc) {
            if (err) throw err;
                if (doc) {
                    await ChatGptGenCode.findOneAndUpdate(
                              { projectId : projectId }, 
                              { $push: { generatedCode : { codeResponse : gencode } } },
                              {useFindAndModify: false},
                              function (error, success) {
                                      if (error) {
                                          console.log("error while writing generated code to db")
                                      } else {
                                          console.log("Generated code is stored in db");
                                      }
                              });
                    
                } else {
                    ChatGptGenCode.create({projectId:projectId, generatedCode : { codeResponse : gencode }});
                }
                //console.log("doclength ins.. ", doc.generatedCode.length)

              }
        ) */
		}
		let responseMsg, errAssrtFile;
		let directory = process.env.DIRECTORY_LOCATION + '/' + projectId + '/pythoncode';
		await deleteFile(directory, 'app.py');
		// iterate through generated code for each endpoint and merge
		const doc = await ChatGptGenCode.findOne({
			projectId: projectId,
			chtgptRunId: chtgptRunDoc.chtgptRunId
		});
		if (doc) {
			// get recently pushed code and handle the file logic
			let count = 0;
			console.log('doclength, ', doc.generatedCode.length);
			for (let i = doc.generatedCode.length - 1; i >= 0 && count < noOfOps; i--) {
				console.log('i is ', i);
				console.log('count is ', count);
				let endPointCode = doc.generatedCode[i].codeResponse;
				let firstLastIndicator;
				if (count == 0) {
					firstLastIndicator = 'FIRST_ENDPOINT';
				} else if (count == noOfOps - 1) {
					firstLastIndicator = 'LAST_ENDPOINT';
				} else {
					firstLastIndicator = 'INTERMEDIATE_ENDPOINT';
				}
				console.log('firstLastIndicator..', firstLastIndicator);
				({ responseMsg, errAssrtFile } = await assortIntoFilesV2(
					projectId,
					endPointCode,
					codegenDb,
					reqData,
					firstLastIndicator
				));
				console.log('responseMsg..', responseMsg);
				count++;
			}
			console.log('count is ', count);
		}
		if (!responseMsg) throw errAssrtFile;
		return { responseMsg };
	} catch (errCodeGenV2) {
		// no relations , continue
		console.log('errCodeGenV2 : ', errCodeGenV2);
		return { errCodeGenV2 };
	}
}

async function iterateAndMerge(projectId, reqData) {
	let codegenDb = reqData.codegenDb;
	try {
		let responseMsg, errAssrtFile;
		const docs = await OperationData.find({ projectid: projectId });
		let noOfOps = docs.length;
		console.log('opslenght', noOfOps);
		// iterate through generated code for each endpoint and merge
		const doc = await ChatGptGenCode.findOne({ projectId: projectId });
		if (doc) {
			// get recently pushed code and handle the file logic
			let count = 0;
			console.log('doclength, ', doc.generatedCode.length);
			for (let i = doc.generatedCode.length - 1; i >= 0 && count < noOfOps; i--) {
				count++;
				let endPointCode = doc.generatedCode[i].codeResponse;
				let firstLastIndicator;
				if (count == 1) {
					firstLastIndicator = 'FIRST_ENDPOINT';
				} else if (count == noOfOps) {
					firstLastIndicator = 'LAST_ENDPOINT';
				} else {
					firstLastIndicator = 'INTERMEDIATE_ENDPOINT';
				}
				console.log('firstLastIndicator..', firstLastIndicator);
				({ responseMsg, errAssrtFile } = await assortIntoFilesV2(
					projectId,
					endPointCode,
					codegenDb,
					reqData,
					firstLastIndicator
				));
				console.log('responseMsg..', responseMsg);
			}
			console.log('count is ', count);
		}
		if (!responseMsg) throw errAssrtFile;
		return { responseMsg };
	} catch (errCodeGenV2) {
		// no relations , continue
		console.log('errCodeGenV2 : ', errCodeGenV2);
		return { errCodeGenV2 };
	}
}

async function genPythonMongoCodegenV2(reqData) {
	let projectId = reqData.projectId;
	let codegenDb = reqData.codegenDb;
	let collectionsUsed = [];
	const docs = await OperationData.find({ projectid: projectId });
	let noOfOps = docs.length;
	for (let i = 0; i < docs.length; i++) {
		let prompt =
			'Give me a ' +
			reqData.codegenLang +
			' code using mongoDB as database for the following endpoint :';
		let modelPrompt =
			'Give me a ' +
			reqData.codegenLang +
			' code for model class using flask and pymongo for the following mongoDB collections and documents : ';

		let respDataLength = docs[i].data.responseData.length;

		for (let r = 0; r < respDataLength; r++) {
			// these are keys under content-properties under response data
			let innerKeyNames = Object.keys(docs[i].data.responseData[r].content.properties);

			for (let s = 0; s < innerKeyNames.length; s++) {
				// this gives the collection used
				let key = docs[i].data.responseData[r].content.properties[innerKeyNames[s]].key;
				if (key) {
					if (!collectionsUsed.includes(key)) {
						collectionsUsed.push(key);
					}
				} else {
					// object case , get the key
					try {
						let objInnerNames = Object.keys(
							docs[i].data.responseData[r].content.properties[innerKeyNames[s]].items
								.properties
						);
						for (let t = 0; i < objInnerNames.length; t++) {
							let key =
								docs[i].data.responseData[r].content.properties[innerKeyNames[s]]
									.items.properties[objInnerNames[t]].key;
							if (key) {
								if (!collectionsUsed.includes(key)) {
									collectionsUsed.push(key);
								}
							}
						}
					} catch (e) {
						// continue
					}
				}
			}
		}

		console.log('collectionss used :');
		console.log(collectionsUsed);

		const mongoCollections = await MongoCollections.find(
			{ projectid: projectId },
			{ attributes: 1, collection: 1, relations: 1 }
		).lean();

		let requiredCollections = collectionsUsed;

		for (let i = 0; i < mongoCollections.length; i++) {
			if (requiredCollections.includes(mongoCollections[i].collection)) {
				let attributes = mongoCollections[i].attributes;
				let documents = Object.keys(attributes);
				modelPrompt +=
					'The ' +
					mongoCollections[i].collection +
					' collection include ' +
					documents.length +
					' documents , they are :';

				for (let j = 0; j < documents.length; j++) {
					let innerDoc = mongoCollections[i].attributes[documents[j]];
					if (innerDoc.ezapi_type == 'array') {
						// get the ezapi_array object
						let arrayType = innerDoc.ezapi_array.ezapi_type;
						// traverseArray(innerDoc);
						if (arrayType != 'object') {
							//modelPrompt+=" (line 1029) "
							modelPrompt +=
								j +
								1 +
								') ' +
								documents[j] +
								' of type array of ' +
								arrayType +
								's. ';
						} else {
							// array of objects case

							let innerNestedDocNames = Object.keys(
								innerDoc.ezapi_array.ezapi_object
							);

							for (let m = 0; m < innerNestedDocNames.length; m++) {
								let nsInnerType =
									innerDoc.ezapi_array.ezapi_object[innerNestedDocNames[m]]
										.ezapi_type;
								//modelPrompt+=" (line 1037) "
								modelPrompt +=
									j +
									1 +
									') ' +
									innerNestedDocNames[m] +
									' of type ' +
									nsInnerType +
									'. ';
							}
						}
					} else if (innerDoc.ezapi_type == 'object') {
						modelPrompt +=
							j + 1 + ') ' + documents[j] + ' of type object and it includes :';
						let innerObjNames = Object.keys(innerDoc.ezapi_object);

						for (let k = 0; k < innerObjNames.length; k++) {
							let type = innerDoc.ezapi_object[innerObjNames[k]].ezapi_type;

							if (type != 'object' && type != 'array') {
								//modelPrompt+=" (line 1048) "
								modelPrompt +=
									j +
									1 +
									'.' +
									(k + 1) +
									') ' +
									innerObjNames[k] +
									' of type ' +
									type +
									'. ';
							} else if (type == 'object') {
								//modelPrompt+=" (line 1052) "
								modelPrompt +=
									j +
									1 +
									'.' +
									(k + 1) +
									') ' +
									innerObjNames[k] +
									' of type ' +
									type +
									' which contains : ';
								let nestedInnerDoc = Object.keys(
									innerDoc.ezapi_object[innerObjNames[k]].ezapi_object
								);

								for (let l = 0; l < nestedInnerDoc.length; l++) {
									let innerType =
										innerDoc.ezapi_object[innerObjNames[k]].ezapi_object[
											nestedInnerDoc[l]
										].ezapi_type;

									if (innerType != 'array' && innerType != 'object') {
										//modelPrompt+=" (line 1059) "
										modelPrompt +=
											j +
											1 +
											'.' +
											(k + 1) +
											'.' +
											(l + 1) +
											') ' +
											nestedInnerDoc[l] +
											' of type ' +
											innerType +
											'. ';
									} else if (innerType == 'object') {
										// nested object logic
										let innerNestedDocNames = Object.keys(
											innerDoc.ezapi_object[innerObjNames[k]].ezapi_object[
												nestedInnerDoc[l]
											].ezapi_object
										);
										for (let m = 0; m < innerNestedDocNames.length; m++) {
											let nsInnerType =
												innerDoc.ezapi_object[innerObjNames[k]]
													.ezapi_object[nestedInnerDoc[l]].ezapi_object
													.innerNestedDocNames[m].ezapi_type;
											//modelPrompt+=" (line 1066) "
											modelPrompt +=
												k +
												1 +
												'.' +
												(j + 1) +
												'.' +
												(l + 1) +
												'.' +
												(m + 1) +
												') ' +
												innerNestedDocNames[m] +
												' of type ' +
												nsInnerType +
												'. ';
										}
									} else {
										// type is array
										//modelPrompt+=" (line 1084) "
										let arrayType =
											innerDoc.ezapi_object[innerObjNames[k]].ezapi_object[
												nestedInnerDoc[l]
											].ezapi_array.ezapi_type;
										modelPrompt +=
											k +
											1 +
											'.' +
											(l + 1) +
											' ' +
											nestedInnerDoc[l] +
											' of type array of ' +
											arrayType;
									}
								}
							}
						}
					} else {
						// oid , date , string , integer etc
						//modelPrompt+=" (line 1077) "
						modelPrompt +=
							j + 1 + ') ' + documents[j] + ' of type ' + innerDoc.ezapi_type + '. ';
					}
				}
			}
		}
		modelPrompt +=
			'Dont give me any method definitions under the class model which are used inside a route and use MongoClient for database connection';
		// model prompt ends here

		// empty the collectionUsed array
		collectionsUsed = [];

		// OperrationData prompoot begin here

		prompt += 'The method is ' + docs[i].data.method + ' method.';
		prompt += 'The endpoint is ' + docs[i].data.endpoint + '. ';
		prompt += 'The Request data is as follows :';

		let authorizationUsed = docs[i].data.requestData.authorization.authType;

		if (authorizationUsed !== 'No Auth') {
			prompt += 'The authorization include a ' + authorizationUsed + '.';
		}

		let headersUsed = docs[i].data.requestData.header;

		if (headersUsed && headersUsed.length > 0) {
			prompt += 'There are ' + headersUsed.length + ' headers used.';

			for (let i = 0; i < headersUsed.length; i++) {
				let key = Array.from(headersUsed[i].keys())[i];
				if (key) {
					let name = headersUsed[i].get(key).name ? headersUsed[i].get(key).name : '';
					let type = headersUsed[i].get(key).type ? headersUsed[i].get(key).type : '';
					let format = headersUsed[i].get(key).format
						? headersUsed[i].get(key).format
						: '';
					let required = headersUsed[i].get(key).required
						? headersUsed[i].get(key).required
						: '';

					prompt +=
						'The header is ' +
						name +
						' with the type ' +
						type +
						' and of format ' +
						format +
						'.';

					if (required) {
						prompt += ' It is a required header.';
					}
				}
			}
		}

		let pathUsed = docs[i].data.requestData.path;

		if (pathUsed && pathUsed.length > 0) {
			prompt += 'There are ' + pathUsed.length + ' path used.';

			for (let i = 0; i < pathUsed.length; i++) {
				let key = Array.from(pathUsed[i].keys())[i];
				if (key) {
					let name = pathUsed[i].get(key).name ? pathUsed[i].get(key).name : '';
					let type = pathUsed[i].get(key).type ? pathUsed[i].get(key).type : '';
					let format = pathUsed[i].get(key).format ? pathUsed[i].get(key).format : '';
					let required = pathUsed[i].get(key).required
						? pathUsed[i].get(key).required
						: '';

					prompt +=
						'The path is ' +
						name +
						' with the type ' +
						type +
						' and of format ' +
						format +
						'.';

					if (required) {
						prompt += ' It is a required path.';
					}
				}
			}
		}

		let queryUsed = docs[i].data.requestData.query;

		if (queryUsed && queryUsed.length > 0) {
			prompt += 'There are ' + queryUsed.length + ' queries used.';

			for (let i = 0; i < queryUsed.length; i++) {
				let key = Array.from(queryUsed[i].keys())[i];
				if (key) {
					let name = queryUsed[i].get(key).name ? queryUsed[i].get(key).name : '';
					let type = queryUsed[i].get(key).type ? queryUsed[i].get(key).type : '';
					let format = queryUsed[i].get(key).format ? queryUsed[i].get(key).format : '';
					let required = queryUsed[i].get(key).required
						? queryUsed[i].get(key).required
						: '';

					prompt +=
						'The query is ' +
						name +
						' with the type ' +
						type +
						' and of format ' +
						format +
						'.';

					if (required) {
						prompt += ' It is a required query.';
					}
				}
			}
		}

		let formDataUsed = docs[i].data.requestData.formData;

		if (formDataUsed && formDataUsed.length > 0) {
			prompt += 'There are ' + formDataUsed.length + ' form datas are used.';

			for (let i = 0; i < formDataUsed.length; i++) {
				let key = Array.from(formDataUsed[i].keys())[i];
				if (key) {
					let name = formDataUsed[i].get(key).name ? formDataUsed[i].get(key).name : '';
					let type = formDataUsed[i].get(key).type ? formDataUsed[i].get(key).type : '';
					let format = formDataUsed[i].get(key).format
						? formDataUsed[i].get(key).format
						: '';
					let required = formDataUsed[i].get(key).required
						? formDataUsed[i].get(key).required
						: '';

					prompt +=
						'The query is ' +
						name +
						' with the type ' +
						type +
						' and of format ' +
						format +
						'.';

					if (required) {
						prompt += ' It is a required formData.';
					}
				}
			}
		}

		// no request body for GET methods

		if (docs[i].data.method.toLowerCase() != 'get') {
			prompt += ' The request body include :';
			let requestDataHeader;
			if (requestDataHeader && requestDataHeader.length > 0) {
				prompt += 'There are ' + requestDataHeader.length + ' response headers used.';
				for (let i = 0; i < requestDataHeader.length; i++) {
					let key = Array.from(requestDataHeader[i].keys())[i];
					if (key) {
						let name = requestDataHeader[i].get(key).name
							? requestDataHeader[i].get(key).name
							: '';
						let type = requestDataHeader[i].get(key).type
							? requestDataHeader[i].get(key).type
							: '';
						let format = requestDataHeader[i].get(key).format
							? requestDataHeader[i].get(key).format
							: '';
						let required = requestDataHeader[i].get(key).required
							? requestDataHeader[i].get(key).required
							: '';

						prompt +=
							'The header is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required request header.';
						}
					}
				}
			} // headers end

			// request body starts

			let innerObjects = Object.keys(docs[i].data.requestData.body.properties);

			for (let ib = 0; ib < innerObjects.length; ib++) {
				let documentField = docs[i].data.requestData.body.properties[innerObjects[ib]].name;
				let collectionUsed = docs[i].data.requestData.body.properties[innerObjects[ib]].key;
				prompt +=
					ib + 1 + ') ' + documentField + ' from ' + collectionUsed + ' collection. ';
			}
		}

		// request data ends here

		// response data
		prompt += ' The response data is as follows : ';
		let ResponseHeadersUsed;
		for (let j = 0; j < docs[i].data.responseData.length; j++) {
			// get staus_code and status message
			prompt +=
				'The status code is ' +
				docs[i].data.responseData[j].status_code +
				' with status message as ' +
				docs[i].data.responseData[j].description +
				'.';
			ResponseHeadersUsed = docs[i].data.responseData[j].headers;
			if (ResponseHeadersUsed && ResponseHeadersUsed.length > 0) {
				prompt += 'There are ' + ResponseHeadersUsed.length + ' response headers used.';
				for (let i = 0; i < ResponseHeadersUsed.length; i++) {
					let key = Array.from(ResponseHeadersUsed[i].keys())[i];
					if (key) {
						let name = ResponseHeadersUsed[i].get(key).name
							? ResponseHeadersUsed[i].get(key).name
							: '';
						let type = ResponseHeadersUsed[i].get(key).type
							? ResponseHeadersUsed[i].get(key).type
							: '';
						let format = ResponseHeadersUsed[i].get(key).format
							? ResponseHeadersUsed[i].get(key).format
							: '';
						let required = ResponseHeadersUsed[i].get(key).required
							? ResponseHeadersUsed[i].get(key).required
							: '';

						prompt +=
							'The header is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required response header.';
						}
					}
				}
			} // headers end

			// rsponse body starts

			prompt += ' The response body data : ';

			let resInnerObjects = Object.keys(docs[i].data.responseData[j].content.properties);

			for (let ib = 0; ib < resInnerObjects.length; ib++) {
				let documentField =
					docs[i].data.responseData[j].content.properties[resInnerObjects[ib]].name;
				let collectionUsed =
					docs[i].data.responseData[j].content.properties[resInnerObjects[ib]].key;
				if (documentField && collectionUsed) {
					prompt +=
						ib + 1 + ') ' + documentField + ' from ' + collectionUsed + ' collection. ';
				}

				// if properties exist , then
				if (
					docs[i].data.responseData[j].content.properties[resInnerObjects[ib]].properties
				) {
					let keysUnderProp = Object.keys(
						docs[i].data.responseData[j].content.properties[resInnerObjects[ib]]
							.properties
					);
					prompt += ib + 1 + ')' + keysUnderProp[ib] + ' is an object and it includes : ';
					for (let kup = 0; kup < keysUnderProp.length; kup++) {
						let propChildObj =
							docs[i].data.responseData[j].content.properties[resInnerObjects[ib]]
								.properties[keysUnderProp[kup]];
						let name = propChildObj.name;
						let key = propChildObj.key;
						prompt +=
							ib + 1 + '.' + (kup + 1) + ')' + name + ' from ' + key + ' collection.';
					}
				}
			}
		} // response data ends
		if (reqData.codegenLang.includes('py')) {
			prompt += 'Give me a requirements.txt file for python libraries used.';
		}

		console.log('model prompt :', modelPrompt);
		console.log('opdata prompt :', prompt);

		const { gencode, errODCdPrmpt } = await ODCodeGenerator(projectId, prompt, modelPrompt);
		if (!gencode) throw errODCdPrmpt;
		console.log('Receive code for app');
		console.log(gencode);

		// After code is generated , clear both modelprompt and opDataPrompt for new ednpoint prompt
		prompt = '';
		modelPrompt = '';

		// storing the code in mongo db for sp
		ChatGptGenCode.findOne({ projectId: projectId }, function (err, doc) {
			if (err) throw err;
			if (doc) {
				ChatGptGenCode.findOneAndUpdate(
					{ projectId: projectId },
					{ $push: { generatedCode: { codeResponse: gencode } } },
					{ useFindAndModify: false },
					function (error, success) {
						if (error) {
							console.log('error while writing generated code to db');
						} else {
							console.log('Generated code is stored in db');
						}
					}
				);
			} else {
				ChatGptGenCode.create({
					projectId: projectId,
					generatedCode: { codeResponse: gencode }
				});
			}
		});
	} // all operations ends

	// from db fetch the code and merge it into a file

	ChatGptGenCode.findOne({ projectId: projectId }, async function (err, doc) {
		if (err) throw err;
		if (doc) {
			// get recently pushed code and handle the file logic
			let count = 0;
			for (let i = doc.generatedCode.length - 1; i >= 0 && count < noOfOps; i--) {
				count++;
				let endPointCode = doc.generatedCode[i].codeResponse;
				let firstLastIndicator;
				if (count == 1) {
					firstLastIndicator = 'FIRST_ENDPOINT';
				} else if (count == noOfOps) {
					firstLastIndicator = 'LAST_ENDPOINT';
				} else {
					firstLastIndicator = 'INTERMEDIATE_ENDPOINT';
				}
				//  assortIntoFilesMongoV2
				await assortIntoFilesMongoV2(
					projectId,
					endPointCode,
					codegenDb,
					reqData,
					firstLastIndicator
				);
			}
			console.log('count is ', count);
		}
	});
}

async function genNodeMongoModelPrompt(projectId, codegenLang, userId) {
	let prompt;
	try {
		let codeFramework = await getCodeFramework(projectId, userId);

		prompt =
			'Write a ' +
			codegenLang +
			` code for model class using ${codeFramework} and mongoose for the following mongoDB collections and documents : `;

		let tblList = await getTablesList(projectId);

		const mongoCollections = await MongoCollections.find(
			{ projectid: projectId },
			{ attributes: 1, collection: 1, relations: 1 }
		).lean();

		let requiredCollections = tblList.tablesList;

		for (let i = 0; i < mongoCollections.length; i++) {
			if (requiredCollections.includes(mongoCollections[i].collection)) {
				let attributes = mongoCollections[i].attributes;
				let documents = Object.keys(attributes);
				prompt +=
					'The ' +
					mongoCollections[i].collection +
					' collection include ' +
					documents.length +
					' documents , they are :';

				for (let j = 0; j < documents.length; j++) {
					let innerDoc = mongoCollections[i].attributes[documents[j]];
					if (innerDoc.ezapi_type == 'array') {
						// get the ezapi_array object
						let arrayType = innerDoc.ezapi_array.ezapi_type;
						// traverseArray(innerDoc);
						if (arrayType != 'object') {
							//prompt+=" (line 1029) "
							prompt +=
								j +
								1 +
								') ' +
								documents[j] +
								' of type array of ' +
								arrayType +
								's. ';
						} else {
							// array of objects case

							let innerNestedDocNames = Object.keys(
								innerDoc.ezapi_array.ezapi_object
							);

							for (let m = 0; m < innerNestedDocNames.length; m++) {
								let nsInnerType =
									innerDoc.ezapi_array.ezapi_object[innerNestedDocNames[m]]
										.ezapi_type;
								//prompt+=" (line 1037) "
								prompt +=
									j +
									1 +
									') ' +
									innerNestedDocNames[m] +
									' of type ' +
									nsInnerType +
									'. ';
							}
						}
					} else if (innerDoc.ezapi_type == 'object') {
						prompt += j + 1 + ') ' + documents[j] + ' of type object and it includes :';
						let innerObjNames = Object.keys(innerDoc.ezapi_object);

						for (let k = 0; k < innerObjNames.length; k++) {
							let type = innerDoc.ezapi_object[innerObjNames[k]].ezapi_type;

							if (type != 'object' && type != 'array') {
								//prompt+=" (line 1048) "
								prompt +=
									j +
									1 +
									'.' +
									(k + 1) +
									') ' +
									innerObjNames[k] +
									' of type ' +
									type +
									'. ';
							} else if (type == 'object') {
								//prompt+=" (line 1052) "
								prompt +=
									j +
									1 +
									'.' +
									(k + 1) +
									') ' +
									innerObjNames[k] +
									' of type ' +
									type +
									' which contains : ';
								let nestedInnerDoc = Object.keys(
									innerDoc.ezapi_object[innerObjNames[k]].ezapi_object
								);

								for (let l = 0; l < nestedInnerDoc.length; l++) {
									let innerType =
										innerDoc.ezapi_object[innerObjNames[k]].ezapi_object[
											nestedInnerDoc[l]
										].ezapi_type;

									if (innerType != 'array' && innerType != 'object') {
										//prompt+=" (line 1059) "
										prompt +=
											j +
											1 +
											'.' +
											(k + 1) +
											'.' +
											(l + 1) +
											') ' +
											nestedInnerDoc[l] +
											' of type ' +
											innerType +
											'. ';
									} else if (innerType == 'object') {
										// nested object logic
										let innerNestedDocNames = Object.keys(
											innerDoc.ezapi_object[innerObjNames[k]].ezapi_object[
												nestedInnerDoc[l]
											].ezapi_object
										);
										for (let m = 0; m < innerNestedDocNames.length; m++) {
											let nsInnerType =
												innerDoc.ezapi_object[innerObjNames[k]]
													.ezapi_object[nestedInnerDoc[l]].ezapi_object
													.innerNestedDocNames[m].ezapi_type;
											//prompt+=" (line 1066) "
											prompt +=
												k +
												1 +
												'.' +
												(j + 1) +
												'.' +
												(l + 1) +
												'.' +
												(m + 1) +
												') ' +
												innerNestedDocNames[m] +
												' of type ' +
												nsInnerType +
												'. ';
										}
									} else {
										// type is array
										//prompt+=" (line 1084) "
										let arrayType =
											innerDoc.ezapi_object[innerObjNames[k]].ezapi_object[
												nestedInnerDoc[l]
											].ezapi_array.ezapi_type;
										prompt +=
											k +
											1 +
											'.' +
											(l + 1) +
											' ' +
											nestedInnerDoc[l] +
											' of type array of ' +
											arrayType;
									}
								}
							}
						}
					} else {
						// oid , date , string , integer etc
						//prompt+=" (line 1077) "
						prompt +=
							j + 1 + ') ' + documents[j] + ' of type ' + innerDoc.ezapi_type + '. ';
					}
				}
			}
		}
	} catch (errMdlPrmpt) {
		return { errMdlPrmpt };
	}
	return { prompt };
}

async function genNodeMongoOpDataPrompt(projectId, codegenLang, userId) {
	let prompt = '',
		opDataPrompt;
	try {
		let codeFramework = await getCodeFramework(projectId, userId);

		prompt +=
			'Write a ' +
			codegenLang +
			` code using ${codeFramework},node and mongoose using mongoDB as database for the following operations :`;

		const docs = await OperationData.find({ projectid: projectId });
		prompt += 'There are ' + docs.length + ' endpoints.';
		for (let i = 0; i < docs.length; i++) {
			prompt += 'The method is ' + docs[i].data.method + ' method.';
			prompt += 'The endpoint is ' + docs[i].data.endpoint + '. ';
			prompt += 'The Request data is as follows :';

			let authorizationUsed = docs[i].data.requestData.authorization.authType;

			if (authorizationUsed !== 'No Auth') {
				prompt += 'The authorization include a ' + authorizationUsed + '.';
			}

			let headersUsed = docs[i].data.requestData.header;

			if (headersUsed && headersUsed.length > 0) {
				prompt += 'There are ' + headersUsed.length + ' headers used.';

				for (let i = 0; i < headersUsed.length; i++) {
					let key = Array.from(headersUsed[i].keys())[i];
					if (key) {
						let name = headersUsed[i].get(key).name ? headersUsed[i].get(key).name : '';
						let type = headersUsed[i].get(key).type ? headersUsed[i].get(key).type : '';
						let format = headersUsed[i].get(key).format
							? headersUsed[i].get(key).format
							: '';
						let required = headersUsed[i].get(key).required
							? headersUsed[i].get(key).required
							: '';

						prompt +=
							'The header is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required header.';
						}
					}
				}
			}

			let pathUsed = docs[i].data.requestData.path;

			if (pathUsed && pathUsed.length > 0) {
				prompt += 'There are ' + pathUsed.length + ' path used.';

				for (let i = 0; i < pathUsed.length; i++) {
					let key = Array.from(pathUsed[i].keys())[i];
					if (key) {
						let name = pathUsed[i].get(key).name ? pathUsed[i].get(key).name : '';
						let type = pathUsed[i].get(key).type ? pathUsed[i].get(key).type : '';
						let format = pathUsed[i].get(key).format ? pathUsed[i].get(key).format : '';
						let required = pathUsed[i].get(key).required
							? pathUsed[i].get(key).required
							: '';

						prompt +=
							'The path is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required path.';
						}
					}
				}
			}

			let queryUsed = docs[i].data.requestData.query;

			if (queryUsed && queryUsed.length > 0) {
				prompt += 'There are ' + queryUsed.length + ' queries used.';

				for (let i = 0; i < queryUsed.length; i++) {
					let key = Array.from(queryUsed[i].keys())[i];
					if (key) {
						let name = queryUsed[i].get(key).name ? queryUsed[i].get(key).name : '';
						let type = queryUsed[i].get(key).type ? queryUsed[i].get(key).type : '';
						let format = queryUsed[i].get(key).format
							? queryUsed[i].get(key).format
							: '';
						let required = queryUsed[i].get(key).required
							? queryUsed[i].get(key).required
							: '';

						prompt +=
							'The query is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required query.';
						}
					}
				}
			}

			let formDataUsed = docs[i].data.requestData.formData;

			if (formDataUsed && formDataUsed.length > 0) {
				prompt += 'There are ' + formDataUsed.length + ' form datas are used.';

				for (let i = 0; i < formDataUsed.length; i++) {
					let key = Array.from(formDataUsed[i].keys())[i];
					if (key) {
						let name = formDataUsed[i].get(key).name
							? formDataUsed[i].get(key).name
							: '';
						let type = formDataUsed[i].get(key).type
							? formDataUsed[i].get(key).type
							: '';
						let format = formDataUsed[i].get(key).format
							? formDataUsed[i].get(key).format
							: '';
						let required = formDataUsed[i].get(key).required
							? formDataUsed[i].get(key).required
							: '';

						prompt +=
							'The query is ' +
							name +
							' with the type ' +
							type +
							' and of format ' +
							format +
							'.';

						if (required) {
							prompt += ' It is a required formData.';
						}
					}
				}
			}

			// no request body for GET methods

			if (docs[i].data.method.toLowerCase() != 'get') {
				prompt += ' The request body include :';
				let requestDataHeader;
				if (requestDataHeader && requestDataHeader.length > 0) {
					prompt += 'There are ' + requestDataHeader.length + ' response headers used.';
					for (let i = 0; i < requestDataHeader.length; i++) {
						let key = Array.from(requestDataHeader[i].keys())[i];
						if (key) {
							let name = requestDataHeader[i].get(key).name
								? requestDataHeader[i].get(key).name
								: '';
							let type = requestDataHeader[i].get(key).type
								? requestDataHeader[i].get(key).type
								: '';
							let format = requestDataHeader[i].get(key).format
								? requestDataHeader[i].get(key).format
								: '';
							let required = requestDataHeader[i].get(key).required
								? requestDataHeader[i].get(key).required
								: '';

							prompt +=
								'The header is ' +
								name +
								' with the type ' +
								type +
								' and of format ' +
								format +
								'.';

							if (required) {
								prompt += ' It is a required request header.';
							}
						}
					}
				} // headers end

				// request body starts

				let innerObjects = Object.keys(docs[i].data.requestData.body.properties);

				for (let ib = 0; ib < innerObjects.length; ib++) {
					let documentField =
						docs[i].data.requestData.body.properties[innerObjects[ib]].name;
					let collectionUsed =
						docs[i].data.requestData.body.properties[innerObjects[ib]].key;
					prompt +=
						ib + 1 + ') ' + documentField + ' from ' + collectionUsed + ' collection. ';
				}
			}

			// request data ends here

			// response data
			prompt += ' The response data is as follows : ';
			let ResponseHeadersUsed;
			for (let j = 0; j < docs[i].data.responseData.length; j++) {
				// get staus_code and status message
				prompt +=
					'The status code is ' +
					docs[i].data.responseData[j].status_code +
					' with status message as ' +
					docs[i].data.responseData[j].description +
					'.';
				ResponseHeadersUsed = docs[i].data.responseData[j].headers;
				if (ResponseHeadersUsed && ResponseHeadersUsed.length > 0) {
					prompt += 'There are ' + ResponseHeadersUsed.length + ' response headers used.';
					for (let i = 0; i < ResponseHeadersUsed.length; i++) {
						let key = Array.from(ResponseHeadersUsed[i].keys())[i];
						if (key) {
							let name = ResponseHeadersUsed[i].get(key).name
								? ResponseHeadersUsed[i].get(key).name
								: '';
							let type = ResponseHeadersUsed[i].get(key).type
								? ResponseHeadersUsed[i].get(key).type
								: '';
							let format = ResponseHeadersUsed[i].get(key).format
								? ResponseHeadersUsed[i].get(key).format
								: '';
							let required = ResponseHeadersUsed[i].get(key).required
								? ResponseHeadersUsed[i].get(key).required
								: '';

							prompt +=
								'The header is ' +
								name +
								' with the type ' +
								type +
								' and of format ' +
								format +
								'.';

							if (required) {
								prompt += ' It is a required response header.';
							}
						}
					}
				} // headers end

				// rsponse body starts

				prompt += ' The response body data : ';

				let resInnerObjects = Object.keys(docs[i].data.responseData[j].content.properties);

				for (let ib = 0; ib < resInnerObjects.length; ib++) {
					let documentField =
						docs[i].data.responseData[j].content.properties[resInnerObjects[ib]].name;
					let collectionUsed =
						docs[i].data.responseData[j].content.properties[resInnerObjects[ib]].key;
					prompt +=
						ib + 1 + ') ' + documentField + ' from ' + collectionUsed + ' collection. ';
				}
			} // response data ends
		} // all operations ends
		if (codeFramework === 'express') {
			prompt += NODEJSPROMPT;
			let { projectName } = await Projects.findOne({ projectId }, { projectName: 1 }).lean();
			projectName = projectName.replaceAll('_', '');
			projectName = projectName.toUpperCase();
			prompt = prompt.replaceAll('{projectName}', projectName);
			prompt += NODEJSDBCONNECTION;
		}
		if (codeFramework === 'nestjs') {
			prompt += NESTJSPROMPT;
			prompt += NESTJSDBCONNECTION;
		}

		opDataPrompt = prompt;
		return { opDataPrompt };
	} catch (errODPrmpt) {
		console.log(errODPrmpt);
		return { errODPrmpt };
	}
}

async function getCodeFramework(projectId, userId) {
	try {
		let codeFramework = 'express';
		let project = await Projects.findOne({ projectId }, { codeFramework: 1 }).lean();
		if (project.codeFramework) {
			codeFramework = project.codeFramework.node;
		} else {
			const settings = await Settings.findOne(
				{ userId, 'settings.type': 'code' },
				{ 'settings.$': 1, _id: 0 }
			).lean();
			if (settings) {
				codeFramework = settings.settings[0].values.node;
			}
		}
		if (!codeFramework) return 'express';
		return codeFramework;
	} catch (err) {
		return 'express';
	}
}

module.exports = {
	modelPromptController,
	modelCodeGenerator,
	ODPromptController,
	ODCodeGenerator,
	assortIntoFiles,
	codeGenpython,
	writeToFiles,
	generatePyMongoCodeGen,
	tablesData,
	getNoSQLAttributes,
	genPythonCodegenV2,
	genPythonMongoCodegenV2,
	genNodeMongoModelPrompt,
	genNodeMongoOpDataPrompt,
	iterateAndMerge,
	getCodeFramework
};
