const Joi = require('joi');

const keyValuePairSchema = Joi.array()
	.items(
		Joi.object({
			key: Joi.string().required(),
			value: Joi.string().optional()
		})
	)
	.optional();

const relationParamSchema = {
	relation: Joi.string().valid('equals', 'contains', 'startsWith', 'endsWith').default('equals'),
	attributeName: Joi.string().required(),
	attributeAPI: Joi.string().allow('').required(),
	attributeType: Joi.string().required(),
	attributeDataType: Joi.string().required(),
	attributeRef: Joi.string().optional(),
	mappedAttributeName: Joi.string().required(),
	mappedAttributeType: Joi.string().required(),
	mappedAttributeAPI: Joi.string().required(),
	mappedAttributeDataType: Joi.string().required(),
	mappedAttributeRef: Joi.string().optional(),
	bearer: Joi.boolean().optional()
};

const nodesSchema = Joi.array()
	.items(
		Joi.object({
			cardId: Joi.string().required(),
			type: Joi.string().required(),
			name: Joi.string().required(),
			position: Joi.object({
				x: Joi.number().required(),
				y: Joi.number().required()
			}).required(),
			positionAbsolute: Joi.object({
				x: Joi.number().required(),
				y: Joi.number().required()
			}).optional(),
			parentNode: Joi.string().allow('').optional(),
			inputNodeIds: Joi.array().items(Joi.string()).optional(),
			nonDeletable: Joi.boolean().optional(),
			width: Joi.number().optional(),
			height: Joi.number().optional(),
			selected: Joi.boolean().optional(),
			dragging: Joi.boolean().optional(),
			dragHandle: Joi.string().optional()
		})
	)
	.required();

const edgesSchema = Joi.array()
	.items(
		Joi.object({
			id: Joi.string().required(),
			source: Joi.string().required(),
			target: Joi.string().required(),
			sourceHandle: Joi.string().allow(null).optional(),
			targetHandle: Joi.string().allow(null).optional(),
			selected: Joi.boolean().optional(),
			animated: Joi.boolean().optional()
		})
	)
	.required();

const aggregateCardRunDataSchema = Joi.object({
	url: Joi.string().optional().allow(''),
	method: Joi.string().valid('get', 'post', 'put', 'patch').optional(),
	body: Joi.object({
		data: Joi.object().required()
	}),
	headers: keyValuePairSchema,
	queryParams: keyValuePairSchema,
	pathParams: keyValuePairSchema,
	output: Joi.object().optional()
});

const aggregateCardMainDataSchema = Joi.object({
	body: Joi.object({
		data: Joi.object().required()
	}),
	headers: keyValuePairSchema,
	queryParams: keyValuePairSchema,
	pathParams: keyValuePairSchema
});

const aggregateCardConditionsSchema = Joi.array()
	.items(
		Joi.object({
			conditionId: Joi.string().required(),
			conditionType: Joi.string().required(),
			rawExpression: Joi.string().allow('').optional(),
			detailedExpression: Joi.string().optional(),
			parsedExpression: Joi.object().optional(),
			/* 	expression: Joi
				.object
						{
				type: Joi.string().valid('operand', 'operator', 'expression').required(),
				value: Joi.string().optional(),
				left: Joi.object().optional(),
				right: Joi.object().optional()
			}
				()
				.optional(), */
			// expression: Joi.object().unknown().optional(),
			inputNodeIds: Joi.array().items(Joi.string()).optional()
		})
	)
	.optional();

const aggregateCardBranchDataSchema = Joi.object({
	conditions: aggregateCardConditionsSchema
});

const getMappingAndMetaDataSchema = Joi.object({
	query: Joi.object({
		projectId: Joi.string().required()
	}),
	params: Joi.object({
		operationId: Joi.string().required()
	})
}).unknown(true);

const responseMapperSchema = Joi.object({
	responseHeaders: Joi.array().items(Joi.object(relationParamSchema)).optional(),
	responseBody: Joi.array().items(Joi.object(relationParamSchema)).required()
}).required();

const filterFieldsSchema = Joi.object({
	attributeRef: Joi.string().required(),
	attributeDataType: Joi.string().required(),
	attributeName: Joi.string().required()
});

const aggregateCardFilterDataSchema = Joi.object({
	filterType: Joi.string().required(),
	sourceNodeId: Joi.string().required(),
	targetNodeId: Joi.string().required(),
	replacedFields: Joi.array().items(filterFieldsSchema).optional(),
	excludedFields: Joi.array().items(filterFieldsSchema).optional(),
	iterateThroughArray: Joi.boolean().optional(),
	originalAttributeRef: Joi.string().optional(),
	newAttributeRef: Joi.string().optional()
}).or('replacedFields', 'excludedFields');

