import * as Yup from 'yup';
import Messages from '../shared/messages';

const schema = Yup.object().shape({
    fullName: Yup.string().required(Messages.FIELD_REQUIRED),
    company: '',
    country: Yup.string().required(Messages.FIELD_REQUIRED),
    addressLine1: Yup.string().required(Messages.FIELD_REQUIRED),
    addressLine2: '',
    zip: Yup.string().required(Messages.FIELD_REQUIRED),
    city: Yup.string().required(Messages.FIELD_REQUIRED),
    state: Yup.string().required(Messages.FIELD_REQUIRED),
    email: Yup.string().email(Messages.INVALID_EMAIL).required(Messages.FIELD_REQUIRED),
    phone: '',
});

export default schema;
