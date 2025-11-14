import currentViewAtom from '@/shared/atom/currentViewAtom';
import saveBulkParamAtom from '@/shared/atom/saveBulkParamAtom';
import { Dialog, Switch, Tab, Tabs } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import classNames from 'classnames';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useRecoilState, useResetRecoilState } from 'recoil';
import addParamAtom from '../../shared/atom/addParamAtom';
import schemaAtom from '../../shared/atom/schemaAtom';
import storedProcedureAtom from '../../shared/atom/storedProcedureAtom';
import tableAtom from '../../shared/atom/tableAtom';
import tablesDataAtom from '../../shared/atom/tablesDataAtom';
import { PrimaryButton } from '../../shared/components/AppButton';
import AppIcon from '../../shared/components/AppIcon';
import TabLabel from '../../shared/components/TabLabel';
import { isArray, isMongoDb, isObject, operationAtomWithMiddleware, useCanEdit } from '../../shared/utils';
import BusinessFlow from '../BusinessFlow/BusinessFlow';
import AddOrEditCustomParameter from './CustomParameters/AddOrEditCustomParameter/AddOrEditCustomParameter';
import CustomParameters from './CustomParameters/CustomParameters';
import Database from './Database/Database';
import AddOrEditParameter from './Parameters/AddOrEditParameter/AddOrEditParameter';
import Parameters from './Parameters/Parameters';
import Schema from './Schema';
import StoredProcedures from './StoredProcedures/StoredProcedures';

