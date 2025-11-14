import * as Yup from 'yup';
import Messages from '../../../../shared/messages';
import apiNameSchema from '../../../../shared/schemas/apiNameSchema';

const schema = Yup.object().shape({
    attribute: apiNameSchema(Messages.PARAMETER_FIELD_REQUIRED),
    description: Yup.string().required(Messages.PARAMETER_FIELD_REQUIRED),
    /* possibleValues: Yup.string().when('dataType',
  { is:(dataType)=>{ return dataType==='array';},
    then: Yup.string().required(Messages.MANDATORY_ARRAY_FIELD)
  }), */
    possibleValues: Yup.string().when('dataType', (dataType) => {
        if (['array', 'string', 'boolean', 'integer'].includes(dataType)) {
            return Yup.string().required(`Mandatory field for ${dataType} datatype`);
        }
    }),
    dataType: Yup.string().required(Messages.PARAMETER_FIELD_REQUIRED),
    required: Yup.bool(),
});

export default schema;
