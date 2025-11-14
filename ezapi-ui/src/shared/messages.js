const Messages = {
    UNKNOWN: 'Something went wrong, please try again.',
    DB_REQUIRED: 'Atleast one spec or db file must be uploaded.',
    NAME_REQUIRED: 'Name is required',
    SPEC_REQUIRED: 'Spec is required',
    TYPE_REQUIRED: 'Type is required',
    DESC_REQUIRED: 'Description is required',
    TABLE_REQUIRED: 'Please select a table name',
    COLUMN_REQUIRED: 'Please select a column name',
    FIELD_REQUIRED: 'Please fill this field',
    PARAMETER_FIELD_REQUIRED: 'Required field',
    TABLE_COLUMN_EXISTS: 'Table/Column with this name already exists',
    INVALID_EMAIL: 'Please enter valid email',
    NO_USER_DETAILS: 'Failed to get the user details, please try again.',
    INVALID_DATA: 'Invalid data provided, please check and retry',
    LINKEDIN_REQUIRED: 'Need to login using LinkedIn',
    PAYMENT_FAILURE: 'Something went wrong during payment',
    PAYMENT_RETRY: 'Something went wrong during payment, please try again.',
    FUNCTION_REQUIRED: 'Please select a function name',
    CONDITION_REQUIRED: 'Please select a condtion',
    VALUE_REQUIRED: 'Please enter a valid value',
    RELATION_REQUIRED: 'Please select a relation',
    MANDATORY_MAPPING_MSG:
        'You have attributes that are either partial match or no match, provide relevant database columns matching to proceed further',
    MANDATORY_ARRAY_FIELD: 'Mandatory field for array datatype',

    VALIDATE_RETRY: 'Failed to validate project, please try again.',
    PUBLISH_RETRY: 'Failed to publish the project, please try again.',
    publishSuccess: (projectName) =>
        `Project ${projectName} successfully published. You can now download the specs and artifacts.`,
};

export default Messages;
