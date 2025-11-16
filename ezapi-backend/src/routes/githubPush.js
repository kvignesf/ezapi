let GitHub = require('github-api');
let fs = require('fs');
const express = require('express');
const router = new express.Router();
const path = require('path');
const { default: axios } = require('axios');
const githubUserData = require('../models/githubUserData');
const Projects = require('../models/projects');

// NOT USING THIS ENDPOINT USE : /pushToGithub
router.post('/push_to_github', async (req, res) => {
	let branchName = req.body.branch;
	let userName = req.body.username;
	let directory = req.body.directory;
	let repoName = req.body.reponame;
	let projectId = req.body.projectid;
	let token = req.headers['authorization'] || req.headers['x-access-token'];

	if (!token) {
		// missing token
		return res.sendStatus(401);
	}

	if (!(branchName && userName && directory && repoName && projectId)) {
		return res.sendStatus(400);
	}

	const query = { $and: [{ projectId: projectId }, { isDeleted: false }] };
	const project = await Projects.findOne(query);

	if (!project) {
		return res.status(404).send({ error: 'PROJECT_NOT_FOUND' });
	}

	// For this library to work , we atleast need one commit , so committing a welcome.txt file

	const options1 = {
		method: 'POST',
		url: `https://api.github.com/repos/${userName}/${repoName}/contents/welcome.txt`,
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`
		},
		data: {
			message: 'sample commit',
			committer: {
				name: 'Tarun',
				email: 'tarun.t@cumulations.com'
			},
			content: 'V2VsY29tZSB0byBDb25la3R0byEK' // 'welcome to connektto' in base64 encoded version
		}
	};

	axios
		.request(options1)
		.then(function (response) {
			console.log(response.data);
		})
		.catch(function (error) {
			console.error(error);
		});

	function flatten(lists) {
		return lists.reduce((a, b) => a.concat(b), []);
	}

	function getDirectories(srcpath) {
		return fs
			.readdirSync(srcpath)
			.map((file) => path.join(srcpath, file))
			.filter((path) => fs.statSync(path).isDirectory());
	}

	function getDirectoriesRecursive(srcpath) {
		return [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];
	}

	let allDirs = getDirectoriesRecursive(directory);
	let filePaths = [];
	for (let i = 0; i < allDirs.length; i++) {
		if (!String(allDirs[i]).includes('git')) {
			filePaths.push(String(allDirs[i]).replace(/\\/g, '/'));
		}
	}

	/*

    // INITIAL HARDCODED JAVA DIRS

    let javaDirectories = [

        "proj_P7_code",
        "proj_P7_code/src/main/docker/grafana/provisioning/dashboards",
        "proj_P7_code/src/test/java/com/ezapi/api/repository/timezone",
        "proj_P7_code/src/main/docker",
        "proj_P7_code/src/main/docker/prometheus",
        "proj_P7_code/src/main/java/com/ezapi/api/aop/logging",
        "proj_P7_code/src/main/java/com/ezapi/api/client",
        "proj_P7_code/src/main/java/com/ezapi/api/config",
        "proj_P7_code/src/main/java/com/ezapi/api/domain",
        "proj_P7_code/src/main/java/com/ezapi/api/security",
        "proj_P7_code/src/main/java/com/ezapi/api/security/jwt",
        'proj_P7_code/src/main/java/com/ezapi/api/service',
        "proj_P7_code/src/main/java/com/ezapi/api/service/mapper",
        "proj_P7_code/src/main/java/com/ezapi/api/repository",
        "proj_P7_code/src/main/java/com/ezapi/api/service/dto",
        "proj_P7_code/src/main/java/com/ezapi/api",
        "proj_P7_code/src/main/resources/config/liquibase/fake-data",
        "proj_P7_code/src/main/java/com/ezapi/api/web/rest/vm",
        "proj_P7_code/src/main/resources/config/liquibase/changelog",
        "proj_P7_code/src/main/resources",
        "proj_P7_code/src/main/docker/grafana/provisioning/datasources", //done
        "proj_P7_code/src/test/java/com/ezapi/api/service/mapper",
        "proj_P7_code/src/main/resources/config",
        "proj_P7_code/src/main/docker/jib",
        "proj_P7_code/src/main/resources/config/liquibase",
        "proj_P7_code/src/main/java/com/ezapi/api/web/rest/errors",
        "proj_P7_code/src/main/java/com/ezapi/api/service/impl",
        "proj_P7_code/src/main/resources/config/tls",
        "proj_P7_code/src/main/resources/i18n",
        'proj_P7_code/src/test/java/com/ezapi/api/security/jwt',
        "proj_P7_code/src/main/resources/static",
        "proj_P7_code/src/main/resources",
        "proj_P7_code/src/main/java/com/ezapi/api/web/rest",
        "proj_P7_code/src/main/resources/templates",
        "proj_P7_code/src/test/java/com/ezapi/api",
        'proj_P7_code/src/test/java/com/ezapi/api/config',
        "proj_P7_code/src/test/java/com/ezapi/api/config/timezone",
        "proj_P7_code/src/test/java/com/ezapi/api/domain",
        "proj_P7_code/src/test/java/com/ezapi/api/security",
        "proj_P7_code/src/test/java/com/ezapi/api/service/dto",
        "proj_P7_code/src/test/java/com/ezapi/api/web/rest",
        "proj_P7_code/src/test/java/com/ezapi/api/web/rest/errors",
        'proj_P7_code/src/test/resources',
        "proj_P7_code/src/test/resources/config",

    ]
    */

	for (let file = 0; file < filePaths.length; file++) {
		pushFilesFromDirectory(filePaths[file]);
		await delay(4000); // to avoid merge conflicts
	}

	function pushFilesFromDirectory(dirName) {
		let filenames;
		let directory_name = dirName;
		try {
			filenames = fs.readdirSync(directory_name);
		} catch (e) {
			console.log(e.message);
			return;
		}
		let directories = [];
		let files = [];

		filenames.forEach((file) => {
			try {
				content = fs.readFileSync(directory_name + '/' + file);
				files.push(file);
			} catch (e) {
				directories.push(file);
			}
		});

		// making them globally available

		let fileContentObj = [];
		let content;
		let filePath;

		for (let i = 0; i < directories.length; i++) {
			filePath = directory_name + '/' + directories[i];
			try {
				content = fs.readFileSync(filePath).toString();
			} catch (e) {
				console.log('Skipping a directory if found');
			}
			let obj = {
				content: content,
				path: filePath
			};
			if (
				filePath.endsWith('src') ||
				filePath.endsWith('.git') ||
				typeof content == 'undefined'
			) {
				continue; // filepath malformation fix
			}
			fileContentObj.push(obj);
		}
		let api = new GithubAPI({ token: token });
		api.setRepo(userName, repoName);
		api.setBranch(branchName)
			.then(() => {
				api.pushFiles('pushing files from API', fileContentObj);
			})
			.then(function () {
				console.log('Files committed!');
			});
	}

	function GithubAPI(auth) {
		let repo;
		let filesToCommit = [];
		let currentBranch = {};
		let newCommit = {};

		this.gh = new GitHub(auth);

		this.setRepo = function () {};
		this.setBranch = function () {};
		this.pushFiles = function () {};
		function getCurrentCommitSHA() {}
		function getCurrentTreeSHA() {}
		function createFiles() {}
		function createFile() {}
		function createTree() {}
		function createCommit() {}
		function updateHead() {}

		this.setRepo = function (userName, repoName) {
			repo = this.gh.getRepo(userName, repoName);
		};

		this.setBranch = function (branchName) {
			return repo.listBranches().then((branches) => {
				let branchExists = branches.data.find((branch) => branch.name === branchName);
				if (!branchExists) {
					return repo.createBranch('master', branchName).then(() => {
						currentBranch.name = branchName;
					});
				} else {
					currentBranch.name = branchName;
				}
			});
		};

		this.pushFiles = function (message, files) {
			return getCurrentCommitSHA()
				.then(getCurrentTreeSHA)
				.then(() => createFiles(files))
				.then(createTree)
				.then(() => createCommit(message))
				.then(updateHead)
				.catch((e) => {
					console.error(e);
				});
		};

		function getCurrentCommitSHA() {
			return repo.getRef('heads/' + currentBranch.name).then((ref) => {
				currentBranch.commitSHA = ref.data.object.sha;
			});
		}

		function getCurrentTreeSHA() {
			return repo.getCommit(currentBranch.commitSHA).then((commit) => {
				currentBranch.treeSHA = commit.data.tree.sha;
			});
		}

		function createFiles(files) {
			let promises = [];
			let length = files.length;

			for (let i = 0; i < length; i++) {
				promises.push(createFile(files[i]));
			}
			return Promise.all(promises);
		}

		function createFile(file) {
			return repo.createBlob(file.content).then((blob) => {
				filesToCommit.push({
					sha: blob.data.sha,
					path: file.path,
					mode: '100644',
					type: 'blob'
				});
			});
		}

		function createTree() {
			return repo.createTree(filesToCommit, currentBranch.treeSHA).then((tree) => {
				newCommit.treeSHA = tree.data.sha;
			});
		}

		function createCommit(message) {
			return repo
				.commit(currentBranch.commitSHA, newCommit.treeSHA, message)
				.then((commit) => {
					newCommit.sha = commit.data.sha;
				});
		}

		function updateHead() {
			return repo.updateHead('heads/' + currentBranch.name, newCommit.sha);
		}
	}

	// first push case
	let githubPushDetails = { userName: userName, repoName: repoName, branchName: branchName };
	Projects.findOneAndUpdate(
		{ projectId: projectId },
		{ $push: { githubPushData: githubPushDetails } },
		function (error, success) {
			if (error) {
				console.log(error);
			} else {
				console.log(success);
			}
		}
	);
	/*
            const prevGitPushData = project.githubPushData ? project.githubPushData : [];
			project.resources = [...prevGitPushData, { userName : userName, repoName :repoName,branchName:branchName }];
			await project.save();
            */

	res.send('PUSHED TO GITHUB');
});

router.post('/create_branch', async (req, res) => {
	let userName = req.body.username;
	let repoName = req.body.reponame;
	let branchName = req.body.branch;

	let token = req.headers['authorization'] || req.headers['x-access-token'];

	// For this library to work , we atleast need one commit , so committing a welcome.txt file

	const options1 = {
		method: 'POST',
		url: `https://api.github.com/repos/${userName}/${repoName}/contents/welcome.txt`,
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`
		},
		data: {
			message: 'sample commit',
			committer: {
				name: 'Tarun',
				email: 'tarun.t@cumulations.com'
			},
			content: 'V2VsY29tZSB0byBDb25la3R0byEK' // 'welcome to connektto' in base64 encoded version
		}
	};

	axios
		.request(options1)
		.then(function (response) {
			console.log(response.data);
		})
		.catch(function (error) {
			console.error(error);
		});

	if (!token) {
		return res.send(401);
	}

	if (!(userName && repoName)) {
		return res.send(400);
	}

	let response = await axios
		.get(`https://api.github.com/repos/${userName}/${repoName}/git/refs/heads`)
		.then((res) => res.data)
		.catch((error) => {
			throw error;
		});

	let branchHash = response[0].object.sha;

	const options = {
		method: 'POST',
		url: `https://api.github.com/repos/${userName}/${repoName}/git/refs`,
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`
		},
		data: {
			ref: `refs/heads/${branchName}`,
			sha: branchHash
		}
	};

	axios
		.request(options)
		.then(function (response) {
			console.log(response.data);
		})
		.catch(function (error) {
			console.error(error);
		});

	res.send('branch created successfully');
});

router.post('/create_repo', (req, res) => {
	let repoName = req.body.reponame;
	let description = req.body.description;
	let token = req.headers['authorization'] || req.headers['x-access-token'];

	if (!token) {
		return res.sendStatus(401);
	}

	if (!(repoName && description)) {
		return res.sendStatus(400);
	}

	const options = {
		method: 'POST',
		url: `https://api.github.com/user/repos`,
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`
		},
		data: {
			name: repoName,
			description: description,
			homepage: 'https://github.com',
			private: false,
			is_template: false
		}
	};

	axios
		.request(options)
		.then(function (response) {
			console.log(response.data);
		})
		.catch(function (error) {
			console.error(error);
		});

	res.send('Repo created successfully');
});

router.post('/view_repo', async (req, res) => {
	let projectId = req.body.projectid;
	if (!projectId) {
		if (!res.headersSent) {
			return res.sendStatus(400);
		}
	}
	// verifying project
	const query = { $and: [{ projectId: projectId }, { isDeleted: false }] };
	const project = await Projects.findOne(query);
	if (!project) {
		return res.status(404).send({ error: 'PROJECT_NOT_FOUND' });
	}
	let url;
	try {
		let latestPushData = project.githubPushData[project.githubPushData.length - 1];
		let userName = latestPushData.userName;
		let repoName = latestPushData.repoName;
		// example url : https://github.com/tarunsraina/BikeStore
		url = 'https://github.com/' + userName + '/' + repoName;
		console.log(url);
	} catch (e) {
		if (!res.headersSent) {
			return res.sendStatus(500);
		}
	}
	res.send({ repo_url: url });
});

router.post('/github_auth_token', async (req, res) => {
	let code = req.body.code;

	let github_access_token;

	if (!code) {
		return res.sendStatus(401);
	}

	const options = {
		method: 'POST',
		// client ID and client SECRET are hardcoded for now for testing, using from env file later
		url: `https://github.com/login/oauth/access_token?client_id=5d1d5dfe113cdee9b700&client_secret=7d95d7f719ea1146474a72887357dd451551adde&code=${code}`,
		headers: {
			Accept: 'application/vnd.github+json'
		},
		data: {
			code: code
		}
	};

	await axios
		.request(options)
		.then(function (response) {
			github_access_token = response.data.access_token;
		})
		.catch(function (error) {
			console.error(error);
			return res.sendStatus(500);
		});

	const options1 = {
		method: 'GET',
		url: `https://api.github.com/user`,
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${github_access_token}`
		}
	};

	await axios
		.request(options1)
		.then(async function (response) {
			//console.log("response:")
			let userName = response.data.login;
			let email = response.data.email;

			if (!github_access_token) {
				return res.sendStatus(401);
			} else {
				// mongo updation/insertion code , keeping for future ref
				/*
                console.log("ooooooooo")
                githubUserData.exists({userName:userName},(err,exists)=>{
                    console.log(exists)
                    if(exists){
                        // update the accessToken
                        githubUserData.updateOne({userName:userName},{ "$set": { "accessToken": github_access_token } },(err,updatedResult)=>{
                            if(err){
                                console.log(err);
                            }
                        })
                    }else{
                        let githubUser = new githubUserData({userName:userName,email:email,accessToken:github_access_token})
                        githubUser.save();
                    }
                })
            */

				return res.send({
					username: userName,
					email: email,
					access_token: github_access_token
				});
			}
		})
		.catch(function (error) {
			// console.error(error);
			return res.sendStatus(500);
		});
});

router.post('/pushToGithub', async (req, res) => {
	let code = req.body.code;
	let projectId = req.body.projectid;
	let userName;
	let github_access_token;
	let branchName;
	let directory = process.env.DIRECTORY_LOCATION;
	let repoExists;

	try {
		const PUSHTO_GITHUB_CLIENT_ID = process.env.GITHUB_OAUTH_CLIENT_ID;
		const PUSHTO_GITHUB_CLIENT_SECRET = process.env.GITHUB_OAUTH_CLIENT_SECRET;

		// verifying project
		const query = { $and: [{ projectId: projectId }, { isDeleted: false }] };
		const project = await Projects.findOne(query);
		if (!project) {
			return res.status(404).send({ error: 'PROJECT_NOT_FOUND' });
		}
		let publishCnt = Number(project.publishCount);

		updateCommitStatus('CommitInProgress', projectId);

		// setting repo name using the project name from mongoDB
		let repoName = project.projectName;
		console.log('repoName,', repoName);
		let description = repoName + ' - Files pushed from conektto platform';
		if (!code) {
			return res.sendStatus(401);
		}
		// authentication - token
		const options = {
			method: 'POST',
			// client ID and client SECRET are hardcoded for now for testing, using from env file later
			url: `https://github.com/login/oauth/access_token?client_id=${PUSHTO_GITHUB_CLIENT_ID}&client_secret=${PUSHTO_GITHUB_CLIENT_SECRET}&code=${code}`,
			headers: {
				Accept: 'application/vnd.github+json'
			}
		};
		await axios
			.request(options)
			.then(function (responset) {
				github_access_token = responset.data.access_token;
				console.log('1- getting github_access_token');
			})
			.catch(function (error) {
				console.error('1-', error);
				updateCommitStatus('ReadyForPush', projectId);
				return res.sendStatus(500);
			});

		// completed authentication , required AUTH TOKEN is in `github_access_token` - get UserName
		const UserNameOptions = {
			method: 'GET',
			url: `https://api.github.com/user`,
			headers: {
				Accept: 'application/vnd.github+json',
				Authorization: `Bearer ${github_access_token}`
			}
		};

		await axios
			.request(UserNameOptions)
			.then(function (responseu) {
				//console.log("responseu", responseu.data.login)
				userName = responseu.data.login;
				console.log('2- getting github username');
			})
			.catch(function (error) {
				console.error('2-', error);
				updateCommitStatus('ReadyForPush', projectId);
				return res.sendStatus(500);
			});

		if (!github_access_token) {
			return res.sendStatus(401);
		}
		if (!(userName && directory)) {
			return res.sendStatus(400);
		}

		repoExists = await chkRepoExists(userName, repoName, github_access_token);
		if (repoExists === 404) {
			console.log('3-create repo since it doesnt exist');
			await createRepoAndInitCommit(userName, repoName, description, github_access_token);
		} else if (repoExists === 200) {
			console.log('3-Repo exists, chng visibility options for the repo');
			await chngeRepoVisibility(userName, repoName, 'false', github_access_token);
		}

		await delay(2000);

		// create a new branch if target branch is not main

		branchName = 'version-' + publishCnt;
		let response3 = await axios
			.get(`https://api.github.com/repos/${userName}/${repoName}/git/refs/heads`)
			.then((res) => res.data)
			//.then(function(resp) { console.log("resp", resp)})
			.catch(async (error) => {
				updateCommitStatus('ReadyForPush', projectId);
				try {
					await chngeRepoVisibility(userName, repoName, 'true', github_access_token);
				} catch (error) {
					console.log('5E-error while changing repo visibility');
					throw error;
				}

				throw error;
			});
		let branchHash = response3[0].object.sha;
		const options3 = {
			method: 'POST',
			url: `https://api.github.com/repos/${userName}/${repoName}/git/refs`,
			headers: {
				Accept: 'application/vnd.github+json',
				Authorization: `Bearer ${github_access_token}`
			},
			data: {
				ref: `refs/heads/${branchName}`,
				sha: branchHash
			}
		};
		await axios
			.request(options3)
			.then(function (response3) {
				console.log('6- new branch ' + branchName + ' created successfully');
			})
			.catch(async function (error) {
				updateCommitStatus('ReadyForPush', projectId);
				try {
					await chngeRepoVisibility(userName, repoName, 'true', github_access_token);
				} catch (error) {
					console.log('6E-error while changing repo visibility');
					throw error;
				}
				console.error('6-error while creating new branch ' + branchName, error.message);
			});

		//Push files
		if (typeof branchName == 'undefined') {
			branchName = 'main';
		}

		await delay(2000);

		pushToGithub(userName, repoName, directory, branchName, projectId, github_access_token);
	} catch (error) {
		updateCommitStatus('ReadyForPush', projectId);
		return res.sendStatus(500);
	}

	/* console.log("Total missed Dirs:"+totalMissedDirs);
    if(totalMissedDirs==0){
        res.send("SUCCESSFULLY PUSHED TO GITHUB");
    }else{
        res.status(206).send("PARTIAL SUCCESS | "+"MISSED DIRECTORIES :"+totalMissedDirs);
    } */

	res.send('SUCCESSFULLY PUSHED TO GITHUB');
});

