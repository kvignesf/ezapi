import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import tableAtom from '../../../shared/atom/tableAtom';
import tablesDataAtom from '../../../shared/atom/tablesDataAtom';
import LoaderWithMessage from '../../../shared/components/LoaderWithMessage';
import { useGetSubTables, useGetTablesData } from '../../../shared/query/tablesQueries';
import { isArray, isDatabase, isMongoDb, isObject } from '../../../shared/utils';
import DatabaseSection from './DatabaseSection';
const Database = () => {
    const { projectId } = useParams();
    const {
        isLoading: isFetchingTables,
        error: fetchTablesError,
        data: tablesData,
        mutate: fetchTablesData,
    } = useGetTablesData();
    const {
        isLoading: isLoadingSubTable,
        error: getSubTablesError,
        data: subTableData,
        mutate: getSubTable,
        reset: resetSubTableData,
        isIdle: isGetSubTableIdle,
    } = useGetSubTables();
    const [content, setContent] = useState(null);
    const [tableState, setTableState] = useRecoilState(tableAtom);
    const [tablesDataState, setTablesDataState] = useRecoilState(tablesDataAtom);
    const [selectedItem, setSelectedItem] = useState();

    useEffect(() => {
        fetchTablesData({ projectId });
    }, []);

    const handleItemClick = (item) => {
        setSelectedItem(item);
        if (isDatabase(item) || isMongoDb(item)) {
            setTableState((tableState) => {
                const clonedTableState = _.cloneDeep(tableState);

                clonedTableState.selected.push(item);

                return clonedTableState;
            });
        } else if (isObject(item) && !item.is_child) {
            //console.log("object", item);
            let newRef;
            if (tableState.ref === '') {
                newRef = `${item.tableName}.attributes.${item.name}.ezapi_object`;
            } else {
                newRef = `${tableState.ref}.${item.name}.ezapi_object`;
            }
            setTableState((tableState) => {
                const clonedTableState = _.cloneDeep(tableState);
                clonedTableState.ref = newRef;
                return clonedTableState;
            });
            getSubTable({
                projectId,
                name: item?.name,
                type: item?.type,
                ref: newRef,
            });
        } else if (isArray(item) && !item.is_child) {
            let newRef;
            if (tableState.ref === '') {
                newRef = `${item.tableName}.attributes.${item.name}.ezapi_array.ezapi_object`;
            } else {
                newRef = `${tableState.ref}.${item.name}.ezapi_array.ezapi_object`;
            }
            setTableState((tableState) => {
                const clonedTableState = _.cloneDeep(tableState);
                clonedTableState.ref = newRef;
                return clonedTableState;
            });
            item['ref'] = newRef;
            getSubTable({
                projectId,
                name: item?.name,
                type: item?.type,
                ref: newRef,
            });

            // setTableState((tableState) => {
            //   const clonedTableState = _.cloneDeep(tableState);

            //   clonedTableState.selected = item;

            //   return clonedTableState;
            // });
        }
    };

    useEffect(() => {
        if (subTableData) {
            setTableState((tableState) => {
                const clonedTableState = _.cloneDeep(tableState);
                selectedItem.selectedColumns = subTableData.data;
                clonedTableState.selected.push(selectedItem);
                clonedTableState.selected[clonedTableState.selected.length - 1].selectedColumns.map((item) => {
                    item.ref = clonedTableState.ref;
                });

                return clonedTableState;
            });
        }
    }, [subTableData]);

    useEffect(() => {
        if (tableState?.selected.length > 0) {
            const length = tableState.selected.length;
            const columnsData = _.cloneDeep(tableState?.selected[length - 1]?.selectedColumns);
            const threePartIndex = Math.ceil(columnsData?.length / 3);

            const thirdPart = columnsData.splice(-threePartIndex);
            const secondPart = columnsData.splice(-threePartIndex);
            const firstPart = columnsData;

            setContent([firstPart, secondPart, thirdPart]);
        } else if (tablesData && !_.isEmpty(tablesData)) {
            setTablesDataState(tablesData);

            const clonedTablesData = _.cloneDeep(tablesData);

            clonedTablesData?.sort((a, b) => {
                if (a?.selectedColumns?.length < b?.selectedColumns?.length) return 1;
                if (a?.selectedColumns?.length > b?.selectedColumns?.length) return -1;
                return 0;
            });

            const threePartIndex = Math.ceil(clonedTablesData.length / 3);

            const thirdPart = clonedTablesData.splice(-threePartIndex);
            const secondPart = clonedTablesData.splice(-threePartIndex);
            const firstPart = clonedTablesData;
            setContent([firstPart, secondPart, thirdPart]);
        }
    }, [tablesData, tableState?.selected.length]);

    if (isLoadingSubTable || isFetchingTables) {
        return <LoaderWithMessage message="Loading data" className="h-full" contained={true} />;
    }

    if (!content || _.isEmpty(content)) {
        return (
            <div className="h-full flex flex-col justify-center items-center">
                <p className="text-overline2">No tables available</p>
            </div>
        );
    }

    return (
        <div className="mx-4 py-4">
            <div className="flex flex-row gap-x-5 justify-center">
                <div className="flex-1 h-fit bg-neutral-gray7 rounded-md p-2">
                    <DatabaseSection
                        section={'1'}
                        items={content[0]}
                        onItemClick={(item) => {
                            handleItemClick(item);
                        }}
                    />
                </div>

                <div className="flex-1 h-fit bg-neutral-gray7 rounded-md p-2 ">
                    <DatabaseSection
                        section={'2'}
                        items={content[1]}
                        onItemClick={(item) => {
                            handleItemClick(item);
                        }}
                    />
                </div>

                <div className="flex-1 h-fit  bg-neutral-gray7 rounded-md p-2">
                    <DatabaseSection
                        section={'3'}
                        items={content[2]}
                        onItemClick={(item) => {
                            handleItemClick(item);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Database;
