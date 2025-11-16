const express = require('express');
const mongoose = require('mongoose');
const _ = require('lodash');

const router = new express.Router();

const authenticate = require('../authentication/authentication');
const authorize = require('../authentication/authorization');

const Projects = require('../models/projects');
const AggregateCards = require('../models/aggregateCards');
const AggregateMappings = require('../models/aggregateMappings');
const AggregateMetadata = require('../models/aggregateMetadata');
const AggregateResponseMappings = require('../models/aggregateResponseMapping');
const OperationData = require('../models/operationData');

const {
	getAggregateCardsSchema,
	getAggregateCardSchema,
	postAggregateCardSchema,
	putAggregateCardSchema,
	deleteAggregateCardSchema,
	mappingDataSchema
} = require('../middlewares/validators/aggregateapi');
const validate = require('../middlewares/validators/validateRequest');
const expressionParser = require('../utility/rawExpressionParse');
const emitSocket = require('../utility/emitSocket');

router.get('/system-api', authenticate, async (req, res) => {
	try {
		const { user_id } = req;
		let projects = await Projects.aggregate([
			{
				$match: {
					author: user_id,
					isDeleted: false
				}
			},
			{
				$lookup: {
					from: 'resources',
					localField: 'resources.resource',
					foreignField: 'resourceId',
					as: 'resources'
				}
			},
			{
				$sort: {
					updatedAt: -1
				}
			},
			{
				$project: {
					projectName: 1,
					resources: 1
				}
			}
		]);
		if (projects) {
			projects = projects.map((project) => {
				project.name = project.projectName;
				delete project.projectName;
				project.resources.map((resource) => {
					resource.name = resource.resourceName;
					delete resource.resourceName;
					const operations = [];
					resource.path.map((path) => {
						path.operations.map((op) => {
							op.name = op.operationName;
							delete op.operationName;
							op.pathName = path.pathName;
							op.pathId = path.pathId;
							operations.push(op);
							return op;
						});
						return path;
					});
					delete resource.path;
					resource.operations = operations;
					return resource;
				});

				return project;
			});
			return res.status(200).send(projects);
		}
		throw new Error('No projects found...');
	} catch (err) {
		res.status(400).send({ message: err.message });
	}
});

// we may need this endpoint in request response mapping
router.get(
	'/aggregateCards',
	authenticate,
	authorize,
	validate(getAggregateCardsSchema, false),
	async (req, res) => {
		try {
			const { operationId, projectId } = req.query;
			const aggregationCards = await AggregateCards.find(
				{ operationId, projectId },
				{}
			).lean();
			if (aggregationCards) return res.status(200).send({ data: aggregationCards });
			throw new Error('Invalid OperationId or empty Data');
		} catch (err) {
			return res.status(400).send({ message: err.message });
		}
	}
);

router.get(
	'/aggregateCard/:cardId',
	authenticate,
	authorize,
	validate(getAggregateCardSchema, false),
	async (req, res) => {
		try {
			const { cardId } = req.params;
			const { operationId, projectId } = req.query;
			const card = await AggregateCards.findOne({
				_id: cardId,
				operationId,
				projectId
			}).lean();
			if (card && (card.runData || card.branchData || card.mainData)) {
				return res.status(200).send(card);
			}
			if (card && card.systemApi) {
				const { operationDataId } = card.systemApi;
				const operationData = await OperationData.findOne({ id: operationDataId }).lean();
				card.systemApi = { ...card.systemApi, ...operationData.data };
				card.systemApi.url = card.systemApi.endpoint;
				delete card.systemApi.endpoint;
				return res.status(200).send(card);
			}
			throw new Error('card not found or Invalid cardId');
		} catch (err) {
			return res.status(400).send({ message: err.message });
		}
	}
);

