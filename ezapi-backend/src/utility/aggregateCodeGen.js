const OperationData = require('../models/operationData');
const AggregateCards = require('../models/aggregateCards');
const VirtualSim = require('../models/virtualSim');
const AggregateMappings = require('../models/aggregateMappings');
const Projects = require('../models/projects');
const Settings = require('../models/settings');

const generateCodeUsingPrompt = require('../utility/generateCodeUsingPrompt');
const { writeToFiles } = require('../utility/files/fileSystem');
const { splitNodeExpressCodeIntoFolders } = require('./aggregateCodeGen/nodeCodeGen');
const { splitDotNetCodeIntoFolders } = require('./aggregateCodeGen/dotNetCodeGen');
const { splitNestCodeIntoFolders } = require('./aggregateCodeGen/nestCodeGen');
const { NESTJSPROMPT, NODEJSPROMPT } = require('../constants/prompts');

const host = `http://localhost:7744/`;

async function aggregateCodeGen(userId, projectId, requestBody, codegenLang, projectName) {
	try {
		const operationData = await OperationData.findOne(
			{ projectid: projectId },
			{ id: 1, data: 1 }
		).lean();
		const { id: operationId } = operationData;
		const {
			prompt,
			err: promptError,
			urlMapper,
			libraries: frameworks
		} = await promptGen(userId, projectId, projectName, operationId, codegenLang);
		if (promptError) throw new Error(promptError);
		const { code, err: codegenError } = await generateCodeUsingPrompt(
			prompt,
			projectId,
			codegenLang
		);

		if (codegenError) throw new Error(codegenError);
		await generateFiles(
			projectId,
			codegenLang,
			code,
			projectName,
			operationData,
			urlMapper,
			frameworks
		);
		const libraries = {
			python: 'pythoncodegen',
			node: 'nodecodegen',
			dotnet: 'dotnetcodegen'
		};
		const codegenVar = libraries[codegenLang];
		await Projects.updateOne({ projectId }, { $set: { [codegenVar]: true } });
		return { codegen: true, code };
	} catch (err) {
		return { err: `aggregateCodeGen: ${err.message} ` };
	}
}

async function promptGen(userId, projectId, projectName, operationId, codegenLang) {
	try {
		projectName = projectName.replace(/_/g, '').toUpperCase();
		const libraries = {
			python: 'flask',
			node: 'express',
			java: 'springboot',
			dotnet: '.NET Core 6'
		};

		//update framework using project framework Value or settings frameworkValue
		let { codeFramework } = await Projects.findOne({ projectId }, { codeFramework: 1 }).lean();
		if (!codeFramework) {
			const settings = await Settings.findOne(
				{ userId, 'settings.type': 'code' },
				{ 'settings.$': 1, _id: 0 }
			).lean();
			if (settings) {
				codeFramework = settings.settings[0].values;
			}
		}
		for (let i in codeFramework) {
			libraries[i] = codeFramework[i];
		}

		const programLang = {
			python: 'python',
			node: 'node',
			dotnet: 'c#'
		};
		const { requestBody: requestJson, responseBody: responseJson } = await VirtualSim.findOne({
			projectid: projectId,
			operationId
		}).lean();
		const operation = await OperationData.findOne({ id: operationId }).lean();
		const { method, endpoint } = operation.data;

		let prompt = `I want you to act as ${programLang[codegenLang]} developer.Give me ${
			programLang[codegenLang]
		} code using ${libraries[codegenLang]} for a ${method} endpoint ${host.replace(
			/\/$/,
			''
		)}${endpoint} which has requestBody JSON structure as \n`;

		prompt += JSON.stringify(requestJson) + '\n The response JSON structure should be \n';
		prompt += JSON.stringify(responseJson) + '\n';
		const aggregateCardsPrompt = await generatePromptForAggregateCards(operationId);
		prompt += aggregateCardsPrompt.cardsPrompt;
		prompt += `send the last api call response as the actual response for api. `;
		switch (codegenLang) {
			case 'dotnet':
				prompt +=
					'Use httpclient postAsync, getAsync for making api calls. Create DTOs to represent all JSON objects in camelcase and convert them to string using JsonSerializer. Use StringContent and System.text.json JsonSerializer with JsonSerializerOptions for camelCaseMapping. Dont use Newtonsoft.Json.';
				break;
			case 'node':
				if (libraries.node === 'express') {
					prompt += NODEJSPROMPT;
					prompt = prompt.replaceAll('{projectName}', projectName);
				}
				if (libraries.node === 'nestjs') {
					prompt += NESTJSPROMPT;
				}
				break;
			default:
				prompt += '';
		}

		return { prompt, urlMapper: aggregateCardsPrompt.urlMapper, libraries };
	} catch (err) {
		console.log('error1:', err.message);
		return { err: `promptGen: ${err.message}` };
	}
}

