import { CircularProgress, MenuItem } from '@material-ui/core';
import Select from '@material-ui/core/Select';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CloseIcon from '@material-ui/icons/Close';
import classNames from 'classnames';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import Scrollbar from 'react-smooth-scrollbar';
import { useRecoilValue } from 'recoil';
import schemaAtom from '../../shared/atom/schemaAtom';
import { PrimaryButton, TextButton } from '../../shared/components/AppButton';
import AppIcon from '../../shared/components/AppIcon';
import { isFullMatch, isNoMatch, isPartialMatch, isSchema, useCanEdit } from '../../shared/utils';
import { useGetAttrRecommendations, useGetTables, useSaveAttrRecommendations } from './recommendationQueries';

const MatchItem = ({ item }) => {
    return (
        <div className="flex flex-row mr-2 justify-start items-start">
            <div
                style={{
                    width: '40px',
                    height: '20px',
                    borderRadius: '2px',
                    marginRight: '0.5rem',
                }}
                className={classNames({
                    'bg-brand-green': isFullMatch(item),
                    'bg-score-yellow': isPartialMatch(item),
                    'bg-score-red': isNoMatch(item),
                })}
            ></div>

            <p className="text-mediumLabel">
                {isFullMatch(item) ? 'Full Match' : isPartialMatch(item) ? 'Partial Match' : 'No Match'}
            </p>
        </div>
    );
};

