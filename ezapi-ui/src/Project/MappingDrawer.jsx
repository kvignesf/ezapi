import { CircularProgress, MenuItem, Table, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import Select from '@material-ui/core/Select';
import CloseIcon from '@material-ui/icons/Close';
import Switch from '@mui/material/Switch';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import ReactTooltip from 'react-tooltip';
import { PrimaryButton, TextButton } from '../shared/components/AppButton';
import AppIcon from '../shared/components/AppIcon';
import { useCanEdit } from '../shared/utils';
import InfoLogo from '../static/images/info-logo.svg';
import { useSaveSchemaRecommendations } from './SchemaDetails/schemaRecommendationQuery';

const MappingDrawer = ({ mmtableData, tablesData, onClose, newProjectDetails }) => {
    const { projectId } = useParams();
    const {
        isLoading: isSavingSchemaData,
        isSuccess: isSavingSchemaSuccess,
        error: saveSchemaMatchError,
        mutate: saveSchemaMatchData,
        reset: resetSaveSchemaMutation,
    } = useSaveSchemaRecommendations();
    const canEdit = useCanEdit();
    const [unMappedFields, setUnMappedFields] = useState(true);
    const [updatedTableData, setUpdatedTableData] = useState(null);
    const [hasError, setHasError] = useState(false);
    const [finalMappedData, setFinalMappedData] = useState(mmtableData);
    const [overrideArray, setOverrideArray] = useState([]);
    useEffect(() => {
        var temp;
        if (unMappedFields) {
            document.getElementById('unmapped').style.color = '#1976d2';
            temp = mmtableData?.filter((row) => row.hasOwnProperty('noMatch'));
        } else {
            document.getElementById('unmapped').style.color = 'black';
            temp = mmtableData?.filter((row) => !row.hasOwnProperty('noMatch'));
        }

        setUpdatedTableData(temp);
    }, [unMappedFields, mmtableData]);
    function handleSwitchChange(event) {
        setUnMappedFields(event.target.checked);
    }
    useEffect(() => {
        if (!saveSchemaMatchError && isSavingSchemaSuccess) {
            resetSaveSchemaMutation();
            onClose('publish');
        }
    }, [isSavingSchemaSuccess]);

    const saveSchema = () => {
        if (canEdit()) {
            var tempArr = [];
            finalMappedData?.map((row) => {
                var temp = {
                    level: null,
                    name: null,
                    overridenMatch: [],
                    path: null,
                };

                temp['level'] = Number(row?.level ?? row?.attributeLevel);
                temp['path'] = row?.path ?? row?.attributePath;
                temp['name'] = row?.attribute ?? row?.schemaAttribute;
                temp['overridenMatch'] = {
                    tableAttribute: row?.tableAttribute ?? '',
                    tableName: row?.tableName ?? '',
                };
                temp['schemaName'] = row?.schemaName;
                tempArr.push(temp);
            });

            saveSchemaMatchData({
                projectId,
                data: tempArr,
                newProjectDetails,
            });
            if (isSavingSchemaSuccess) {
                onClose();
                return null;
            }
        }
    };

    useEffect(() => {
        setFinalMappedData(mmtableData);
    }, [mmtableData]);
    return (
        <div style={{ width: `80vw`, height: '100%', maxWidth: '900px' }} className="flex flex-col">
            <div className="p-4 border-b-1 flex flex-row justify-between">
                <p className="text-subtitle1">Mapping</p>
                <AppIcon onClick={onClose}>
                    <CloseIcon />
                </AppIcon>
            </div>
            <div className="container mx-auto p-4 ">
                <div className="flex justify-end ">
                    {' '}
                    <Switch
                        inputProps={{ 'aria-label': 'secondary checkbox' }}
                        checked={unMappedFields}
                        onChange={handleSwitchChange}
                    />
                    <div id="unmapped" className="mt-1.5 text-black-500">
                        Unmapped Fields
                    </div>
                </div>
            </div>
            <div className="w-full flex-1">
                {tablesData && mmtableData && (
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
                                        <TableCell align="left" style={{ padding: '0' }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                {updatedTableData?.map((row) => {
                                    return (
                                        <>
                                            <MMTableDataRow
                                                attribute={row.attribute ?? row.schemaAttribute}
                                                path={row.path}
                                                hoverOperationData={row.operationId}
                                                tablesData={tablesData}
                                                unMappedFields={unMappedFields}
                                                tableName={row.tableName}
                                                columnName={row.tableAttribute}
                                                overrideArray={overrideArray}
                                                setOverrideArray={setOverrideArray}
                                                // resetSaveSchemaMutation={resetSaveSchemaMutation}
                                                setFinalMappedData={setFinalMappedData}
                                                finalMappedData={finalMappedData}
                                            />
                                        </>
                                    );
                                })}
                            </Table>
                        </TableContainer>
                    </div>
                )}
                {(!tablesData || !mmtableData) && (
                    <div className="h-full flex flex-col items-center justify-center">
                        <CircularProgress style={{ width: '28px', height: '28px', marginBottom: '1rem' }} />
                        <p className="text-overline2">Loading Mapping Data</p>
                    </div>
                )}
            </div>
            <div className="pl-6 pb-5">
                {' '}
                {saveSchemaMatchError && <p className="text-overline2 text-accent-red my-2">Fill all fields</p>}
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

                <PrimaryButton
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setHasError(false);

                        saveSchema(overrideArray);
                    }}
                >
                    Save and Publish
                </PrimaryButton>
            </div>
        </div>
    );
};