async function generatePromptForAggregateCards(operationId) {
	const aggregateCards = await AggregateCards.find({
		operationId,
		type: { $ne: 'mainNode' }
	}).lean();
	const urlMapper = {};
	const aggregateMappings = await AggregateMappings.find({ operationId }).lean();
	let cardsPrompt = `Inside this endpoint make the following sequence of API calls using axios.`;
	aggregateCards.forEach((card, index) => {
		const { runData, type } = card;
		if (type === 'externalAPINode') {
			const modifiedAPIUrl = runData.url.replace(/\/\/.*?\//, '//localhost:7744/');
			urlMapper[modifiedAPIUrl] = runData.url;
			cardsPrompt += `${index + 1}) Send a ${runData.method} request to ${modifiedAPIUrl}\n`;
			//cardsPrompt += `${index + 1}) Send a ${runData.method} request to ${runData.url}\n`;
			const requestParametersPrompt = generatePromptForRequestParameters(card);
			cardsPrompt += requestParametersPrompt;
			const cardMappings = aggregateMappings.filter((mapping) =>
				mapping.cardId.equals(card._id)
			);
			const mappingsPrompt = generateMappingsPrompt(cardMappings[0]);
			cardsPrompt += mappingsPrompt;
		}
		/* if (type === 'filterNode') {
			const { replacedFields, excludedFields } = card.filterData;
			excludedFields.forEach((obj) => {});
			replacedFields.forEach((obj) => {});
		} */
	});
	return { cardsPrompt, urlMapper };
}

function generatePromptForRequestParameters(card) {
	let requestPrompt = ``;
	const { headers, queryParams, pathParams, body } = card.runData;
	const requestParameters = { headers, queryParams, pathParams };
	Object.keys(requestParameters).forEach((reqParam) => {
		if (requestParameters[reqParam].length) {
			requestPrompt += `\n${reqParam}: `;
			const reqParamObject = {};
			requestParameters[reqParam].forEach((prop) => {
				reqParamObject[prop.key] = typeof prop.value;
			});
			requestPrompt += JSON.stringify(reqParamObject);
		}
	});
	if (body && body.data && Object.keys(body.data).length > 0) {
		requestPrompt += `The request body structure for  this API call is \n ${JSON.stringify(
			body.data
		)} \n`;
	}
	return requestPrompt;
}

function generateMappingsPrompt(cardMappings) {
	let mappingPrompt = ``;
	const { relationsHeaders, relationsParams, relationsRequestBody } = cardMappings;
	const requestParameters = { relationsHeaders, relationsParams, relationsRequestBody };
	Object.keys(requestParameters).forEach((reqParam) => {
		if (requestParameters[reqParam].length > 0) {
			requestParameters[reqParam].forEach((rel) => {
				const { mappedAttributeRef, attributeRef } = rel;
				let mappedAttribute = mappedAttributeRef.substring(
					mappedAttributeRef.indexOf('.') + 1
				);
				let attribute = attributeRef.substring(attributeRef.indexOf('.') + 1);
				if (mappedAttributeRef.includes('Request')) {
					mappingPrompt += `\n use Request '${mappedAttribute}' as '${attribute}' \n`;
				} else {
					mappingPrompt += `\n use previous api response '${mappedAttribute}' as '${attribute}' \n`;
				}
			});
		}
	});
	return mappingPrompt;
}

async function generateFiles(
	projectId,
	codegenLang,
	code,
	projectName,
	operationData,
	urlMapper,
	frameworks
) {
	try {
		const fileNames = {
			node: {
				mainFile: 'index.js',
				dependencyFile: 'package.json'
			},
			python: {
				mainFile: 'app.py',
				dependencyFile: 'requirements.txt'
			},
			dotnet: {
				mainFile: 'ProjectController.cs',
				dependencyFile: 'project.csproj'
			}
		};
		const dirPathModifier = {
			python: 'pythoncode',
			node: 'nodecode',
			dotnet: 'dotnetcode'
		};

		const modProjectName = projectName.replace('_', '').replace('-', '').replace('_', '');
		const dirName = dirPathModifier[codegenLang];
		const directory =
			process.env.DIRECTORY_LOCATION + '/' + projectId + `/${dirName}` + `/${modProjectName}`;

		const dependencyCode = {
			node: `{
		"name": "aggregateapi",
		"version": "1.0.0",
		"description": "aggregate apis",
		"main": "index.js",
		"scripts": {
		  "start": "node index.js",
		  "dev": "nodemon index.js"
		},
		"keywords": [],
		"author": "ezapi",
		"license": "MIT",
		"dependencies": {
		  "express": "^4.17.1",
		  "axios": "^0.21.4"
		},
		"devDependencies": {
		  "nodemon": "^2.0.12"
		}
	  }
	  `,
			python: `
		Flask==2.0.1
		requests==2.26.0
		`,
			dotnet: `
			  <Project Sdk="Microsoft.NET.Sdk.Web">

			  <PropertyGroup>
				<TargetFramework>net6.0</TargetFramework>
				<Nullable>enable</Nullable>
				<ImplicitUsings>enable</ImplicitUsings>
			  </PropertyGroup>
			
			  <ItemGroup>
				<PackageReference Include="Microsoft.AspNet.WebApi.Core" Version="5.2.9" />
				<PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
				<PackageReference Include="Swashbuckle.AspNetCore" Version="6.2.3" />
			  </ItemGroup>
			
			</Project>
			`
		};
		switch (codegenLang) {
			case 'dotnet':
				await splitDotNetCodeIntoFolders(
					code,
					urlMapper,
					projectName,
					directory,
					operationData
				);
				break;
			case 'node':
				if (frameworks.node === 'express') {
					await splitNodeExpressCodeIntoFolders(
						code,
						directory,
						projectName,
						projectId,
						urlMapper
					);
				}
				if (frameworks.node === 'nestjs') {
					await splitNestCodeIntoFolders(code, directory, projectId, urlMapper);
				}
				break;
			default:
				writeToFiles(directory, fileNames[codegenLang].mainFile, code);
				writeToFiles(
					directory,
					fileNames[codegenLang].dependencyFile,
					dependencyCode[codegenLang]
				);
		}
	} catch (err) {
		console.log('generateFiles..', err.message);
		return { err: `generateFiles: ${err.message}` };
	}
}

module.exports = { aggregateCodeGen, promptGen };