async function chngeRepoVisibility(userName, repoName, visibilityLevel, github_access_token) {
	const visibilityOptions = {
		method: 'PATCH',
		url: `https://api.github.com/repos/${userName}/${repoName}`,
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${github_access_token}`
		},
		data: {
			private: visibilityLevel
		}
	};
	await axios
		.request(visibilityOptions)
		.then(function (response4) {
			console.log('4-visibility options changed to private ' + visibilityLevel);
		})
		.catch(function (error) {
			console.error(
				'4-error while changing visibility options for private ' + visibilityLevel,
				error.message
			);
			throw error;
		});
}

async function getCommitSha(userName, repoName, github_access_token) {
	let commitSha;

	const commitShaOptions = {
		method: 'GET',
		url: `https://api.github.com/repos/${userName}/${repoName}/commits`,
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${github_access_token}`
		}
	};

	await axios
		.request(commitShaOptions)
		.then(function (response) {
			console.log('Gettting commit sha successful');
			commitSha = response.data[0].sha;
		})
		.catch(function (error) {
			console.error('error while getting commit sha', error.message);
			throw error;
		});

	return commitSha;
}

async function createRepoAndInitCommit(userName, repoName, description, github_access_token) {
	let respRepoCrt;
	let respInitCmmt;
	const options1 = {
		method: 'POST',
		url: `https://api.github.com/user/repos`,
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${github_access_token}`
		},
		data: {
			name: repoName,
			description: description,
			homepage: 'https://github.com',
			private: false,
			is_template: false
		}
	};

	await axios
		.request(options1)
		.then(function (response1) {
			console.log('4-create repo successfull');
			respRepoCrt = response1.status;
		})
		.catch(function (error) {
			console.error('4-error while creating repo', error.message);
			throw error;
		});

	// repo is created successfully with repoName
	// For this library to work , we atleast need one commit , so committing a welcome.txt file

	await delay(2000);
	if (respRepoCrt == 201) {
		const options2 = {
			method: 'PUT',
			url: `https://api.github.com/repos/${userName}/${repoName}/contents/welcome.txt`,
			headers: {
				Accept: 'application/vnd.github+json',
				Authorization: `Bearer ${github_access_token}`
			},
			data: {
				message: 'sample commit',
				committer: {
					name: 'Conektto',
					email: 'admin@Conektto.io'
				},
				content: 'V2VsY29tZSB0byBDb25la3R0byEK' // 'welcome to connektto' in base64 encoded version
			}
		};

		await axios
			.request(options2)
			.then(function (response2) {
				respInitCmmt = response2.status;
				console.log('5-initial commit successfull');
			})
			.catch(function (error) {
				console.error('5-error while creating init commit', error.message, error);
				throw error;
			});
	}
}