router.post(
	'/aggregateCard',
	authenticate,
	authorize,
	validate(postAggregateCardSchema),
	async (req, res) => {
		try {
			const {
				projectId,
				operationId,
				systemApi,
				type,
				name,
				parentNode,
				inputNodeIds,
				runData,
				branchData,
				filterData,
				mainData,
				responsePayloadData
			} = req.body;
			const card = await AggregateCards.create({
				projectId,
				operationId,
				systemApi,
				type,
				name,
				parentNode,
				inputNodeIds,
				runData,
				branchData,
				filterData,
				mainData,
				responsePayloadData
			});
			return res.status(200).send({ message: 'ok', data: card });
		} catch (err) {
			return res.status(400).send({ message: err.message });
		}
	}
);

router.put(
	'/aggregateCard/:cardId',
	authenticate,
	authorize,
	validate(putAggregateCardSchema),
	async (req, res) => {
		try {
			let { cardId } = req.params;
			cardId = mongoose.Types.ObjectId(cardId);
			const {
				projectId,
				operationId,
				systemApi,
				type,
				name,
				parentNode,
				inputNodeIds,
				runData,
				branchData,
				filterData,
				mainData,
				responsePayloadData
			} = req.body;
			if (branchData && branchData.conditions) {
				const conditions = branchData.conditions.map((cond) => {
					if (cond.rawExpression) {
						const parsedExpression = expressionParser(cond.rawExpression);
						cond.parsedExpression = parsedExpression;
						return cond;
					}
					return cond;
				});
				branchData.conditions = conditions;
			}

			const filters = {
				_id: cardId,
				operationId,
				projectId
			};

			const query = {
				type,
				name,
				parentNode,
				inputNodeIds,
				runData,
				branchData: branchData || {},
				systemApi: systemApi || {},
				filterData: filterData || {},
				mainData: mainData || {},
				responsePayloadData: responsePayloadData || {}
			};

			const isResponsePayLoadCard = responsePayloadData
				? Object.keys(responsePayloadData).length > 0
				: false;
			if (isResponsePayLoadCard) {
				const { customMapping, cardId } = responsePayloadData;
				if (!customMapping && cardId) {
					const mappedCardResponse = await AggregateCards.findOne(
						{ _id: cardId, type: 'externalAPINode' },
						{ runData: 1 }
					).lean();
					if (mappedCardResponse) {
						const { data } = mappedCardResponse.runData.output;
						responsePayloadData.data = data;
						emitSocket(req, data, 'payloadCardResponse');
					}
				}
			}
			const data = await AggregateCards.findOneAndUpdate(
				filters,
				{ $set: query },
				{ returnDocument: 'after' }
			);

			//updateTargetCard using filterData
			const isFilterDataExist = filterData ? Object.keys(filterData).length > 0 : false;
			if (isFilterDataExist) {
				updateCardUsingFilter(cardId, req);
			}

			if (data) {
				return res.status(200).send({ message: 'ok', data });
			}
			return res.status(200).send({ message: 'no changes found' });
		} catch (err) {
			return res.status(400).send({ message: err.message });
		}
	}
);

router.delete(
	'/aggregateCard/:cardId',
	authenticate,
	authorize,
	validate(deleteAggregateCardSchema, false),
	async (req, res) => {
		try {
			let { cardId } = req.params;
			const {
				projectId,
				operationId,
				updatedAggregateMetadata: aggregateMetadata,
				updatedResponseMapper: responseMapper
			} = req.body;
			const { responseHeaders, responseBody } = responseMapper;

			const { nodes, edges } = aggregateMetadata;

			const findQuery = { projectId, operationId };
			const node = await AggregateCards.findOne({ _id: cardId }).lean();
			if (!node) throw new Error('invalid cardId');

			/* if node is filterNode => get targetNode and run complete logic for targetNode else run complete logic
			for the externalAPINode and if parentNode is filterNode, delete filterNode */
			let targetCardId;
			if (node.type === 'filterNode') {
				targetCardId = node.filterData.targetNodeId;
				await AggregateCards.deleteOne({ _id: cardId });
			} else if (node.type === 'externalAPINode') {
				const parentNodeId = node.parentNode;
				if (parentNodeId) {
					const { type: parentNodeType } = await AggregateCards.findOne(
						{ _id: parentNodeId },
						{ type: 1 }
					).lean();
					if (parentNodeType === 'filterNode') {
						await AggregateCards.deleteOne({ _id: parentNodeId });
					}
				}
			}
			cardId = targetCardId || cardId;
			const result = await resetSyncedValues(cardId);
			if (result.reset) {
				const deleteAllLinkedMappings = await deleteMappingsOfLinkedCards(cardId);
			}

			await AggregateCards.deleteOne({
				_id: cardId
			});
			await AggregateMappings.deleteOne({
				cardId
			});
			await AggregateMetadata.updateOne(findQuery, { $set: { nodes, edges } });

			await AggregateResponseMappings.updateOne(findQuery, {
				$set: { responseHeaders, responseBody }
			});
			res.status(200).send({ message: 'ok' });
		} catch (err) {
			res.status(400).send({ message: err.message });
		}
	}
);

