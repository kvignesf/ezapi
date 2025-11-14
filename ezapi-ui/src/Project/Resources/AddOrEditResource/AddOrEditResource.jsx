import { CircularProgress, TextField } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import _ from 'lodash';
import * as Yup from 'yup';
import { PrimaryButton, TextButton } from '../../../shared/components/AppButton';
import AppIcon from '../../../shared/components/AppIcon';
import EnterKeyCaptureInput from '../../../shared/components/EnterKeyCaptureInput';
import Messages from '../../../shared/messages';
import apiNameSchema from '../../../shared/schemas/apiNameSchema';
import { useAddResource, useEditResource } from './resourceQuery';

const AddOrEditResource = ({ projectId, title, resource: { resourceId, resourceName }, onClose }) => {
    const {
        isLoading: isAddingResource,
        isSuccess: isAddingResourceSuccess,
        error: addResourceError,
        mutate: addResource,
    } = useAddResource();
    const {
        isLoading: isEditingResource,
        isSuccess: isEditingResourceSuccess,
        error: editResourceError,
        mutate: editResource,
    } = useEditResource();

    const handleSubmit = (values) => {
        const updatedResourceName = values?.name;

        if (resourceId && !_.isEmpty(resourceId)) {
            if (resourceName !== updatedResourceName) {
                editResource({ id: resourceId, name: updatedResourceName });
            }
            return;
        }

        addResource({
            projectId: projectId,
            name: updatedResourceName,
        });
    };

    if (isAddingResourceSuccess || isEditingResourceSuccess) {
        onClose();
    }

    return (
        <div
            onClick={(event) => {
                event?.stopPropagation();
            }}
        >
            <div className="p-3 flex flex-row justify-between border-b-2">
                <h5>{title}</h5>

                <AppIcon onClick={onClose}>
                    <CloseIcon />
                </AppIcon>
            </div>

            <p className="my-2 mx-4 text-overline2">Resource Name</p>

            <Formik
                initialValues={{
                    name: resourceName ?? '',
                }}
                validationSchema={Yup.object().shape({
                    name: apiNameSchema(Messages.NAME_REQUIRED),
                })}
                onSubmit={handleSubmit}
            >
                {({ errors, touched, submitForm, validateForm, values, setErrors, handleBlur }) => (
                    <>
                        <Form
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                    handleBlur(e);
                                    const errors = await validateForm(values);

                                    if (!_.isEmpty(errors)) {
                                        setErrors(errors);
                                    } else {
                                        submitForm();
                                    }
                                    e.preventDefault();
                                }
                            }}
                        >
                            <EnterKeyCaptureInput />
                            <div className="mb-4 px-4">
                                <Field
                                    id="name"
                                    name="name"
                                    fullWidth
                                    color="primary"
                                    error={touched.name && Boolean(errors.name)}
                                    helperText={<ErrorMessage name="name" />}
                                    variant="outlined"
                                    as={TextField}
                                    disabled={isAddingResource || isEditingResource}
                                    inputProps={{ maxLength: 24 }}
                                />
                            </div>
                            {editResourceError && (
                                <p className="ml-4 mb-3 text-accent-red text-overline2">{editResourceError?.message}</p>
                            )}
                            {addResourceError && (
                                <p className="ml-4 mb-3 text-accent-red text-overline2">{addResourceError?.message}</p>
                            )}
                            <div className="border-t-2 border-neutral-gray7 flex flex-row items-center justify-end p-4">
                                {!(isAddingResource || isEditingResource) ? (
                                    <>
                                        <TextButton
                                            onClick={(event) => {
                                                event?.preventDefault();
                                                event?.stopPropagation();
                                                onClose();
                                            }}
                                            classes="mr-3"
                                        >
                                            Cancel
                                        </TextButton>
                                        <PrimaryButton onClick={submitForm}>Done</PrimaryButton>
                                    </>
                                ) : (
                                    <CircularProgress size="24px" />
                                )}
                            </div>
                        </Form>
                    </>
                )}
            </Formik>
        </div>
    );
};

export default AddOrEditResource;
