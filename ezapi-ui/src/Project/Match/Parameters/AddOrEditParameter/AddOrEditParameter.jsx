import { Checkbox, TextField } from '@material-ui/core';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';
import { FormHelperText } from '@mui/material';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { useRecoilState } from 'recoil';
import addParamAtom from '../../../../shared/atom/addParamAtom';
import AppIcon from '../../../../shared/components/AppIcon';
import Constants from '../../../../shared/constants';
import { useAddParameter, useEditParameter } from './modifyParameterQueries';
import addParameterSchema from './parameterSchema';

const AddOrEditParameter = ({ projectType, parameter, onClose, stopEdit }) => {
    const formRef = useRef(null);
    const { projectId } = useParams();
    const [addParamCheck, setAddParamCheck] = useRecoilState(addParamAtom);
    const [clearErrorMssgs, setClearErrorMssgs] = useState(true);
    const {
        isLoading: isAddingParameter,
        isSuccess: isAddSuccess,
        error: addParamError,
        mutate: addParam,
        reset: resetAddParam,
    } = useAddParameter();
    const {
        isLoading: isEditingParameter,
        isSuccess: isEditSuccess,
        error: editParamError,
        mutate: editParam,
        reset: resetEditParam,
    } = useEditParameter();

    const handleSubmit = (values, { resetForm }) => {
        if (parameter) {
            editParam({
                projectId,
                paramId: parameter?.id,
                ...values,
            });
            //console.log("editparamerror", editParamError);
            //resetForm({values:''})
            return;
        }
        addParam({
            projectId,
            ...values,
        });
        //console.log("addParamError", addParamError?.response?.data?.error);
        //resetForm({values:''})
        return;
    };

    const resetMutationState = () => {
        if (parameter) {
            if (isEditingParameter || isEditSuccess || editParamError) {
                resetEditParam();
            }
            return;
        }

        if (isAddingParameter || isAddSuccess || addParamError) {
            resetAddParam();
        }
    };

    useEffect(() => {
        if (addParamCheck) {
            if (
                formRef.current.values.attribute === '' &&
                formRef.current.values.dataType === '' &&
                formRef.current.values.description === '' &&
                formRef.current.values.possibleValues === '' &&
                formRef.current.values.required === false
            ) {
            } else {
                formRef.current.submitForm();
            }
            setAddParamCheck(false);
        }
    }, [addParamCheck]);
    useEffect(() => {
        if (isAddSuccess) {
            formRef.current.resetForm({ values: '' });
        }
    }, [isAddSuccess]);

    useEffect(() => {
        if (isEditSuccess) {
            stopEdit();
        }
    }, [isEditSuccess]);

    // useEffect(() => {
    //   if(addParamError){
    //     formRef.current.resetForm({values:{attribute:""}})
    //   }
    // }, [addParamError]);

    return (
        <>
            <div className="flex flex-col mt-2">
                <div className="mb-3">
                    <Formik
                        initialValues={{
                            attribute: parameter?.name ?? '',
                            dataType: parameter?.commonName ?? '',
                            description: parameter?.description ?? '',
                            required: parameter?.required ?? false,
                            possibleValues:
                                parameter?.possibleValues?.reduce((acc, curr) => {
                                    if (!_.isEmpty(acc)) {
                                        return acc + ', ' + curr;
                                    }
                                    return curr;
                                }, '') ?? '',
                        }}
                        validationSchema={addParameterSchema}
                        innerRef={formRef}
                        onSubmit={handleSubmit}
                    >
                        {({ errors, touched, formik, setFieldValue }) => (
                            <Form>
                                <div
                                    onKeyDown={(e) => {
                                        // resetMutationState();
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            formRef.current.submitForm();
                                            /* if(parameter){
                          stopEdit();
                          } */
                                        }
                                    }}
                                    className="bg-white mb-1 rounded-md flex flex-row p-1 py-1 items-center"
                                >
                                    {/* <div className='mb-4'> */}
                                    <div className="w-4"></div>
                                    <p className="flex-1 ml-1 mr-2 text-overline2">
                                        <Field
                                            id="attribute"
                                            name="attribute"
                                            placeholder="attribute"
                                            fullWidth
                                            color="primary"
                                            variant="outlined"
                                            disabled={isAddingParameter || isEditingParameter}
                                            error={touched.attribute && Boolean(errors.attribute)}
                                            helperText={<ErrorMessage name="attribute" />}
                                            onKeyUp={(e) => {
                                                resetMutationState();
                                            }}
                                            inputProps={{
                                                style: {
                                                    height: '4px',
                                                },
                                            }}
                                            as={TextField}
                                        />
                                    </p>

                                    <p className="flex-1 text-overline2 ml-2 mr-2 mb-1">
                                        <Field
                                            id="dataType"
                                            name="dataType"
                                            fullWidth
                                            color="primary"
                                            variant="outlined"
                                            disabled={isAddingParameter || isEditingParameter}
                                            error={touched.dataType && Boolean(errors.dataType)}
                                            helperText={<ErrorMessage name="dataType" />}
                                            onKeyUp={(e) => {
                                                resetMutationState();
                                            }}
                                            style={{
                                                border: '1px solid #c0c0c0',
                                                height: '42px',
                                                borderRadius: '4px',
                                                width: '100%',
                                                color: 'primary',
                                                backgroundColor: '#ffffff',
                                                borderColor: touched.dataType && errors.dataType && '#f44336',
                                            }}
                                            as="select"
                                        >
                                            <option value="">Select your datatype</option>
                                            {projectType === 'noinput' || projectType === 'aggregate'
                                                ? Constants.parameterDataTypes.map((type) => {
                                                      var upCaseType = type.charAt(0).toUpperCase() + type.slice(1);
                                                      return <option value={type}>{upCaseType}</option>;
                                                  })
                                                : Constants.customizedParameterDataTypes.map((type) => {
                                                      var upCaseType = type.charAt(0).toUpperCase() + type.slice(1);
                                                      return <option value={type}>{upCaseType}</option>;
                                                  })}
                                        </Field>
                                        {touched.dataType && errors.dataType && (
                                            <FormHelperText htmlFor="render-select" error>
                                                {errors.dataType}
                                            </FormHelperText>
                                        )}
                                    </p>

                                    <p className="flex-1 text-overline2 ml-2 mr-1">
                                        <Field
                                            id="possibleValues"
                                            name="possibleValues"
                                            placeholder="value1, value2, value3"
                                            fullWidth
                                            color="primary"
                                            variant="outlined"
                                            disabled={isAddingParameter || isEditingParameter}
                                            error={touched.possibleValues && Boolean(errors.possibleValues)}
                                            helperText={<ErrorMessage name="possibleValues" />}
                                            onKeyUp={(e) => {
                                                resetMutationState();
                                            }}
                                            inputProps={{
                                                style: {
                                                    height: '4px',
                                                },
                                            }}
                                            as={TextField}
                                        />
                                    </p>

                                    <p className="flex-1 text-overline2 ml-5">
                                        <p className="text-center">
                                            {/* <Field
                    id='required'
                    name='required'
                    type='checkbox'
                    disabled={isAddingParameter || isEditingParameter}
                    component={({ field }) => {
                      return (
                        <Checkbox
                          {...field}
                          disabled={isAddingParameter || isEditingParameter}
                          style={{
                            color: Colors.brand.secondary,
                            padding: "0",
                          }}
                        />
                      );
                    }}
                  /> */}

                                            <Field name="required">
                                                {({ field }) => (
                                                    <Checkbox
                                                        onChange={(e) => {
                                                            setFieldValue('required', e.target.checked);
                                                        }}
                                                        checked={field.value}
                                                    />
                                                )}
                                            </Field>
                                        </p>
                                    </p>

                                    <p className="flex-1 text-overline2 pr-5 mr-6">
                                        <Field
                                            id="description"
                                            name="description"
                                            placeholder="description"
                                            fullWidth
                                            style={{ marginLeft: '20px' }}
                                            color="primary"
                                            variant="outlined"
                                            disabled={isAddingParameter || isEditingParameter}
                                            error={touched.description && Boolean(errors.description)}
                                            helperText={<ErrorMessage name="description" />}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Tab') {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    formRef.current.submitForm();
                                                    /*  if(parameter){
                          stopEdit();
                        } */
                                                }
                                            }}
                                            inputProps={{
                                                style: {
                                                    height: '4px',
                                                },
                                            }}
                                            as={TextField}
                                        />
                                    </p>
                                    {!isAddingParameter && !isEditingParameter && parameter ? (
                                        <div className="w-12 h-8 flex flex-row pt-1">
                                            <AppIcon
                                                className="mr-1"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    formRef.current.submitForm();
                                                    //stopEdit();
                                                }}
                                            >
                                                <DoneIcon
                                                    className={'cursor-pointer'}
                                                    style={{ height: '1.25rem', color: '#c72c71' }}
                                                />
                                            </AppIcon>
                                            <AppIcon
                                                className="mr-1"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    stopEdit();
                                                }}
                                            >
                                                <CloseIcon
                                                    className={'cursor-pointer'}
                                                    style={{ marginLeft: '5px', height: '1.25rem', color: '#c72c71' }}
                                                />
                                            </AppIcon>
                                        </div>
                                    ) : (
                                        <div className="w-12 h-8 flex flex-row pt-1 pl-7">
                                            <AppIcon
                                                className="mr-1"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    formRef.current.resetForm();
                                                    resetAddParam();
                                                }}
                                            >
                                                <DeleteIcon
                                                    className={'cursor-pointer'}
                                                    style={{ height: '1.25rem', color: '#c72c71' }}
                                                />
                                            </AppIcon>
                                        </div>
                                    )}
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>

                {addParamError && (
                    <p className="text-accent-red text-overline2">{addParamError?.response?.data?.error}</p>
                )}

                {editParamError && (
                    <p className="text-accent-red text-overline2">
                        {/* {editParamError?.error} */}
                        {editParamError?.response?.data?.error}
                    </p>
                )}
            </div>
        </>
    );
};

export default AddOrEditParameter;
