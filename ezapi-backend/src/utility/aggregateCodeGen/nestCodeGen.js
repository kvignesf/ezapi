const fs = require('fs');
const path = require('path');

const { copyFolder } = require('../files/fileSystem');
const Projects = require('../../models/projects');
const getChatCompletion = require('../chatCompletions');

//Remove unwanted comments and informational sentences
const removeNestCodeComments = (code, mainFile = false) => {
	let startString = 'import';
	const endString = mainFile ? ')' : '}';

	let startIndex = code.indexOf(startString);
	if (startIndex === -1) {
		startString = 'export';
		startIndex = code.indexOf(startString);
	}
	const endIndex = code.lastIndexOf(endString) + 1;

	return code.substring(startIndex, endIndex);
};

function splitCodeIntoBlocks(codeString) {
	// Regular expressions to match each block
	const moduleRegex = /#MODULE#\s*(.*?)\s*#CONTROLLER#/s;
	const controllerRegex = /#CONTROLLER#\s*(.*?)\s*#SERVICE#/s;
	const serviceRegex = /#SERVICE#\s*(.*?)\s*#MODELS#/s;
	const modelsRegex = /#MODELS#\s*(.*?)\s*#MAIN#/s;

	// Extracting blocks
	let moduleBlock = (codeString.match(moduleRegex) || [])[1];
	let controllerBlock = (codeString.match(controllerRegex) || [])[1];
	let serviceBlock = (codeString.match(serviceRegex) || [])[1];
	let modelsBlock = (codeString.match(modelsRegex) || [])[1];

	// Extracting the main file block directly
	let mainFileBlock = codeString.split('#MAIN#')[1].trim();

	moduleBlock = removeNestCodeComments(moduleBlock);
	controllerBlock = removeNestCodeComments(controllerBlock);
	serviceBlock = removeNestCodeComments(serviceBlock);
	modelsBlock = removeNestCodeComments(modelsBlock);
	mainFileBlock = removeNestCodeComments(mainFileBlock, true);

	return {
		moduleBlock: moduleBlock ? moduleBlock.trim() : null,
		controllerBlock: controllerBlock ? controllerBlock.trim() : null,
		serviceBlock: serviceBlock ? serviceBlock.trim() : null,
		modelsBlock: modelsBlock ? modelsBlock.trim() : null,
		mainFileBlock: mainFileBlock ? mainFileBlock.trim() : null
	};
}

//split the ai generated code into files and folders
/* async function splitNestCodeIntoFolders(codeString, directory, projectName, urlMapper) {
	//replace all localhost URLs with actual URLs
	if (urlMapper) {
		const urlMapperUrls = Object.keys(urlMapper);
		urlMapperUrls.forEach((url) => {
			codeString = codeString.replace(url, urlMapper[url]);
		});
	}
	const { controllerBlock, moduleBlock, serviceBlock, modelsBlock, mainFileBlock } =
		splitCodeIntoBlocks(codeString);

	const templateSource = path.join(__dirname, '../../../codegen_templates/nestjs');
	copyFolder(templateSource, directory);
	// projectName = projectName.replace(/_/g, '').toUpperCase();
	//Replace default names  with projectName
	// await replaceDefaultTemplateWithProjectName(directory, 'PROJECTNAME', projectName);
	writeToFiles(directory, `src/app.controller.ts`, controllerBlock);
	writeToFiles(directory, `src/app.module.ts`, moduleBlock);
	writeToFiles(directory, `src/app.service.ts`, serviceBlock);
	writeToFiles(directory, `src/app.models.ts`, modelsBlock);
	writeToFiles(directory, `src/main.ts`, mainFileBlock);
} */

async function splitNestCodeIntoFolders(codeString, directory, projectId, urlMapper) {
	if (urlMapper) {
		const urlMapperUrls = Object.keys(urlMapper);
		urlMapperUrls.forEach((url) => {
			codeString = codeString.replace(url, urlMapper[url]);
		});
	}
	const templateLocation = path.join(__dirname, '../../../codegen_templates/nestjs');
	copyFolder(templateLocation, directory);

	codeString = JSON.parse(codeString);

	function saveCodeToFile(filename, code) {
		const filePath = path.join(directory, filename);
		const directoryPath = path.dirname(filePath);
		if (!fs.existsSync(directoryPath)) {
			fs.mkdirSync(directoryPath, { recursive: true });
		}
		fs.writeFileSync(filePath, code);
	}

	// Iterate over each key-value pair in the response JSON
	for (const filename in codeString) {
		if (codeString.hasOwnProperty(filename)) {
			let code = codeString[filename];
			if (filename === 'src/app.module.ts') {
				let oldAppModuleTemplateCode = fs.readFileSync(path.join(directory, filename));
				const prompt = `Merge my two files code which are numbered 1) and 2) below..
				1) ${oldAppModuleTemplateCode}
				2) ${code}
				Give me the final Merged code as output without any informational sentences.  I need just the final code.
				`;
				code = await getChatCompletion(prompt);
				code = removeNestCodeComments(code);
				console.log('final app.module Code', code);
			}
			if (filename === 'src/main.ts' && !code.includes('dotenv')) {
				const dotenvCode = `import {config} from 'dotenv'\nconfig()\n`;
				code = dotenvCode + code;
			}
			saveCodeToFile(filename, code);
		}
	}
	await saveEnvContent(directory, projectId);
	console.log('nestjs code saved to', directory);
}

async function saveEnvContent(directory, projectId) {
	const project = await Projects.findOne({ projectId }, { dbDetails: 1 });
	const { dbDetails } = project;
	const { server, username, portNo, database } = dbDetails;
	const ENVContent = `DB_HOST=${server}
DB_PORT=${portNo}
DB_USERNAME=${username}
DB_PASSWORD='your db password here..'
DB_NAME=${database}\n
	`;
	const envFilePath = directory + '/.env';
	fs.writeFileSync(envFilePath, ENVContent);
}

module.exports = {
	splitNestCodeIntoFolders,
	saveEnvContent
};
