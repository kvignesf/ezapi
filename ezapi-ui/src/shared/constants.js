const responses = [
    { code: 200, description: 'OK' },
    { code: 201, description: 'Created' },
    { code: 400, description: 'Bad Request' },
    { code: 401, description: 'Unauthorized' },
    { code: 404, description: 'Not Found' },
    { code: 500, description: 'Internal Server Error' },
];

const Constants = {
    linkedClientId: process.env.REACT_APP_LINKEDIN_CLIENT_ID,
    allResponses: responses,
    mandatoryResponse: responses[0],
    parameterDataTypes: [
        'array',
        'object',
        'integer',
        'long',
        'float',
        'double',
        'string',
        'arrayOfObjects',
        'byte',
        'binary',
        'boolean',
        'date',
        'dateTime',
        'password',
    ],
    customizedParameterDataTypes: ['integer', 'string', 'arrayOfObjects', 'array', 'boolean', 'object'],
    customParameterDataTypes: ['integer', 'array', 'DateTime'],
    // customParameterDataTypes: ["integer", "array"],

    acceptedTypes: ['integer', 'number', 'string', 'boolean'],
    bodyAcceptedTypes: ['array', 'object'],
    customParameterFunctionTypes: {
        integer: ['count', 'sum', 'min', 'max', 'average'],
        array: ['distinct', 'top10'],
        DateTime: ['extract year', 'extract month', 'extract date', 'min', 'max'],
    },
    customParametersConditionKeys: ['>', '<', '=', 'Null', 'NotNull'],
    customParamtersFilterRelations: ['AND', 'OR'],
};

export default Constants;
