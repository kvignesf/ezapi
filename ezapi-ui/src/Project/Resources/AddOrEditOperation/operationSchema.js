import * as Yup from 'yup';
import Messages from '../../../shared/messages';
import apiNameSchema from '../../../shared/schemas/apiNameSchema';

const schema = () =>
    Yup.object().shape({
        name: apiNameSchema(Messages.NAME_REQUIRED),
        type: Yup.string().required(Messages.TYPE_REQUIRED),
        desc: Yup.string().required(Messages.DESC_REQUIRED),
    });

export default schema;
