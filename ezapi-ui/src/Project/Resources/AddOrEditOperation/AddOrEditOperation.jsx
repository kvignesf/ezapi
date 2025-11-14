import { CircularProgress, MenuItem, Select, TextField } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { useGetRecoilValueInfo_UNSTABLE, useRecoilState } from 'recoil';
import { operationAtomWithMiddleware } from '../../../shared/utils';
// import { operationAtomWithMiddleware } from "../../../shared/utils";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import _ from 'lodash';
import { useParams } from 'react-router-dom';
import { PrimaryButton, TextButton } from '../../../shared/components/AppButton';
import AppIcon from '../../../shared/components/AppIcon';
import EnterKeyCaptureInput from '../../../shared/components/EnterKeyCaptureInput';
import { useSyncOperation } from '../../../shared/query/operationDetailsQuery';
import { useAddOperation, useEditOperation } from './operationQuery';
import operationSchema from './operationSchema';

const OperationType = [
    {
        id: 'get',
        name: 'GET',
    },
    {
        id: 'post',
        name: 'POST',
    },
    {
        id: 'put',
        name: 'PUT',
    },
    {
        id: 'del',
        name: 'DELETE',
    },
    {
        id: 'patch',
        name: 'PATCH',
    },
    // {
    //   id: "trace",
    //   name: "TRACE",
    // },
    //{
    //  id: "head",
    //  name: "HEAD",
    //},
];

const CustomTextField = (props) => (
    <TextField
        InputProps={{
            style: {
                background: 'white',
            },
        }}
        {...props}
    />
);

const CustomSelect = (props) => (
    <Select
        style={{ background: 'white' }}
        inputProps={{
            style: {
                background: 'white',
            },
        }}
        {...props}
    />
);

const AddOrEditOperation = ({
    title,
    resourceId,
    pathId,
    operation: { operationName, operationType, operationDescription, operationId },
    onClose,
}) => {
    const getRecoilValueInfo = useGetRecoilValueInfo_UNSTABLE();
    let [operationData, setOperationDetails] = useRecoilState(operationAtomWithMiddleware);
    const {
        isLoading: isAddingOperation,
        isSuccess: isAddingOperationSuccess,
        error: addOperationError,
        mutate: addOperation,
        reset: resetAddOperation,
    } = useAddOperation();
    const {
        isLoading: isSyncingOperation,
        isSuccess: isSyncOperationSuccess,
        error: syncOperationError,
        mutate: syncOperation,
        reset: resetSyncOperationMutation,
    } = useSyncOperation();
    const {
        isLoading: isEditingOperation,
        isSuccess: isEditingOperationSuccess,
        error: editOperationError,
        mutate: editOperation,
        reset: resetEditOperation,
    } = useEditOperation();
    const { projectId } = useParams();
    const resetMutationState = () => {
        if (operationName && operationDescription && operationType) {
            if (editOperationError || isEditingOperationSuccess || isEditingOperation) {
                resetEditOperation();
            }
        } else if (addOperationError || isAddingOperationSuccess || isAddingOperation) {
            resetAddOperation();
        }
    };

    const handleSubmit = async ({ name, type, desc }) => {
        if (operationId && !_.isEmpty(operationId)) {
            if (name !== operationName || type !== operationType || desc !== operationDescription) {
                editOperation({
                    pathId,
                    projectId,
                    resourceId,
                    operationId,
                    name,
                    type,
                    desc,
                });
            }
            /* const { data: saveSimulateArtefactsData } = await client.post(
        `simulation_artefacts`,
        {
          projectid: projectId,
        }
      ); */
            return;
        }

        addOperation({
            pathId,
            projectId,
            resourceId,
            name,
            type,
            desc,
        });
    };

    if (isEditingOperationSuccess || isAddingOperationSuccess) {
        onClose();
        return null;
    }

    return (
        <div
            onClick={(event) => {
                event?.stopPropagation();
            }}
        >
            <div className="p-4 flex flex-row justify-between border-b-2">
                <h5>{title}</h5>

                <AppIcon onClick={onClose}>
                    <CloseIcon />
                </AppIcon>
            </div>

            <Formik
                initialValues={{
                    name: operationName ?? '',
                    type: operationType ?? OperationType[0].name,
                    desc: operationDescription ?? '',
                }}
                validationSchema={operationSchema}
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

                            <div className="m-4 p-4 rounded-md bg-neutral-gray7">
                                <div className="flex flex-row mb-3">
                                    <div className="mr-5">
                                        <p className="text-overline2 mb-2">Operation Type</p>
                                        <Field
                                            variant="outlined"
                                            required
                                            fullWidth
                                            id="type"
                                            name="type"
                                            // onKeyUp={resetMutationState}
                                            helperText={<ErrorMessage name="role" />}
                                            error={touched.role && Boolean(errors.role)}
                                            as={CustomSelect}
                                            IconComponent={ExpandMoreIcon}
                                            disabled={isEditingOperation || isAddingOperation}
                                            onClick={resetMutationState}
                                        >
                                            {OperationType.map((value) => {
                                                return <MenuItem value={value.name}>{value.name}</MenuItem>;
                                            })}
                                        </Field>
                                    </div>

                                    <div className="flex-1">
                                        <p className="text-overline2 mb-2">Operation Name</p>
                                        <Field
                                            id="name"
                                            name="name"
                                            fullWidth
                                            color="primary"
                                            // onKeyUp={resetMutationState}
                                            error={touched.name && Boolean(errors.name)}
                                            helperText={<ErrorMessage name="name" />}
                                            variant="outlined"
                                            as={CustomTextField}
                                            disabled={isEditingOperation || isAddingOperation}
                                            inputProps={{ maxLength: 24 }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <p className="text-overline2 mb-2">Description</p>
                                    <Field
                                        id="desc"
                                        name="desc"
                                        fullWidth
                                        color="primary"
                                        error={touched.desc && Boolean(errors.desc)}
                                        helperText={<ErrorMessage name="desc" />}
                                        variant="outlined"
                                        // onKeyUp={resetMutationState}
                                        as={CustomTextField}
                                        multiline
                                        rows={4}
                                        disabled={isEditingOperation || isAddingOperation}
                                        inputProps={{ maxLength: 64 }}
                                    />
                                </div>
                            </div>

                            {editOperationError && (
                                <p className="ml-4 mb-3 text-accent-red text-overline2">
                                    {editOperationError?.message}
                                </p>
                            )}

                            {addOperationError && (
                                <p className="ml-4 mb-3 text-accent-red text-overline2">{addOperationError?.message}</p>
                            )}

                            <div className="border-t-2 border-neutral-gray7 flex flex-row items-center justify-end p-4">
                                {!(isEditingOperation || isAddingOperation) ? (
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

export default AddOrEditOperation;
