const fs = require('fs');
const path = require('path');

const { copyFolder } = require('../files/fileSystem');
const replaceDefaultTemplateWithProjectName = require('./replaceTemplateWithProjectName');
const { saveEnvContent } = require('./nestCodeGen');

//Remove unwanted comments and informational sentences
const removeNodeCodeComments = (code, mainFile = false) => {
	const startString = 'const';
	const endString = mainFile ? ')' : '}';

	const startIndex = code.indexOf(startString);
	const endIndex = code.lastIndexOf(endString) + 1;

	return code.substring(startIndex, endIndex);
};

//replace all fileNames and innerCode in template with  projectName
function replaceDefaultTemplateContent(filePath, content) {
	console.log('content', content);
	fs.writeFile(filePath, content, 'utf8', (err) => {
		if (err) {
			console.error('Error writing file:', err);
		} else {
			console.log('File content replaced successfully.');
		}
	});
}

//split the ai generated code into files and folders
async function splitNodeExpressCodeIntoFolders(
	codeString,
	directory,
	projectName,
	projectId,
	urlMapper
) {
	//replace all localhost URLs with actual URLs
	if (urlMapper) {
		const urlMapperUrls = Object.keys(urlMapper);
		urlMapperUrls.forEach((url) => {
			codeString = codeString.replace(url, urlMapper[url]);
		});
	}
	const parts = codeString.split(/#MODELS#|#CONTROLLERS#|#INDEX#/);
	let modelsCode = parts[1].trim();
	let controllersCode = parts[2].trim();
	let indexCode = parts[3].trim();

	modelsCode = removeNodeCodeComments(modelsCode);
	controllersCode = removeNodeCodeComments(controllersCode);
	indexCode = removeNodeCodeComments(indexCode, true);

	console.log('replacedIndex', indexCode);

	const templateSource = path.join(__dirname, '../../../codegen_templates/nodeExpress');
	copyFolder(templateSource, directory);
	projectName = projectName.replace(/_/g, '').toUpperCase();
	//Replace default names  with projectName
	await replaceDefaultTemplateWithProjectName(directory, 'PROJECTNAME', projectName);
	replaceDefaultTemplateContent(path.join(directory, `/models/${projectName}.js`), modelsCode);
	replaceDefaultTemplateContent(
		path.join(directory, `/controllers/${projectName}.js`),
		controllersCode
	);
	replaceDefaultTemplateContent(path.join(directory, `/index.js`), indexCode);
	await saveEnvContent(directory, projectId);
}

module.exports = {
	replaceDefaultTemplateContent,
	removeNodeCodeComments,
	splitNodeExpressCodeIntoFolders
};
