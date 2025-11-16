const fs = require('fs');
const path = require('path');

const { copyFolder } = require('../files/fileSystem');
const replaceDefaultTemplateWithProjectName = require('./replaceTemplateWithProjectName');

async function dotNetCodeGetControllersAndModels(code) {
	const modelsCode = (code) => {
		const startToken = 'public class';
		const endToken = '}';

		// Find the start index of the second occurrence of 'public class'
		const startIndex = code.indexOf(startToken, code.indexOf(startToken) + startToken.length);
		console.log('startIndex', startIndex);
		// Find the end index of the last occurrence of '}'
		const endIndex = code.lastIndexOf(endToken);
		console.log('endIndex', endIndex);

		// Extract the desired substring
		let substring = code.substring(startIndex, endIndex + endToken.length);
		substring = substring.replace(/```([\s\S]*?)```(.*)/g, '');
		console.log('substring model...', substring);
		return substring;
	};
	const controllersCode = (code) => {
		const startIndex = code.indexOf('public class');
		const endIndex = code.indexOf('public class', startIndex + 1);
		console.log('startIndex contr', startIndex);
		console.log('endIndex cont', endIndex);

		let substring = code.substring(startIndex, endIndex);
		//substring = substring.replace(/```([\s\S]*?)```(.*)/g,"")
		substring = substring.replace(
			/```((?!(?:\r?\n|\r)[\s\S]*?public class)[\s\S]+?)```\s*([\s\S]*?)(?=\r?\n|$)/g,
			''
		);
		console.log('substring controller...', substring);
		return substring;
	};

	const models = modelsCode(code);
	const controllers = controllersCode(code);
	return { models, controllers };
}

async function replaceControllersContentDotNet(filePath, newCode, operationData, urlMapper) {
	const { endpoint } = operationData.data;
	fs.readFile(filePath, 'utf8', (err, data) => {
		if (err) {
			console.error(err);
			return;
		}

		const oldCodeStartIndex = data.indexOf('public class');
		if (oldCodeStartIndex === -1) {
			console.error('Failed to find the target code in the file.');
			return;
		}

		const oldCodeEndIndex = data.indexOf('{', oldCodeStartIndex);
		if (oldCodeEndIndex === -1) {
			console.error('Failed to find the end of the target code in the file.');
			return;
		}

		let modifiedContent =
			data.slice(0, oldCodeStartIndex) + newCode + data.slice(oldCodeEndIndex);
		modifiedContent = modifiedContent.replace('ENDPOINTPATH', endpoint);

		//replace all localhost URLs with actual URLs
		const urlMapperUrls = Object.keys(urlMapper);
		urlMapperUrls.forEach((url) => {
			modifiedContent = modifiedContent.replace(url, urlMapper[url]);
		});

		fs.writeFile(filePath, modifiedContent, 'utf8', (err) => {
			if (err) {
				console.error(err);
				return;
			}

			console.log('File contents replaced successfully.');
		});
	});
}

async function replaceModelsContentDotNet(filePath, newCode) {
	fs.readFile(filePath, 'utf8', (err, data) => {
		if (err) {
			console.error(err);
			return;
		}

		const startIndex = data.indexOf('{');
		const endIndex = data.lastIndexOf('}');

		if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
			console.error(
				'Invalid file contents. Opening and closing braces not found or in the wrong order.'
			);
			return;
		}

		// Insert the models code at the appropriate position
		const modifiedData =
			data.slice(0, startIndex + 1) + '\n' + newCode + '\n' + data.slice(endIndex);

		// Write the modified file contents back to the file
		fs.writeFile(filePath, modifiedData, 'utf8', (err) => {
			if (err) {
				console.error(err);
				return;
			}
			return 'code inserted successfully...';
		});
	});
}

async function splitDotNetCodeIntoFolders(code, urlMapper, projectName, directory, operationData) {
	const { models, controllers } = await dotNetCodeGetControllersAndModels(code);
	const templateSource = path.join(__dirname, '../../../codegen_templates/CsharpAggApi');

	//make a copy from template in directory location
	copyFolder(templateSource, directory);
	projectName = projectName.replace(/_/g, '').toUpperCase();

	//Generate Template with projectName
	await replaceDefaultTemplateWithProjectName(directory, 'CNKTOPROJNMTMP', projectName);
	const controllerFilePath = path.join(directory, `/Controllers/${projectName}Controller.cs`);
	replaceControllersContentDotNet(controllerFilePath, controllers, operationData, urlMapper);
	const modelFilePath = path.join(directory, `/Models/${projectName}Request.cs`);
	replaceModelsContentDotNet(modelFilePath, models);
}

module.exports = {
	dotNetCodeGetControllersAndModels,
	replaceControllersContentDotNet,
	replaceModelsContentDotNet,
	splitDotNetCodeIntoFolders
};
