const mongoose = require('mongoose');

const STATUS = [
	'IN_PROGRESS',
	'COMPLETE',
	'SPEC_ERROR',
	'DB_ERROR',
	'MATCHER_ERROR',
	'SPEC_UPLOAD_ERROR',
	'DB_UPLOAD_ERROR'
];

const PROJECT_BILLING_PLAN_VALUES = ['COMMUNITY', 'TRIAL', 'BASIC', 'PRO', 'NONE', 'POC'];
const PROJECT_TYPE_VALUES = ['both', 'db', 'schema', 'noinput', 'aggregate'];

const memberslimit = process.env.MEMBERS_LIMIT;
const publishlimit = process.env.PUBLISH_LIMIT;

const publishStatusSchema = new mongoose.Schema(
	{
		success: {
			type: Boolean
		},
		message: {
			type: String,
			default: ''
		}
	},
	{ _id: false }
);

const resourcesSchema = new mongoose.Schema(
	{
		resource: {
			type: String,
			ref: 'resources' //creates a relationship to user document
		}
	},
	{ _id: false }
);

const membersSchema = new mongoose.Schema(
	{
		email: {
			type: String
		},
		accepted: {
			type: Boolean,
			default: false
		},
		user: {
			type: String,
			ref: 'userdata'
		},
		firstName: {
			type: String
		},
		lastName: {
			type: String
		},
		role: {
			type: String,
			default: 'guest',
			enum: ['admin', 'guest']
		}
	},
	{ timestamps: true, _id: false }
);

const apiSpecsShcema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		file: { type: String, required: true }
	},
	{ timestamps: true, _id: false }
);

const dbShcema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		file: { type: String, required: true }
	},
	{ timestamps: true, _id: false }
);

const pricingVersionShcema = new mongoose.Schema(
	{
		productName: { type: String, required: false },
		productVersion: { type: String, required: false }
	},
	{ timestamps: false, _id: false }
);

const githubPushSchema = new mongoose.Schema(
	{
		userName: { type: String, required: false },
		repoName: { type: String, required: false },
		branchName: { type: String, required: false },
		commitSha: { type: String, required: false }
	},
	{ timestamps: true, _id: false }
);

const projectsShcema = new mongoose.Schema(
	{
		projectId: {
			type: String,
			unique: true,
			required: true
		},
		projectName: { type: String, required: true },
		isDeleted: { type: Boolean, default: 'false' },
		dbType: {
			type: String
		},
		author: {
			type: String,
			required: true,
			ref: 'userdata' //creates a relationship to user document
		},
		projectType: {
			type: String,
			enum: PROJECT_TYPE_VALUES
		},
		status: { type: String, default: 'IN_PROGRESS', enum: STATUS },
		codegen: { type: Boolean, default: false },
		codeFramework: {
			node: {
				type: String,
				enum: ['express', 'nestjs']
			},
			python: {
				type: String,
				enum: ['flask']
			},
			dotnet: {
				type: String,
				enum: ['dotnetcore 6']
			},
			java: {
				type: String,
				enum: ['springboot']
			}
		},
		dotnetcodegen: { type: Boolean, default: false },
		pythoncodegen: { type: Boolean, default: false },
		nodecodegen: { type: Boolean, default: false },
		publishStatus: {
			SpecGeneration: publishStatusSchema,
			ArtefactGeneration: publishStatusSchema,
			SankyGeneration: publishStatusSchema
		},
		apiSpec: [apiSpecsShcema],
		dbSchema: [dbShcema],
		membersLimit: { type: Number, required: false, default: memberslimit }, // 1 admin + 5 guest members
		members: [membersSchema],
		resources: [resourcesSchema],
		githubPushData: [githubPushSchema],
		isConnectDB: { type: Boolean, required: false, default: false },
		datagen_count: { type: Number, required: false, default: 0 },
		datagen_perf_count: { type: Number, required: false, default: 0 },
		dbDetails: { type: Object, required: false },
		projectBillingPlan: {
			type: String,
			required: false,
			default: 'COMMUNITY',
			enum: PROJECT_BILLING_PLAN_VALUES
		},
		publishLimit: { type: Number, required: false, default: publishlimit },
		publishCount: { type: Number, required: false, default: 0 },
		pricingVersions: [pricingVersionShcema], // Product pricing that was active while project creation
		lastDataGenerated: { type: String, required: false, default: null },
		lastDataGenRequestOffline: { type: Boolean, required: false, default: false },
		lastGenType: { type: String, required: false, default: null },
		isDesign: { type: Boolean, required: true, default: true },
		isDefaultSpecDb: { type: Boolean, default: false },
		githubCommit: { type: String, required: false, default: 'noData' },
		isAggregate: { type: Boolean, required: false, default: false },
		linkedProjects: {
			type: Array,
			required: false
		}
	},
	{ timestamps: true }
);

const Projects = mongoose.model('projects', projectsShcema);

module.exports = Projects;
