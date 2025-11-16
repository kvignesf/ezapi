const mongoose = require('mongoose');

const requestSchema = mongoose.Schema({
	id: {
		type: String,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	userId: {
		type: String,
		required: true
	},
	request: {
		type: mongoose.SchemaTypes.Mixed,
		default: {}
	},
	response: {
		type: mongoose.SchemaTypes.Mixed,
		default: {}
	},
	onSave: {
		type: Boolean,
		default: false
	},
	parentFolderId: {
		type: String
	},
	isRecent: {
		type: Boolean,
		default: false
	},
	createdAt: {
		type: String
	},
	modifiedAt: {
		type: String
	}
});

const collectionsRequest = mongoose.model('collectionsRequest', requestSchema);

module.exports = collectionsRequest;
