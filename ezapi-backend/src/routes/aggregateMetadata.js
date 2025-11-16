const express = require('express');

const router = new express.Router();

const AggregateCards = require('../models/aggregateCards');
const AggregateMetaData = require('../models/aggregateMetadata');

const authenticate = require('../authentication/authentication');
const authorize = require('../authentication/authorization');

//const { INVALID_OPERATION_ID } = require('../utility/errorMessages');
const validate = require('../middlewares/validators/validateRequest');
const {
	getAggregateMetaDataSchema,
	postAggregateMetaDataSchema
} = require('../middlewares/validators/aggregateapi');

router.get(
	'/aggregateMetadata/:operationId',
	authenticate,
	authorize,
	validate(getAggregateMetaDataSchema, false),
	async (req, res) => {
		const { operationId } = req.params;
		const { projectId } = req.query;

		try {
			let flowDataObj = await AggregateMetaData.findOne({ projectId, operationId }).lean();
			if (!flowDataObj) {
				const card = await AggregateCards.create({
					projectId,
					operationId,
					type: 'mainNode',
					name: 'Main',
					parentNode: '',
					inputNodeIds: [],
					runData: {},
					branchData: {},
					mainData: {}
				});
				flowDataObj = await AggregateMetaData.create({
					projectId,
					operationId,
					nodes: [
						{
							cardId: card._id,
							type: 'mainNode',
							name: 'Main',
							parentNode: card.parentNode,
							inputNodeIds: card.inputNodeIds,
							runData: {},
							branchData: {},
							filterData: {},
							mainData: {},
							position: { x: 25, y: 25 },
							nonDeletable: true
						}
					],
					edges: []
				});
			}
			res.status(200).send(flowDataObj);

			// throw new Error('flowData not found or Invalid operationId');
		} catch (err) {
			return res.status(400).send({ message: err.message });
		}
	}
);

router.post(
	'/aggregateMetadata/:operationId',
	authenticate,
	authorize,
	validate(postAggregateMetaDataSchema, false),
	async (req, res) => {
		try {
			const { operationId } = req.params;
			const { projectId, nodes, edges } = req.body;

			const flowDataObj = await AggregateMetaData.findOne({ projectId, operationId });
			if (flowDataObj) {
				flowDataObj.nodes = nodes;
				flowDataObj.edges = edges;
				await flowDataObj.save();
			} else {
				await AggregateMetaData.create({
					projectId,
					operationId,
					nodes,
					edges
				});
			}

			return res.status(200).send({ message: 'ok' });
		} catch (err) {
			return res.status(400).send({ message: err.message });
		}
	}
);

/* router.delete('/aggregateMetadata/:operationId', authenticate, authorize, async (req, res) => {
	try {
		const { operationId } = req.params;
		const { projectId } = req.query;
		const deletedData = await AggregateMetaData.deleteOne({ operationId, projectId });
		if (!deletedData) throw new Error(INVALID_OPERATION_ID);
		res.status(200).send({ message: 'ok', data: deletedData });
	} catch (err) {
		res.status(400).send({ message: err.message });
	}
}); */

module.exports = router;
