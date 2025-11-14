import { CircularProgress, MenuItem, Table, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import Select from '@material-ui/core/Select';
import CloseIcon from '@material-ui/icons/Close';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useHistory } from 'react-router-dom';
import { PrimaryButton, TextButton } from '../../shared/components/AppButton';
import AppIcon from '../../shared/components/AppIcon';
import { isFullMatch, useCanEdit } from '../../shared/utils';
import { useGetSchemaRecommendations, useGetTables, useSaveSchemaRecommendations } from './schemaRecommendationQuery';

const SchemaDetails = ({ schema, onClose }) => {
    const history = useHistory();
    const { projectId } = useParams();
    const {
        isLoading: isFetchingTables,
        data: tablesData,
        error: fetchTablesError,
        mutate: fetchTables,
    } = useGetTables();
    const {
        isLoading: isFetchingSchemaData,
        data: schemaData,
        error: fetchSchemaError,
        mutate: fetchSchemaData,
    } = useGetSchemaRecommendations();
    const {
        isLoading: isSavingSchemaData,
        isSuccess: isSavingSchemaSuccess,
        error: saveSchemaMatchError,
        mutate: saveSchemaMatchData,
        reset: resetSaveSchemaMutation,
    } = useSaveSchemaRecommendations();
    const canEdit = useCanEdit();

    useEffect(() => {
        if (schema && schema?.name) {
            fetchTables({ projectId });
            fetchSchemaData({
                projectId,
                schema: schema?.name,
            });
        } else {
            history.goBack();
        }
    }, []);

    const getLoadingMessage = () => {
        if (isFetchingSchemaData) {
            return 'Fetching schema data';
        } else if (isFetchingTables) {
            return 'Fetching tables data';
        } else if (isSavingSchemaData) {
            return 'Saving schema data';
        }
        return null;
    };

    const getErrorMessage = () => {
        if (fetchSchemaError) {
            return fetchSchemaError?.message;
        } else if (fetchTablesError) {
            return fetchTablesError?.message;
        }
        return null;
    };

    const saveSchema = () => {
        if (canEdit()) {
            const attributesWithOverrides = schemaData
                ?.filter((attribute) => attribute?.overridenMatch && !_.isEmpty(attribute?.overridenMatch))
                ?.map((overridenAttribute) => {
                    const clonedOverridenAttribute = _.cloneDeep(overridenAttribute);

                    delete clonedOverridenAttribute['recommendations'];

                    return clonedOverridenAttribute;
                });

            saveSchemaMatchData({
                projectId,
                schema: schema?.name,
                attributesWithOverrides: attributesWithOverrides ?? [],
            });
        }
    };

    if (isSavingSchemaSuccess) {
        onClose();
        return null;
    }

    return (
        <div style={{ width: `80vw`, height: '100%', maxWidth: '900px' }} className="flex flex-col">
            <div className="p-4 border-b-1 flex flex-row justify-between">
                <p className="text-subtitle1">{schema?.name}</p>
                <AppIcon onClick={onClose}>
                    <CloseIcon />
                </AppIcon>
            </div>

            <div className="w-full flex-1">
                {schemaData && !_.isEmpty(schemaData) && !getLoadingMessage() && !getErrorMessage() && (
                    <div className="p-4">
                        <TableContainer style={{ maxHeight: `calc(100vh - 160px)` }} className="border-2 rounded-md">
                            <Table stickyHeader aria-label="simple table">
                                <TableHead className="w-full">
                                    <TableRow>
                                        <TableCell align="left" style={{ padding: '0.5rem' }}>
                                            <p className="text-smallLabel text-neutral-gray4 uppercase">attribute</p>
                                        </TableCell>
                                        <TableCell align="left" style={{ padding: '0' }}>
                                            <p className="text-smallLabel text-neutral-gray4 uppercase">path</p>
                                        </TableCell>
                                        <TableCell
                                            align="left"
                                            style={{
                                                padding: '0',
                                            }}
                                        >
                                            <p className="text-smallLabel text-neutral-gray4 uppercase">table</p>
                                        </TableCell>
                                        <TableCell align="left" style={{ padding: '0' }}>
                                            <p className="text-smallLabel text-neutral-gray4 uppercase">column</p>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                {schemaData?.map((attribute) => {
                                    return (
                                        <SchemaDetailsRow
                                            attribute={attribute}
                                            tablesData={tablesData}
                                            resetSaveSchemaMutation={resetSaveSchemaMutation}
                                        />
                                    );
                                })}
                            </Table>
                        </TableContainer>
                    </div>
                )}

                {!schemaData ||
                    (_.isEmpty(schemaData) && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <p className="text-overline2">No schema data available</p>
                        </div>
                    ))}

                {saveSchemaMatchError && (
                    <p className="text-overline2 text-accent-red pl-4 my-2">{saveSchemaMatchError?.message}</p>
                )}

                {getLoadingMessage() && (
                    <div className="h-full flex flex-col items-center justify-center">
                        <CircularProgress style={{ width: '28px', height: '28px', marginBottom: '1rem' }} />
                        <p className="text-overline2">{getLoadingMessage()}</p>
                    </div>
                )}

                {getErrorMessage() && (
                    <div className="h-full flex flex-col items-center justify-center">
                        <p className="text-overline2">{getErrorMessage()}</p>
                    </div>
                )}
            </div>

            <div className="p-4 border-t-1 flex flex-row justify-between">
                <TextButton
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        onClose();
                    }}
                >
                    Cancel
                </TextButton>
                {canEdit() && (
                    <PrimaryButton
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            saveSchema();
                        }}
                    >
                        Save
                    </PrimaryButton>
                )}
            </div>
        </div>
    );
};

