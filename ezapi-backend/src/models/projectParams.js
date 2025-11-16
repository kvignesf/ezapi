const mongoose = require('mongoose');

const ParamsSchema = new mongoose.Schema(
	{
		id: {
			type: String,
			required: true
		},
		name: {
			type: String,
			unique: true,
			required: true
		},
		type: {
			type: String,
			required: true
		},
		commonName: { type: String },
		format: { type: String },
		description: {
			type: String,
			required: true
		},
		required: {
			type: Boolean,
			required: true
		},
		possibleValues: [String]
	},
	{ _id: false }
);

const ProjectParamsSchema = new mongoose.Schema({
	projectId: {
		type: String,
		required: true
	},
	data: [ParamsSchema]
});

const ProjectParams = mongoose.model('projectParams', ProjectParamsSchema);

module.exports = ProjectParams;
