import { TextField } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import _ from 'lodash';
import { useRef, useState } from 'react';
import { useGetRecoilValueInfo_UNSTABLE, useSetRecoilState } from 'recoil';
import * as Yup from 'yup';
import { PrimaryButton, TextButton } from '../../../shared/components/AppButton';
import AppIcon from '../../../shared/components/AppIcon';
import EnterKeyCaptureInput from '../../../shared/components/EnterKeyCaptureInput';
import Messages from '../../../shared/messages';
import apiNameSchema from '../../../shared/schemas/apiNameSchema';
import { operationAtomWithMiddleware } from '../../../shared/utils';

const ChangeTableName = ({ labelItem, request, responseCode, onClose, onUpdate = () => {} }) => {
    const formRef = useRef(null);
    const setOperationDetails = useSetRecoilState(operationAtomWithMiddleware);
    const getRecoilValueInfo = useGetRecoilValueInfo_UNSTABLE();
    const [error, setError] = useState(null);

    const isNameAlreadyExisting = (name) => {
        const { loadable: operationAtom } = getRecoilValueInfo(operationAtomWithMiddleware);
        const operationDetails = operationAtom?.contents;

        let nameExists = false;

        if (request) {
            const index = operationDetails.operationRequest.body.findIndex(
                (x) => x?.name === name && x?.sourceName !== labelItem?.sourceName,
            );
            if (index !== -1) {
                nameExists = true;
            }
        } else {
            const responseIndex = operationDetails?.operationResponse?.findIndex(
                (item) => item.responseCode === responseCode,
            );
            const responseData = operationDetails?.operationResponse[responseIndex];

            const existingBodyIndex = responseData?.body?.findIndex((body) => body.name === name);

            if (existingBodyIndex >= 0 && responseData && responseIndex >= 0) {
                nameExists = true;
            }
        }

        return nameExists;
    };

    const onTableNameUpdate = ({ name }) => {
        if (isNameAlreadyExisting(name)) {
            setError(Messages.TABLE_COLUMN_EXISTS);

            return;
        }

        setOperationDetails((operationDetails) => {
            if (request) {
                const index = operationDetails.operationRequest.body.findIndex((x) => x.name === labelItem?.name);
                if (index !== -1) {
                    const newOperationDetails = _.cloneDeep(operationDetails);
                    const clonedTableData = _.cloneDeep(labelItem);

                    clonedTableData.name = name;
                    newOperationDetails.operationRequest.body[index] = clonedTableData;

                    onUpdate(newOperationDetails);
                    return newOperationDetails;
                }
            } else {
                const responseData = operationDetails?.operationResponse?.find(
                    (item) => item.responseCode === responseCode,
                );
                const responseIndex = operationDetails?.operationResponse?.findIndex(
                    (item) => item.responseCode === responseCode,
                );

                const existingBodyIndex = responseData?.body?.findIndex((body) => body.name === labelItem.name);

                if (existingBodyIndex >= 0 && responseData && responseIndex >= 0) {
                    const clonedOperationDetails = _.cloneDeep(operationDetails);
                    const clonedResponseData = _.cloneDeep(responseData);
                    const clonedTableData = _.cloneDeep(labelItem);

                    clonedTableData.name = name;
                    clonedResponseData.body[existingBodyIndex] = clonedTableData;

                    clonedOperationDetails.operationResponse[responseIndex] = clonedResponseData;
                    onUpdate(clonedOperationDetails);
                    return clonedOperationDetails;
                }
            }

            return operationDetails;
        });
        //refresh();
        onClose();
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
                <p className="text-subtitle2">Edit Table Name</p>
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
                    onClose={onClose}
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
                                onKeyUp={(event) => {
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

export default ChangeTableName;
