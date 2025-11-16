const express = require('express');
const router = new express.Router();
const { v4: uuidv4 } = require('uuid');

const Directory = require('../models/collectionDirectory');
const Request = require('../models/collectionRequest');
//To create a folder or file
router.post('/collectionDirectory', async (req, res) => {
	try {
		const dir = new Directory({
			id: req.body.id,
			userId: req.body.userId,
			name: req.body.name,
			type: req.body.type,
			parentFolderId: req.body.parentFolderId
		});
		const post = await dir.save();
		res.status(200).send(post);
	} catch (err) {
		res.send(err);
	}
});

//To delete a folders or files
router.delete('/collectionDirectory/:userId/:id', async (req, res) => {
	const userId = req.params.userId;
	const id = req.params.id;
	let requestFiles = [];

	const deleteFolder = async (folderId) => {
		// Delete the folder
		await Directory.deleteOne({ userId: userId, id: folderId });

		// Find all child folders
		const childFolders = await Directory.find({ userId: userId, parentFolderId: folderId });

		// Recursively delete child folders and their contents
		for (const childFolder of childFolders) {
			if (childFolder.type === 'File') {
				requestFiles.push(childFolder.id);
			}
			await deleteFolder(childFolder.id);
		}

		// Delete requests associated with the folder
		await Request.deleteMany({ userId: userId, parentFolderId: folderId });
	};

	try {
		// Find the root folder to delete
		const rootFolder = await Directory.findOne({ userId: userId, id: id });

		if (!rootFolder) {
			res.status(404).send({ message: 'Folder not found' });
			return;
		}

		// Delete the root folder and its contents recursively
		await deleteFolder(rootFolder.id);

		res.status(200).send({
			message: 'Folder and its contents deleted successfully',
			requestFiles
		});
	} catch (err) {
		res.status(500).send({ error: err.message });
	}
});

//To update name of a folder or file
router.put('/collectionDirectory/:userId/:id', async (req, res) => {
	try {
		const id = req.params.id;
		const userId = req.params.userId;
		const newName = req.body.name;
		let updatedFile;
		if (req.body.name) {
			updatedFile = await Directory.updateOne(
				{ userId: userId, id: req.params.id },
				{ $set: { name: newName } }
			);
		}
		if (req.body.parentFolderId) {
			updatedFile = await Directory.updateOne(
				{ userId: userId, id: req.params.id },
				{
					$set: {
						parentFolderId: req.body.parentFolderId
					}
				}
			);
		}

		if (!updatedFile) {
			return res.status(404).send({ error: 'File not found' });
		}
		res.status(200).send({ message: 'Renamed successfully' });
	} catch (err) {
		res.send(err);
	}
});

//To get all folders and files
router.get('/collectionDirectory/:userId', async (req, res) => {
	try {
		const data = await Directory.find({ userId: req.params.userId, parentFolderId: '0' });
		const files = await Directory.find({ userId: req.params.userId, type: 'File' });

		if (!data || !files) {
			res.status(200).send({ message: 'No data present' });
		} else {
			res.status(200).send({ data, files });
		}
	} catch (err) {
		res.send(err);
	}
});

// route
router.get('/collectionDirectory/:userId/:id', async (req, res) => {
	const userId = req.params.userId;
	const id = req.params.id;

	const buildFolderTree = (parentId, folders, requestFiles) => {
		const childFolders = folders.filter(
			(childFolder) => childFolder.parentFolderId === parentId
		); // Filter child folders based on parentFolderId
		const childFolderTree = childFolders.map((childFolder) => {
			if (childFolder.type == 'File') {
				const request = requestFiles.filter((request) => request.id == childFolder.id);
				return {
					name: childFolder.name,
					request: request[0].request
				};
			} else {
				return {
					name: childFolder.name,
					items: buildFolderTree(childFolder.id, folders, requestFiles) // Recursively build child folder tree
				};
			}
		});
		return childFolderTree; // Return array of child folders
	};
	try {
		const folders = await Directory.find({ userId: userId }); // Fetch folder from MongoDB
		const rootFolder = await Directory.find({ userId: userId, id: id });
		const requestFiles = await Request.find({ userId: userId });

		const exportData = rootFolder.map((rootFolder) => ({
			conektto_collection_id: id,
			name: rootFolder.name,
			items: buildFolderTree(rootFolder.id, folders, requestFiles)
		}));

		if (!exportData) {
			res.status(200).send({ message: 'No data present' });
		} else {
			res.status(200).send({ exportData: exportData[0] });
		}
	} catch (err) {
		res.send(err);
	}
});

