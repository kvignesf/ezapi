const {
	writeToFiles,
	modelPromptController,
	ODPromptController,
	ODCodeGenerator,
	genNodeMongoModelPrompt,
	genNodeMongoOpDataPrompt,
	getCodeFramework
} = require('./getPromptsCompletions');
const { deleteFolderRecursive } = require('./files/fileSystem');

const { splitNestCodeIntoFolders } = require('./aggregateCodeGen/nestCodeGen');
const { splitNodeExpressCodeIntoFolders } = require('./aggregateCodeGen/nodeCodeGen');

const Projects = require('../models/projects');

function getCodeBlocks(codeString, codeFramework) {
	const removeUnwantedCommentsOrLines = (code, codeFramework, isMainFile) => {
		let startString = codeFramework === 'nestjs' ? 'import' : 'const';
		let endString = codeFramework === 'nestjs' ? '}' : ')';

		if (!isMainFile) {
			startString = '{';
			endString = '}';
		}

		const startIndex = code.indexOf(startString);
		const endIndex = code.lastIndexOf(endString) + 1;

		return code.substring(startIndex, endIndex);
	};
	//get indexCode Block
	const indexRegex = /#INDEX#([\s\S]*?)#PACKAGEJSON#/;
	const indexMatch = codeString.match(indexRegex);
	let indexCode = indexMatch ? indexMatch[1].trim() : null;
	indexCode = removeUnwantedCommentsOrLines(indexCode, codeFramework, true);

	// get PackageJson Code block
	const packageJsonRegex = /#PACKAGEJSON#([\s\S]*)}/;
	const packageJsonMatch = codeString.match(packageJsonRegex);
	let packageJsonCode = packageJsonMatch ? packageJsonMatch[1].trim() : null;
	packageJsonCode = removeUnwantedCommentsOrLines(packageJsonCode, codeFramework);

	return {
		indexCode,
		packageJsonCode
	};
}

async function createNodeFilesFromCode(projectId, genCode, codegenDb, reqData, userId) {
	try {
		console.log('genCode node..', genCode);
		const directory = process.env.DIRECTORY_LOCATION + '/' + projectId + '/nodecode';
		const { dbHost, dbName, dbUserName, dbPassword } = reqData;
		const codegenFailMsgs = [
			'i apologize',
			'unfortunately',
			'as an ai model',
			'unclear',
			'sample implemenatation',
			'sorry'
		];
		let failMsgCount = 0;

		for (let f = 0; f < codegenFailMsgs.length; f++) {
			if (String(genCode).toLowerCase().includes(codegenFailMsgs[f])) {
				failMsgCount++;
			}
		}
		let CHAT_GPT_ERROR = 'UNEXPECTED_CHATGPT_RESPONSE';
		if (failMsgCount > 0) {
			return { CHAT_GPT_ERROR };
		}
		let codeFramework = await getCodeFramework(projectId, userId);

		if (codeFramework === 'express') {
			const project = await Projects.findOne({ projectId }, { projectName: 1 }).lean();
			splitNodeExpressCodeIntoFolders(genCode, directory, project.projectName, projectId);
			/* let { indexCode, packageJsonCode } = getCodeBlocks(genCode, codeFramework);

			//replace sequelize connnection given by chat-gpt codegen
			indexCode = replaceDBConnectionDetails(indexCode, codegenDb);

			//add dotenv config to app code
			indexCode = `require('dotenv').config()\n` + indexCode;
			const mainFileName = codeFramework === 'express' ? 'index.js' : 'main.ts';
			const envContent = `DB_NAME=${dbName} \nDB_USER=${dbUserName}\nDB_PASSWORD=${dbPassword}\nDB_HOST=${dbHost}`;
			deleteFolderRecursive(directory);
			writeToFiles(directory, mainFileName, indexCode);
			writeToFiles(directory, '.env', envContent);
			writeToFiles(directory, 'package.json', packageJsonCode); */
		}
		if (codeFramework === 'nestjs') {
			splitNestCodeIntoFolders(genCode, directory, projectId);
		}

		// remove lines which are before packageJson file start curly brace

		/* if (!packageJsonContent) {
			packageJsonContent = `
		{\n
			"name": "your_project_name",\n
			"version": "1.0.0",\n
			"description": "your_project_description",\n
			"main": "index.js",\n
			"scripts": {\n
			  "start": "node index.js"\n
			},\n
			"dependencies": {\n
			  "body-parser": "^1.19.0",\n
			  "dotenv": "^10.0.0",\n
			  "express": "^4.17.1",\n
			  "pg": "^8.7.1",\n
			  "sequelize": "^6.6.5",\n
			  "tedious": "^15.1.3"\n
			}\n
		  }
		`;
		} else {
			regexPkgDpndcs = /\"dependencies\"\:[\s\S]\{[\s\S]*?\}/g;
			let dataPkgDpndcs = packageJsonContent.match(regexPkgDpndcs);
			if (dataPkgDpndcs) {
				let newdataPkgDpndcs = dataPkgDpndcs[0].substring(
					dataPkgDpndcs[0].indexOf('{'),
					dataPkgDpndcs[0].indexOf('}')
				);
				if (newdataPkgDpndcs.split(',').length !== 6) {
					const tobeDpndcs = `"dependencies": {\n "body-parser": "^1.19.0",\n"dotenv": "^10.0.0",\n"express": "^4.17.1",\n"pg": "^8.7.1",\n"sequelize": "^6.6.5",\n"tedious": "^15.1.3"\n}`;
					packageJsonContent = packageJsonContent.replace(regexPkgDpndcs, tobeDpndcs);
				}
			}
		} */

		return { responseMsg: 'success' };
	} catch (errAssrtFile) {
		return { errAssrtFile };
	}
}