router.get(
	'/mappingData/:cardId',
	authenticate,
	authorize,
	validate(mappingDataSchema),
	async (req, res) => {
		try {
			const { cardId } = req.params;
			const { operationId, projectId: projectid } = req.query;

			//get OperationData
			const { data: aggregateApi } = await OperationData.findOne(
				{ id: operationId, projectid },
				{ data: 1 }
			).lean();
			const excludedFields = `-projectId -operationId`;

			//get cardData for each inputNodeId
			let aggregateCard = await AggregateCards.findById(cardId)
				.populate({
					path: 'inputNodeIds',
					select: excludedFields
				})
				.lean();
			aggregateCard.inputNodeIds.forEach((node) => {
				delete node._v;
				delete node.inputNodeIds;
				delete node.runData._id;
			});

			if (aggregateCard)
				return res.status(200).send({ aggregateApi, cardData: aggregateCard });
			throw new Error('Invalid OperationId or empty Data');
		} catch (err) {
			return res.status(400).send({ message: err.message });
		}
	}
);

//Update targetCardData Using Filter
async function updateCardUsingFilter(filterCardId, req) {
	try {
		const filterCard = await AggregateCards.findOne(
			{ _id: filterCardId },
			{ filterData: 1 }
		).lean();
		const { sourceNodeId, targetNodeId, replacedFields, excludedFields } =
			filterCard.filterData;

		const sourceCard = await AggregateCards.findOne({ _id: sourceNodeId }).lean();

		const sourceCardOutputData = sourceCard.runData;
		replacedFields.forEach((obj) => {
			const { attributeRef: ref } = obj;
			const modifiedRef = ref.replace(`${sourceNodeId}.output`, 'output.data');

			//check if the path contains a loop
			const isLoopPath = /\[[^\]]*\]/.test(modifiedRef);
			if (isLoopPath) {
				const segments = modifiedRef.split(/\[.*?\]./);
				replaceFieldsUsingLoop(sourceCardOutputData, segments, 0);
			} else {
				_.set(sourceCardOutputData, modifiedRef, '');
			}
		});

		excludedFields.forEach((obj) => {
			const { attributeRef: ref } = obj;
			const modifiedRef = ref.replace(`${sourceNodeId}.output`, 'output.data');

			//check if the path contains a loop
			const isLoopPath = /\[[^\]]*\]/.test(modifiedRef);
			if (isLoopPath) {
				const segments = modifiedRef.split(/\[.*?\]./);
				excludeFieldsUsingLoop(sourceCardOutputData, segments, 0);
			} else {
				_.unset(sourceCardOutputData, modifiedRef);
			}
		});

		const targetCardData = await AggregateCards.findOneAndUpdate(
			{ _id: targetNodeId },
			{
				'runData.body': {
					data: sourceCardOutputData.output.data
				}
			},
			{
				returnOriginal: false
			}
		);

		//emit socket Event once filterUpdate is done..
		const socketData = {
			cards: {
				[targetNodeId]: targetCardData
			}
		};
		emitSocket(req, socketData, 'filterUpdateDone');
		return targetCardData;
	} catch (err) {
		return { err: err.message };
	}
}

function replaceFieldsUsingLoop(data, segments, currentIndex) {
	if (currentIndex === segments.length - 1) {
		_.set(data, segments[currentIndex], '');
	} else {
		const currentArray = _.get(data, segments[currentIndex]);
		_.forEach(currentArray, (obj) => {
			replaceFieldsUsingLoop(obj, segments, currentIndex + 1);
		});
	}
}