const AttributeDetails = ({ attribute, onClose }) => {
    const schemaDetails = useRecoilValue(schemaAtom);
    const [table, setTable] = useState(null); // table name
    const [column, setColumn] = useState(null); // column name
    const { projectId } = useParams();
    const {
        isLoading: isFetchingTables,
        data: tablesData,
        error: fetchTablesError,
        mutate: fetchTables,
    } = useGetTables();
    const {
        isLoading: isFetchingAttrData,
        data: attributeData,
        error: fetchAttributeError,
        mutate: fetchAttrData,
    } = useGetAttrRecommendations();
    const {
        isLoading: isSavingAttrData,
        isSuccess: saveAttributeSuccess,
        error: saveAttributeError,
        data: saveAttrData,
        mutate: saveAttrDetails,
        reset: resetSaveAttrDetails,
    } = useSaveAttrRecommendations();
    const canEdit = useCanEdit();

    useEffect(() => {
        fetchTables({ projectId });
        fetchAttrData({
            projectId,
            schema: getParentSchema()?.name,
            attribute: attribute?.name,
        });
    }, []);

    useEffect(() => {
        if (saveAttrData) {
            fetchAttrData({
                projectId,
                schema: getParentSchema()?.name,
                attribute: attribute?.name,
            });
        }
    }, [saveAttrData]);

    useEffect(() => {
        if (attributeData && attributeData?.overridenMatch) {
            setTable(attributeData?.overridenMatch?.tableName);
            setColumn(attributeData?.overridenMatch?.tableAttribute);
        }
    }, [attributeData]);

    const getParentSchema = () => {
        if (schemaDetails && schemaDetails?.selected && !_.isEmpty(schemaDetails?.selected)) {
            const value = schemaDetails?.selected
                ?.slice()
                ?.reverse()
                ?.find((item) => isSchema(item));

            return value;
        }
        return null;
    };

    const saveAttributeData = (selectedTable, selectedAttribute) => {
        if (canEdit()) {
            saveAttrDetails({
                projectId,
                schema: getParentSchema()?.name,
                schemaAttribute: attribute?.name,
                level: attributeData?.level,
                path: attributeData?.path,
                tableName: selectedTable ?? table?.table,
                tableAttribute: selectedAttribute ?? column?.name,
            });
        }
    };

    const getColumns = (tableName) => {
        return _.find(tablesData, (tab) => tab?.name === tableName)?.data ?? [];
    };

    const isRecommendationApplied = (recom) => {
        if (attributeData?.overridenMatch && !_.isEmpty(attributeData?.overridenMatch)) {
            return (
                attributeData?.overridenMatch?.tableName === recom?.table &&
                attributeData?.overridenMatch?.tableAttribute === recom?.table_attribute
            );
        }
        return isFullMatch(recom);
    };

    if (saveAttributeSuccess) {
        onClose();
        return null;
    }

    return (
        <div style={{ width: `50vw`, height: '100%', maxWidth: '600px' }} className="flex flex-col">
            <div className="p-4 border-b-1 flex flex-row justify-between">
                <p className="text-subtitle1">Attribute Details</p>
                <AppIcon onClick={onClose}>
                    <CloseIcon />
                </AppIcon>
            </div>

            <div className="flex-1">
                {attributeData && !isSavingAttrData && (
                    <div className="h-full p-4">
                        <div className="flex flex-row w-full mb-8 gap-3">
                            <div className="flex-1 flex flex-col">
                                <p className="text-capitalised text-neutral-gray3 mb-1">Attribute Name</p>
                                <p className="text-mediumLabel">{attribute?.name}</p>
                            </div>
                            <div className="flex-1 flex flex-col">
                                <p className="text-capitalised text-neutral-gray3 mb-1">Attribute Path</p>
                                <p className="text-mediumLabel">{`${getParentSchema()?.name} / ${attribute?.name}`}</p>
                            </div>
                            <div className="flex-1 flex flex-col">
                                <p className="text-capitalised text-neutral-gray3 mb-1">Match</p>
                                <MatchItem item={attribute} />
                            </div>
                        </div>

                        <div className="mb-4">
                            {tablesData && !_.isEmpty(tablesData) && (
                                <>
                                    <div className="w-full mb-4">
                                        <p className="text-mediumLabel mb-1">Table</p>

                                        <Select
                                            labelId="demo-simple-select-label"
                                            id="table-select"
                                            value={table}
                                            disabled={!canEdit()}
                                            variant="outlined"
                                            onChange={({ target: { value } }) => {
                                                resetSaveAttrDetails();
                                                setTable(value);
                                                setColumn(null);
                                            }}
                                            style={{ width: '100%' }}
                                        >
                                            {tablesData?.map((table) => {
                                                return <MenuItem value={table?.name}>{table?.name}</MenuItem>;
                                            })}
                                        </Select>
                                    </div>

                                    <div className="w-full">
                                        <p className="text-mediumLabel mb-1">Column</p>

                                        <Select
                                            labelId="column"
                                            id="column-select"
                                            value={column}
                                            variant="outlined"
                                            disabled={!canEdit()}
                                            onChange={({ target: { value } }) => {
                                                resetSaveAttrDetails();
                                                setColumn(value);
                                            }}
                                            style={{ width: '100%' }}
                                        >
                                            {getColumns(table)?.map((column) => {
                                                return <MenuItem value={column?.name}>{column?.name}</MenuItem>;
                                            })}
                                        </Select>
                                    </div>
                                </>
                            )}

                            {isFetchingTables && (
                                <div className="flex flex-row items-center">
                                    <CircularProgress
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            marginRight: '1rem',
                                        }}
                                    />
                                    <p className="text-overline2">Fetching tables data</p>
                                </div>
                            )}

                            {fetchTablesError && (
                                <p className="text-overline2 text-accent-red">{fetchTablesError?.message}</p>
                            )}
                        </div>

                        <div className="bg-brand-primary bg-opacity-5 p-3 border-1 border-brand-primary rounded-sm">
                            <p className="text-capitalised text-brand-primary mb-2">Recommendations</p>
                            {attributeData?.recommendations && !_.isEmpty(attributeData?.recommendations) && (
                                <Scrollbar style={{ maxHeight: '25vh' }}>
                                    <div>
                                        {attributeData?.recommendations?.map((recom, index) => {
                                            return (
                                                <div
                                                    className={classNames(
                                                        'flex flex-row items-center justify-between py-1',
                                                        {
                                                            'border-b-1':
                                                                index !== attributeData?.recommendations?.length - 1,
                                                        },
                                                    )}
                                                >
                                                    <p className="text-overline2 mr-2">
                                                        {recom.table} / {recom.table_attribute}
                                                    </p>

                                                    {isRecommendationApplied(recom) ? (
                                                        <div className="bg-brand-green p-1 px-2 rounded-sm flex flex-row items-center">
                                                            <AppIcon
                                                                color="white"
                                                                style={{
                                                                    padding: '0',
                                                                    marginRight: '0.5rem',
                                                                    cursor: 'default',
                                                                }}
                                                            >
                                                                <CheckCircleIcon style={{ fontSize: '20px' }} />
                                                            </AppIcon>
                                                            <p className="text-white text-smallLabel">Applied</p>
                                                        </div>
                                                    ) : canEdit() ? (
                                                        <div
                                                            className="bg-brand-secondary p-1 px-3 rounded-sm cursor-pointer hover:opacity-90"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();

                                                                saveAttributeData(recom.table, recom.table_attribute);
                                                            }}
                                                        >
                                                            <p className="text-white text-smallLabel">Apply</p>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Scrollbar>
                            )}

                            {!attributeData ||
                                !attributeData?.recommendations ||
                                (_.isEmpty(attributeData?.recommendations) && (
                                    <p className="text-overline2 mb-2">Unable to find the recommendations</p>
                                ))}
                        </div>

                        {saveAttributeError && (
                            <p className="text-overline2 my-4 text-accent-red">{saveAttributeError?.message}</p>
                        )}
                    </div>
                )}

                {isSavingAttrData && (
                    <div className="h-full flex flex-col items-center justify-center">
                        <CircularProgress style={{ width: '28px', height: '28px', marginBottom: '1rem' }} />
                        <p className="text-overline2">Saving recommendations</p>
                    </div>
                )}

                {isFetchingAttrData && (
                    <div className="h-full flex flex-col items-center justify-center">
                        <CircularProgress style={{ width: '28px', height: '28px', marginBottom: '1rem' }} />
                        <p className="text-overline2">Fetching attribute details</p>
                    </div>
                )}

                {fetchAttributeError && (
                    <div className="h-full flex flex-col justify-center items-center">
                        <p className="text-overline2">{fetchAttributeError?.message}</p>
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

                            saveAttributeData(table, column);
                        }}
                    >
                        Save
                    </PrimaryButton>
                )}
            </div>
        </div>
    );
};

export default AttributeDetails;
