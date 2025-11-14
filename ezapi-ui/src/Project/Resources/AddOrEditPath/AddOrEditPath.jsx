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
import { useAddPath, useEditPath } from './pathQuery';

const AddOrEditPath = ({ title, resourceId, path: { pathId, pathName }, onClose }) => {
    const {
        isLoading: isAddingPath,
        isSuccess: isAddingPathSuccess,
        error: addPathError,
        mutate: addPath,
    } = useAddPath();
    const {
        isLoading: isEditingPath,
        isSuccess: isEditingPathSuccess,
        error: editPathError,
        mutate: editPath,
    } = useEditPath();

    const handleSubmit = ({ name: updatedPathName }) => {
        if (pathId && !_.isEmpty(pathId)) {
            if (pathName !== updatedPathName) {
                editPath({
                    pathId: pathId,
                    resourceId: resourceId,
                    pathName: updatedPathName,
                });
            }
            return;
        }

        addPath({
            resourceId: resourceId,
            pathName: updatedPathName,
        });
    };

    if (isEditingPathSuccess || isAddingPathSuccess) {
        onClose();
        return null;
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

            <p className="my-2 mx-4 text-overline2">Path Name</p>

            <Formik
                initialValues={{
                    name: pathName ?? '',
                }}
                validationSchema={Yup.object().shape({
                    name: apiNameSchema(Messages.NAME_REQUIRED),
                })}
                onSubmit={handleSubmit}
            >
                {({ errors, touched, values, handleBlur, validateForm, setErrors, submitForm }) => (
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
                                    disabled={isEditingPath || isAddingPath}
                                    inputProps={{ maxLength: 24 }}
                                />
                            </div>

                            {editPathError && (
                                <p className="ml-4 mb-3 text-accent-red text-overline2">{editPathError?.message}</p>
                            )}

                            {addPathError && (
                                <p className="ml-4 mb-3 text-accent-red text-overline2">{addPathError?.message}</p>
                            )}

                            <div className="border-t-2 border-neutral-gray7 flex flex-row items-center justify-end p-4">
                                {!(isEditingPath || isAddingPath) ? (
                                    <>
                                        <TextButton
                                            onClick={() => {
                                                onClose();
                                            }}
                                            classes="mr-3"
                                        >
                                            Cancel
                                        </TextButton>
                                        <PrimaryButton type="submit">Done</PrimaryButton>
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

export default AddOrEditPath;