async function chkRepoExists(userName, repoName, github_access_token) {
	let searchURL = 'https://github.com/' + userName + '/' + repoName;
	let foundRepo = false;

	const optChkRepo = {
		//method: 'HEAD',
		//url: `https://github.com/repos/${userName}/${repoName}`,
		method: 'GET',
		url: `https://api.github.com/user/repos?type=private`,
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${github_access_token}`
		}
	};
	/* let repoResp;
    try {
        let res = await axios.request(optChkRepo)
        console.log("res..",res.status)
        repoResp = res.status
    }

    catch (error) {

        if (error.response) {
            console.log("..err.response", error.response)
            repoResp = error.response.status
        }
    };
    return repoResp*/
	await axios
		.request(optChkRepo)
		.then(function (checkRepoResponse) {
			for (let i = 0; i < checkRepoResponse.data.length; i++) {
				if (checkRepoResponse.data[i].html_url == searchURL) {
					foundRepo = true; // found the repo
				}
			}
			console.log('2a-repo exists..', foundRepo);
		})
		.catch(function (error) {
			console.error('2a-error while checking repos', error.message, error);
			updateCommitStatus('ReadyForPush', projectId);
			throw error;
		});

	if (foundRepo) {
		console.log('Repo exist already');
		return 200;
	} else {
		console.log('Repo does not exist');
		return 404;
	}
}

async function updateCommitStatus(status, projectId) {
	await Projects.findOneAndUpdate(
		{ projectId: projectId },
		{ $set: { githubCommit: status } },
		{ useFindAndModify: false }
	);
}

async function pushToGithub(userName, repoName, directory, branchName, projectId, token) {
	directory = directory + '/' + projectId;
	let dirsPushCount = 0;
	let totalFiles = 0;

	//updateCommitStatus("CommitInProgress", projectId)

	function flatten(lists) {
		return lists.reduce((a, b) => a.concat(b), []);
	}

	function getDirectories(srcpath) {
		return fs
			.readdirSync(srcpath)
			.map((file) => path.join(srcpath, file))
			.filter((path) => fs.statSync(path).isDirectory());
	}

	function getDirectoriesRecursive(srcpath) {
		return [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];
	}

	let allDirs = getDirectoriesRecursive(directory);
	let filePaths = [];
	for (let i = 0; i < allDirs.length; i++) {
		if (!String(allDirs[i]).includes('git')) {
			filePaths.push(String(allDirs[i]).replace(/\\/g, '/'));
		}
	}

	console.log('7-filePaths..', filePaths);
	console.log('8-No of dirs to be committed..', filePaths.length);
	for (let file = 0; file < filePaths.length; file++) {
		pushFilesFromDirectory(filePaths[file]);
		await delay(5000); // to avoid merge conflicts
	}

	function pushFilesFromDirectory(dirName) {
		let filenames;
		let directory_name = dirName;
		try {
			filenames = fs.readdirSync(directory_name);
		} catch (e) {
			console.log(e.message);
		}
		let directories = [];
		let files = [];

		filenames.forEach((file) => {
			try {
				content = fs.readFileSync(directory_name + '/' + file);
				totalFiles++;
				files.push(file);
			} catch (e) {
				directories.push(file);
			}
		});

		// making them globally available

		let fileContentObj = [];
		let content;
		let filePath;
		let gitFldrPath;

		for (let i = 0; i < directories.length; i++) {
			filePath = directory_name + '/' + directories[i];

			try {
				if (!fs.lstatSync(filePath).isDirectory()) {
					content = fs.readFileSync(filePath).toString();
				}
			} catch (e) {
				console.log('Skipping a directory if found');
			}

			filePathArr = filePath.split(projectId);
			indxend = filePathArr.length;
			folderName = filePathArr[indxend - 1];
			if (folderName.startsWith('/')) {
				gitFldrPath = folderName.substring(1, folderName.length);
			}
			//console.log("gitFldrPath....", gitFldrPath)
			let obj = {
				content: content,
				path: gitFldrPath
			};
			if (
				filePath.endsWith('src') ||
				filePath.endsWith('.git') ||
				filePath.includes('/bin/') ||
				typeof content == 'undefined'
			) {
				continue; // filepath malformation fix
			}

			//console.log("filePath,", obj.path)
			//console.log("content,", obj.content)
			fileContentObj.push(obj);
		}
		let api = new GithubAPI({ token: token });
		api.setRepo(userName, repoName);
		api.setBranch(branchName)
			.then(() => {
				if (fileContentObj.length > 0) {
					api.pushFiles('pushing files from API', fileContentObj);
				}
			})
			.then(function () {
				dirsPushCount++;
				console.log('Files committed!');
			});
	}

	function GithubAPI(auth) {
		let repo;
		let filesToCommit = [];
		let currentBranch = {};
		let newCommit = {};

		this.gh = new GitHub(auth);

		this.setRepo = function () {};
		this.setBranch = function () {};
		this.pushFiles = function () {};
		function getCurrentCommitSHA() {}
		function getCurrentTreeSHA() {}
		function createFiles() {}
		function createFile() {}
		function createTree() {}
		function createCommit() {}
		function updateHead() {}

		this.setRepo = function (userName, repoName) {
			repo = this.gh.getRepo(userName, repoName);
		};

		this.setBranch = function (branchName) {
			return repo.listBranches().then((branches) => {
				let branchExists = branches.data.find((branch) => branch.name === branchName);
				if (!branchExists) {
					return repo.createBranch('master', branchName).then(() => {
						currentBranch.name = branchName;
					});
				} else {
					currentBranch.name = branchName;
				}
			});
		};

		this.pushFiles = function (message, files) {
			return getCurrentCommitSHA()
				.then(getCurrentTreeSHA)
				.then(() => createFiles(files))
				.then(createTree)
				.then(() => createCommit(message))
				.then(updateHead)
				.catch((e) => {
					console.error(e);
				});
		};

		function getCurrentCommitSHA() {
			return repo.getRef('heads/' + currentBranch.name).then((ref) => {
				currentBranch.commitSHA = ref.data.object.sha;
			});
		}

		function getCurrentTreeSHA() {
			return repo.getCommit(currentBranch.commitSHA).then((commit) => {
				currentBranch.treeSHA = commit.data.tree.sha;
			});
		}

		function createFiles(files) {
			let promises = [];
			let length = files.length;

			for (let i = 0; i < length; i++) {
				promises.push(createFile(files[i]));
			}
			return Promise.all(promises);
		}

		function createFile(file) {
			return repo.createBlob(file.content).then((blob) => {
				filesToCommit.push({
					sha: blob.data.sha,
					path: file.path,
					mode: '100644',
					type: 'blob'
				});
			});
		}

		function createTree() {
			return repo.createTree(filesToCommit, currentBranch.treeSHA).then((tree) => {
				newCommit.treeSHA = tree.data.sha;
			});
		}

		function createCommit(message) {
			return repo
				.commit(currentBranch.commitSHA, newCommit.treeSHA, message)
				.then((commit) => {
					newCommit.sha = commit.data.sha;
				});
		}

		function updateHead() {
			return repo.updateHead('heads/' + currentBranch.name, newCommit.sha);
		}
	}

	let commitSha;
	try {
		commitSha = await getCommitSha(userName, repoName, token);
	} catch (error) {
		throw error;
	}
	console.log('9-commmit sha', commitSha);

	// first push case
	let githubPushDetails = {
		userName: userName,
		repoName: repoName,
		branchName: branchName,
		commitSha: commitSha
	};
	Projects.findOneAndUpdate(
		{ projectId: projectId },
		{ $push: { githubPushData: githubPushDetails } },
		{ useFindAndModify: false },
		function (error, success) {
			if (error) {
				console.log(error);
				throw error;
			} else {
				console.log(
					'10-committed all files successfully and updated commit details in db '
				);
			}
		}
	);
	/*
        const prevGitPushData = project.githubPushData ? project.githubPushData : [];
        project.resources = [...prevGitPushData, { userName : userName, repoName :repoName,branchName:branchName }];
        await project.save();
        */

	updateCommitStatus('ReadyForView', projectId);
	try {
		await chngeRepoVisibility(userName, repoName, 'true', token);
	} catch (error) {
		console.log('error while changing repo visibility');
		throw error;
	}
	// filePaths.length  - total directories to be pushed
	// dirsPushCount - number of dirs pushed to github
	let missedDirsCount = filePaths.length - dirsPushCount;
	if (missedDirsCount == 0) {
		console.log('SUCCESSFULLY PUSHED TO GITHUB');
	} else {
		console.log('PARTIAL SUCCESS | ' + 'MISSED DIRECTORIES :' + missedDirsCount);
	}
	//return missedDirsCount;

	//return "SUCCESS";
}

function delay(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = router;
