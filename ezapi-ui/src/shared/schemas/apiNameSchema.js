import * as Yup from 'yup';

const apiNameSchema = (error = 'Name is required') =>
    Yup.string()
        .required(error)
        .matches(`^(?=[a-zA-Z0-9-_]*$)`, 'Only - and _ are allowed as special characters')
        .matches(`^([^_].*?)`, 'Cannot start with an underscore (_)');

export default apiNameSchema;