function excludeFieldsUsingLoop(data, segments, currentIndex) {
	if (currentIndex === segments.length - 1) {
		_.unset(data, segments[currentIndex]);
	} else {
		const currentArray = _.get(data, segments[currentIndex]);
		_.forEach(currentArray, (obj) => {
			excludeFieldsUsingLoop(obj, segments, currentIndex + 1);
		});
	}
}

async function resetSyncedValues(cardId) {
	//Find all Mappings in which deletedCard is used
	try {
		const matchedObjects = await AggregateMappings.aggregate([
			{
				$match: {
					$or: [
						{ 'relationsHeaders.mappedAttributeAPI': cardId },
						{ 'relationsParams.mappedAttributeAPI': cardId },
						{ 'relationsRequestBody.mappedAttributeAPI': cardId }
					]
				}
			},
			{
				$project: {
					relationsHeaders: {
						$filter: {
							input: '$relationsHeaders',
							as: 'header',
							cond: { $eq: ['$$header.mappedAttributeAPI', cardId] }
						}
					},
					relationsParams: {
						$filter: {
							input: '$relationsParams',
							as: 'param',
							cond: { $eq: ['$$param.mappedAttributeAPI', cardId] }
						}
					},
					relationsRequestBody: {
						$filter: {
							input: '$relationsRequestBody',
							as: 'body',
							cond: { $eq: ['$$body.mappedAttributeAPI', cardId] }
						}
					}
				}
			}
		]);

		for (const eachObject of matchedObjects) {
			const { relationsHeaders, relationsParams, relationsRequestBody } = eachObject;
			const targetObjects = [relationsParams, relationsRequestBody, relationsHeaders];
			for (const targetObject of targetObjects) {
				for (const mapping of targetObject) {
					const { attributeRef: ref } = mapping;
					const reset = await resetValue(ref);
				}
			}
		}
		return { reset: true };
	} catch (error) {
		return { error: error.message };
	}
}

async function deleteMappingsOfLinkedCards(cardId) {
	try {
		const updateMappingsOfCard = await AggregateMappings.updateMany(
			{
				$or: [
					{ 'relationsHeaders.mappedAttributeAPI': cardId },
					{ 'relationsParams.mappedAttributeAPI': cardId },
					{ 'relationsRequestBody.mappedAttributeAPI': cardId }
				]
			},
			{
				$pull: {
					relationsHeaders: { mappedAttributeAPI: cardId },
					relationsParams: { mappedAttributeAPI: cardId },
					relationsRequestBody: { mappedAttributeAPI: cardId }
				}
			}
		);
		return updateMappingsOfCard.modifiedCount;
	} catch (error) {
		return { error: error.message };
	}
}

async function resetValue(ref) {
	try {
		const splittedRef = ref.split('.');

		//get CardId
		const cardId = splittedRef[0];
		//get Remaining ref path
		let actualRef = splittedRef.slice(1);

		const cardData = await AggregateCards.findOne({ _id: cardId }).lean();

		//check what is the type of parameter :  bodyParameter or header or query param
		let targetObject = cardData.runData[actualRef[0]];
		const isArray = Array.isArray(targetObject);
		if (isArray) {
			// const requiredObj = targetObject.filter((el) => el.key === actualRef[1])[0];
			targetObject.forEach((obj) => {
				if (obj.key === actualRef[1]) {
					obj.value = null;
				}
			});
		} else {
			//add data key because object has data key  in db
			actualRef.splice(1, 0, 'data');
			actualRef.unshift('runData');
			actualRef = actualRef.join('.');
			_.set(cardData, actualRef, null);
		}
		const { output, ...modifiedRunData } = cardData.runData;
		await AggregateCards.updateOne(
			{ _id: cardId },
			{
				$set: {
					runData: modifiedRunData
				}
			}
		);
		return { reset: true };
	} catch (err) {
		return { err: err.message };
	}
}

module.exports = router;
