import { CircularProgress, MenuItem, Select, Tab, Tabs, TextField } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import { ErrorMessage, Field, FieldArray, Form, Formik } from 'formik';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { useRecoilState } from 'recoil';
import tablesDataAtom from '../../../../shared/atom/tablesDataAtom';
import Colors from '../../../../shared/colors';
import { PrimaryButton, TextButton } from '../../../../shared/components/AppButton';
import AppIcon from '../../../../shared/components/AppIcon';
import TabLabel from '../../../../shared/components/TabLabel';
import Constants from '../../../../shared/constants';
import Messages from '../../../../shared/messages';
import addCustomParameterSchema from './customParameterSchema';
import FilterItem from './FilterItem/FilterItem';
import { useAddCustomParameter, useEditCustomParameter } from './modifyCustomParameterQueries';

const AddOrEditCustomParameter = ({ parameter, onClose }) => {
    const formRef = useRef(null);
    const { projectId } = useParams();
    const [currentTab, setTab] = useState(0);
    const [tablesDataState, setTablesDataState] = useRecoilState(tablesDataAtom);
    const [columns, setColumns] = useState();
    const [filterColumns, setFilterColumns] = useState([]);
    const [tableName, setTableName] = useState(parameter?.tableName);
    const [filterErrors, setFilterErrors] = useState([]);
    const [isAlreadyChecked, setIsAlreadyChecked] = useState(false);
    const [columnsType, setColumnsType] = useState(parameter?.type);
    const [isTypeChanged, setIsTypeChanged] = useState(false);
    const [emptyColumnsError, setEmptyColumnsError] = useState();

    const [tabsError, setTabsError] = useState({
        tab0: parameter ? true : false,
        tab1: parameter ? true : false,
    });

    const {
        isLoading: isAddingCustomParameter,
        isSuccess: isAddSuccess,
        error: addCustomParamError,
        mutate: addCustomParam,
        reset: resetAddCustomParam,
    } = useAddCustomParameter();

    const {
        isLoading: isEditingCustomParameter,
        isSuccess: isEditCustomSuccess,
        error: editCustomParamError,
        mutate: editCustomParam,
        reset: resetEditCustomParam,
    } = useEditCustomParameter();

    const initialFilters = {
        filters: parameter?.filters ?? [
            {
                columnName: '',
                conditionKey: '',
                value: '',
                relation: null,
            },
        ],
    };

    const temp = {
        columnName: '',
        conditionKey: '',
        value: '',
        relation: '',
    };

    useEffect(() => {
        if (tableName && tablesDataState) {
            let table = tablesDataState?.find((item) => item.name === tableName);
            setFilterColumns(table?.selectedColumns);
            if (columnsType === 'integer') {
                let cols = table?.selectedColumns.filter((item) => item.type === 'integer');
                setColumns(cols);
            } else {
                setColumns(table?.selectedColumns);
            }
        }
    }, [tableName, tablesDataState, columnsType]);

    useEffect(() => {
        if (columns && columns.length === 0) {
            setEmptyColumnsError('Please select different type. None of the columns match selected type');
        } else {
            setEmptyColumnsError();
        }
    }, [columns]);

    useEffect(() => {
        if (isTypeChanged) {
            formRef.current.values.functionName = '';
            formRef.current.values.columnName = '';
            setIsTypeChanged(false);
            setTabsError({ ...tabsError, tab1: false });
        }
    }, [isTypeChanged, tabsError]);

    const handleSubmit = (values) => {
        if (parameter) {
            editCustomParam({
                projectId,
                customParamID: parameter?.customParamID,
                ...values,
            });
            return;
        }
        addCustomParam({
            projectId,
            ...values,
        });
    };

    const resetMutationState = () => {
        if (parameter) {
            if (isEditingCustomParameter || isEditCustomSuccess || editCustomParamError) {
                resetEditCustomParam();
            }
            return;
        }

        if (isAddingCustomParameter || isAddSuccess || addCustomParamError) {
            resetAddCustomParam();
        }
    };

    if (isAddSuccess || isEditCustomSuccess) {
        formRef.current.resetForm();
        onClose();
        return null;
    }

    const handleNext = (index) => {
        if (index === undefined) index = currentTab + 1;

        let flag = true;
        if (index < currentTab) {
            setTab(index);
        } else if (formRef.current?.values) {
            const { name, type, tableName, columnName, functionName } = formRef.current.values;
            if (currentTab === 0 && (name.length === 0 || type.length === 0)) {
                flag = false;
                formRef.current.touched.name = true;
                formRef.current.touched.type = true;
                setTabsError({ ...tabsError, tab0: false });
            } else if (
                currentTab === 1 &&
                (tableName.length === 0 || columnName.length === 0 || functionName.length === 0)
            ) {
                flag = false;
                formRef.current.touched.tableName = true;
                formRef.current.touched.columnName = true;
                formRef.current.touched.functionName = true;
                setTabsError({ ...tabsError, tab1: false });
            }

            if (flag) {
                formRef.current.touched.name = false;
                formRef.current.touched.type = false;
                formRef.current.touched.tableName = false;
                formRef.current.touched.columnName = false;
                formRef.current.touched.functionName = false;
                if (currentTab === 0 && formRef.current.values.type !== columnsType) {
                    formRef.current.values.columnName = '';
                    formRef.current.values.functionName = '';
                    setTabsError({ ...tabsError, tab1: false });
                }

                if (currentTab === 0) setTabsError({ ...tabsError, tab0: true });
                if (currentTab === 1) setTabsError({ ...tabsError, tab1: true });

                // setTab(currentTab + 1);
                setTab(index);
            }
            formRef.current.validateForm();
        } else if ((parameter && index) || (tabsError.tab0 && tabsError.tab1)) {
            setTab(index);
        }
    };

    const validateFilters = (filters) => {
        let flag = true,
            errors = [];
        if (filters && filters.length > 0) {
            setIsAlreadyChecked(true);
            errors = filters.map((filter, index) => {
                let error = {};

                const { columnName, conditionKey, value, relation } = filter;

                if (columnName.length > 0) {
                    error.columnName = null;
                } else {
                    error.columnName = Messages.COLUMN_REQUIRED;
                    flag = false;
                }

                if (conditionKey.length > 0) {
                    error.conditionKey = null;
                } else {
                    error.conditionKey = Messages.CONDITION_REQUIRED;
                    flag = false;
                }

                if (value.length > 0) {
                    error.value = null;
                } else {
                    error.value = Messages.VALUE_REQUIRED;
                    flag = false;
                }

                if (index !== 0 && relation.length > 0) {
                    error.relation = null;
                } else if (index !== 0) {
                    error.relation = Messages.RELATION_REQUIRED;
                    flag = false;
                }
                return error;
            });
        }
        setFilterErrors(errors);
        return flag;
    };

    const handleDone = () => {
        const { filters } = formRef.current.values;
        if (validateFilters(filters)) {
            formRef.current.submitForm();
        }
    };

    return (
        <div className="flex flex-col">
            <div className="p-4 flex flex-row justify-between border-b-1">
                <p className="text-subtitle1">{parameter ? 'Edit Parameter' : 'Add Parameter'}</p>
                {!isAddingCustomParameter && !isEditCustomSuccess && (
                    <AppIcon
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            formRef.current.resetForm();
                            onClose();
                        }}
                    >
                        <CloseIcon />
                    </AppIcon>
                )}
            </div>
            <div>
                <Tabs
                    value={currentTab}
                    onChange={(_, index) => {
                        handleNext(index);
                    }}
                    aria-label="add custom parameter tabs"
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab label={<TabLabel label={'Naming'} />} style={{ outline: 'none', border: 'none' }} />
                    <Tab label={<TabLabel label={'Result'} />} style={{ outline: 'none', border: 'none' }} />
                    <Tab label={<TabLabel label={'Filter'} />} style={{ outline: 'none', border: 'none' }} />
                </Tabs>

                <div className="p-4">
                    {currentTab === 0 ? (
                        <div className="h-80">
                            <Formik
                                initialValues={{
                                    name: parameter?.name ?? '',
                                    type: parameter?.type ?? '',
                                    tableName: parameter?.tableName ?? '',
                                    columnName: parameter?.columnName ?? '',
                                    functionName: parameter?.functionName ?? '',
                                    filters: parameter?.filters ?? initialFilters.filters,
                                }}
                                validationSchema={addCustomParameterSchema}
                                innerRef={formRef}
                                onSubmit={handleSubmit}
                            >
                                {({ errors, touched, values, handleChange }) => (
                                    <Form>
                                        <div className="mb-4">
                                            <p className="text-overline2 mb-2">Attribute Name</p>
                                            <Field
                                                id="name"
                                                name="name"
                                                style={{ height: '48px' }}
                                                fullWidth
                                                color="primary"
                                                variant="outlined"
                                                disabled={isAddingCustomParameter || isEditingCustomParameter}
                                                error={touched.name && Boolean(errors.name)}
                                                helperText={<ErrorMessage name="attribute" />}
                                                onKeyUp={(e) => {
                                                    resetMutationState();
                                                }}
                                                inputProps={{
                                                    style: {
                                                        height: '6px',
                                                    },
                                                }}
                                                as={TextField}
                                            />
                                            {touched.name && errors?.name && (
                                                <p
                                                    className="py-1"
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        marginLeft: '1rem',
                                                        color: '#f44336',
                                                    }}
                                                >
                                                    {errors?.name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mb-4">
                                            <p className="text-overline2 mb-2">Type</p>
                                            <Field
                                                id="type"
                                                name="type"
                                                style={{ height: '48px' }}
                                                fullWidth
                                                color="primary"
                                                variant="outlined"
                                                onChange={(e) => {
                                                    handleChange(e);
                                                    setColumnsType(e.target.value);
                                                    setIsTypeChanged(true);
                                                }}
                                                disabled={isAddingCustomParameter || isEditingCustomParameter}
                                                error={touched.type && Boolean(errors.type)}
                                                helperText={<ErrorMessage name="type" />}
                                                onKeyUp={(e) => {
                                                    resetMutationState();
                                                }}
                                                as={(value) => {
                                                    return (
                                                        <div className="flex flex-col">
                                                            <Select
                                                                labelId="label type"
                                                                id="type ID"
                                                                variant="outlined"
                                                                className="w-full"
                                                                {...value}
                                                            >
                                                                {Constants.customParameterDataTypes.map(
                                                                    (type, index) => {
                                                                        var upCaseType =
                                                                            type.charAt(0).toUpperCase() +
                                                                            type.slice(1);
                                                                        return (
                                                                            <MenuItem key={index} value={type}>
                                                                                {upCaseType}
                                                                            </MenuItem>
                                                                        );
                                                                    },
                                                                )}
                                                            </Select>
                                                            {value?.error && (
                                                                <p
                                                                    className="py-1"
                                                                    style={{
                                                                        fontSize: '0.75rem',
                                                                        marginLeft: '1rem',
                                                                        color: '#f44336',
                                                                    }}
                                                                >
                                                                    {errors?.type}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                }}
                                            />
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    ) : currentTab === 1 ? (
                        <div className="h-80">
                            <Formik
                                initialValues={{
                                    name: parameter?.name ?? '',
                                    type: parameter?.type ?? '',
                                    tableName: parameter?.tableName ?? '',
                                    columnName: parameter?.columnName ?? '',
                                    functionName: parameter?.functionName ?? '',
                                    filters: parameter?.filters ?? initialFilters.filters,
                                }}
                                validationSchema={addCustomParameterSchema}
                                innerRef={formRef}
                                onSubmit={handleSubmit}
                            >
                                {({ errors, touched, values, handleChange, handleBlur }) => (
                                    <Form>
                                        <div className="mb-4">
                                            <p className="text-overline2 mb-2">Table Name</p>
                                            <Field
                                                id="tableName"
                                                name="tableName"
                                                style={{ height: '48px' }}
                                                fullWidth
                                                color="primary"
                                                variant="outlined"
                                                disabled={isAddingCustomParameter || isEditingCustomParameter}
                                                error={touched.tableName && Boolean(errors.tableName)}
                                                helperText={<ErrorMessage name="tableName" />}
                                                onKeyUp={(e) => {
                                                    resetMutationState();
                                                }}
                                                onChange={(e) => {
                                                    handleChange(e);
                                                    setTableName(e.target.value);
                                                }}
                                                as={(value) => {
                                                    return (
                                                        <div className="flex flex-col">
                                                            <Select
                                                                labelId="label tableName"
                                                                id="tableName"
                                                                variant="outlined"
                                                                className="w-full"
                                                                {...value}
                                                            >
                                                                {tablesDataState?.map((table, index) => {
                                                                    return (
                                                                        <MenuItem key={index} value={table.name}>
                                                                            {table.name}
                                                                        </MenuItem>
                                                                    );
                                                                })}
                                                            </Select>
                                                            {value?.error && (
                                                                <p
                                                                    className="py-1"
                                                                    style={{
                                                                        fontSize: '0.75rem',
                                                                        marginLeft: '1rem',
                                                                        color: '#f44336',
                                                                    }}
                                                                >
                                                                    {errors?.tableName}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                }}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <p className="text-overline2 mb-2">Column Name</p>
                                            <Field
                                                id="columnName"
                                                name="columnName"
                                                style={{ height: '48px' }}
                                                fullWidth
                                                color="primary"
                                                variant="outlined"
                                                disabled={isAddingCustomParameter || isEditingCustomParameter}
                                                error={touched.columnName && Boolean(errors.columnName)}
                                                helperText={<ErrorMessage name="columnName" />}
                                                onKeyUp={(e) => {
                                                    resetMutationState();
                                                }}
                                                as={(value) => {
                                                    return (
                                                        <div className="flex flex-col">
                                                            <Select
                                                                labelId="columnName"
                                                                id="columnName"
                                                                variant="outlined"
                                                                className="w-full"
                                                                {...value}
                                                            >
                                                                {columns?.map((column, index) => {
                                                                    return (
                                                                        <MenuItem key={index} value={column.name}>
                                                                            {column.name}
                                                                        </MenuItem>
                                                                    );
                                                                })}
                                                            </Select>
                                                            {value?.error && (
                                                                <p
                                                                    className="py-1"
                                                                    style={{
                                                                        fontSize: '0.75rem',
                                                                        marginLeft: '1rem',
                                                                        color: '#f44336',
                                                                    }}
                                                                >
                                                                    {errors?.columnName}
                                                                </p>
                                                            )}
                                                            {emptyColumnsError && (
                                                                <p
                                                                    className="py-1"
                                                                    style={{
                                                                        fontSize: '0.75rem',
                                                                        marginLeft: '1rem',
                                                                        color: '#f44336',
                                                                    }}
                                                                >
                                                                    {emptyColumnsError}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                }}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <p className="text-overline2 mb-2">Function</p>
                                            <Field
                                                id="functionName"
                                                name="functionName"
                                                style={{ height: '48px' }}
                                                fullWidth
                                                color="primary"
                                                variant="outlined"
                                                disabled={isAddingCustomParameter || isEditingCustomParameter}
                                                error={touched.functionName && Boolean(errors.functionName)}
                                                helperText={<ErrorMessage name="attribute" />}
                                                onKeyUp={(e) => {
                                                    resetMutationState();
                                                }}
                                                inputProps={{
                                                    style: {
                                                        height: '6px',
                                                    },
                                                }}
                                                as={(value) => {
                                                    return (
                                                        <div className="flex flex-col">
                                                            <Select
                                                                labelId="functionName-label"
                                                                id="functionName-select"
                                                                variant="outlined"
                                                                className="w-full"
                                                                {...value}
                                                            >
                                                                {formRef.current?.values?.type &&
                                                                    Constants.customParameterFunctionTypes[
                                                                        formRef.current?.values?.type
                                                                    ].map((type, index) => {
                                                                        var upCaseType =
                                                                            type.charAt(0).toUpperCase() +
                                                                            type.slice(1);
                                                                        return (
                                                                            <MenuItem key={index} value={type}>
                                                                                {upCaseType}
                                                                            </MenuItem>
                                                                        );
                                                                    })}
                                                            </Select>
                                                            {value?.error && (
                                                                <p
                                                                    className="py-1"
                                                                    style={{
                                                                        fontSize: '0.75rem',
                                                                        marginLeft: '1rem',
                                                                        color: '#f44336',
                                                                    }}
                                                                >
                                                                    {errors?.functionName}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                }}
                                            />
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    ) : (
                        <div className="h-80 overflow-auto">
                            <Formik
                                initialValues={{
                                    name: parameter?.name ?? '',
                                    type: parameter?.type ?? '',
                                    tableName: parameter?.tableName ?? '',
                                    columnName: parameter?.columnName ?? '',
                                    functionName: parameter?.functionName ?? '',
                                    filters: parameter?.filters ?? initialFilters.filters,
                                }}
                                validationSchema={addCustomParameterSchema}
                                innerRef={formRef}
                                enableReinitialize={false}
                                onSubmit={handleSubmit}
                            >
                                {({ errors, touched, values, handleChange, handleBlur }) => (
                                    <Form>
                                        <div className="mb-4">
                                            <div className="flex flex-row ml-12 mr-12">
                                                <p className="font-semibold text-base mr-4">Where</p>
                                                <div className="w-full">
                                                    <p className="text-overline2 mb-2">Table Name</p>
                                                    <Field
                                                        id="tableName"
                                                        name="tableName"
                                                        style={{ height: '48px' }}
                                                        fullWidth
                                                        color="primary"
                                                        variant="outlined"
                                                        disabled={true}
                                                        inputProps={{
                                                            style: {
                                                                height: '6px',
                                                            },
                                                        }}
                                                        as={TextField}
                                                    />
                                                </div>
                                            </div>
                                            <FieldArray name="filters">
                                                {({ remove, push }) => (
                                                    <>
                                                        <div className="ml-4">
                                                            {values.filters &&
                                                                values.filters.length > 0 &&
                                                                values.filters.map((filter, index) => (
                                                                    <FilterItem
                                                                        index={index}
                                                                        filterColumns={filterColumns}
                                                                        filterErrors={filterErrors}
                                                                        formRef={formRef}
                                                                        handleChange={handleChange}
                                                                        isAddingCustomParameter={
                                                                            isAddingCustomParameter
                                                                        }
                                                                        isEditingCustomParameter={
                                                                            isEditingCustomParameter
                                                                        }
                                                                        isAlreadyChecked={isAlreadyChecked}
                                                                        remove={remove}
                                                                        resetMutationState={resetMutationState}
                                                                        validateFilters={validateFilters}
                                                                        key={index}
                                                                    />
                                                                ))}
                                                        </div>
                                                        <div
                                                            className="float-right flex flex-row items-center cursor-pointer hover:opacity-80 mr-12 mt-2 border-1 rounded-md border-brand-secondary px-2 py-2"
                                                            onClick={() => {
                                                                if (validateFilters(values.filters)) {
                                                                    setIsAlreadyChecked(false);
                                                                    push(temp);
                                                                }
                                                            }}
                                                        >
                                                            <AppIcon
                                                                size="20px"
                                                                color={Colors.brand.secondary}
                                                                style={{
                                                                    marginRight: '0.5rem',
                                                                }}
                                                            >
                                                                <AddIcon
                                                                    style={{
                                                                        fontSize: '20px',
                                                                    }}
                                                                />
                                                            </AppIcon>
                                                            <p className="text-overline2 text-brand-secondary">Add</p>
                                                        </div>
                                                    </>
                                                )}
                                            </FieldArray>
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    )}
                </div>
                {addCustomParamError && (
                    <p className="text-accent-red text-overline2">
                        {addCustomParamError?.response?.data?.error?.error}
                    </p>
                )}

                {editCustomParamError && (
                    <p className="text-accent-red text-overline2">{editCustomParamError?.error?.error}</p>
                )}
            </div>
            <div className="border-t-2 border-neutral-gray7 flex flex-row items-center justify-end pt-4 mb-4 mr-4 ml-4">
                {!isAddingCustomParameter && !isEditingCustomParameter ? (
                    <>
                        {currentTab === 2 && (
                            <TextButton
                                onClick={() => {
                                    formRef.current.values.filters = [];
                                    formRef.current.submitForm();
                                }}
                                classes="flex-1 -ml-4 text-brand-secondary"
                            >
                                Skip for now
                            </TextButton>
                        )}
                        <TextButton
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                formRef.current.resetForm();
                                onClose();
                            }}
                        >
                            Cancel
                        </TextButton>
                        <PrimaryButton
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (currentTab !== 2) {
                                    handleNext();
                                } else {
                                    handleDone();
                                    // formRef.current.submitForm();
                                }
                            }}
                        >
                            {currentTab === 2 ? 'Done' : 'Next'}
                        </PrimaryButton>
                    </>
                ) : (
                    <CircularProgress
                        style={{
                            width: '24px',
                            height: '24px',
                            color: Colors.brand.secondary,
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default AddOrEditCustomParameter;
