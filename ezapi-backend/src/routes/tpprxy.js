const { Router } = require('express');
const _ = require('lodash');

const axiosCall = require('../utility/axiosCall');
const AggregateMappings = require('../models/aggregateMappings');
const AggregateCards = require('../models/aggregateCards');

const router = new Router();

router.post('/tpprxy', async (req, res) => {
	try {
		let { url, headers, method, data, cardDetails } = req.body;
		const responses = [];
		if (cardDetails && cardDetails.isLoopApi) {
			const { cardId } = cardDetails;
			let { relationsRequestBody } = await AggregateMappings.findOne(
				{ cardId },
				{ relationsRequestBody: 1 }
			).lean();
			relationsRequestBody = relationsRequestBody.filter((obj) =>
				obj.mappedAttributeRef.includes('[n]')
			);
			for (const mappingObj of relationsRequestBody) {
				let { attributeRef } = mappingObj;
				attributeRef = attributeRef.replace(/(.*)body/, 'body.data');
				const mappedCardValues = await getMappedValues(mappingObj);
				for (const mappedValue of mappedCardValues) {
					_.set(data, attributeRef, mappedValue);
					console.log('axiosData', data);
					const axiosResponse = await axiosCall(url, headers, method, data);
					responses.push(axiosResponse.data);
				}
			}
			return res.json({ responses });
		} else {
			const axiosResponse = await axiosCall(url, headers, method, data);
			const { statusCode, data: axiosData } = axiosResponse;
			return res.status(statusCode).json(axiosData);
		}
	} catch (err) {
		console.log('tpprxy', err.message);
		res.status(500).json({ err: err.message });
	}
});

async function getMappedValues(mappingObj) {
	try {
		let { mappedAttributeRef, mappedAttributeAPI: linkedCardId } = mappingObj;
		mappedAttributeRef = mappedAttributeRef.replace(/(.*)output/, 'output.data');
		const { runData: mappedCardRunData } = await AggregateCards.findOne(
			{ _id: linkedCardId },
			{ runData: 1 }
		).lean();
		const segments = mappedAttributeRef.split(/\[.*?\]./);
		const mappedArrayValues = extractValues(mappedCardRunData, segments, 0);
		return mappedArrayValues;
	} catch (error) {
		console.log('getMappedValues', error.message);
		return { error: error.message };
	}
}

function extractValues(data, segments, currentIndex, values = []) {
	try {
		if (currentIndex === segments.length - 1) {
			const value = _.get(data, segments[currentIndex]);
			values.push(value);
		} else {
			const currentArray = _.get(data, segments[currentIndex]);
			_.forEach(currentArray, (obj) => {
				extractValues(obj, segments, currentIndex + 1, values);
			});
		}
		return values;
	} catch (error) {
		console.log('extractValues', error.message);
		return { error: error.message };
	}
}

module.exports = router;
