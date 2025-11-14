import { TextField } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import _ from 'lodash';
import { useRef, useState } from 'react';
import * as Yup from 'yup';
import { PrimaryButton, TextButton } from '../../shared/components/AppButton';
import AppIcon from '../../shared/components/AppIcon';
import EnterKeyCaptureInput from '../../shared/components/EnterKeyCaptureInput';
import Messages from '../../shared/messages';
import apiNameSchema from '../../shared/schemas/apiNameSchema';

const ChangeColumnName = ({ labelItem, isNameTaken, renameColumn, onClose }) => {
    const formRef = useRef(null);
    const [error, setError] = useState(null);

    const onTableNameUpdate = ({ name }) => {
        if (isNameTaken(labelItem, name)) {
            setError(Messages.TABLE_COLUMN_EXISTS);
            return;
        }
        renameColumn(labelItem, name);
    };

    return (
        <div
            className="flex flex-col"
            onClick={(e) => {
                e?.preventDefault();
                e?.stopPropagation();
            }}
        >
            <div className="flex flex-row p-4 justify-between border-b-1">
                <p className="text-subtitle2">Edit Column Name</p>
                <AppIcon
                    onClick={(e) => {
                        e?.preventDefault();
                        e?.stopPropagation();

                        onClose();
                    }}
                >
                    <CloseIcon />
                </AppIcon>
            </div>

            <div className="p-4">
                <Formik
                    initialValues={{
                        name: labelItem?.name ?? '',
                    }}
                    validationSchema={Yup.object().shape({
                        name: apiNameSchema(Messages.NAME_REQUIRED),
                    })}
                    innerRef={formRef}
                    onSubmit={onTableNameUpdate}
                >
                    {({ errors, touched, values, handleBlur, validateForm, setErrors, submitForm }) => (
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

                            <Field
                                id="name"
                                name="name"
                                fullWidth
                                color="primary"
                                variant="outlined"
                                error={touched.name && Boolean(errors.name)}
                                helperText={<ErrorMessage name="name" />}
                                onKeyUp={(e) => {
                                    if (error) {
                                        setError(null);
                                    }
                                }}
                                inputProps={{
                                    style: {
                                        height: '6px',
                                    },
                                }}
                                as={TextField}
                            />
                        </Form>
                    )}
                </Formik>
            </div>

            {error && <p className="text-overline2 text-accent-red m-4 mt-0">{error}</p>}

            <div className="border-t-1 p-4 flex flex-row justify-end">
                <TextButton
                    onClick={(e) => {
                        e?.preventDefault();
                        e?.stopPropagation();

                        onClose();
                    }}
                >
                    Cancel
                </TextButton>
                <PrimaryButton
                    onClick={(e) => {
                        formRef.current.submitForm();
                    }}
                >
                    Save
                </PrimaryButton>
            </div>
        </div>
    );
};

export default ChangeColumnName;
