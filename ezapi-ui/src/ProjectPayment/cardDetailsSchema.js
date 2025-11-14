import * as Yup from 'yup';
import Messages from '../shared/messages';

const schema = Yup.object().shape({
    cardHolderName: Yup.string().required(Messages.FIELD_REQUIRED),
    card: Yup.boolean().isTrue(Messages.FIELD_REQUIRED),
});

export default schema;