async function sqlNodeCodeGen(projectId, codegenLang, codegenDb, reqData, userId) {
	try {
		const { prompt, errMdlPrmpt } = await modelPromptController(
			projectId,
			codegenLang,
			codegenDb,
			userId
		);
		if (!prompt) throw errMdlPrmpt;

		const { finalprompt, errODPrmpt } = await ODPromptController(
			projectId,
			codegenLang,
			codegenDb,
			userId
		);
		if (!finalprompt) throw errODPrmpt;

		const { gencode, errODCdPrmpt } = await ODCodeGenerator(
			projectId,
			codegenLang,
			finalprompt,
			prompt
		);
		if (!gencode) throw errODCdPrmpt;
		const { responseMsg, errAssrtFile, CHAT_GPT_ERROR } = await createNodeFilesFromCode(
			projectId,
			gencode,
			codegenDb,
			reqData,
			userId
		);
		if (CHAT_GPT_ERROR == 'UNEXPECTED_CHATGPT_RESPONSE') throw CHAT_GPT_ERROR;
		if (!responseMsg) throw errAssrtFile;

		await Projects.updateOne({ projectId }, { $set: { nodecodegen: true } });
		return { responseMsg };
	} catch (errCodeGen) {
		console.log('errNodeCodeGen : ', errCodeGen);
		return { errCodeGen };
	}
}

async function mongoCodeGen(projectId, codegenLang, codegenDb, reqData, userId) {
	try {
		const { prompt, errMdlPrmpt } = await genNodeMongoModelPrompt(
			projectId,
			codegenLang,
			userId
		);
		if (!prompt) throw errMdlPrmpt;
		console.log('node-mongo model prompt done ');
		console.log(prompt);
		const { opDataPrompt, errOpDataPrompt } = await genNodeMongoOpDataPrompt(
			projectId,
			codegenLang,
			userId
		);
		console.log('node-mongo opData prompt done');
		console.log(opDataPrompt);
		if (!opDataPrompt) throw errOpDataPrompt;
		console.log();
		const { gencode, errODCdPrmpt } = await ODCodeGenerator(projectId, opDataPrompt, prompt);
		console.log(gencode);
		if (!gencode) throw errODCdPrmpt;
		console.log('received cd for app');
		const { responseMsg, errAssrtFile, CHAT_GPT_ERROR } = await createNodeFilesFromCode(
			projectId,
			gencode,
			codegenDb,
			reqData
		);
		if (CHAT_GPT_ERROR == 'UNEXPECTED_CHATGPT_RESPONSE') throw CHAT_GPT_ERROR;
		if (!responseMsg) throw errAssrtFile;
		console.log('files generated');

		Projects.updateOne({ projectId }, { $set: { nodecodegen: true } });
		return { responseMsg };
	} catch (errCodeGen) {
		return { errCodeGen };
	}
}

function replaceDBConnectionDetails(string, codegenDb) {
	let startIndex;
	let endIndex;
	let replacement;
	if (codegenDb === 'mssql' || codegenDb === 'oracle' || codegenDb === 'mysql') {
		startIndex = string.indexOf('const sequelize');
		endIndex = string.indexOf('})') + 2;
		replacement = `
		const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
							
			host: process.env.DB_HOST,
			dialect: '${codegenDb}',
			dialectOptions: {
			  options: {
				encrypt: true
			  }
			}
		  });
		`;
	} else if (codegenDb === 'mongo') {
		startIndex = string.indexOf('mongoose.connect');
		endIndex = string.indexOf(`err))`) + 5;
		const options =
			'authSource=admin&readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false';
		const connectionString = `mongodb://process.env.DB_USER:process.env.DB_PASSWORD@process.env.DB_HOST:process.env.PORT/process.env.DB_NAME?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false`;
		replacement = `mongoose
			.connect("mongodb://process.env.DB_USER:process.env.DB_PASSWORD@process.env.DB_HOST:process.env.PORT/process.env.DB_NAME?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false")
			.then(() => console.log('mongo connected'))
			.catch((err) => console.log('error connecting to mongodb', err));`;
	} else if (codegenDb === 'postgres') {
		startIndex = string.indexOf('const pool');
		endIndex = string.indexOf('})') + 2;
		replacement = `
		const pool = new Pool({
			user: process.env.DB_USER,
			host: process.env.DB_HOST,
			database: process.env.DB_NAME,
			password: process.env.DB_PASSWORD,
			port: process.env.DB_PORTNO,
		});
		`;
	}

	if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
		return string.substring(0, startIndex) + replacement + string.substring(endIndex);
	}
	return string;
}

module.exports = { sqlNodeCodeGen, mongoCodeGen };
