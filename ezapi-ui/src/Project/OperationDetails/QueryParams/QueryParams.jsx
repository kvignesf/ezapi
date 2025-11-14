import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import _ from 'lodash';
import debounce from 'lodash.debounce';
import { useCallback } from 'react';
import { useGetRecoilValueInfo_UNSTABLE, useRecoilState, useRecoilValue } from 'recoil';
import primaryAtom from '../../../shared/atom/primaryAtom';
import tablesDataAtom from '../../../shared/atom/tablesDataAtom';
import DragAndDropMessage from '../../../shared/components/DragAndDropMessage';
import {
    isArray,
    isAttribute,
    isColumn,
    isItemSame,
    isObject,
    isSchema,
    operationAtomWithMiddleware,
    useGetFullPath,
    useGetParentName,
    useWindowSize,
} from '../../../shared/utils';
import DropArea from '../DropArea';
import Row from '../Row';

const QueryParams = ({ request = true }) => {
    let [operationDetails, setOperationDetails] = useRecoilState(operationAtomWithMiddleware);
    const { height, width } = useWindowSize();
    const [primaryKeyRef, setPrimaryKeyRef] = useRecoilState(primaryAtom);
    const tablesData = useRecoilValue(tablesDataAtom);
    const { fetch: fetchParentName } = useGetParentName();
    const { fetch: fetchFullPath } = useGetFullPath();
    const getRecoilValueInfo = useGetRecoilValueInfo_UNSTABLE();

    const itemDropped = (item) => {
        var final_arr = [];

        if (isColumn(item)) {
            if (item?.foreign) {
                final_arr.push(item?.foreign?.table);

                let condition = tablesData
                    .filter((table) => {
                        return table.name === item.foreign.table;
                    })[0]
                    .selectedColumns.filter((column) => {
                        return column.name === item.foreign.column;
                    })[0];

                while (condition?.foreign) {
                    final_arr.push(condition.foreign.table);
                    condition = tablesData
                        .filter((table) => {
                            return table.name === condition.foreign.table;
                        })[0]
                        .selectedColumns.filter((column) => {
                            return column.name === condition.foreign.column;
                        })[0];
                }
            } else {
                final_arr = [];
            }
            setPrimaryKeyRef(final_arr);
        }
        if ((isAttribute(item) || isColumn(item)) && !isArray(item) && !isSchema(item) && !isObject(item)) {
            setOperationDetails((operationDetails) => {
                const path = fetchFullPath(item);

                if (request) {
                    if (!operationDetails.operationRequest.queryParams.find((x) => isItemSame(x, item, path))) {
                        const newOperationDetails = _.cloneDeep(operationDetails);
                        const clonedItem = _.cloneDeep(item);

                        if (isAttribute(item)) {
                            clonedItem.schemaName = fetchParentName(clonedItem) ?? 'global';
                            clonedItem.parentName = path ?? '/';
                        } else if (isColumn(item)) {
                            clonedItem.tableName = fetchParentName(clonedItem) ?? 'global';
                        }

                        newOperationDetails.operationRequest.queryParams.push(clonedItem);

                        return newOperationDetails;
                    }
                } else {
                    if (!operationDetails.operationResponse.queryParams.find((x) => isItemSame(x, item, path))) {
                        const newOperationDetails = _.cloneDeep(operationDetails);
                        const clonedItem = _.cloneDeep(item);

                        if (isAttribute(item)) {
                            clonedItem.schemaName = fetchParentName(clonedItem) ?? 'global';
                            clonedItem.parentName = path ?? '/';
                        } else if (isColumn(item)) {
                            clonedItem.tableName = fetchParentName(clonedItem) ?? 'global';
                        }

                        newOperationDetails.operationResponse.queryParams.push(clonedItem);

                        return newOperationDetails;
                    }
                }
                return operationDetails;
            });
        }
    };

    const itemDeleted = (item) => {
        if ((isAttribute(item) || isColumn(item)) && !isArray(item) && !isSchema(item) && !isObject(item)) {
            setOperationDetails((operationDetails) => {
                if (request) {
                    const index = operationDetails.operationRequest.queryParams.findIndex((x) => x.name === item.name);

                    if (index !== -1) {
                        const newOperationDetails = _.cloneDeep(operationDetails);

                        newOperationDetails.operationRequest.queryParams.splice(index, 1);

                        return newOperationDetails;
                    }
                } else {
                    const index = operationDetails.operationResponse.queryParams.findIndex((x) => x.name === item.name);

                    if (index !== -1) {
                        const newOperationDetails = _.cloneDeep(operationDetails);

                        newOperationDetails.operationResponse.queryParams.splice(index, 1);

                        return newOperationDetails;
                    }
                }

                return operationDetails;
            });
        }
    };

    const onDescriptionUpdate = useCallback(
        debounce((item, value) => {
            setOperationDetails((operationDetails) => {
                if (request) {
                    let foundItem = operationDetails.operationRequest.queryParams.find((x) => x.name === item.name);
                    let foundItemIndex = operationDetails.operationRequest.queryParams.findIndex(
                        (x) => x.name === item.name,
                    );

                    if (foundItem) {
                        const clonedFoundItem = _.cloneDeep(foundItem);
                        const clonedOperationDetails = _.cloneDeep(operationDetails);

                        clonedFoundItem.description = value;
                        clonedOperationDetails.operationRequest.queryParams[foundItemIndex] = clonedFoundItem;

                        return clonedOperationDetails;
                    }
                } else {
                    let foundItem = operationDetails.operationResponse.queryParams.find((x) => x.name === item.name);
                    let foundItemIndex = operationDetails.operationResponse.queryParams.findIndex(
                        (x) => x.name === item.name,
                    );

                    if (foundItem) {
                        const clonedFoundItem = _.cloneDeep(foundItem);
                        const clonedOperationDetails = _.cloneDeep(operationDetails);

                        clonedFoundItem.description = value;
                        clonedOperationDetails.operationResponse.queryParams[foundItemIndex] = clonedFoundItem;

                        return clonedOperationDetails;
                    }
                }

                return operationDetails;
            });
        }, 300),
        [], // will be created only once initially
    );

    const onNameUpdate = (item, name) => {
        setOperationDetails((operationDetails) => {
            if (request) {
                let foundItemIndex = operationDetails.operationRequest.queryParams.findIndex(
                    (x) => x?.sourceName === item?.sourceName,
                );

                if (foundItemIndex !== -1) {
                    let foundItem = operationDetails.operationRequest.queryParams[foundItemIndex];

                    const clonedFoundItem = _.cloneDeep(foundItem);
                    const clonedOperationDetails = _.cloneDeep(operationDetails);

                    clonedFoundItem.name = name;
                    clonedOperationDetails.operationRequest.queryParams[foundItemIndex] = clonedFoundItem;

                    return clonedOperationDetails;
                }
            }
            return operationDetails;
        });
    };

    const isNameTaken = (item, name) => {
        const { loadable: operationAtom } = getRecoilValueInfo(operationAtomWithMiddleware);
        const operationDetails = operationAtom?.contents;
        let nameExists = false;

        if (request) {
            let foundItemIndex = operationDetails.operationRequest.queryParams.findIndex(
                (x) => x?.name === name && x?.sourceName !== item?.sourceName,
            );

            if (foundItemIndex !== -1) {
                nameExists = true;
            }
        }
        return nameExists;
    };

    const onRequiredUpdate = (item, value) => {
        setOperationDetails((operationDetails) => {
            let foundItem = operationDetails.operationRequest.queryParams.find((x) => x.name === item.name);
            let foundItemIndex = operationDetails.operationRequest.queryParams.findIndex((x) => x.name === item.name);

            if (foundItem) {
                const clonedFoundItem = _.cloneDeep(foundItem);
                const clonedOperationDetails = _.cloneDeep(operationDetails);

                clonedFoundItem.required = value;
                clonedOperationDetails.operationRequest.queryParams[foundItemIndex] = clonedFoundItem;

                return clonedOperationDetails;
            }
            return operationDetails;
        });
    };

    return (
        <DropArea onItemDropped={itemDropped}>
            <TableContainer
                style={{
                    maxHeight: height > 750 ? '27vh' : height > 600 ? '23vh' : '20vh',
                }}
            >
                <Table stickyHeader aria-label="simple table" className="border-t-2 border-b-2">
                    <TableHead className="border-t-2 border-b-2 w-full">
                        <TableRow>
                            <TableCell align="left" style={{ padding: '0.5rem' }}>
                                <p className="text-overline2 text-neutral-gray4">ATTRIBUTE</p>
                            </TableCell>
                            <TableCell align="left" style={{ padding: '0' }}>
                                <p className="text-overline2 text-neutral-gray4">DATA TYPE</p>
                            </TableCell>
                            <TableCell align="left" style={{ padding: '0' }}>
                                <p className="text-overline2 text-neutral-gray4">DESCRIPTION</p>
                            </TableCell>
                            <TableCell align="left" style={{ padding: '0' }}>
                                <p className="text-overline2 text-neutral-gray4">REQUIRED</p>
                            </TableCell>
                            <TableCell align="left" style={{ padding: '0' }}></TableCell>
                        </TableRow>
                    </TableHead>

                    {request && !_.isEmpty(operationDetails?.operationRequest?.queryParams) && (
                        <TableBody className="w-full max-h-6">
                            {operationDetails?.operationRequest?.queryParams?.map((row) => {
                                return (
                                    <Row
                                        row={row}
                                        onItemDelete={itemDeleted}
                                        onDescriptionUpdate={(item, value) => {
                                            onDescriptionUpdate(item, value);
                                        }}
                                        onRequiredUpdate={(item, value) => {
                                            onRequiredUpdate(item, value);
                                        }}
                                        onNameUpdate={(item, name) => {
                                            onNameUpdate(item, name);
                                        }}
                                        isNameTaken={isNameTaken}
                                    />
                                );
                            })}
                        </TableBody>
                    )}

                    {!request && !_.isEmpty(operationDetails?.operationResponse?.queryParams) && (
                        <TableBody className="w-full max-h-6">
                            {operationDetails?.operationResponse?.queryParams?.map((row) => {
                                return (
                                    <Row
                                        row={row}
                                        onItemDelete={itemDeleted}
                                        onDescriptionUpdate={(item, value) => {
                                            onDescriptionUpdate(item, value);
                                        }}
                                        onRequiredUpdate={(item, value) => {
                                            onRequiredUpdate(item, value);
                                        }}
                                        isNameTaken={isNameTaken}
                                    />
                                );
                            })}
                        </TableBody>
                    )}
                </Table>
            </TableContainer>

            {request && _.isEmpty(operationDetails?.operationRequest?.queryParams) && (
                <div className="border-dashed p-3 bg-neutral-gray7 rounded-md border-2 m-2 flex flex-row justify-center">
                    <DragAndDropMessage isAttributeAllowed />
                </div>
            )}

            {!request && _.isEmpty(operationDetails?.operationResponse?.queryParams) && (
                <div className="border-dashed p-3 bg-neutral-gray7 rounded-md border-2 m-2 flex flex-row justify-center">
                    <DragAndDropMessage isColumnAllowed />
                </div>
            )}
        </DropArea>
    );
};

export default QueryParams;
