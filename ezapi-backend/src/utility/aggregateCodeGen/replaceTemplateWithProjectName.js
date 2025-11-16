const fs = require('fs');
const path = require('path');

/* module.exports = async function (rootFolder, defaultText, projectName) {
	function traverseDirectory(folderPath) {
		const files = fs.readdirSync(folderPath);

		files.forEach((file) => {
			const filePath = path.join(folderPath, file);
			const stat = fs.statSync(filePath);

			if (stat.isDirectory()) {
				traverseDirectory(filePath); // Recursively traverse subdirectories
			} else if (stat.isFile()) {
				// Replace word in file names
				const updatedFileName = file.replace(defaultText, projectName);
				const updatedFilePath = path.join(folderPath, updatedFileName);
				fs.renameSync(filePath, updatedFilePath);

				// Replace word in file contents
				const fileContent = fs.readFileSync(updatedFilePath, 'utf8');
				const regex = new RegExp(defaultText, 'g');
				const updatedContent = fileContent.replace(regex, projectName);
				fs.writeFileSync(updatedFilePath, updatedContent, 'utf8');
			}
		});
	}

	// Traverse the root folder and update files
	traverseDirectory(rootFolder);

	console.log('File updates complete.');
}; */

module.exports = async function (rootFolder, defaultText, projectName) {
	function traverseDirectory(folderPath) {
		const files = fs.readdirSync(folderPath);

		files.forEach((file) => {
			const filePath = path.join(folderPath, file);
			const stat = fs.statSync(filePath);

			if (stat.isDirectory()) {
				traverseDirectory(filePath); // Recursively traverse subdirectories
			} else if (stat.isFile()) {
				// Replace word in file names
				const updatedFileName = file.replace(defaultText, projectName);
				const updatedFilePath = path.join(folderPath, updatedFileName);
				fs.renameSync(filePath, updatedFilePath);
			}
		});

		// After renaming files in the folder, check if the folder name needs to be updated
		const folderName = path.basename(folderPath);
		const updatedFolderName = folderName.replace(defaultText, projectName);
		if (folderName !== updatedFolderName) {
			const updatedFolderPath = path.join(path.dirname(folderPath), updatedFolderName);
			fs.renameSync(folderPath, updatedFolderPath);
		}
	}

	function replaceTextInFiles(folderPath) {
		const files = fs.readdirSync(folderPath);

		files.forEach((file) => {
			const filePath = path.join(folderPath, file);
			const stat = fs.statSync(filePath);

			if (stat.isDirectory()) {
				replaceTextInFiles(filePath); // Recursively traverse subdirectories
			} else if (stat.isFile()) {
				// Replace word in file contents
				const fileContent = fs.readFileSync(filePath, 'utf8');
				const regex = new RegExp(defaultText, 'g');
				const updatedContent = fileContent.replace(regex, projectName);
				fs.writeFileSync(filePath, updatedContent, 'utf8');
			}
		});
	}

	// First, traverse the root folder and update file and folder names
	traverseDirectory(rootFolder);

	// Second, traverse the root folder again and update file contents
	replaceTextInFiles(rootFolder);

	console.log('File updates complete.');
};
