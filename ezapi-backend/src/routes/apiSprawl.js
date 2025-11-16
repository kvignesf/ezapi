const express = require('express');
const Projects = require('../models/projects');
const Users = require('../models/user');
const OperationData = require('../models/operationData');
const app = express();

app.post('/apiSprawl', async (req, res) => {
	try {
		let isOrgPresent;

		let OrgProjects = {};
		let OrgDuplicates = {};

		let userProjects = {};
		let userDuplicates = {};

		const user = await Users.find({
			user_id: req.body.userId
		});

		function checkRequest(Request1, Request2, projectOperation1, projectOperation2) {
			let RequestPathParams1 = Request1.path;
			let RequestQueryParams1 = Request1.query;
			let RequestFormData1 = Request1.formData;
			let RequestBody1 = Request1.body;

			let RequestPathParams2 = Request2.path;
			let RequestQueryParams2 = Request2.query;
			let RequestFormData2 = Request2.formData;
			let RequestBody2 = Request2.body;

			RequestPathParams1 = sortObjects(RequestPathParams1, 'req');
			RequestQueryParams1 = sortObjects(RequestQueryParams1, 'req');
			RequestFormData1 = sortObjects(RequestFormData1, 'req');

			RequestPathParams2 = sortObjects(RequestPathParams2, 'req');
			RequestQueryParams2 = sortObjects(RequestQueryParams2, 'req');
			RequestFormData2 = sortObjects(RequestFormData2, 'req');

			let compareBody;
			if (RequestBody1 && RequestBody1.properties && RequestBody2 && RequestBody2.properties) {
				RequestBody1 = sortObjects(RequestBody1.properties, 'reqBody');
				RequestBody2 = sortObjects(RequestBody2.properties, 'reqBody');
				compareBody = compareArrays(RequestBody1, RequestBody2, 'reqBody');
			} else if (RequestBody1 && RequestBody1.sourceName && RequestBody2 && RequestBody2.sourceName) {
				compareBody = RequestBody1.sourceName == RequestBody2.sourceName ? true : false;
			} else {
				if (RequestBody1 && RequestBody1.name && RequestBody2 && RequestBody2.name) {
					compareBody = RequestBody1.name == RequestBody2.name ? true : false;
				}
			}

			if (
				RequestPathParams1.length == RequestPathParams2.length &&
				RequestQueryParams1.length == RequestQueryParams2.length &&
				RequestFormData1.length == RequestFormData2.length
			) {
				compareArrays(RequestFormData1, RequestFormData2, 'req');
				if (
					compareArrays(RequestPathParams1, RequestPathParams2, 'req') &&
					compareArrays(RequestQueryParams1, RequestQueryParams2, 'req') &&
					compareArrays(RequestFormData1, RequestFormData2, 'req') &&
					compareBody
				)
					return true;
			}
			return false;
		}

		function checkResponse(
			username1,
			username2,
			projectResponse1,
			projectResponse2,
			projectid1,
			projectid2,
			projectName1,
			projectName2,
			projectOperation1,
			projectOperation2,
			projectEndpoint1,
			projectEndpoint2,
			method,
			mode
		) {
			//properties present
			if (projectResponse1 && projectResponse1.properties && projectResponse2 && projectResponse2.properties) {
				let count = 0;
				let projectResponse1_sorted = sortObjects(
					Object.values(projectResponse1.properties),
					'res'
				);
				let projectResponse2_sorted = sortObjects(
					Object.values(projectResponse2.properties),
					'res'
				);
				if (projectResponse1_sorted.length == projectResponse2_sorted.length) {
					for (let idx = 0; idx < projectResponse1_sorted.length; idx++) {
						if (
							projectResponse1_sorted[idx].selectedColumns &&
							projectResponse2_sorted[idx].selectedColumns
						) {
							//properties present + selectedColumns present
							count += compareArrays(
								projectResponse1_sorted[idx].selectedColumns,
								projectResponse2_sorted[idx].selectedColumns,
								'res'
							);
						} else if (
							!projectResponse1_sorted[idx].selectedColumns &&
							!projectResponse2_sorted[idx].selectedColumns
						) {
							//properties present + selectedColumns not present
							if (
								projectResponse1_sorted[idx].tableName &&
								projectResponse2_sorted[idx].tableName &&
								projectResponse1_sorted[idx].sourceName ==
									projectResponse2_sorted[idx].sourceName &&
								projectResponse1_sorted[idx].tableName ==
									projectResponse2_sorted[idx].tableName &&
								projectResponse1_sorted[idx].required ==
									projectResponse2_sorted[idx].required
							) {
								count += 1;
							} else {
								if (
									projectResponse1_sorted[idx].name ==
									projectResponse2_sorted[idx].name
								) {
									count += 1;
								}
							}
						} else {
							continue;
						}
					}
					if (projectResponse1_sorted.length == count) {
						const projectIds = [];
						const projectOperations = [];

						if (
							projectIds.indexOf(projectid2) == -1 ||
							(projectIds.indexOf(projectid2) != -1 &&
								projectOperations.indexOf(projectOperation2) == -1)
						) {
							setDuplicates(
								username1,
								username2,
								projectid1,
								projectid2,
								projectName1,
								projectName2,
								projectOperation1,
								projectOperation2,
								projectEndpoint1,
								projectEndpoint2,
								method,
								mode
							);
						}
					}
				}
			} else if (!(projectResponse1 && projectResponse1.properties) && !(projectResponse2 && projectResponse2.properties)) {
				// selectedColumns present
				if (projectResponse1 && projectResponse1.selectedColumns && projectResponse2 && projectResponse2.selectedColumns) {
					if (
						projectResponse1.sourceName == projectResponse2.sourceName &&
						projectResponse1.tableName == projectResponse2.tableName &&
						projectResponse1.required == projectResponse2.required
					) {
						const projectIds = [];
						const projectOperations = [];
						if (
							projectIds.indexOf(projectid2) == -1 ||
							(projectIds.indexOf(projectid2) != -1 &&
								projectOperations.indexOf(projectOperation2) == -1)
						) {
							setDuplicates(
								username1,
								username2,
								projectid1,
								projectid2,
								projectName1,
								projectName2,
								projectOperation1,
								projectOperation2,
								projectEndpoint1,
								projectEndpoint2,
								method,
								mode
							);
						}
					}
				}

				// selectedColumns not present
				else if (!(projectResponse1 && projectResponse1.selectedColumns) && !(projectResponse2 && projectResponse2.selectedColumns)) {
					if (projectResponse1 && projectResponse2 && projectResponse1.name && projectResponse2.name && projectResponse1.name == projectResponse2.name) {
						const projectIds = [];
						const projectOperations = [];

						if (
							(projectIds.indexOf(projectid2) != -1 &&
								projectOperations.indexOf(projectOperation2) == -1) ||
							projectIds.indexOf(projectid2) == -1
						) {
							setDuplicates(
								username1,
								username2,
								projectid1,
								projectid2,
								projectName1,
								projectName2,
								projectOperation1,
								projectOperation2,
								projectEndpoint1,
								projectEndpoint2,
								method,
								mode
							);
						}
					}
				}
			}
		}

		function sortObjects(array, type) {
			if (type === 'req') {
				return array.sort((a, b) => {
					const sourceNameA = Object.values(a)[0];
					const sourceNameB = Object.values(b)[0];
					if (sourceNameA.sourceName < sourceNameB.sourceName) {
						return -1;
					}
					if (sourceNameA.sourceName > sourceNameB.sourceName) {
						return 1;
					}
					if (
						!Object.keys(sourceNameA).includes('sourceName') ||
						!Object.keys(sourceNameA).includes('sourceName')
					) {
						if (sourceNameA.name < sourceNameB.name) return -1;
						if (sourceNameA.name > sourceNameB.name) return 1;
					}
					return 0;
				});
			}
			if (type === 'res') {
				return array.sort((a, b) => {
					if (a.sourceName < b.sourceName) return -1;
					if (a.sourceName > b.sourceName) return 1;
					if (
						!Object.keys(a).includes('sourceName') ||
						!Object.keys(b).includes('sourceName')
					) {
						if (a.name < b.name) return -1;
						if (a.name > b.name) return 1;
					}
					return 0;
				});
			}
			if (type == 'reqBody') {
				const sortedArray = Object.fromEntries(
					Object.entries(array).sort(([keyA, valueA], [keyB, valueB]) =>
						valueA.name ? valueA.name.localeCompare(valueB.name) : null
					)
				);
				return sortedArray;
			}
		}

		function compareArrays(arr1, arr2, type) {
			if (type === 'req') {
				// Check if arrays are the same length
				if (arr1.length !== arr2.length) {
					return false;
				}

				// Check if each object in arr1 has a matching object in arr2
				for (let i = 0; i < arr1.length; i++) {
					if (
						arr1[i][Object.keys(arr1[i])[0]].sourceName &&
						arr2[i][Object.keys(arr2[i])[0]].sourceName &&
						(arr1[i][Object.keys(arr1[i])[0]].sourceName !==
							arr2[i][Object.keys(arr2[i])[0]].sourceName ||
							arr1[i][Object.keys(arr1[i])[0]].tableName !==
								arr2[i][Object.keys(arr2[i])[0]].tableName ||
							arr1[i][Object.keys(arr1[i])[0]].required !==
								arr2[i][Object.keys(arr2[i])[0]].required)
					) {
						return false;
					} else if (
						!arr1[i][Object.keys(arr1[i])[0]].sourceName &&
						!arr2[i][Object.keys(arr2[i])[0]].sourceName &&
						arr1[i][Object.keys(arr1[i])[0]].name !==
							arr2[i][Object.keys(arr2[i])[0]].name
					) {
						return false;
					}
				}
				// If we get here, all objects in arr1 have matching objects in arr2
				return true;
			}
			if (type === 'res') {
				if (arr1.length !== arr2.length) {
					return 0;
				}
				for (let i = 0; i < arr1.length; i++) {
					let obj1 = arr1[i];
					let obj2 = arr2[i];
					if (
						obj1.sourceName !== obj2.sourceName ||
						obj1.tableName !== obj2.tableName ||
						obj1.required !== obj2.required
					) {
						return 0;
					} else if (!obj1.sourceName && !obj2.sourceName && obj1.name !== obj2.name) {
						return 0;
					}
				}
				return 1;
			}
			if (type == 'reqBody') {
				// Iterate over each property in obj1
				for (let prop in arr1) {
					// If obj2 doesn't have the same property, return false
					if (!arr2.hasOwnProperty(prop)) {
						return false;
					}
					if (
						arr1[prop].sourceName &&
						arr1[prop].sourceName &&
						(arr1[prop].sourceName !== arr2[prop].sourceName ||
							arr1[prop].tableName !== arr2[prop].tableName ||
							arr1[prop].required !== arr2[prop].required)
					) {
						return false;
					}
					// If the name fields don't match, return false
					if (
						!arr1[prop].sourceName &&
						!arr1[prop].sourceName &&
						arr1[prop].name !== arr2[prop].name
					) {
						return false;
					}
				}
				// If all properties and name fields match, return true
				return true;
			}
		}

		function setDuplicates(
			username1,
			username2,
			projectid1,
			projectid2,
			projectName1,
			projectName2,
			projectOperation1,
			projectOperation2,
			projectEndpoint1,
			projectEndpoint2,
			method,
			mode
		) {
			if (mode == 'user') {
				userDuplicates[`${projectid1}`] = userDuplicates[`${projectid1}`] || {};

				userDuplicates[`${projectid1}`]['projectName'] = projectName1;
				userDuplicates[`${projectid1}`][method] =
					userDuplicates[`${projectid1}`][method] || {};

				userDuplicates[`${projectid1}`][method][projectOperation1] =
					userDuplicates[`${projectid1}`][method][projectOperation1] || {};
				userDuplicates[`${projectid1}`][method][projectOperation1].duplicateIds =
					userDuplicates[`${projectid1}`][method][projectOperation1].duplicateIds || [];

				let result = userDuplicates[`${projectid1}`][method][
					projectOperation1
				].duplicateIds.filter(
					(obj) =>
						obj.projectId === projectid2 &&
						obj.endpoint == projectEndpoint2 &&
						obj.operationId == projectOperation2
				);
				if (result.length < 1) {
					userDuplicates[`${projectid1}`][method][projectOperation1].duplicateIds.push({
						projectId: projectid2,
						projectName: projectName2,
						operationId: projectOperation2,
						endpoint: projectEndpoint2
					});
				}

				userDuplicates[`${projectid1}`][method][projectOperation1].duplicatesCount =
					userDuplicates[`${projectid1}`][method][projectOperation1].duplicateIds.length;
			}
			if (mode == 'org') {
				OrgDuplicates[`${projectid1}`] = OrgDuplicates[`${projectid1}`] || {};

				OrgDuplicates[`${projectid1}`]['projectName'] = projectName1;
				OrgDuplicates[`${projectid1}`]['username'] = username1;
				OrgDuplicates[`${projectid1}`][method] =
					OrgDuplicates[`${projectid1}`][method] || {};

				OrgDuplicates[`${projectid1}`][method][projectOperation1] =
					OrgDuplicates[`${projectid1}`][method][projectOperation1] || {};
				OrgDuplicates[`${projectid1}`][method][projectOperation1].duplicateIds =
					OrgDuplicates[`${projectid1}`][method][projectOperation1].duplicateIds || [];

				let result = OrgDuplicates[`${projectid1}`][method][
					projectOperation1
				].duplicateIds.filter(
					(obj) =>
						obj.projectId === projectid2 &&
						obj.endpoint == projectEndpoint2 &&
						obj.operationId == projectOperation2
				);
				if (result.length < 1) {
					OrgDuplicates[`${projectid1}`][method][projectOperation1].duplicateIds.push({
						projectId: projectid2,
						username: username2,
						projectName: projectName2,
						operationId: projectOperation2,
						endpoint: projectEndpoint2
					});
				}

				OrgDuplicates[`${projectid1}`][method][projectOperation1].duplicatesCount =
					OrgDuplicates[`${projectid1}`][method][projectOperation1].duplicateIds.length;
			}
		}

		if (user[0]['_doc'].organization_name) {
			const users = await Users.find();
			const userData = [];
			mode = 'org';

			for (const doc of users) {
				doc['_doc'].organization_name == user[0]['_doc'].organization_name
					? userData.push({
							userId: doc['_doc'].user_id,
							name: `${doc['_doc'].firstName} ${doc['_doc'].lastName}`
					  })
					: null;
			}
			const userIds = userData.map((user) => user.userId);
			const projects = await Projects.find({
				author: { $in: userIds }
			});

			const all_projects = [];
			for (const idx in projects) {
				const projectName = projects[idx]['_doc'].projectName;
				const createdDate = projects[idx]['_doc'].createdAt;
				const projectId = projects[idx]['_doc'].projectId;
				const username = userData.find(
					(user) => user.userId === projects[idx]['_doc'].author
				).name;

				let result = all_projects.filter((obj) => obj.projectId === projectId);
				if (result < 1) {
					all_projects.push({
						projectId: projectId,
						projectName: projectName,
						createdDate: createdDate,
						username: username
					});
				}
			}

			const user_operationdata = [];
			const operationData = await OperationData.find();

			for (const doc of operationData) {
				for (let i = 0; i < all_projects.length; i++) {
					if (doc.projectid == all_projects[i].projectId) {
						user_operationdata.push(doc['_doc']);
						doc['_doc']['projectName'] = all_projects[i].projectName;
						doc['_doc']['username'] = all_projects[i].username;
						//Creating non Empty Projects
						OrgProjects[`${doc.projectid}`] = OrgProjects[`${doc.projectid}`] || {};
						OrgProjects[`${doc.projectid}`]['projectName'] =
							all_projects[i].projectName;
						OrgProjects[`${doc.projectid}`]['username'] = all_projects[i].username;
						OrgProjects[`${doc.projectid}`]['projectId'] = all_projects[i].projectId;
						OrgProjects[`${doc.projectid}`]['createdDate'] =
							all_projects[i].createdDate;

						OrgProjects[`${doc.projectid}`][`${doc['_doc'].data.endpoint}`] =
							OrgProjects[`${doc.projectid}`][`${doc['_doc'].data.endpoint}`] || {};

						OrgProjects[`${doc.projectid}`][`${doc['_doc'].data.endpoint}`][
							`${doc['_doc'].data.method}`
						] =
							OrgProjects[`${doc.projectid}`][`${doc['_doc'].data.endpoint}`][
								`${doc['_doc'].data.method}`
							] || [];

						OrgProjects[`${doc.projectid}`][`${doc['_doc'].data.endpoint}`][
							`${doc['_doc'].data.method}`
						].push(doc['_doc'].data.operationId);
					}
				}
			}

			OrgProjects = Object.values(OrgProjects).sort(
				(a, b) => new Date(b.createdDate) - new Date(a.createdDate)
			);

			user_operationdata.sort(function (a, b) {
				let x = a['projectid'];
				let y = b['projectid'];
				return x < y ? -1 : x > y ? 1 : 0;
			});

			// Seperating the data WRT to method property
			const separated = {
				get: [],
				post: [],
				put: [],
				patch: [],
				delete: []
			};
			user_operationdata.forEach((obj) => {
				switch (obj.data.method) {
					case 'get':
						separated.get.push(obj);
						break;
					case 'post':
						separated.post.push(obj);
						break;
					case 'put':
						separated.put.push(obj);
						break;
					case 'patch':
						separated.patch.push(obj);
						break;
					case 'delete':
						separated.delete.push(obj);
						break;
					default:
						break;
				}
			});

			for (let start = 0; start < 5; start++) {
				let method = Object.keys(separated)[start];
				for (let i = 0; i < separated[method].length; i++) {
					const project1 = separated[method][i];
					const projectid1 = project1.projectid;
					const projectName1 = project1.projectName;
					const username1 = project1.username;
					const projectOperation1 = project1.data.operationId;
					const projectEndpoint1 = project1.data.endpoint;
					const projectRequest1 = project1.data.requestData;
					const projectResponse1 = project1.data.responseData[0].content;

					for (let j = 0; j < separated[method].length; j++) {
						const project2 = separated[method][j];
						const projectid2 = project2.projectid;
						const projectName2 = project2.projectName;
						const username2 = project2.username;
						const projectOperation2 = project2.data.operationId;
						const projectEndpoint2 = project2.data.endpoint;
						const projectRequest2 = project2.data.requestData;
						const projectResponse2 = project2.data.responseData[0].content;
						if (
							projectid2 == projectid1 &&
							projectEndpoint1 == projectEndpoint2 &&
							projectOperation1 == projectOperation2
						) {
							continue;
						}
						let flag = false;
						flag = checkRequest(
							projectRequest1,
							projectRequest2,
							projectOperation1,
							projectOperation2
						);

						if (flag == true) {
							checkResponse(
								username1,
								username2,
								projectResponse1,
								projectResponse2,
								projectid1,
								projectid2,
								projectName1,
								projectName2,
								projectOperation1,
								projectOperation2,
								projectEndpoint1,
								projectEndpoint2,
								method,
								mode
							);
						}
					}
				}
			}
			isOrgPresent = true;
		} else {
			isOrgPresent = false;
		}

		if (user) {
			const projects = await Projects.find({ author: req.body.userId });
			mode = 'user';
			const all_projects = [];
			for (const idx in projects) {
				const projectName = projects[idx]['_doc'].projectName;
				const createdDate = projects[idx]['_doc'].createdAt;
				const projectId = projects[idx]['_doc'].projectId;
				let result = all_projects.filter((obj) => obj.projectId === projectId);
				if (result < 1) {
					all_projects.push({
						projectId: projectId,
						projectName: projectName,
						createdDate: createdDate
					});
				}
			}

			const user_operationdata = [];
			const operationData = await OperationData.find();
			for (const doc of operationData) {
				for (let i = 0; i < all_projects.length; i++) {
					if (doc.projectid == all_projects[i].projectId) {
						user_operationdata.push(doc['_doc']);
						doc['_doc']['projectName'] = all_projects[i].projectName;

						//Creating non Empty Projects
						userProjects[`${doc.projectid}`] = userProjects[`${doc.projectid}`] || {};
						userProjects[`${doc.projectid}`]['projectName'] =
							all_projects[i].projectName;
						userProjects[`${doc.projectid}`]['projectId'] = all_projects[i].projectId;
						userProjects[`${doc.projectid}`]['createdDate'] =
							all_projects[i].createdDate;

						userProjects[`${doc.projectid}`][`${doc['_doc'].data.endpoint}`] =
							userProjects[`${doc.projectid}`][`${doc['_doc'].data.endpoint}`] || {};

						userProjects[`${doc.projectid}`][`${doc['_doc'].data.endpoint}`][
							`${doc['_doc'].data.method}`
						] =
							userProjects[`${doc.projectid}`][`${doc['_doc'].data.endpoint}`][
								`${doc['_doc'].data.method}`
							] || [];

						userProjects[`${doc.projectid}`][`${doc['_doc'].data.endpoint}`][
							`${doc['_doc'].data.method}`
						].push(doc['_doc'].data.operationId);
					}
				}
			}

			userProjects = Object.values(userProjects).sort(
				(a, b) => new Date(b.createdDate) - new Date(a.createdDate)
			);

			user_operationdata.sort(function (a, b) {
				let x = a['projectid'];
				let y = b['projectid'];
				return x < y ? -1 : x > y ? 1 : 0;
			});

			// Seperating the data WRT to method property
			const separated = {
				get: [],
				post: [],
				put: [],
				patch: [],
				delete: []
			};
			user_operationdata.forEach((obj) => {
				switch (obj.data.method) {
					case 'get':
						separated.get.push(obj);
						break;
					case 'post':
						separated.post.push(obj);
						break;
					case 'put':
						separated.put.push(obj);
						break;
					case 'patch':
						separated.patch.push(obj);
						break;
					case 'delete':
						separated.delete.push(obj);
						break;
					default:
						break;
				}
			});

			for (let start = 0; start < 5; start++) {
				let method = Object.keys(separated)[start];
				for (let i = 0; i < separated[method].length; i++) {
					const project1 = separated[method][i];
					const projectid1 = project1.projectid;
					const projectName1 = project1.projectName;
					const username1 = project1.username;
					const projectOperation1 = project1.data.operationId;
					const projectEndpoint1 = project1.data.endpoint;
					const projectRequest1 = project1.data.requestData;
					let projectResponse1 ;
					if (project1.data && project1.data.responseData[0]) {
						projectResponse1 = project1.data.responseData[0].content;
					}

					for (let j = 0; j < separated[method].length; j++) {
						const project2 = separated[method][j];
						const projectid2 = project2.projectid;
						const projectName2 = project2.projectName;
						const username2 = project2.username;
						const projectOperation2 = project2.data.operationId;
						const projectEndpoint2 = project2.data.endpoint;
						const projectRequest2 = project2.data.requestData;
						let projectResponse2;
						if (project2.data && project2.data.responseData[0]) {
							projectResponse2 = project2.data.responseData[0].content;
						} 
						
						if (
							projectid2 == projectid1 &&
							projectEndpoint1 == projectEndpoint2 &&
							projectOperation1 == projectOperation2
						) {
							continue;
						}
						let flag = false;
						flag = checkRequest(
							projectRequest1,
							projectRequest2,
							projectOperation1,
							projectOperation2
						);

						if (flag == true) {
							checkResponse(
								username1,
								username2,
								projectResponse1,
								projectResponse2,
								projectid1,
								projectid2,
								projectName1,
								projectName2,
								projectOperation1,
								projectOperation2,
								projectEndpoint1,
								projectEndpoint2,
								method,
								mode
							);
						}
					}
				}
			}
		}

		if (isOrgPresent) {
			res.status(200).send({
				OrgProjects,
				OrgDuplicates,
				userProjects,
				userDuplicates,
				isOrgPresent
			});
		} else {
			res.status(200).send({
				userProjects,
				userDuplicates,
				isOrgPresent
			});
		}
	} catch (error) {
		console.log("error in sprawl..", error);
		res.sendStatus(500);
	}
});

module.exports = app;
