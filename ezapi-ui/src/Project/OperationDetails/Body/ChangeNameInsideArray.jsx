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

const ChangeNameInsideArray = ({
    labelItem,
    request,
    responseCode,
    onClose,
    array,
    isColumn = false,
    root,
    onUpdate = () => {},
}) => {
    const formRef = useRef(null);
    const setOperationDetails = useSetRecoilState(operationAtomWithMiddleware);
    const getRecoilValueInfo = useGetRecoilValueInfo_UNSTABLE();
    const [error, setError] = useState(null);

    const isNameAlreadyExisting = (name) => {
        const { loadable: operationAtom } = getRecoilValueInfo(operationAtomWithMiddleware);

        const operationDetails = operationAtom?.contents;
        let nameExists = false;
        let obj = {};

        if (root) {
            setOperationDetails((operationDetails) => {
                const newOperationDetails = _.cloneDeep(operationDetails);
                let data = request ? newOperationDetails.operationRequest : newOperationDetails.operationResponse;

                let responseData;
                if (request) {
                    responseData = data;
                } else {
                    const responseIndex = data?.findIndex((item) => item.responseCode === responseCode);
                    responseData = data[responseIndex];
                }

                const index = responseData.body.findIndex((x) => x?.name === root?.name);

                if (index !== -1) {
                    if (responseData.body[index].items && responseData.body[index].items?.properties) {
                        if (responseData.body[index].items?.properties[array.name].items?.properties) {
                            obj = responseData.body[index].items?.properties[array.name].items?.properties;
                        }

                        if (responseData.body[index].items?.properties[array.name].properties) {
                            obj = responseData.body[index].items?.properties[array.name].properties;
                        }
                    }

                    if (responseData.body[index].properties) {
                        if (responseData.body[index].properties[array.name].items?.properties) {
                            obj = responseData.body[index].properties[array.name].items?.properties;
                        }

                        if (responseData.body[index].properties[array.name].properties) {
                            obj = responseData.body[index].properties[array.name].properties;
                        }
                    }
                    // onUpdate(newOperationDetails);
                    return newOperationDetails;
                }
            });
        } else {
            const newOperationDetails = _.cloneDeep(operationDetails);
            let data = request ? newOperationDetails.operationRequest : newOperationDetails.operationResponse;

            let responseData;
            if (request) {
                responseData = data;
            } else {
                const responseIndex = data?.findIndex((item) => item.responseCode === responseCode);
                responseData = data[responseIndex];
            }

            const arrayIndex = responseData?.body?.findIndex((body) => body.name === array.name);

            if (responseData.body[arrayIndex].items?.properties) {
                obj = responseData.body[arrayIndex].items?.properties;
            }

            if (responseData.body[arrayIndex].properties) {
                obj = responseData.body[arrayIndex].properties;
            }
        }

        let size = Object.keys(obj).length;

        for (let i = 0; i < size; i++) {
            if (Object.keys(obj)[i] === name) {
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

        if (root) {
            setOperationDetails((operationDetails) => {
                const newOperationDetails = _.cloneDeep(operationDetails);
                let data = request ? newOperationDetails.operationRequest : newOperationDetails.operationResponse;

                let responseData;
                if (request) {
                    responseData = data;
                } else {
                    const responseIndex = data?.findIndex((item) => item.responseCode === responseCode);
                    responseData = data[responseIndex];
                }
                const index = responseData.body.findIndex((x) => x?.name === root?.name);
                const clonedTableData = _.cloneDeep(labelItem);
                clonedTableData.name = name;

                if (index !== -1) {
                    if (responseData.body[index].items && responseData.body[index].items?.properties) {
                        if (responseData.body[index].items?.properties[array.name].items?.properties) {
                            responseData.body[index].items.properties[array.name].items.properties[name] =
                                clonedTableData;
                            delete responseData.body[index].items?.properties[array.name].items?.properties[
                                labelItem.name
                            ];
                        }

                        if (responseData.body[index].items?.properties[array.name].properties) {
                            responseData.body[index].items.properties[array.name].properties[name] = clonedTableData;
                            delete responseData.body[index].items?.properties[array.name].properties[labelItem.name];
                        }
                    }

                    if (responseData.body[index].properties) {
                        if (responseData.body[index].properties[array.name].items?.properties) {
                            responseData.body[index].properties[array.name].items.properties[name] = clonedTableData;
                            delete responseData.body[index].properties[array.name].items?.properties[labelItem.name];
                        }

                        if (responseData.body[index].properties[array.name].properties) {
                            responseData.body[index].properties[array.name].properties[name] = clonedTableData;
                            delete responseData.body[index].properties[array.name].properties[labelItem.name];
                        }
                    }
                    onUpdate(newOperationDetails);
                    return newOperationDetails;
                }
            });
        } else {
            setOperationDetails((operationDetails) => {
                const newOperationDetails = _.cloneDeep(operationDetails);
                let data = request ? newOperationDetails.operationRequest : newOperationDetails.operationResponse;

                let responseData;
                if (request) {
                    responseData = data;
                } else {
                    const responseIndex = data?.findIndex((item) => item.responseCode === responseCode);
                    responseData = data[responseIndex];
                }

                const arrayIndex = responseData?.body?.findIndex((body) => body.name === array.name);

                const clonedTableData = _.cloneDeep(labelItem);
                clonedTableData.name = name;

                if (responseData.body[arrayIndex].items?.properties) {
                    responseData.body[arrayIndex].items.properties[name] = clonedTableData;
                    delete responseData.body[arrayIndex].items.properties[labelItem.name];
                } else if (responseData.body[arrayIndex].properties) {
                    responseData.body[arrayIndex].properties[name] = clonedTableData;
                    delete responseData.body[arrayIndex].properties[labelItem.name];
                }

                onUpdate(newOperationDetails);

                return newOperationDetails;
            });
        }
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
                {isColumn ? (
                    <p className="text-subtitle2">Edit Column Name</p>
                ) : (
                    <p className="text-subtitle2">Edit Table Name</p>
                )}
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

export default ChangeNameInsideArray;