const responsePayloadDataSchema = Joi.alternatives().try(
	Joi.object().pattern(/^/, Joi.any()), // allow empty object
	Joi.object({
		customMapping: Joi.boolean().required(),
		cardId: Joi.when('customMapping', {
			is: true,
			then: Joi.forbidden(),
			otherwise: Joi.string().allow('').optional()
		}),
		cardName: Joi.when('customMapping', {
			is: true,
			then: Joi.forbidden(),
			otherwise: Joi.string().allow('').optional()
		}),
		data: Joi.object({
			body: Joi.object().optional(),
			headers: keyValuePairSchema
		}).optional()
	})
);

const typeValues = [
	'payloadBuilderNode',
	'filterNode',
	'branchNode',
	'loopNode',
	'startNode',
	'selectionNode',
	'externalAPINode',
	'mainNode'
];
const schemas = {
	getAggregateMetaDataSchema: getMappingAndMetaDataSchema,
	postAggregateMetaDataSchema: Joi.object({
		params: Joi.object({
			operationId: Joi.string().required()
		}),
		body: Joi.object({
			projectId: Joi.string().required(),
			nodes: nodesSchema,
			edges: edgesSchema
		})
	}).unknown(true),
	getAggregateCardsSchema: Joi.object({
		query: Joi.object({
			operationId: Joi.string().required(),
			projectId: Joi.string().required()
		})
	}).unknown(true),
	getAggregateCardSchema: Joi.object({
		query: Joi.object({
			projectId: Joi.string().required(),
			operationId: Joi.string().required()
		}),
		params: Joi.object({
			cardId: Joi.string().required()
		})
	}).unknown(true),
	postAggregateCardSchema: Joi.object({
		projectId: Joi.string().required(),
		operationId: Joi.string().required(),
		sytemApi: Joi.object({
			operationDataId: Joi.string().required(),
			sysProjectId: Joi.string().required()
		}).optional(),
		type: Joi.string()
			.valid(...typeValues)
			.required(),
		name: Joi.string().required(),
		parentNode: Joi.string().allow('').optional(),
		inputNodeIds: Joi.array().items(Joi.string()).optional(),
		runData: aggregateCardRunDataSchema,
		branchData: aggregateCardBranchDataSchema,
		filterData: aggregateCardFilterDataSchema,
		mainData: aggregateCardMainDataSchema,
		responsePayloadData: responsePayloadDataSchema
	}).or('runData', 'systemApi', 'branchData', 'filterData', 'mainData', 'responsePayloadData'),
	putAggregateCardSchema: Joi.object({
		params: Joi.object({
			cardId: Joi.string().required()
		}),
		body: Joi.ref('postAggregateCardSchema')
	}).unknown(true),
	deleteAggregateCardSchema: Joi.object({
		params: Joi.object({
			cardId: Joi.string().required()
		}),
		body: Joi.object({
			operationId: Joi.string().required(),
			projectId: Joi.string().required(),
			updatedAggregateMetadata: Joi.object({
				nodes: nodesSchema,
				edges: edgesSchema
			}).required(),
			updatedResponseMapper: responseMapperSchema
		})
	}).unknown(true),
	getAggregateMappingSchema: Joi.object({
		params: Joi.object({
			cardId: Joi.string().required()
		}),
		query: Joi.object({
			operationId: Joi.string().required(),
			projectId: Joi.string().required()
		})
	}).unknown(true),
	postAggregateMappingSchema: Joi.object({
		projectId: Joi.string().required(),
		operationId: Joi.string().required(),
		cardId: Joi.string().required(),
		relationsParams: Joi.array().items(Joi.object(relationParamSchema)).optional(),
		relationsHeaders: Joi.array().items(Joi.object(relationParamSchema)).optional(),
		relationsRequestBody: Joi.array().items(Joi.object(relationParamSchema)).optional()
	}),
	getAggregateResponseMappingSchema: getMappingAndMetaDataSchema,
	postAggregateResponseMappingSchema: Joi.object({
		projectId: Joi.string().required(),
		operationId: Joi.string().required(),
		responseHeaders: Joi.array().items(Joi.object(relationParamSchema)).optional(),
		responseBody: Joi.array().items(Joi.object(relationParamSchema)).required()
	}),
	mappingDataSchema: Joi.ref('getAggregateCardSchema')
};

module.exports = schemas;
