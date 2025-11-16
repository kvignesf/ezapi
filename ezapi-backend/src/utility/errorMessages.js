const errorMessages = {
	EMPTY_OBJECT: 'object cannot be empty in placeholder and must have atleast one attribute',
	EMPTY_ARRAY_OBJECT:
		'Array of Objects cannot be empty in placeholder and must have atleast one attribute or object',
	UNMAPPED_FIELDS: 'Mandatory mapping is required',
	PROJECT_NOT_FOUND: 'No such project found, make sure you have access to this project.',
	RESOURCE_ID_NOT_VALID: 'No resource found with this ID, Please check again.',
	PATH_ID_NOT_VALID: 'No path found with this ID, Please check again',
	OPERATION_ID_NOT_VALID: 'No operation found with this ID, Please check again',
	USER_ID_NOT_VALID: 'No user found with this ID',
	UNAUTHORIZED_USER: 'Unauthorized User or projectId is invalid',
	COLLABRATOR_LIMIT_REACHED: 'You have exceeded the collaborator limit for your plan',
	PUBLISH_LIMIT_REACHED: 'Publish Limit Reached',
	TRIAL_PERIOD_EXPIRED: 'Your Trial Period has expired, Please upgrade',
	FREE_PROJECTS_EXHAUSTED:
		'Your 2 free Projects limit is exhausted, please purchase paid plan to publish.',
	FREE_DESIGN_PROJECTS_EXHAUSTED:
		'Your free Design Projects limit is exhausted, please upgrade to publish.',
	FREE_TEST_PROJECTS_EXHAUSTED:
		'Your free Test Projects limit is exhausted, please upgrade to publish.',
	FREE_AGGREGATE_PROJECTS_EXHAUSTED:
		'Your free Aggregation Projects limit is exhausted, please upgrade to publish.',
	ALLOWED_PROJECTS_LIMIT_EXHAUSTED:
		'Your allowed Projects limit for the current subscription is exhausted, please upgrade plan to publish a new project.',
	SPEC_GENERATED_ARTIFACT_ERROR: 'Open API spec generated, unable to generate Artifact.',
	DATA_GENERATED_ERROR: 'Unable to generate Data',
	SPEC_ARTIFACT_GEN_ERROR: 'Unable to generate Open API spec and Artifact.',
	SPEC_GEN_ERROR: 'Artifact generated, unable to generate Open API spec.',
	ALREADY_PAID: 'Payment already made for this project.',
	PROJECT_IS_FREEMIUM: 'Project is already under freemium plan.',
	PRODUCT_NOT_FOUND: 'No product found, please check the productId.',
	SCHEMA_NOT_FOUND: 'No such schema found',
	ATTRIBUTE_NOT_FOUND: 'No such attribute found in schema',
	DUPLICATE_ATTRIBUTE_NAME: 'Each parameter name must be unique.',
	MATCH_DATA_NOT_FOUND: 'No match data found for this schema name',
	PARAMS_REQUIRES_RES_NAME: 'Param must have resourceName',
	INVALID_RESOURCE: 'Please make sure resourceId is valid',
	EMPTY_RES_ID: 'Resource ID should not be empty',
	INVALID_PATH: 'Path ID should be valid',
	INVALID_OPERATION_ID: 'operationId should be valid',
	PROJ_WITH_NO_API: 'Project does not have any API operation.',
	STATUS_CODE_200_REQUIRED: '200 status code is required',
	STATUS_CODE_RESP_BODY: 'Response body is required for status code ', // Response body is required for status code 200
	STATUS_CODE_REQUIRES_DESC: 'Description is required for status code ', // Description is required for status code 200
	GITHUB_COMMIT_INPROGRESS:
		'Publish cannot be performed as gitHub Commit is in progress for this project. Publish once the commit is completed'
};

module.exports = errorMessages;
