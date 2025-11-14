import { Fade, Menu, MenuItem, Select, TextField } from '@material-ui/core';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { ErrorMessage, Field } from 'formik';
import { useState } from 'react';
import Colors from '../../../../../shared/colors';
import AppIcon from '../../../../../shared/components/AppIcon';
import Constants from '../../../../../shared/constants';
import { useCanEdit } from '../../../../../shared/utils';

const FilterItem = ({
    index,
    handleChange,
    isAlreadyChecked,
    isAddingCustomParameter,
    isEditingCustomParameter,
    validateFilters,
    formRef,
    filterErrors,
    resetMutationState,
    filterColumns,
    remove,
}) => {
    const canEdit = useCanEdit();
    const [menuAnchorEl, setMenuAnchorEl] = useState(false);
    return (
        <div className="flex flex-row justify-items-stretch mb-8">
            <div key={index} className="flex flex-row justify-items-stretch mb-8">
                <div className="w-20 mr-5">
                    {index !== 0 && (
                        <Field
                            id={`filters.${index}.relation`}
                            name={`filters.${index}.relation`}
                            style={{ height: '44px' }}
                            fullWidth
                            color="primary"
                            variant="outlined"
                            onChange={(e) => {
                                handleChange(e);
                                setTimeout(() => {
                                    isAlreadyChecked && validateFilters(formRef.current.values.filters);
                                }, 600);
                            }}
                            disabled={isAddingCustomParameter || isEditingCustomParameter}
                            error={filterErrors[index]?.relation}
                            helperText={<ErrorMessage name="relation" />}
                            // onKeyUp={(e) => {
                            //   resetMutationState();
                            // }}

                            as={(value) => {
                                return (
                                    <div className="flex flex-col">
                                        <Select
                                            labelId={`select.${index}.relation`}
                                            id={`select.${index}.relation`}
                                            variant="outlined"
                                            className="w-full"
                                            onChange={(e) => {
                                                handleChange(e);
                                                setTimeout(() => {
                                                    isAlreadyChecked && validateFilters(formRef.current.values.filters);
                                                }, 600);
                                            }}
                                            {...value}
                                        >
                                            {Constants.customParamtersFilterRelations.map((key, index) => {
                                                return (
                                                    <MenuItem key={index} value={key}>
                                                        {key}
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                        {filterErrors?.[index]?.relation && (
                                            <p
                                                className="py-1"
                                                style={{
                                                    fontSize: '0.75rem',
                                                    marginLeft: '1rem',
                                                    color: '#f44336',
                                                }}
                                            >
                                                {filterErrors?.[index]?.relation}
                                            </p>
                                        )}
                                    </div>
                                );
                            }}
                        />
                    )}
                </div>
                <div className="mt-2 mr-4" style={{ width: '73%' }}>
                    <div className="mb-4">
                        <p className="text-overline2 mb-1">Column Name</p>
                        <Field
                            id={`filters.${index}.columnName`}
                            name={`filters.${index}.columnName`}
                            style={{ height: '48px' }}
                            fullWidth
                            color="primary"
                            variant="outlined"
                            onChange={(e) => {
                                handleChange(e);
                                setTimeout(() => {
                                    isAlreadyChecked && validateFilters(formRef.current.values.filters);
                                }, 500);
                            }}
                            disabled={isAddingCustomParameter || isEditingCustomParameter}
                            error={filterErrors[index]?.columnName}
                            onKeyUp={(e) => {
                                resetMutationState();
                            }}
                            as={(value) => {
                                return (
                                    <div className="flex flex-col">
                                        <Select
                                            labelId={`filters.${index}.columnName`}
                                            id={`filters.${index}.columnName`}
                                            variant="outlined"
                                            className="w-full"
                                            {...value}
                                        >
                                            {filterColumns?.map((column, index) => {
                                                return (
                                                    <MenuItem key={index} value={column.name}>
                                                        {column.name}
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                        {filterErrors?.[index] && (
                                            <p
                                                className="py-1"
                                                style={{
                                                    fontSize: '0.75rem',
                                                    marginLeft: '1rem',
                                                    color: '#f44336',
                                                }}
                                            >
                                                {filterErrors?.[index]?.columnName}
                                            </p>
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </div>
                    <div className="flex flex-row w-full">
                        <div className="mr-4 w-2/5">
                            <p className="text-overline2 mb-1">Condition Key</p>
                            <Field
                                id={`filters.${index}.conditionKey`}
                                name={`filters.${index}.conditionKey`}
                                style={{ height: '44px' }}
                                fullWidth
                                color="primary"
                                variant="outlined"
                                onChange={(e) => {
                                    if (e.target.value === 'Null' || e.target.value === 'NotNull') {
                                        formRef.current.values.filters[index].value = e.target.value;
                                    } else {
                                        if (
                                            formRef.current.values.filters[index].value === 'Null' ||
                                            formRef.current.values.filters[index].value === 'NotNull'
                                        ) {
                                            formRef.current.values.filters[index].value = '';
                                        }
                                    }
                                    handleChange(e);
                                    setTimeout(() => {
                                        isAlreadyChecked && validateFilters(formRef.current.values.filters);
                                    }, 500);
                                }}
                                // disabled={isAddingCustomParameter || isEditingCustomParameter}
                                error={filterErrors[index]?.conditionKey}
                                helperText={<ErrorMessage name="attribute" />}
                                onKeyUp={(e) => {
                                    resetMutationState();
                                }}
                                as={(value) => {
                                    return (
                                        <div className="flex flex-col">
                                            <Select
                                                labelId={`select.${index}.conditionKey`}
                                                id={`select.${index}.conditionKey`}
                                                variant="outlined"
                                                className="w-full"
                                                {...value}
                                            >
                                                {Constants.customParametersConditionKeys.map((key, index) => {
                                                    return (
                                                        <MenuItem key={index} value={key}>
                                                            {key}
                                                        </MenuItem>
                                                    );
                                                })}
                                            </Select>
                                            {filterErrors?.[index]?.conditionKey && (
                                                <p
                                                    className="py-1"
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        marginLeft: '1rem',
                                                        color: '#f44336',
                                                    }}
                                                >
                                                    {filterErrors?.[index]?.conditionKey}
                                                </p>
                                            )}
                                        </div>
                                    );
                                }}
                            />
                        </div>
                        <div className="ml-4 w-3/5">
                            <p className="text-overline2 mb-1">Value</p>
                            <Field
                                id={`filters.${index}.value`}
                                name={`filters.${index}.value`}
                                style={{ height: '48px' }}
                                fullWidth
                                color="primary"
                                variant="outlined"
                                onChange={(e) => {
                                    handleChange(e);
                                    setTimeout(() => {
                                        isAlreadyChecked && validateFilters(formRef.current.values.filters);
                                    }, 500);
                                }}
                                // disabled={isAddingCustomParameter || isEditingCustomParameter}
                                error={filterErrors[index]?.value}
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
                            {filterErrors?.[index]?.value && (
                                <p
                                    className="py-1"
                                    style={{
                                        fontSize: '0.75rem',
                                        marginLeft: '1rem',
                                        color: '#f44336',
                                    }}
                                >
                                    {filterErrors?.[index]?.value}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-4">
                    <div>
                        {canEdit() ? (
                            <AppIcon
                                style={{ padding: '0px' }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setMenuAnchorEl(e.currentTarget);
                                }}
                            >
                                <MoreVertIcon
                                    style={{
                                        width: '20px',
                                        height: 'min-content',
                                    }}
                                />
                            </AppIcon>
                        ) : (
                            <div
                                style={{
                                    width: '20px',
                                    height: 'min-content',
                                }}
                            />
                        )}
                    </div>
                    {canEdit() && (
                        <Menu
                            id="param-menu"
                            anchorEl={menuAnchorEl}
                            keepMounted
                            open={Boolean(menuAnchorEl)}
                            onClose={() => {
                                setMenuAnchorEl(null);
                            }}
                            TransitionComponent={Fade}
                            style={{
                                borderRadius: '1rem',
                                zIndex: '10000',
                            }}
                        >
                            <MenuItem
                                onClick={() => {
                                    setMenuAnchorEl(null);
                                    remove(index);
                                }}
                                style={{ color: Colors.accent.red }}
                            >
                                Delete
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    setMenuAnchorEl(null);
                                }}
                            >
                                Duplicate
                            </MenuItem>
                        </Menu>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilterItem;
