const express = require('express');
const _ = require('lodash');

const router = new express.Router();

const authenticate = require('../authentication/authentication');
const authorize = require('../authentication/authorization');

const {
	getAggregateResponseMappingSchema,
	postAggregateResponseMappingSchema
} = require('../middlewares/validators/aggregateapi');
const validate = require('../middlewares/validators/validateRequest');

const AggregateResponseMappings = require('../models/aggregateResponseMapping');
const AggregateCards = require('../models/aggregateCards');
const emitSocket = require('../utility/emitSocket');

//get aggregate response mappings by operationId
router.get(
	'/aggregateResponseMappings/:operationId',
	authenticate,
	validate(getAggregateResponseMappingSchema, false),
	authorize,
	async (req, res) => {
		try {
			const { projectId } = req.query;
			const { operationId } = req.params;
			const query = { operationId, projectId };

			const aggregateResponseMappings = await AggregateResponseMappings.findOne(query).lean();
			if (aggregateResponseMappings) {
				return res.status(200).send({ data: aggregateResponseMappings });
			}
			return res.status(200).send({ data: {} });
		} catch (err) {
			res.status(400).send({ message: err.message });
		}
	}
);

//Create or Update Aggregate Response Mappings
router.post(
	'/aggregateResponseMappings',
	authenticate,
	validate(postAggregateResponseMappingSchema),
	authorize,
	async (req, res) => {
		try {
			const { operationId, projectId, responseHeaders, responseBody } = req.body;

			// create a new record or update existing record
			const aggregateResponseMappings = await AggregateResponseMappings.findOneAndUpdate(
				{
					operationId,
					projectId
				},
				{
					$set: {
						responseHeaders,
						responseBody
					}
				},
				{ upsert: true, new: true, returnDocument: 'after' }
			);
			if (aggregateResponseMappings) {
				syncAggregateResponseMapping(req, aggregateResponseMappings.toObject());
			}
			return res.status(200).send({
				responseHeaders: aggregateResponseMappings.responseHeaders,
				responseBody: aggregateResponseMappings.responseBody
			});
		} catch (err) {
			res.status(400).send({ message: err.message });
		}
	}
);

async function syncAggregateResponseMapping(req, aggregateResponseMappings) {
	try {
		const responseData = {};
		const headers = [];
		const { responseHeaders, responseBody, operationId, projectId } = aggregateResponseMappings;
		const responseParams = { responseHeaders, responseBody };
		for (const i of Object.keys(responseParams)) {
			for (const bodyMapping of responseParams[i]) {
				const { attributeRef, mappedAttributeRef, mappedAttributeAPI } = bodyMapping;
				const mappedCardData = await AggregateCards.findOne(
					{ _id: mappedAttributeAPI },
					{ runData: 1, mainData: 1 }
				).lean();

				const modifiedRef = mappedAttributeRef.replace(
					`${mappedCardData._id}.output`,
					'runData.output.data'
				);
				const mappedValue = _.get(mappedCardData, modifiedRef);
				const splittedRef = attributeRef.split('.');
				const key = splittedRef[splittedRef.length - 1];
				if (i === 'responseHeaders') {
					const header = {
						key: key,
						value: mappedValue
					};
					headers.push(header);
				} else {
					responseData[key] = mappedValue;
				}
			}
		}
		await AggregateCards.updateOne(
			{
				projectId,
				operationId,
				type: 'payloadBuilderNode'
			},
			{
				$set: {
					responsePayloadData: {
						data: {
							body: responseData,
							headers
						}
					}
				}
			}
		);
		const socketData = { body: responseData, headers };
		emitSocket(req, socketData, 'payloadCardResponse');
		console.log(`operationId: ${operationId} - AggregateResponseMappingSyncDone:`);
		return { updated: true };
	} catch (error) {
		console.log(`AggregateResponseMappingSyncError - ${error.message}`);
		return { error: error.message };
	}
}

module.exports = router;
