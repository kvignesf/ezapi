const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const config = require('../authentication/config');
let privateKEY = fs.readFileSync('./private.key', 'utf8');
const Products = require('./products');
const freeprojectslimit = process.env.FREEPROJECTS_LIMIT;
const allowedProjectsLimit = 2;
const { DESIGN_PROJECTS, TEST_PROJECTS, NO_SPECNO_DB, AGGREGATE_PROJECTS } = process.env;

const userSchema = new mongoose.Schema(
	{
		user_id: {
			type: String,
			unique: true,
			required: true,
			default: ''
		},
		firstName: {
			type: String,
			required: true,
			default: ''
		},
		billing_address: {
			type: Object,
			required: false,
			default: ''
		},
		lastName: {
			type: String,
			required: false,
			default: ''
		},
		email: {
			type: String,
			unique: true,
			required: false,
			lowercase: true,
			trim: true,
			default: ''
		},
		linkedinID: {
			type: String,
			required: false,
			default: ''
		},
		linkedinToken: {
			type: String,
			required: false,
			default: ''
		},
		githubId: {
			type: String,
			required: false,
			default: ''
		},
		githubToken: {
			type: String,
			required: false,
			default: ''
		},
		ssoID: {
			type: String,
			required: false,
			default: ''
		},
		ssoToken: {
			type: String,
			required: false,
			default: ''
		},
		connection_type: {
			type: String,
			required: false,
			default: ''
		},
		organization_id: {
			type: String,
			required: false,
			default: ''
		},
		organization_name: {
			type: String,
			required: false,
			default: ''
		},
		connection_id: {
			type: String,
			required: false,
			default: ''
		},
		expiresOn: {
			type: String,
			required: false,
			default: ''
		},
		tokens: [String],
		stripeCustomerId: {
			type: String,
			required: false,
			default: ''
		},
		subscription_id: {
			type: String,
			required: false,
			default: ''
		},
		subscribed_price: {
			type: String,
			required: false,
			default: ''
		},
		subscribed_plan: {
			type: String,
			required: false,
			default: ''
		},
		initializeFlag: {
			type: Boolean,
			required: false,
			default: true
		},
		is_superuser: {
			type: Boolean,
			required: false,
			default: false
		},
		subscription_ends_at: {
			type: String,
			required: false,
			default: ''
		},
		freeProjects: { type: Number, required: false, default: freeprojectslimit }, //In production by default freeProjects should be 3
		allowedProjects: { type: Number, required: false },
		sampleProjCount: { type: Number, required: false, default : 0 },
		sampleAdvWorksDBProjCnt: { type: Number, required: false, default : 0 },
		sampleMFlixDBProjCnt: { type: Number, required: false, default : 0 },
		lastLogin: { type: String, required: false, default: '' },
		registeredOn: {
			type: String,
			required: true
		},
		resetOn: {
			type: String,
			required: false			
		},
		group: {
			type: String,
			required: false,
			default: 'regular'
		},
		noSpecNoDb: {
			type: Number,
			required: true,
			default: NO_SPECNO_DB || 999
		},
		designProjects: {
			type: Number,
			required: true,
			default: DESIGN_PROJECTS || 4
		},
		testProjects: {
			type: Number,
			required: true,
			default: TEST_PROJECTS || 4
		},
		aggregateProjects: {
			type: Number,
			required: true,
			default: AGGREGATE_PROJECTS || 4
		}
	},
	{ collection: 'userdata' }
);

//Generate jwt
userSchema.methods.generateJwt = async function () {
	const user = this;
	const token = jwt.sign({ user: user.user_id }, privateKEY, config.signOptions);
	user.tokens = [...user.tokens, token];
	await user.save();

	return token;
};

userSchema.pre('save', async function () {
	if (this.isNew) {
		const product = await Products.findOne({ stripe_product_id: { $exists: false } });
		if (product) {
			this.designProjects = product.designProjects;
			this.testProjects = product.testProjects;
			this.noSpecNoDb = product.noSpecNoDb;
			this.aggregateProjects = product.aggregateProjects;
		}
	}
});

//hiding private data
userSchema.methods.getPublicProfile = function () {
	const user = this;
	const userObject = user.toObject();
	delete userObject.tokens;
	delete userObject.linkedinID;
	delete userObject.githubToken;
	delete userObject.githubId;
	delete userObject.linkedinToken;
	delete userObject.expiresOn;
	delete userObject._id;
	delete userObject.is_superuser;
	delete userObject.ssoID;
	delete userObject.ssoToken;

	return userObject;
};

const User = mongoose.model('userdata', userSchema);

module.exports = User;