router.get('/collectionDirectory/getTreeStructure/:userId', async (req, res) => {
	const userId = req.params.userId;
	const buildFolderTree = (parentId, folders) => {
		const childFolders = folders.filter(
			(childFolder) => childFolder.parentFolderId === parentId
		); // Filter child folders based on parentFolderId
		const childFolderTree = childFolders.map((childFolder) => {
			if (childFolder.type == 'File') {
				return {
					id: childFolder.id,
					name: childFolder.name,
					type: childFolder.type,
					parentFolderId: childFolder.parentFolderId
				};
			} else {
				return {
					id: childFolder.id,
					name: childFolder.name,
					type: childFolder.type,
					parentFolderId: childFolder.parentFolderId,
					items: buildFolderTree(childFolder.id, folders) // Recursively build child folder tree
				};
			}
		});
		return childFolderTree; // Return array of child folders
	};
	try {
		const folders = await Directory.find({ userId: userId }); // Fetch folders from MongoDB
		const rootFolders = folders.filter((folder) => !folder.parentFolderId); // Filter root level folders (parentFolderId is not present)

		const treeStructure = rootFolders.map((rootFolder) => ({
			id: rootFolder.id,
			name: rootFolder.name,
			type: rootFolder.type,
			parentFolderId: rootFolder.parentFolderId,
			items: buildFolderTree(rootFolder.id, folders)
		}));

		if (!treeStructure) {
			res.status(200).send({ message: 'No data present' });
		} else {
			res.status(200).send({ treeStructure });
		}
	} catch (err) {
		res.send(err);
	}
});

router.get('/collectionDirectory/:userId/:type/:id', async (req, res) => {
	try {
		const data = await Directory.find({
			userId: req.params.userId,
			parentFolderId: req.params.id
		});
		let result;
		if (req.params.type === 'file') {
			try {
				const getParentFolderNames = (fileId, folders) => {
					const folder = folders.find((file) => file.id === fileId); // Find the folder by its ID
					const parentFolderNames = [];
					if (folder) {
						parentFolderNames.push(folder.name);
						let currentFolder = folder;

						while (currentFolder.parentFolderId) {
							// Traverse the tree structure recursively until we reach the root folder
							const parentFolder = folders.find(
								(folder) => folder.id === currentFolder.parentFolderId
							);
							if (parentFolder) {
								parentFolderNames.push(parentFolder.name);
								currentFolder = parentFolder;
							} else {
								break; // Stop if we can't find the parent folder
							}
						}
					}

					return parentFolderNames;
				};
				const folders = await Directory.find({
					userId: req.params.userId
				});
				result = getParentFolderNames(req.params.id, folders);
			} catch (err) {
				// Handle any errors that occur during the aggregation
				console.error(err);
				res.status(500).json({ error: 'Internal Server Error' });
			}
		}
		if (!data && !result) {
			res.status(200).send({ message: 'No data present' });
		} else {
			res.status(200).send({ data, result });
		}
	} catch (err) {
		res.send(err);
	}
});

//router to handle imported files
router.post('/collectionDirectory/upload', async (req, res) => {
	try {
		const data = req.body.jsonData;
		// if (data.conektto_collection_id) {
		// 	const rootFolderId = data.conektto_collection_id;
		// 	const parentFolder = await Directory.findById(rootFolderId);
		// 	if (parentFolder.id === data.conektto_collection_id) {
		// 		res.status(200).send({ message: 'data present' });
		// 		return;
		// 	}
		// }
		const collectionName = data.name ? data.name : 'New Collection';
		const id = uuidv4();
		const dir = new Directory({
			id: id,
			userId: req.body.userId,
			name: collectionName,
			type: 'Collection',
			parentFolderId: '0'
		});
		await dir.save();

		let counter = 0; // Initialize a counter variable

		// Modify the property names to match the required structure recursively
		async function uploadFilesAndFolders(item, parentFolderId) {
			if (item.items) {
				const newId = uuidv4(); //Date.now() + counter++; // Generate a unique ID using the counter
				const dir = new Directory({
					id: newId,
					userId: req.body.userId,
					name: item.name,
					type: 'Folder',
					parentFolderId: parentFolderId
				});
				await dir.save();
				item.items.forEach((item) => uploadFilesAndFolders(item, newId));
			} else {
				const newId = uuidv4(); //Date.now() + counter++; // Generate a unique ID using the counter
				if (item.request.url === item.name) {
					item.name = 'New Request';
				}
				const currentDate = new Date();
				const formattedDateTime = currentDate.toLocaleString('en-GB', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit'
				});

				const dir = new Directory({
					id: newId,
					userId: req.body.userId,
					name: item.name,
					type: 'File',
					parentFolderId: parentFolderId
				});

				const request = new Request({
					id: newId,
					userId: req.body.userId,
					request: item.request,
					name: item.name,
					onSave: true,
					parentFolderId: parentFolderId,
					isRecent: false,
					createAt: formattedDateTime,
					modifiedAt: formattedDateTime
				});
				await dir.save();
				await request.save();
			}
		}

		data.items.forEach((item) => uploadFilesAndFolders(item, id));
		return res.status(200).send('data uploaded successfully');
	} catch (err) {
		return res.send(err);
	}
});
module.exports = router;
