import {
    CircularProgress,
    makeStyles,
    MenuItem,
    Select,
    Tab,
    Table,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography,
} from '@material-ui/core';
import { Add, Delete } from '@material-ui/icons';
import CloseIcon from '@material-ui/icons/Close';
import { Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import Colors from '../shared/colors';
import { OutlineButton, PrimaryButton, TextButton } from '../shared/components/AppButton';
import AppIcon from '../shared/components/AppIcon';
import ConfirmDialog from '../shared/components/ConfirmDialog';
import LoaderWithMessage from '../shared/components/LoaderWithMessage';
import TabLabel from '../shared/components/TabLabel';
import { getTablesRelations, tableMappings } from './projectQueries';

const RelationTableRow = ({ data, tables, onUpdate, schema, onDelete }) => {
    const [mainTable, setMainTable] = useState(data?.mainTable ?? '');
    const [dependentTableSchema, setDependentTableSchema] = useState(data?.dependentTableSchema ?? '');
    const [mainTableSchema, setMainTableSchema] = useState(data?.mainTableSchema ?? '');
    const [dependentTable, setDependentTable] = useState(data?.dependentTable ?? '');
    const [dependentTableColumn, setDependentTableColumn] = useState(data?.dependentTableColumn ?? '');
    const [mainTableColumn, setMainTableColumn] = useState(data?.mainTableColumn ?? '');
    const [availableTable, setAvailableTable] = useState([]);
    const [availableTableColumn, setAvailableTableColumn] = useState([]);
    const [availableColumn, setAvailableColumn] = useState([]);
    const [availableMainTable, setAvailableMainTable] = useState([]);
    const [availableDependentTable, setAvailableDependentTable] = useState([]);
    /*const [availableSchemas, setavailableSchemas] = useState([]);
  useEffect(() => {
    let list = tables.map((a) => {
      return a.schema;
    });
    list = list.filter((x, i, a) => a.indexOf(x) === i);
    setavailableSchemas(list);
  }, [tables]);*/

    useEffect(() => {
        if (mainTable === '') {
            setDependentTable('');
            setDependentTableColumn('');
            setMainTableColumn('');
            //setAvailableTable([]);
            //setAvailableTableColumn([]);
            setAvailableColumn([]);
        } else {
            let tableData = [];
            tables.map((item) => {
                if (item.name !== mainTable) {
                    tableData.push(item.name);
                } else {
                    setAvailableColumn(item.data);
                }
            });
            //setAvailableTable(tableData);
        }

        if (dependentTable === '') {
            setDependentTableColumn('');
            setAvailableTableColumn([]);
        } else {
            tables.map((item) => {
                if (item.name === dependentTable) {
                    if (dependentTable === mainTable) {
                        const newData = item.data.filter((value) => value.name !== mainTableColumn);
                        setAvailableTableColumn(newData);
                    } else {
                        setAvailableTableColumn(item.data);
                    }
                }
            });
        }
    }, [mainTable, dependentTable, tables]);

    /* useEffect(() => {
    if (dependentTable !== "") {
      tables.map((item) => {
        if (item.name === dependentTable) {
          setAvailableTableColumn(item.data);
        }
      });
    }
  }, [dependentTable, tables]); */

    useEffect(() => {
        if (mainTableSchema === '') {
            setAvailableMainTable([]);
        }

        if (tables) {
            let mainTableData = [];
            tables.map((item) => {
                if (item.schema === mainTableSchema) {
                    mainTableData.push(item.name);
                }
            });

            setAvailableMainTable(mainTableData);
        }
    }, [mainTableSchema, tables]);

    useEffect(() => {
        if (dependentTableSchema === '') {
            setAvailableDependentTable([]);
        } else {
            if (tables) {
                let dependentTableData = [];
                tables.map((item) => {
                    if (item.schema === dependentTableSchema) {
                        dependentTableData.push(item.name);
                    }
                });
                setAvailableDependentTable(dependentTableData);
            }
        }
    }, [dependentTableSchema, tables]);

    useEffect(() => {
        const newdata = {
            mainTable: mainTable,
            mainTableColumn: mainTableColumn,
            dependentTable: dependentTable,
            dependentTableColumn: dependentTableColumn,
            relation: 'equals',
            origin: data.origin,
            mainTableSchema: mainTableSchema,
            dependentTableSchema: dependentTableSchema,
        };

        onUpdate(newdata);
    }, [mainTable, mainTableColumn, dependentTable, dependentTableColumn, mainTableSchema, dependentTableSchema]);

    return (
        <TableRow>
            <TableCell
                align="left"
                style={{
                    padding: '0.5rem',
                }}
            >
                <Select
                    disabled={data.origin === 'derived'}
                    required
                    variant="outlined"
                    value={mainTableSchema}
                    onChange={({ target: { value } }) => {
                        setMainTableSchema(value);
                        setDependentTableSchema('');
                        setMainTable('');
                        setMainTableColumn('');
                    }}
                    style={{
                        width: '100%',
                        height: '40px',
                    }}
                >
                    {schema.map((value) => {
                        return (
                            <MenuItem value={value}>
                                <p className="text-overline2">{value}</p>
                            </MenuItem>
                        );
                    })}
                </Select>
            </TableCell>
            <TableCell
                align="left"
                style={{
                    padding: '0.5rem',
                }}
            >
                <Select
                    disabled={data.origin === 'derived'}
                    required
                    variant="outlined"
                    value={mainTable}
                    onChange={({ target: { value } }) => {
                        setMainTable(value);
                        setMainTableColumn('');
                    }}
                    style={{
                        width: '100%',
                        height: '40px',
                    }}
                >
                    {availableMainTable.map((value) => {
                        return (
                            <MenuItem value={value}>
                                <p className="text-overline2">{value}</p>
                            </MenuItem>
                        );
                    })}
                </Select>
            </TableCell>
            <TableCell
                align="left"
                style={{
                    padding: '0.5rem',
                }}
            >
                <Select
                    disabled={data.origin === 'derived'}
                    required
                    variant="outlined"
                    value={mainTableColumn}
                    onChange={({ target: { value } }) => {
                        setMainTableColumn(value);
                    }}
                    style={{
                        width: '100%',
                        height: '40px',
                    }}
                >
                    {availableColumn.map((column) => {
                        return (
                            <MenuItem value={column?.name} key={column?.name}>
                                <p className="text-overline2">{column?.name}</p>
                            </MenuItem>
                        );
                    })}
                </Select>
            </TableCell>
            <TableCell
                align="left"
                style={{
                    padding: '0.5rem',
                }}
            >
                <Select
                    disabled={data.origin === 'derived'}
                    required
                    variant="outlined"
                    value={dependentTableSchema}
                    onChange={({ target: { value } }) => {
                        setDependentTableSchema(value);
                        setDependentTable('');
                        setDependentTableColumn('');
                    }}
                    style={{
                        width: '100%',
                        height: '40px',
                    }}
                >
                    {schema.map((value) => {
                        return (
                            <MenuItem value={value}>
                                <p className="text-overline2">{value}</p>
                            </MenuItem>
                        );
                    })}
                </Select>
            </TableCell>
            <TableCell
                align="left"
                style={{
                    padding: '0.5rem',
                }}
            >
                <Select
                    disabled={data.origin === 'derived'}
                    required
                    variant="outlined"
                    value={dependentTable}
                    onChange={({ target: { value } }) => {
                        setDependentTable(value);
                        setDependentTableColumn('');
                    }}
                    style={{
                        width: '100%',
                        height: '40px',
                    }}
                    MenuProps={{
                        style: {
                            maxHeight: '500px',
                        },
                    }}
                >
                    {availableDependentTable.map((value) => {
                        return (
                            <MenuItem value={value}>
                                <p className="text-overline2">{value}</p>
                            </MenuItem>
                        );
                    })}
                </Select>
            </TableCell>
            <TableCell
                align="left"
                style={{
                    padding: '0.5rem',
                }}
            >
                <Select
                    disabled={data.origin === 'derived'}
                    required
                    variant="outlined"
                    value={dependentTableColumn}
                    onChange={({ target: { value } }) => {
                        setDependentTableColumn(value);
                    }}
                    style={{
                        width: '100%',
                        height: '40px',
                    }}
                >
                    {availableTableColumn.map((column) => {
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
                    padding: '0.5rem',
                    width: '100px',
                }}
            >
                <p className="text-overline2">{data?.origin ?? ''}</p>
            </TableCell>
            <TableCell
                align="left"
                style={{
                    padding: '0.5rem',
                }}
            >
                <Delete
                    color={data?.origin === 'derived' ? 'disabled' : 'error'}
                    onClick={() => {
                        if (data?.origin !== 'derived') {
                            onDelete();
                        }
                    }}
                />
            </TableCell>
        </TableRow>
    );
};

const FilterTableRow = ({ data, tables, schema, onUpdate, onDelete }) => {
    const [schemaName, setSchemaName] = useState(data?.schemaName ?? '');
    const [tableName, setTableName] = useState(data?.tableName ?? '');
    const [columnName, setColumnName] = useState(data?.columnName ?? '');
    const [availableColumn, setAvailableColumn] = useState([]);
    const [availableTables, setAvailableTables] = useState([]);
    const [filterCondition, setFilterCondition] = useState(data?.filterCondition ?? '');
    const [value, setValue] = useState(data?.value ?? '');

    /*const [availableSchemas, setavailableSchemas] = useState([]);
  useEffect(() => {
    let list = tables.map((a) => {
      return a.schema;
    });
    list = list.filter((x, i, a) => a.indexOf(x) === i);
    setavailableSchemas(list);
  }, [tables]);*/

    useEffect(() => {
        if (tableName === '') {
            setColumnName('');
            setAvailableColumn([]);
        } else {
            tables.map((item) => {
                if (item.name == tableName) {
                    setAvailableColumn(item.data);
                }
            });
        }
    }, [tableName, tables]);

    useEffect(() => {
        if (schemaName === '') {
            setAvailableTables([]);
        } else {
            if (tables) {
                let tableData = [];
                tables.map((item) => {
                    if (item.schema === schemaName) {
                        tableData.push(item.name);
                    }
                });
                setAvailableTables(tableData);
            }
        }
    }, [schemaName, tables]);

    useEffect(() => {
        const newdata = {
            schemaName: schemaName,
            tableName: tableName,
            columnName: columnName,
            filterCondition: filterCondition,
            value: value,
        };

        onUpdate(newdata);
    }, [tableName, columnName, filterCondition, value, schemaName]);

    return (
        <TableRow>
            <TableCell
                align="left"
                style={{
                    padding: '0.5rem',
                }}
            >
                <Select
                    required
                    variant="outlined"
                    value={schemaName}
                    onChange={({ target: { value } }) => {
                        setSchemaName(value);
                        setTableName('');
                    }}
                    style={{
                        width: '100%',
                        height: '40px',
                    }}
                >
                    {schema.map((value) => {
                        return (
                            <MenuItem value={value}>
                                <p className="text-overline2">{value}</p>
                            </MenuItem>
                        );
                    })}
                </Select>
            </TableCell>
            <TableCell
                align="left"
                style={{
                    padding: '0.5rem',
                }}
            >
                <Select
                    required
                    variant="outlined"
                    value={tableName}
                    onChange={({ target: { value } }) => {
                        setTableName(value);
                        setColumnName('');
                    }}
                    style={{
                        width: '100%',
                        height: '40px',
                    }}
                >
                    {availableTables.map((value) => {
                        return (
                            <MenuItem value={value}>
                                <p className="text-overline2">{value}</p>
                            </MenuItem>
                        );
                    })}
                </Select>
            </TableCell>
            <TableCell
                align="left"
                style={{
                    padding: '0.5rem',
                }}
            >
                <Select
                    required
                    variant="outlined"
                    value={columnName}
                    onChange={({ target: { value } }) => {
                        setColumnName(value);
                    }}
                    style={{
                        width: '100%',
                        height: '40px',
                    }}
                >
                    {availableColumn.map((column) => {
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
                    padding: '0.5rem',
                }}
            >
                <Select
                    required
                    variant="outlined"
                    value={filterCondition}
                    onChange={({ target: { value } }) => {
                        setFilterCondition(value);
                    }}
                    style={{
                        width: '100%',
                        height: '40px',
                    }}
                    MenuProps={{
                        style: {
                            maxHeight: '500px',
                        },
                    }}
                >
                    <MenuItem value={'equals'}>
                        <p className="text-overline2">=</p>
                    </MenuItem>
                    <MenuItem value={'not equals'}>
                        <p className="text-overline2">≠</p>
                    </MenuItem>
                    <MenuItem value={'greater than'}>
                        <p className="text-overline2">{'>'}</p>
                    </MenuItem>
                    <MenuItem value={'less than'}>
                        <p className="text-overline2">{'<'}</p>
                    </MenuItem>
                </Select>
            </TableCell>
            <TableCell
                align="left"
                style={{
                    padding: '0.5rem',
                }}
            >
                <TextField
                    variant="outlined"
                    value={value}
                    onChange={({ target: { value } }) => {
                        setValue(value);
                    }}
                    size="small"
                />
            </TableCell>
            <TableCell
                align="left"
                style={{
                    padding: '0.5rem',
                }}
            >
                <Delete
                    color="error"
                    onClick={() => {
                        onDelete();
                    }}
                />
            </TableCell>
        </TableRow>
    );
};

const tabsStyles = makeStyles({
    indicator: {
        top: '0px',
    },
});

const tabStyles = makeStyles({
    tab: {
        background: Colors.neutral.gray7,
        '&.Mui-selected': {
            background: 'white',
        },
    },
});

const DBMappingDrawer = ({ projectId, onClose, onSubmit, tablesData }) => {
    const [isFilter, setIsFilter] = useState(0);
    const [tablesRelation, setTablesRelation] = useState([]);
    const [dummyTables, setDummyTables] = useState();
    const [tablesFilter, setTablesFilter] = useState([]);
    const tabsClasses = tabsStyles();
    const tabClasses = tabStyles();
    const [operationDataTables, setOperationDataTables] = useState([]);
    const [disableButton, setDisableButton] = useState(false);
    const [triggerUpdate, setTriggerUpdate] = useState(true);
    const [filterEmptyError, setFilterEmptyError] = useState(false);
    const [filterDuplicateError, setFilterDuplicateError] = useState(false);
    const [relationEmptyError, setRelationEmptyError] = useState(false);
    const [relationDuplicateError, setRelationDuplicateError] = useState(false);
    const [mappingError, setMappingError] = useState(false);
    const [displayPopUp, setDisplayPopUp] = useState(false);
    const [schemaValues, setSchemaValues] = useState([]);
    const [isMappingLoading, setIsMappingLoading] = useState(false);
    const [isTablesLoading, setisTablesLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let filterCheck = false;
        let relationCheck = false;

        if (tablesRelation.length === 0) {
            setRelationEmptyError(false);
            setRelationDuplicateError(false);
        }

        if (tablesFilter.length === 0) {
            setFilterEmptyError(false);
            setFilterDuplicateError(false);
        }

        tablesRelation.map((relation) => {
            let count = 0;
            if (
                relation.mainTableSchema === '' ||
                relation.dependentTableSchema === '' ||
                relation.mainTable === '' ||
                relation.mainTableColumn === '' ||
                relation.dependentTable === '' ||
                relation.dependentTableColumn === ''
            ) {
                setRelationEmptyError(true);
                relationCheck = true;
            } else {
                setRelationEmptyError(false);
            }

            tablesRelation.map((item) => {
                if (
                    item.mainTable === relation.mainTable &&
                    item.mainTableColumn === relation.mainTableColumn &&
                    item.dependentTable === relation.dependentTable &&
                    item.dependentTableColumn === relation.dependentTableColumn
                ) {
                    count++;
                }

                if (
                    item.mainTable === relation.dependentTable &&
                    item.mainTableColumn === relation.dependentTableColumn &&
                    item.dependentTable === relation.mainTable &&
                    item.dependentTableColumn === relation.mainTableColumn &&
                    item.mainTable !== ''
                ) {
                    count++;
                }
            });

            if (count > 1) {
                relationCheck = true;
                setRelationDuplicateError(true);
            } else {
                setRelationDuplicateError(false);
            }
        });

        tablesFilter.map((filter) => {
            let count = 0;

            if (
                filter.schemaName === '' ||
                filter.tableName === '' ||
                filter.columnName === '' ||
                filter.value === '' ||
                filter.filterCondition === ''
            ) {
                filterCheck = true;
                setFilterEmptyError(true);
            } else {
                setFilterEmptyError(false);
            }

            tablesFilter.map((item) => {
                if (
                    item.tableName === filter.tableName &&
                    item.columnName === filter.columnName &&
                    item.schemaName === filter.schemaName &&
                    item.filterCondition === filter.filterCondition &&
                    item.value === filter.value
                ) {
                    count++;
                }
            });

            if (count > 1) {
                filterCheck = true;
                setFilterDuplicateError(true);
            } else {
                setFilterDuplicateError(false);
            }
        });

        setDisableButton(filterCheck || relationCheck);
    }, [triggerUpdate]);

    useEffect(() => {
        setDisableButton(isMappingLoading);
    }, [isMappingLoading]);

    useEffect(() => {
        if (tablesData) {
            let schemaArray = [];
            const newData = tablesData.map((item) => {
                const temp = item.name;
                const arr = temp.split('.');
                if (arr[1]) {
                    item.name = arr[1];
                    item.schema = arr[0];
                    schemaArray.push(arr[0]);
                }
                return item;
            });
            schemaArray = schemaArray.filter((x, i, a) => a.indexOf(x) === i);
            setSchemaValues(schemaArray);

            setOperationDataTables(newData);
            setisTablesLoading(false);
        }
    }, [tablesData]);

    const prepareData = async () => {
        setIsMappingLoading(true);
        const data = await getTablesRelations(projectId);

        if (data) {
            setTablesFilter(data.filters ?? []);
            setTablesRelation(data.relations ?? []);
        }

        if (tablesData) {
            setOperationDataTables(tablesData);
        }
        setIsMappingLoading(false);
    };

    const handleChange = (event, newValue) => {
        setIsFilter(newValue);
    };

    useEffect(() => {
        if (projectId) {
            prepareData();
        }
    }, [projectId]);

    function scrollToBottom() {
        const element = document.getElementById('content');
        if (element) {
            {
                element.scrollIntoView(false);
            }
        }
    }

    return (
        <>
            {displayPopUp && (
                <ConfirmDialog
                    title={'Delete Mapping'}
                    description={'Are you sure you want to delete this row? Once deleted you cant get it back.'}
                    onCancel={() => {
                        setDisplayPopUp(false);
                    }}
                    onConfirm={() => {
                        if (dummyTables?.isRelation) {
                            setTablesRelation(dummyTables.filteredList);
                        } else {
                            setTablesFilter(dummyTables.filteredList);
                        }
                        setTriggerUpdate((oldValue) => !oldValue);
                        setDisplayPopUp(false);
                    }}
                />
            )}
            <div style={{ width: `80vw`, height: '100%', maxWidth: '1400px' }} className="flex flex-col">
                <div className="p-4 border-b-1 flex flex-row justify-between">
                    <p className="text-subtitle1">Entity Mapping</p>
                    <AppIcon onClick={onClose}>
                        <CloseIcon />
                    </AppIcon>
                </div>

                <div className="w-full flex-1">
                    <div className="p-4">
                        {isMappingLoading || isTablesLoading ? (
                            <div style={{ marginTop: '20%' }}>
                                <LoaderWithMessage
                                    message="Loading relations and filters data"
                                    className="h-full"
                                    contained
                                />
                            </div>
                        ) : (
                            <>
                                <Stack
                                    className="border-2 rounded-t-md border-b-0"
                                    sx={{
                                        bgcolor: '#F9FAFC',
                                        borderBottom: 'none',
                                    }}
                                    direction={'row'}
                                    justifyContent="space-between"
                                    alignItems="center"
                                >
                                    <Tabs
                                        classes={{
                                            indicator: tabsClasses.indicator,
                                        }}
                                        value={isFilter}
                                        onChange={handleChange}
                                        aria-label="add project tabs"
                                        indicatorColor="primary"
                                        textColor="primary"
                                        style={{ width: 'min-content' }}
                                    >
                                        <Tab
                                            label={<TabLabel label={'Relations / Joins'} />}
                                            classes={{ root: tabClasses.tab }}
                                            style={{
                                                borderRight: `2px solid ${Colors.neutral.gray6}`,
                                                outline: 'none',
                                            }}
                                        />

                                        <Tab
                                            label={<TabLabel label={'Filters'} />}
                                            classes={{ root: tabClasses.tab }}
                                            style={{
                                                outline: 'none',
                                                borderRight: `2px solid ${Colors.neutral.gray6}`,
                                            }}
                                        />
                                    </Tabs>
                                    {isFilter ? (
                                        <OutlineButton
                                            style={
                                                filterDuplicateError
                                                    ? {
                                                          color: '#808080',
                                                          height: '35px',
                                                          marginRight: '5px',
                                                          cursor: 'not-allowed',
                                                      }
                                                    : { height: '35px', marginRight: '5px' }
                                            }
                                            disabled={filterDuplicateError}
                                            onClick={() => {
                                                const data = {
                                                    tableName: '',
                                                    columnName: '',
                                                    filterCondition: '',
                                                    schemaName: '',
                                                    value: '',
                                                };
                                                setTablesFilter([...tablesFilter, data]);

                                                setTimeout(() => {
                                                    scrollToBottom();
                                                }, 500);
                                            }}
                                        >
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Add fontSize="small" />
                                                <Typography variant="subtitle2">Add Filter</Typography>
                                            </Stack>
                                        </OutlineButton>
                                    ) : (
                                        <OutlineButton
                                            style={
                                                relationDuplicateError
                                                    ? {
                                                          color: '#808080',
                                                          height: '35px',
                                                          marginRight: '5px',
                                                          cursor: 'not-allowed',
                                                      }
                                                    : { height: '35px', marginRight: '5px' }
                                            }
                                            disabled={relationDuplicateError}
                                            onClick={() => {
                                                const data = {
                                                    mainTable: '',
                                                    mainTableColumn: '',
                                                    dependentTable: '',
                                                    dependentTableColumn: '',
                                                    relation: 'equals',
                                                    origin: 'userInput',
                                                    mainTableSchema: '',
                                                    dependentTableSchema: '',
                                                };
                                                setTablesRelation([...tablesRelation, data]);

                                                setTimeout(() => {
                                                    scrollToBottom();
                                                }, 500);
                                            }}
                                        >
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Add fontSize="small" />
                                                <Typography variant="subtitle2">Add Mapping</Typography>
                                            </Stack>
                                        </OutlineButton>
                                    )}
                                </Stack>
                                <TableContainer
                                    style={{
                                        maxHeight: `calc(100vh - 270px)`,
                                    }}
                                    className="border-2 rounded-b-md border-t-0"
                                >
                                    <Table stickyHeader aria-label="simple table" id="content">
                                        {!isFilter ? (
                                            <TableHead className="w-full">
                                                <TableRow>
                                                    <TableCell align="left" style={{ padding: '0.5rem' }}>
                                                        <p className="text-smallLabel text-neutral-gray4 uppercase">
                                                            MAIN TABLE SCHEMA
                                                        </p>
                                                    </TableCell>
                                                    <TableCell align="left" style={{ padding: '0.5rem' }}>
                                                        <p className="text-smallLabel text-neutral-gray4 uppercase">
                                                            MAIN TABLE
                                                        </p>
                                                    </TableCell>
                                                    <TableCell align="left" style={{ padding: '0.5rem' }}>
                                                        <p className="text-smallLabel text-neutral-gray4 uppercase">
                                                            MAIN TABLE COLUMN
                                                        </p>
                                                    </TableCell>
                                                    <TableCell align="left" style={{ padding: '0.5rem' }}>
                                                        <p className="text-smallLabel text-neutral-gray4 uppercase">
                                                            DEPENDENT TABLE SCHEMA
                                                        </p>
                                                    </TableCell>
                                                    <TableCell align="left" style={{ padding: '0.5rem' }}>
                                                        <p className="text-smallLabel text-neutral-gray4 uppercase">
                                                            DEPENDENT TABLE
                                                        </p>
                                                    </TableCell>
                                                    <TableCell align="left" style={{ padding: '0.5rem' }}>
                                                        <p className="text-smallLabel text-neutral-gray4 uppercase">
                                                            DEPENDENT TABLE COLUMN
                                                        </p>
                                                    </TableCell>
                                                    <TableCell align="left" style={{ padding: '0.5rem' }}>
                                                        <p className="text-smallLabel text-neutral-gray4 uppercase">
                                                            ORIGIN
                                                        </p>
                                                    </TableCell>
                                                    <TableCell align="left" style={{ padding: '0.5rem' }}>
                                                        <p className="text-smallLabel text-neutral-gray4 uppercase"></p>
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                        ) : (
                                            <TableHead className="w-full">
                                                <TableCell align="left" style={{ padding: '0.5rem' }}>
                                                    <p className="text-smallLabel text-neutral-gray4 uppercase">
                                                        SCHEMA NAME
                                                    </p>
                                                </TableCell>
                                                <TableCell align="left" style={{ padding: '0.5rem' }}>
                                                    <p className="text-smallLabel text-neutral-gray4 uppercase">
                                                        TABLE NAME
                                                    </p>
                                                </TableCell>
                                                <TableCell align="left" style={{ padding: '0.5rem' }}>
                                                    <p className="text-smallLabel text-neutral-gray4 uppercase">
                                                        COLUMN NAME
                                                    </p>
                                                </TableCell>
                                                <TableCell align="left" style={{ padding: '0.5rem' }}>
                                                    <p className="text-smallLabel text-neutral-gray4 uppercase">
                                                        FILTER CONDITION
                                                    </p>
                                                </TableCell>
                                                <TableCell align="left" style={{ padding: '0.5rem' }}>
                                                    <p className="text-smallLabel text-neutral-gray4 uppercase">
                                                        VALUE
                                                    </p>
                                                </TableCell>
                                                <TableCell align="left" style={{ padding: '0.5rem' }}>
                                                    <p className="text-smallLabel text-neutral-gray4 uppercase"></p>
                                                </TableCell>
                                            </TableHead>
                                        )}

                                        {!isFilter
                                            ? tablesRelation?.map((data, index) => (
                                                  <RelationTableRow
                                                      key={
                                                          data?.mainTable + data?.dependentTable + index + schemaValues
                                                      }
                                                      data={data}
                                                      tables={operationDataTables}
                                                      schema={schemaValues}
                                                      onUpdate={(newdata) => {
                                                          tablesRelation[index] = newdata;
                                                          setTriggerUpdate((oldValue) => !oldValue);
                                                      }}
                                                      onDelete={() => {
                                                          setDisplayPopUp(true);
                                                          const filteredList = tablesRelation.filter((item) => {
                                                              if (item !== tablesRelation[index]) {
                                                                  return item;
                                                              }
                                                          });
                                                          //setTablesRelation(filteredList);
                                                          //setTriggerUpdate((oldValue) => !oldValue);
                                                          setDummyTables({
                                                              filteredList: filteredList,
                                                              isRelation: true,
                                                          });
                                                      }}
                                                  />
                                              ))
                                            : tablesFilter?.map((data, index) => (
                                                  <FilterTableRow
                                                      key={data?.tableName + data?.columnName + index + schemaValues}
                                                      data={data}
                                                      tables={operationDataTables}
                                                      schema={schemaValues}
                                                      onUpdate={(newdata) => {
                                                          tablesFilter[index] = newdata;
                                                          setTriggerUpdate((oldValue) => !oldValue);
                                                      }}
                                                      onDelete={() => {
                                                          setDisplayPopUp(true);
                                                          const filteredList = tablesFilter.filter((item) => {
                                                              if (item !== tablesFilter[index]) {
                                                                  return item;
                                                              }
                                                          });
                                                          //setTablesFilter(filteredList);
                                                          //setTriggerUpdate((oldValue) => !oldValue);
                                                          setDummyTables({
                                                              filteredList: filteredList,
                                                              isRelation: false,
                                                          });
                                                      }}
                                                  />
                                              ))}
                                    </Table>
                                </TableContainer>
                            </>
                        )}
                    </div>
                    {/* )} */}
                </div>
                <div className="pl-6">
                    {relationEmptyError && (
                        <p className="text-overline2 text-accent-red my-1">Fill all fields in relations</p>
                    )}

                    {filterEmptyError && (
                        <p className="text-overline2 text-accent-red my-1">Fill all fields in filters</p>
                    )}
                    {relationDuplicateError && (
                        <p className="text-overline2 text-accent-red my-1">Remove duplicate values in relations</p>
                    )}

                    {filterDuplicateError && (
                        <p className="text-overline2 text-accent-red my-1">Remove duplicate values in filters</p>
                    )}
                    {mappingError && (
                        <p className="text-overline2 text-accent-red my-1">Failed to save changes, try again</p>
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

                    <PrimaryButton
                        disabled={disableButton}
                        onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!disableButton) {
                                setIsLoading(true);
                                await tableMappings(projectId, tablesFilter, tablesRelation)
                                    .then((data) => {
                                        setMappingError(false);
                                        onSubmit();
                                        onClose();
                                    })
                                    .catch((err) => {
                                        setMappingError(true);
                                        setTimeout(() => {
                                            setMappingError(false);
                                        }, 15000);
                                    });
                                setIsLoading(false);
                            }
                        }}
                    >
                        {isLoading ? <CircularProgress color={'#FFF'} size={16} /> : 'Save and Publish'}
                    </PrimaryButton>
                </div>
            </div>
        </>
    );
};

export default DBMappingDrawer;