const SchemaDetailsRow = ({ attribute, tablesData, resetSaveSchemaMutation }) => {
    const [table, setTable] = useState(null); // table name
    const [column, setColumn] = useState(null); // column name
    const canEdit = useCanEdit();

    useEffect(() => {
        if (attribute && attribute?.overridenMatch && !_.isEmpty(attribute?.overridenMatch)) {
            setTable(attribute?.overridenMatch?.tableName);
            setColumn(attribute?.overridenMatch?.tableAttribute);
        } else if (attribute && attribute?.recommendations && !_.isEmpty(attribute?.recommendations)) {
            const fullMatchRecommendation = attribute?.recommendations?.find((recom) => isFullMatch(recom));

            if (fullMatchRecommendation) {
                setTable(fullMatchRecommendation?.table);
                setColumn(fullMatchRecommendation?.table_attribute);
            }
        }
    }, []);

    const getColumns = (tableName) => {
        return _.find(tablesData, (tab) => tab?.name === tableName)?.data ?? [];
    };

    const modifyTableAndColumnData = (value) => {
        if (value && !_.isEmpty(value)) {
            resetSaveSchemaMutation();

            if (value?.includes('$$$')) {
                // Recommended value is selected

                attribute.overridenMatch = {
                    tableName: value?.split('$$$')[0],
                    tableAttribute: value?.split('$$$')[1],
                };

                setTable(value?.split('$$$')[0]);
                setColumn(value?.split('$$$')[1]);
            } else {
                // Table is selected

                attribute.overridenMatch = {
                    tableName: value,
                    tableAttribute: null,
                };

                setTable(value);
                setColumn(null);
            }
        }
    };

    const modifyColumnData = (value) => {
        if (value && !_.isEmpty(value)) {
            const clonedOverrideMatch = _.cloneDeep(attribute?.overridenMatch);

            clonedOverrideMatch.tableAttribute = value;
            attribute.overridenMatch = clonedOverrideMatch;

            resetSaveSchemaMutation();
            setColumn(value);
        }
    };

    return (
        <TableRow>
            <TableCell
                align="left"
                style={{
                    paddingTop: '1.25rem',
                    paddingBottom: '1.25rem',
                    paddingLeft: '0.5rem',
                    paddingRight: '0',
                    width: '25%',
                }}
            >
                <p className="text-overline2">{attribute?.name}</p>
            </TableCell>
            <TableCell
                align="left"
                style={{
                    padding: '0',
                    width: '25%',
                }}
            >
                <p className="text-overline2">{attribute?.path}</p>
            </TableCell>

            <TableCell
                align="left"
                style={{
                    padding: '0',
                    width: '25%',
                    paddingRight: '0.5rem',
                }}
            >
                <Select
                    labelId={`${attribute?.name}-table`}
                    id={`${attribute?.name}-table`}
                    value={table}
                    variant="outlined"
                    disabled={!canEdit()}
                    onChange={(event) => {
                        const value = event?.target?.value;

                        modifyTableAndColumnData(value);
                    }}
                    style={{
                        width: '100%',
                        height: '50px',
                    }}
                    MenuProps={{
                        style: {
                            maxHeight: '500px',
                        },
                    }}
                >
                    {attribute?.recommendations && !_.isEmpty(attribute?.recommendations) && (
                        <p className="text-capitalised text-brand-primary p-4 py-2">Recommended</p>
                    )}
                    {attribute?.recommendations?.map((recom) => {
                        return (
                            <MenuItem value={`${recom?.table}$$$${recom?.table_attribute}`}>
                                <p className="text-overline2">
                                    {recom?.table} / {recom?.table_attribute}
                                </p>
                            </MenuItem>
                        );
                    })}
                    {attribute?.recommendations && !_.isEmpty(attribute?.recommendations) && (
                        <div className="bg-neutral-gray7 my-2" style={{ height: '1px' }}></div>
                    )}
                    {tablesData?.map((table) => {
                        return (
                            <MenuItem value={table?.name}>
                                <p className="text-overline2">{table?.name}</p>
                            </MenuItem>
                        );
                    })}
                </Select>
            </TableCell>

            <TableCell
                align="left"
                style={{
                    padding: '0',
                    width: '25%',
                    paddingRight: '0.5rem',
                }}
            >
                <Select
                    labelId={`${attribute?.name}-column`}
                    id={`${attribute?.name}-column`}
                    value={column}
                    disabled={!canEdit()}
                    variant="outlined"
                    onChange={({ target: { value } }) => {
                        modifyColumnData(value);
                    }}
                    style={{
                        width: '100%',
                        height: '50px',
                    }}
                >
                    {getColumns(table)?.map((column) => {
                        return (
                            <MenuItem value={column?.name}>
                                <p className="text-overline2">{column?.name}</p>
                            </MenuItem>
                        );
                    })}
                </Select>
            </TableCell>
        </TableRow>
    );
};

export default SchemaDetails;
