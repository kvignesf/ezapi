const express = require('express');
const mongoose = require('mongoose');
const _ = require('lodash');

const router = new express.Router();

const authenticate = require('../authentication/authentication');
const authorize = require('../authentication/authorization');

const {
	getAggregateMappingSchema,
	postAggregateMappingSchema
} = require('../middlewares/validators/aggregateapi');
const validate = require('../middlewares/validators/validateRequest');
const emitSocket = require('../utility/emitSocket');

const AggregateMappings = require('../models/aggregateMappings');
const AggregateCards = require('../models/aggregateCards');

router.get(
	'/aggregateMappings/:cardId',
	authenticate,
	validate(getAggregateMappingSchema, false),
	authorize,
	async (req, res) => {
		try {
			const { cardId } = req.params;
			const { operationId, projectId } = req.query;
			const query = {
				cardId,
				operationId,
				projectId
			};

			const aggregateMappings = await AggregateMappings.findOne(query).lean();
			if (aggregateMappings) {
				return res.status(200).send({ data: aggregateMappings });
			}
			return res.status(200).send({ data: {} });
		} catch (err) {
			res.status(400).send({ message: err.message });
		}
	}
);

//Create or Update Aggregate Mappings
router.post(
	'/aggregateMappings',
	authenticate,
	validate(postAggregateMappingSchema),
	authorize,
	async (req, res) => {
		try {
			const {
				operationId,
				projectId,
				cardId,
				relationsParams,
				relationsRequestBody,
				relationsHeaders
			} = req.body;

			//update or create a new record
			const aggregateMappings = await AggregateMappings.findOneAndUpdate(
				{
					operationId,
					projectId,
					cardId
				},
				{
					$set: {
						relationsParams,
						relationsRequestBody,
						relationsHeaders
					}
				},
				{ upsert: true, new: true, returnDocument: 'after' }
			);
			syncMappingDetails(req, cardId, aggregateMappings);
			return res.status(200).send({ message: 'ok', data: aggregateMappings });
		} catch (err) {
			res.status(400).send({ message: err.message });
		}
	}
);

router.delete('/aggregateMappings/:cardId', authenticate, authorize, async (req, res) => {
	try {
		const { cardId } = req.params;
		const { operationId, projectId } = req.query;
		await AggregateMappings.deleteOne({
			cardId,
			operationId,
			projectId
		});
		res.status(200).send({ message: 'ok' });
	} catch (err) {
		res.status(400).send({ message: err.message });
	}
});

async function syncMappingDetails(req, cardId, mappingData) {
	mappingData = mappingData.toObject();
	cardId = mongoose.Types.ObjectId(cardId);
	const { projectId, operationId, relationsHeaders, relationsParams, relationsRequestBody } =
		mappingData;
	const paramsList = [relationsHeaders, relationsParams, relationsRequestBody];
	for (const e of paramsList) {
		for (const item of e) {
			const { mappedAttributeRef, attributeRef, bearer } = item;

			//skip mapping if its a loopPathMapping...
			const isLoopPathMapping = mappedAttributeRef.includes('[n]');
			if (isLoopPathMapping) continue;

			let { mappedValue } = await attributeRefValue(
				mappedAttributeRef,
				projectId,
				operationId
			);
			const { mongoRef, reqParamKeyValue } = await attributeRefValue(
				attributeRef,
				projectId,
				operationId,
				true
			);

			const mongoFindQuery = { _id: cardId };
			let mongoValueRef;
			let updateQuery = {};
			mappedValue = bearer ? `Bearer ${mappedValue}` : mappedValue;
			if (reqParamKeyValue) {
				mongoFindQuery[mongoRef] = reqParamKeyValue;
				mongoValueRef = mongoRef.split('.').slice(0, -1).concat('$.value').join('.');
				updateQuery[mongoValueRef] = mappedValue;
			} else {
				updateQuery[mongoRef] = mappedValue;
			}
			await AggregateCards.updateOne(mongoFindQuery, { $set: updateQuery });
		}
	}

	//get UpdatedData of currentCard & do a socket emit
	const currentCardData = await AggregateCards.findOne({ _id: cardId });
	emitSocket(req, currentCardData, 'aggregateMappings');
	return 'done';
}

async function attributeRefValue(ref, projectId, operationId, isAttributeRef = false) {
	try {
		const splittedRef = ref.split('.');

		//get CardId
		const cardId = splittedRef[0];
		//let filters = {projectId, operationId}
		let cardData;
		let unshiftKey;
		if (cardId === 'Request') {
			cardData = await AggregateCards.findOne({
				projectId,
				operationId,
				type: 'mainNode'
			}).lean();
			unshiftKey = 'mainData';
		} else {
			cardData = await AggregateCards.findOne({ _id: cardId }).lean();
			unshiftKey = 'runData';
		}

		//get Remaining Ref
		let actualRef = splittedRef.slice(1);

		//check what is the type of param => array or object
		const requestParam = cardData[unshiftKey][actualRef[0]];
		const isArray = Array.isArray(requestParam);
		if (isArray) {
			const requiredObj = requestParam.filter((el) => el.key === actualRef[1])[0];
			actualRef.splice(1, 0, 'key');
			actualRef.unshift(unshiftKey);

			//removes the last item as it's the key value
			actualRef.pop();
			actualRef = actualRef.join('.');
			const reqParamKeyValue = requiredObj.key;
			return { mongoRef: actualRef, reqParamKeyValue, mappedValue: requiredObj.value };
		} else {
			//add data key as object has data key  in db
			actualRef.splice(1, 0, 'data');
			actualRef.unshift(unshiftKey);
			actualRef = actualRef.join('.');
			if (isAttributeRef) {
				return { mongoRef: actualRef, reqParamKeyValue: null };
			}
			const mappedValue = _.get(cardData, actualRef);
			return { mongoRef: actualRef, mappedValue };
		}
	} catch (err) {
		return { err: err.message };
	}
}

module.exports = router;
