import currentViewAtom from '@/shared/atom/currentViewAtom';
import saveBulkParamAtom from '@/shared/atom/saveBulkParamAtom';
import { CircularProgress, Dialog } from '@material-ui/core';
import DragIndicatorIcon from '@material-ui/icons/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import _ from 'lodash';
import { useRecoilState } from 'recoil';

import Constants from '@/shared/constants';
import { useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';
import MonacoEditor from 'react-monaco-editor';
import { useParams } from 'react-router';
import Scrollbar from 'react-smooth-scrollbar';
import { useRecoilValue } from 'recoil';
import Colors from '../../../shared/colors';
import AppIcon from '../../../shared/components/AppIcon';
import LoaderWithMessage from '../../../shared/components/LoaderWithMessage';
import { operationAtomWithMiddleware, useCanEdit } from '../../../shared/utils';
import AddOrEditParameter from './AddOrEditParameter/AddOrEditParameter';
import { useBulkChange } from './AddOrEditParameter/modifyParameterQueries';
import DeleteParameter from './DeleteParameter/DeleteParameter';
import { useGetParameters } from './parametersQuery';

const Parameters = ({ projectType, currentView }) => {
    const { projectId } = useParams();
    const {
        isLoading: isFetchingParameters,
        data: parameters,
        error: getParametersError,
    } = useGetParameters(projectId, {
        refetchOnWindowFocus: false,
    });
    const [parametersData, setParametersData] = useState([]);
    useEffect(() => {
        if (parameters) {
            setParametersData(parameters.data);
        }
    }, [parameters]);
    return (
        <>
            {currentView === 'editor' ? (
                <ParametersEditor
                    projectType={projectType}
                    parameters={parametersData}
                    setParametersData={setParametersData}
                />
            ) : (
                <ParametersGrid
                    parameters={parametersData}
                    projectType={projectType}
                    isFetchingParameters={isFetchingParameters}
                    getParametersError={getParametersError}
                    setParametersData={setParametersData}
                />
            )}
        </>
    );
};

const ParametersEditor = ({ projectType, parameters, isFetchingParameters, getParametersError }) => {
    const { projectId } = useParams();
    const [operationState, setOperationState] = useRecoilState(operationAtomWithMiddleware);

    const {
        isLoading: isEditingParameter,
        isSuccess: isEditSuccess,
        error: editParamError,
        mutate: editParam,
        reset: resetEditParam,
    } = useBulkChange();
    const [value, setValue] = useState('Attribute,Data Type,Possible Values,Required,Description');
    const [editorViewValidation, setEditorViewValidation] = useState(null);

    const [saveBulkParameter, setSaveBulkParam] = useRecoilState(saveBulkParamAtom);
    const [currentView, setCurrentView] = useRecoilState(currentViewAtom);

    const parametersToCsv = (parameters) => {
        const csv = ['Attribute,Data Type,Possible Values,Required,Description'];

        parameters.forEach((param) => {
            const row = [
                param.name,
                param.commonName,
                '[' + param.possibleValues.join(',') + ']', // Add square brackets here
                param.required ? 'Yes' : 'No',
                param.description,
            ].join(',');
            csv.push(row);
        });

        return csv.join('\n');
    };

    useEffect(() => {
        if (parameters) {
            setValue(parametersToCsv(parameters));
        }
    }, [parameters]);

    const options = {
        selectOnLineNumbers: true,
        roundedSelection: false,
        readOnly: false,
        cursorStyle: 'line',
        automaticLayout: true,
    };

    const handleChange = (newValue) => {
        setValue(newValue);
    };

    function csvToPayload(input) {
        const header = 'Attribute,Data Type,Possible Values,Required,Description';
        if (input === '') {
            setValue(header);
            return null;
        }
        if (input === header) return 'empty';
        if (!input.toLowerCase().startsWith(header.toLowerCase())) {
            input = header + '\n' + input;
        }

        const preprocessed = input.replace(/\[(.*?)\]/g, (match) => match.replace(/,/g, '|'));
        const lines = preprocessed.split(/\r?\n/);
        const keys = lines[0].split(',').map((key) => key.toLowerCase().trim());
        let objects = [];

        for (let line of lines.slice(1)) {
            const values = line.split(/,(?![^\[]*\])/);
            if (values.length !== keys.length) {
                setEditorViewValidation('Each row should have the same number of columns as the header row.');
                return null;
            }

            let object = {};
            for (let index in keys) {
                let key = keys[index];
                let value = values[index]?.trim();

                if (key === 'required') {
                    value = value.toLowerCase() === 'yes' ? true : false;
                }

                if (key === 'possible values' && value) {
                    value = value
                        .replace(/\|/g, ',')
                        .replace(/[\[\]]/g, '')
                        .split(',')
                        .map((item) => {
                            const isQuoted = item.startsWith('"') && item.endsWith('"');
                            return isQuoted ? item.slice(1, -1).trim() : item.trim();
                        });
                }

                if (key === 'data type') {
                    const dataTypeInList = Constants.parameterDataTypes.find(
                        (dt) => dt.toLowerCase() === value.toLowerCase(),
                    );
                    if (!dataTypeInList) {
                        setEditorViewValidation('Please enter a valid data type.');
                        return null;
                    }
                    value = dataTypeInList;
                }

                object[key] = value;
            }

            if (object.hasOwnProperty('attribute')) {
                object['name'] = object['attribute'];
                delete object['attribute'];
            }
            if (object.hasOwnProperty('data type')) {
                object['type'] = object['data type'];
                delete object['data type'];
            }
            if (object.hasOwnProperty('possible values')) {
                object['possibleValues'] = object['possible values'];
                delete object['possible values'];
            }
            if (object.hasOwnProperty('description')) {
                object['description'] = object['description'];
            }
            if (object.hasOwnProperty('required')) {
                object['required'] = object['required'];
            }
            objects.push(object);
        }

        const names = objects.map((obj) => obj.name);
        const hasDuplicates = names.some((name, index) => names.indexOf(name) !== index);
        if (hasDuplicates) {
            setEditorViewValidation('Each parameter name must be unique.');
            return null;
        }

        return objects;
    }

    useEffect(() => {
        if (saveBulkParameter) {
            submitData();
            setSaveBulkParam(false);
        }
    }, [saveBulkParameter, currentView]);
    useEffect(() => {
        if (!isEditingParameter) {
            if (!editParamError && isEditSuccess) {
                setCurrentView('grid');
            } else if (!isEditSuccess && editParamError) {
                setEditorViewValidation('Save Bulk parameter failed. Please try again.');
            }
        }
    }, [editParamError, isEditSuccess]);
    const submitData = () => {
        setEditorViewValidation(null);
        const newData = csvToPayload(value);
        if (newData && newData.length > 0) {
            if (newData === 'empty') {
                editParam({ projectId: projectId, data: [] });
            } else {
                editParam({ projectId: projectId, data: newData });
            }
        } else {
            setCurrentView('editor');
        }
    };
    return (
        <div className="h-full">
            {isEditingParameter ? (
                <div className="flex flex-col items-center justify-center" style={{ height: `calc(100% - 80px)` }}>
                    <LoaderWithMessage message="Saving Parameters" />
                </div>
            ) : (
                <div
                    className="bg-neutral-gray7 mt-16 p-3 rounded-md flex flex-col"
                    style={{ height: `calc(100% - 80px)` }}
                >
                    <Scrollbar
                        style={{
                            height: !operationState?.operationIndex ? `calc(100vh - 210px)` : `calc(100vh - 300px)`,
                        }}
                    >
                        <MonacoEditor
                            height={!operationState?.operationIndex ? `calc(100vh - 240px)` : `calc(24vh)`}
                            language="plaintext"
                            value={value}
                            options={options}
                            onChange={handleChange}
                            style={{ border: '1px solid lightgrey', borderRadius: '4px', backgroundColor: '#f5f5f5' }}
                        />{' '}
                        {editorViewValidation && (
                            <p className="text-overline2 mb-1 text-accent-red">{editorViewValidation}</p>
                        )}
                    </Scrollbar>
                </div>
            )}
        </div>
    );
};

const ParametersGrid = ({ parameters, projectType, isFetchingParameters, getParametersError }) => {
    const [dialog, setDialog] = useState({
        show: false,
        type: null,
        data: null,
    });
    const operationState = useRecoilValue(operationAtomWithMiddleware);

    const canEdit = useCanEdit();

    const handleCloseDialog = () => {
        setDialog({
            show: false,
            data: null,
        });
    };

    return (
        <>
            <Dialog
                aria-labelledby="dashboard-dialog"
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
                {dialog?.type === 'add-parameter' && canEdit() && (
                    <AddOrEditParameter projectType={projectType} onClose={handleCloseDialog} />
                )}
            </Dialog>

            <div className="h-full">
                <div
                    className="bg-neutral-gray7 mt-14 p-2 rounded-md flex flex-col"
                    style={{ height: `calc(100% - 80px)` }}
                >
                    {isFetchingParameters && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <CircularProgress
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    color: Colors.brand.secondary,
                                    marginBottom: '2rem',
                                }}
                            />
                            <p className="text-overline2">Fetching data</p>
                        </div>
                    )}

                    {getParametersError && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <p className="text-overline2">{getParametersError?.message}</p>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col">
                        <div className="flex flex-row justify-start bg-neutral-gray6 rounded-md p-1 py-2 mb-2">
                            <p className="flex-1 text-smallLabel ml-7 text-neutral-gray2 uppercase">Attribute</p>
                            <p className="flex-1 text-smallLabel uppercase text-neutral-gray2">Data Type</p>
                            <p className="flex-1 text-smallLabel uppercase text-neutral-gray2">Possible Values</p>
                            <div className="flex-1">
                                <p
                                    style={{ marginRight: '24px' }}
                                    className="text-center uppercase text-neutral-gray2 text-smallLabel"
                                >
                                    Required
                                </p>
                            </div>
                            <p className="flex-1 text-smallLabel uppercase text-neutral-gray2">Description</p>
                            <div className="w-12"></div>
                        </div>
                        {parameters && parameters && !_.isEmpty(parameters) ? (
                            <Scrollbar
                                style={{
                                    height: !operationState?.operationIndex ? `calc(100vh - 210px)` : null,
                                    maxHeight: operationState?.operationIndex ? `calc(50vh - 210px)` : null,
                                }}
                            >
                                {parameters?.map((param) => {
                                    return (
                                        <ParamRow projectType={projectType} param={param} entireParam={parameters} />
                                    );
                                })}
                                <AddOrEditParameter projectType={projectType} entireParam={parameters} type="add" />
                            </Scrollbar>
                        ) : (
                            <Scrollbar
                                style={{
                                    height: !operationState?.operationIndex ? `calc(100vh - 210px)` : null,
                                    maxHeight: operationState?.operationIndex ? `calc(50vh - 210px)` : null,
                                }}
                            >
                                <AddOrEditParameter projectType={projectType} onClose={handleCloseDialog} />
                            </Scrollbar>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

const ParamRow = ({ projectType, param, entireParam }) => {
    const [{ isDragging }, drag, dragPreview] = useDrag(
        () => ({
            type: 'drag_item',
            item: param,
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        }),
        [param],
    );
    const [editParameter, setEditParameter] = useState(false);

    const [dialog, setDialog] = useState({
        show: false,
        type: null,
        data: null,
    });
    const canEdit = useCanEdit();

    const showEditParameterDialog = () => {
        if (canEdit()) {
            // setDialog({
            //   show: true,
            //   type: "edit-parameter",
            // });
        }
    };

    const showDeleteParameterDialog = () => {
        if (canEdit()) {
            setDialog({
                show: true,
                type: 'delete-parameter',
            });
        }
    };

    const handleCloseDialog = () => {
        setDialog({
            show: false,
            data: null,
        });
    };

    const handleEditParameter = () => {
        setEditParameter(false);
    };
    return (
        <div
            ref={canEdit() ? drag : null}
            style={{
                opacity: isDragging ? 0.5 : 1,
                cursor: canEdit() ? 'pointer' : 'default',
            }}
        >
            <>
                <Dialog
                    aria-labelledby="dashboard-dialog"
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
                    {dialog?.type === 'delete-parameter' && canEdit() && (
                        <DeleteParameter onClose={handleCloseDialog} parameter={param} />
                    )}
                </Dialog>
                {editParameter && canEdit() ? (
                    <AddOrEditParameter
                        projectType={projectType}
                        stopEdit={handleEditParameter}
                        onClose={handleCloseDialog}
                        parameter={param}
                        entireParam={entireParam}
                    />
                ) : (
                    <div key={param.name} className="bg-white mb-1 rounded-md flex flex-row p-1 py-1 items-center">
                        <AppIcon className="mr-1 opacity-50">
                            <DragIndicatorIcon className={'cursor-move'} style={{ height: '1.25rem' }} />
                        </AppIcon>
                        <p className="flex-1 ml-1 text-overline2">{param?.name}</p>
                        <p className="flex-1 text-overline2">
                            {/* {(param?.format) ? DataTypeTable[param.format].format:param.type}</p> */}
                            {param?.commonName}
                        </p>
                        <p className="flex-1 text-overline2">
                            {param.possibleValues?.reduce((acc, curr) => {
                                if (!_.isEmpty(acc)) {
                                    return acc + ', ' + curr;
                                }
                                return curr;
                            }, '')}
                        </p>
                        <p className="flex-1">
                            <p style={{ marginRight: '29px' }} className="text-center text-overline2 mr-2">
                                {param?.required ? 'Yes' : 'No'}
                            </p>
                        </p>
                        <p className="flex-1 text-overline2">{param?.description}</p>
                        <div className="w-12 h-8 flex flex-row pt-1">
                            <AppIcon
                                className="mr-1"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEditParameter(true);
                                }}
                            >
                                <EditIcon
                                    className={'cursor-pointer'}
                                    style={{ height: '1.25rem', color: '#c72c71' }}
                                />
                            </AppIcon>
                            <AppIcon
                                className="mr-1"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    showDeleteParameterDialog();
                                }}
                            >
                                <DeleteIcon
                                    className={'cursor-pointer'}
                                    style={{ marginLeft: '5px', height: '1.25rem', color: '#c72c71' }}
                                />
                            </AppIcon>
                        </div>
                    </div>
                )}
            </>
        </div>
    );
};

export default Parameters;
