const fs = require('fs');

function deleteFolderRecursive(path) {
	if (fs.existsSync(path)) {
		fs.readdirSync(path).forEach((file) => {
			const currentPath = `${path}/${file}`;

			if (fs.lstatSync(currentPath).isDirectory()) {
				deleteFolderRecursive(currentPath);
			} else {
				fs.unlinkSync(currentPath);
			}
		});
		fs.rmdirSync(path);
	}
}

function copyFolder(source, destination) {
	if (!fs.existsSync(destination)) {
		fs.mkdirSync(destination, { recursive: true });
	} else {
		// Clear the destination directory before copying
		deleteFolderRecursive(destination);
		fs.mkdirSync(destination, { recursive: true });
	}

	const files = fs.readdirSync(source);

	files.forEach((file) => {
		const currentSource = `${source}/${file}`;
		const currentDestination = `${destination}/${file}`;

		if (fs.lstatSync(currentSource).isDirectory()) {
			copyFolder(currentSource, currentDestination);
		} else {
			fs.copyFileSync(currentSource, currentDestination);
		}
	});
}

async function deleteFile(directory, file) {
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
}

function writeToFiles(directory, file, code) {
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
}

module.exports = {
	copyFolder,
	deleteFile,
	writeToFiles,
	deleteFolderRecursive
};
