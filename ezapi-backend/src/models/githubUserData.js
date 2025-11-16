const mongoose = require('mongoose');

const GithubUserSchema = new mongoose.Schema({

	userName: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true
	},
	accessToken: {
		type: String,
		required: true
	}
});

const GitHubUserData = mongoose.model('githubUserData', GithubUserSchema);

module.exports = GitHubUserData;
