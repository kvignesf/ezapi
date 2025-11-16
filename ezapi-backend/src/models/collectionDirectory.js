const mongoose = require('mongoose');

const directorySchema = mongoose.Schema({
	id: {
		type: String,
		required: true
	},
	userId: {
		type: String,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	type: {
		type: String,
		required: true
	},
	parentFolderId: {
		type: String
	}
});

const Directory = mongoose.model('collectionDirectories', directorySchema);

module.exports = Directory;