const Match = ({ projectType, isBusinessFlow, ...props }) => {
    const { projectId } = useParams();
    let [operationData, setOperationDetails] = useRecoilState(operationAtomWithMiddleware);
    const [addParamCheck, setAddParamCheck] = useRecoilState(addParamAtom);
    const [saveBulkParameter, setSaveBulkParam] = useRecoilState(saveBulkParamAtom);

    const [currentTab, setTab] = useState('param');
    const [schemaState, setSchemaState] = useRecoilState(schemaAtom);
    const resetSchemaState = useResetRecoilState(schemaAtom);
    const [tableState, setTableState] = useRecoilState(tableAtom);
    const [tablesDataState, setTablesDataState] = useRecoilState(tablesDataAtom);
    const [storedProcedureState, setStoredProcedureState] = useRecoilState(storedProcedureAtom);
    const resetTableState = useResetRecoilState(tableAtom);
    const [currentView, setCurrentView] = useRecoilState(currentViewAtom);

    const resetStoredProcedureState = useResetRecoilState(storedProcedureAtom);
    const [dialog, setDialog] = useState({
        show: false,
        type: null,
        data: null,
    });
    const canEdit = useCanEdit();
    const customParamENV = process.env.REACT_APP_FEATURE_CUSTOM_PARAMETER
        ? process.env.REACT_APP_FEATURE_CUSTOM_PARAMETER
        : 'true';
    const storedProcENV = process.env.REACT_APP_FEATURE_STORED_PROCS
        ? process.env.REACT_APP_FEATURE_STORED_PROCS
        : 'true';

    useEffect(() => {
        if (projectType === 'schema' || projectType === 'both') {
            setTab('schema');
        } else if (projectType === 'db') {
            setTab('db');
        } else {
            setTab('param');
        }
    }, [projectType]);
    useEffect(() => {
        if (projectType === 'db' && operationData?.operation?.operationType?.toLowerCase() != 'post') {
            setTab('db');
        }
    }, [operationData?.operation?.operationType]);

    const showAddParameterDialog = () => {
        if (canEdit()) {
            setDialog({
                show: true,
                type: 'add-parameter',
            });
        }
    };

    const showAddCustomParameterDialog = () => {
        if (canEdit()) {
            setDialog({
                show: true,
                type: 'add-custom-parameter',
            });
        }
    };

    const handleCloseDialog = () => {
        setDialog({
            show: false,
            data: null,
        });
    };

    function isString(variable) {
        return typeof variable === 'string';
    }

    function replaceLastOccurrenceInString(input, find, replaceWith) {
        if (!isString(input) || !isString(find) || !isString(replaceWith)) {
            // returns input on invalid arguments
            return input;
        }

        const lastIndex = input.lastIndexOf(find);
        if (lastIndex < 0) {
            return input;
        }

        return input.substr(0, lastIndex) + replaceWith + input.substr(lastIndex + find.length);
    }

    const isOperationSelected = projectId && operationData?.operation?.operationId;

    useEffect(() => {
        if (!isOperationSelected && currentTab == 'business-flow') {
            setTab('param');
        }
    }, [isOperationSelected]);

    const useStyles = makeStyles((theme) => ({
        switchBase: {
            color: theme.palette.grey[500],
            '&$checked': {
                color: theme.palette.primary.main,
            },
            '&$checked + $track': {
                backgroundColor: theme.palette.primary.main,
            },
        },
        checked: {},
        track: {},
    }));

    const classes = useStyles();

    return (
        <div className="flex-1 relative w-full" {...props}>
            <Dialog
                aria-labelledby="match-dialog"
                open={dialog?.show ?? false}
                fullWidth
                PaperProps={{
                    style: { borderRadius: 8 },
                }}
                onClose={(event, reason) => {
                    if (reason !== 'backdropClick') {
                        handleCloseDialog();
                    }
                }}
            >
                {dialog?.type === 'add-parameter' && canEdit() && <AddOrEditParameter onClose={handleCloseDialog} />}
                {dialog?.type === 'add-custom-parameter' && canEdit() && (
                    <AddOrEditCustomParameter projectType={projectType} onClose={handleCloseDialog} />
                )}
            </Dialog>

            <div
                className={classNames('fixed top-0 mt-14 z-999 bg-white flex flex-row items-center border-b-2', {
                    'p-3': schemaState?.selected && !_.isEmpty(schemaState?.selected),
                })}
                style={{ width: `calc(100vw - 230px)`, height: '43px' }}
            >
                <div className="flex-1">
                    {schemaState?.selected && !_.isEmpty(schemaState?.selected) ? (
                        <div className="flex flex-row items-center">
                            <AppIcon
                                style={{ marginRight: '0.5rem' }}
                                onClick={(e) => {
                                    e?.preventDefault();
                                    e?.stopPropagation();

                                    let updatedSchemaState = _.cloneDeep(schemaState);
                                    updatedSchemaState?.selected?.pop();

                                    setSchemaState(updatedSchemaState);
                                }}
                            >
                                <ArrowBackIcon style={{ fontSize: '1.25rem' }} />
                            </AppIcon>

                            <div className="flex flex-row items-center">
                                <p
                                    className="text-overline3 text-neutral-gray4 cursor-pointer hover:opacity-70"
                                    onClick={(e) => {
                                        e?.preventDefault();
                                        e?.stopPropagation();

                                        let updatedSchemaState = _.cloneDeep(schemaState);
                                        updatedSchemaState.selected = [];

                                        setSchemaState(updatedSchemaState);
                                    }}
                                >
                                    Schemas
                                </p>

                                {schemaState?.selected?.map((schema, index) => {
                                    return (
                                        <div key={index} className="flex flex-row items-center">
                                            <p className="mx-1 text-neutral-gray3"> / </p>

                                            <p
                                                className={classNames(
                                                    'text-overline3 cursor-pointer hover:opacity-70',
                                                    {
                                                        'text-neutral-gray4':
                                                            index !== schemaState?.selected?.length - 1,
                                                    },
                                                )}
                                                onClick={(e) => {
                                                    e?.preventDefault();
                                                    e?.stopPropagation();

                                                    let updatedSchemaState = _.cloneDeep(schemaState);
                                                    const itemIndex = updatedSchemaState.selected.findIndex(
                                                        (item) => item?.name === schema?.name,
                                                    );

                                                    if (itemIndex >= 0) {
                                                        updatedSchemaState.selected = _.cloneDeep(
                                                            updatedSchemaState.selected.slice(0, itemIndex + 1),
                                                        );
                                                    }

                                                    if (
                                                        updatedSchemaState?.selected?.length !==
                                                        schemaState?.selected?.length
                                                    ) {
                                                        setSchemaState(updatedSchemaState);
                                                    }
                                                }}
                                            >
                                                {schema?.name} {isArray(schema) ? ' [ ] ' : null}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : tableState?.selected && tableState?.selected.length > 0 ? (
                        <div className="flex flex-row items-center ml-3 py-3">
                            <AppIcon
                                style={{ marginRight: '0.5rem' }}
                                onClick={(e) => {
                                    e?.preventDefault();
                                    e?.stopPropagation();

                                    let updatedTableState = _.cloneDeep(tableState);

                                    if (updatedTableState?.selected.length > 0) {
                                        const removedData = updatedTableState?.selected?.pop();
                                        let newRef;
                                        if (isObject(removedData)) {
                                            newRef = replaceLastOccurrenceInString(
                                                updatedTableState.ref,
                                                `.${removedData.name}.ezapi_object`,
                                                '',
                                            );
                                        } else {
                                            newRef = replaceLastOccurrenceInString(
                                                updatedTableState.ref,
                                                `.${removedData.name}.ezapi_array.ezapi_object`,
                                                '',
                                            );
                                        }
                                        updatedTableState.ref = newRef;
                                        setTableState(updatedTableState);
                                    } else {
                                        resetTableState();
                                    }
                                }}
                            >
                                <ArrowBackIcon style={{ fontSize: '1.25rem' }} />
                            </AppIcon>

                            <div className="flex flex-row items-center">
                                <p
                                    className="text-overline3 text-neutral-gray4 cursor-pointer hover:opacity-70"
                                    onClick={(e) => {
                                        e?.preventDefault();
                                        e?.stopPropagation();

                                        resetTableState();
                                    }}
                                >
                                    {isMongoDb(tablesDataState[0] ?? '') ? 'Collections' : 'Tables'}
                                </p>

                                {tableState?.selected.map((data, index) => {
                                    return (
                                        <div className="flex flex-row items-center">
                                            <p className="mx-1 text-neutral-gray3"> / </p>

                                            <p
                                                className={classNames('text-overline3 cursor-pointer hover:opacity-70')}
                                                onClick={(e) => {
                                                    e?.preventDefault();
                                                    e?.stopPropagation();

                                                    let updatedTableState = _.cloneDeep(tableState);
                                                    let removedData = [];
                                                    const data = updatedTableState.selected.filter((item, i) => {
                                                        if (i <= index) {
                                                            return item;
                                                        } else {
                                                            removedData.push(item);
                                                        }
                                                    });
                                                    let refString = '';
                                                    removedData.map((item) => {
                                                        if (isObject(item)) {
                                                            refString = refString.concat(`.${item.name}.ezapi_object`);
                                                        } else {
                                                            refString = refString.concat(
                                                                `.${item.name}.ezapi_array.ezapi_object`,
                                                            );
                                                        }
                                                    });

                                                    const newRef = replaceLastOccurrenceInString(
                                                        updatedTableState.ref,
                                                        refString,
                                                        '',
                                                    );

                                                    updatedTableState.ref = newRef;

                                                    updatedTableState.selected = data;
                                                    setTableState(updatedTableState);
                                                }}
                                            >
                                                {data.name}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : storedProcedureState?.selected ? (
                        <div className="flex flex-row items-center ml-3 py-3">
                            <AppIcon
                                style={{ marginRight: '0.5rem' }}
                                onClick={(e) => {
                                    e?.preventDefault();
                                    e?.stopPropagation();

                                    resetStoredProcedureState();
                                }}
                            >
                                <ArrowBackIcon style={{ fontSize: '1.25rem' }} />
                            </AppIcon>

                            <div className="flex flex-row items-center">
                                <p
                                    className="text-overline3 text-neutral-gray4 cursor-pointer hover:opacity-70"
                                    onClick={(e) => {
                                        e?.preventDefault();
                                        e?.stopPropagation();

                                        resetStoredProcedureState();
                                    }}
                                >
                                    Stored Procedure
                                </p>

                                {storedProcedureState?.selected && (
                                    <div className="flex flex-row items-center">
                                        <p className="mx-1 text-neutral-gray3"> / </p>

                                        <p className={classNames('text-overline3 cursor-pointer hover:opacity-70')}>
                                            {storedProcedureState?.selected?.storedProcedure}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <Tabs
                            value={currentTab}
                            onChange={(_, value) => {
                                setTab(value);
                                if (value === 'business-flow') {
                                    isBusinessFlow(true);
                                } else {
                                    isBusinessFlow(false);
                                }
                                resetSchemaState();
                            }}
                            aria-label="schema tabs"
                            indicatorColor="primary"
                            textColor="primary"
                        >
                            {(projectType === 'schema' || projectType === 'both') && (
                                <Tab
                                    label={<TabLabel label={'Schema'} />}
                                    style={{ outline: 'none', border: 'none' }}
                                    value={'schema'}
                                />
                            )}
                            <Tab
                                label={<TabLabel label={'Parameters'} />}
                                style={{ outline: 'none', border: 'none' }}
                                value={'param'}
                            />
                            {projectType === 'db' && (
                                <Tab
                                    label={<TabLabel label={'Database'} />}
                                    style={{ outline: 'none', border: 'none' }}
                                    value={'db'}
                                />
                            )}
                            {projectType === 'db' && customParamENV === 'true' && (
                                <Tab
                                    label={<TabLabel label={'Custom Parameter'} />}
                                    style={{ outline: 'none', border: 'none' }}
                                    value={'customParam'}
                                />
                            )}
                            {projectType === 'db' &&
                                storedProcENV === 'true' &&
                                operationData?.operation?.operationType?.toLowerCase() == 'post' && (
                                    <Tab
                                        label={<TabLabel label={'Stored Procedures'} />}
                                        style={{ outline: 'none', border: 'none' }}
                                        value={'storedProcedures'}
                                    />
                                )}
                            {isOperationSelected && projectType === 'aggregate' && (
                                <Tab
                                    label={<TabLabel label={'Business Flow'} />}
                                    style={{ outline: 'none', border: 'none' }}
                                    value={'business-flow'}
                                />
                            )}
                        </Tabs>
                    )}
                </div>

                {(currentTab === 'param' || currentTab === 'customParam') && canEdit() && (
                    <div className="flex flex-row items-center ">
                        <div id="durationMY" className="container mx-auto p-4 ">
                            <div className="flex justify-center ">
                                {' '}
                                <div
                                    id="mo"
                                    style={{ color: currentView === 'grid' ? '#c72c71' : 'black' }}
                                    className="mt-1.5 text-black-500"
                                >
                                    <span className="text-overline2 capitalize">Grid View</span>
                                </div>
                                <Switch
                                    color="default"
                                    checked={currentView === 'editor'}
                                    onChange={(e) => {
                                        if (!e.target.checked) {
                                            setSaveBulkParam(true);
                                        } else {
                                            setCurrentView('editor');
                                        }
                                    }}
                                />
                                <div
                                    id="yr"
                                    style={{ color: currentView === 'editor' ? '#c72c71' : 'black' }}
                                    className="mt-1.5 text-black-500"
                                >
                                    <span className="text-overline2 capitalize"> Editor View</span>
                                </div>
                            </div>
                        </div>
                        <div className="mr-16 px-2 py-2">
                            {' '}
                            <PrimaryButton
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (currentTab === 'param') {
                                        if (currentView === 'editor') {
                                            setSaveBulkParam(true);
                                        } else {
                                            setAddParamCheck(true);
                                        }
                                    }
                                    if (currentTab === 'customParam') {
                                        showAddCustomParameterDialog();
                                    }
                                }}
                            >
                                Save
                            </PrimaryButton>
                        </div>
                    </div>
                )}

                {/* <p className='w-28 text-overline2 mr-2'>Search</p> */}
            </div>

            <div className="mt-14 h-full">
                {currentTab === 'schema' ? (
                    <Schema />
                ) : currentTab === 'param' ? (
                    <Parameters projectType={projectType} currentView={currentView} />
                ) : currentTab === 'db' ? (
                    <Database />
                ) : currentTab === 'customParam' ? (
                    <CustomParameters />
                ) : currentTab === 'storedProcedures' ? (
                    <StoredProcedures />
                ) : currentTab === 'business-flow' && projectType === 'aggregate' && isOperationSelected ? (
                    <BusinessFlow />
                ) : null}
            </div>
        </div>
    );
};

export default Match;