const MMTableDataRow = ({
    attribute,
    path,
    hoverOperationData,
    tablesData,
    unMappedFields,
    tableName,
    columnName,
    finalMappedData,
    setFinalMappedData,
}) => {
    const [newTableValue, setNewTableValue] = useState({
        unMappedFields: null,
        mappedFields: null,
    }); // table name
    const [newColumnValue, setNewColumnValue] = useState({
        unMappedFields: null,
        mappedFields: null,
    }); // column name

    const [hoveringOverOperation, setHoveringOverOperation] = useState(false);
    const canEdit = useCanEdit();
    useEffect(() => {
        setNewTableValue((prevState) => ({
            ...prevState,
            unMappedFields: tableName,
        }));
    }, []);
    const modifyTable = (value) => {
        var temp = newTableValue;
        if (value && !_.isEmpty(value)) {
            if (unMappedFields) {
                setNewTableValue((prevState) => ({
                    ...prevState,
                    unMappedFields: value,
                }));
            } else {
                setNewTableValue((prevState) => ({
                    ...prevState, // copy all other key-value pairs of food object
                    mappedFields: value,
                }));
            }
        }
    };

    const modifyColumn = (value) => {
        if (value && !_.isEmpty(value)) {
            if (unMappedFields) {
                setNewColumnValue((prevState) => ({
                    ...prevState,
                    unMappedFields: value,
                }));

                var changedObject = finalMappedData.filter((obj) => {
                    return obj.path === path;
                });
                changedObject = changedObject[0];
                let index = finalMappedData.findIndex((x) => x == changedObject);

                changedObject['tableName'] = newTableValue['unMappedFields'];
                changedObject['tableAttribute'] = value;
                let temp = finalMappedData;
                temp[index] = changedObject;

                setFinalMappedData(temp);
            } else {
                setNewColumnValue((prevState) => ({
                    ...prevState, // copy all other key-value pairs of food object
                    mappedFields: value,
                }));
                var changedObject = finalMappedData.filter((obj) => {
                    return obj.path === path;
                });
                changedObject = changedObject[0];
                let index = finalMappedData.findIndex((x) => x == changedObject);

                changedObject['tableName'] = newTableValue['mappedFields'];
                changedObject['tableAttribute'] = value;
                let temp = finalMappedData;
                temp[index] = changedObject;

                setFinalMappedData(temp);
            }
        }
    };

    const getColumns = (tableName) => {
        return _.find(tablesData, (tab) => tab?.name === tableName)?.data ?? [];
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
                <p className="text-overline2">{attribute}</p>
            </TableCell>
            <TableCell
                align="left"
                style={{
                    padding: '0',
                    width: '25%',
                }}
            >
                <p className="text-overline2">{path}</p>
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
                    required
                    labelId={`${attribute}-table`}
                    id={`${attribute}-table`}
                    // value={newTableValue ?? (unMappedFields ? newTableValue : tableName)}
                    value={
                        (unMappedFields ? newTableValue['unMappedFields'] : newTableValue['mappedFields']) ?? tableName
                    }
                    variant="outlined"
                    disabled={!canEdit()}
                    onChange={(event) => {
                        const value = event?.target?.value;

                        modifyTable(value);
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
                    {tablesData?.map((tableData) => {
                        return (
                            <MenuItem value={tableData.name}>
                                <p className="text-overline2">{tableData.name}</p>
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
                    required
                    labelId={`${attribute?.name}-column`}
                    id={`${attribute?.name}-column`}
                    // value={unMappedFields ? newColumnValue : columnName}
                    value={
                        (unMappedFields ? newColumnValue['unMappedFields'] : newColumnValue['mappedFields']) ??
                        columnName
                    }
                    disabled={!canEdit()}
                    variant="outlined"
                    onChange={({ target: { value } }) => {
                        modifyColumn(value);
                    }}
                    style={{
                        width: '100%',
                        height: '50px',
                    }}
                >
                    {getColumns(
                        newTableValue[unMappedFields ? ['unMappedFields'] : ['mappedFields']] ?? tableName,
                    )?.map((column) => {
                        return (
                            <MenuItem value={column?.name}>
                                <p className="text-overline2">{column?.name}</p>
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
                <img
                    src={InfoLogo}
                    alt="conektto logo"
                    className="bg-white mr-4"
                    hover
                    style={{ height: '24px', width: '24px' }}
                    data-tip
                    data-for="operationHover"
                    // onmouseover={() => setHoveringOverOperation(true)}
                    // onmouseout={() => {
                    //   ReactTooltip.hide("operationHover");
                    //   setHoveringOverOperation(false);
                    // }}
                    onMouseEnter={(e) => {
                        setHoveringOverOperation(true);
                    }}
                    onMouseLeave={(e) => {
                        ReactTooltip.hide('operationHover');
                        setHoveringOverOperation(false);
                    }}
                />{' '}
                <ReactTooltip
                    id="operationHover"
                    place="right"
                    backgroundColor="black"
                    effect="solid"
                    disable={!hoveringOverOperation}
                >
                    {hoverOperationData}
                </ReactTooltip>
            </TableCell>
        </TableRow>
    );
};

export default MappingDrawer;
