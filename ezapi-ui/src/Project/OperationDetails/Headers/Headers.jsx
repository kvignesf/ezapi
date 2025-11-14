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

const Headers = ({ request = true, responseCode }) => {
    let [operationData, setOperationDetails] = useRecoilState(operationAtomWithMiddleware);
    const { height, width } = useWindowSize();
    const { fetch: fetchParentName } = useGetParentName();
    const { fetch: fetchFullPath } = useGetFullPath();
    const [primaryKeyRef, setPrimaryKeyRef] = useRecoilState(primaryAtom);
    const tablesData = useRecoilValue(tablesDataAtom);

    const getRecoilValueInfo = useGetRecoilValueInfo_UNSTABLE();

    const itemDropped = (item) => {
        let final_arr = [];

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
                    if (!operationDetails.operationRequest.headers.find((x) => isItemSame(x, item, path))) {
                        const newOperationDetails = _.cloneDeep(operationDetails);
                        const clonedItem = _.cloneDeep(item);

                        if (isAttribute(item)) {
                            clonedItem.schemaName = fetchParentName(clonedItem) ?? 'global';
                            clonedItem.parentName = path ?? '/';
                        } else if (isColumn(item)) {
                            clonedItem.tableName = fetchParentName(clonedItem) ?? 'global';
                        }

                        newOperationDetails.operationRequest.headers.push(clonedItem);

                        return newOperationDetails;
                    }
                    return operationDetails;
                } else {
                    const responseData = getResponseData(operationDetails);
                    const responseIndex = getResponseIndex(operationDetails);

                    const existingHeaderIndex = responseData?.headers?.findIndex((x) => isItemSame(x, item, path));

                    if (existingHeaderIndex === -1 && responseData && responseIndex >= 0) {
                        const clonedOperationDetails = _.cloneDeep(operationDetails);
                        const clonedResponseData = _.cloneDeep(responseData);
                        const clonedItem = _.cloneDeep(item);

                        if (isAttribute(item)) {
                            clonedItem.schemaName = fetchParentName(clonedItem) ?? 'global';
                            clonedItem.parentName = path ?? '/';
                        } else if (isColumn(item)) {
                            clonedItem.tableName = fetchParentName(clonedItem) ?? 'global';
                        }

                        clonedResponseData.headers.push(clonedItem);

                        clonedOperationDetails.operationResponse[responseIndex] = clonedResponseData;

                        return clonedOperationDetails;
                    }

                    return operationDetails;
                }
            });
        }
    };

    const itemDeleted = (item) => {
        if ((isAttribute(item) || isColumn(item)) && !isArray(item) && !isSchema(item) && !isObject(item)) {
            setOperationDetails((operationDetails) => {
                if (request) {
                    const index = operationDetails.operationRequest.headers.findIndex((x) => x.name === item.name);

                    if (index !== -1) {
                        const newOperationDetails = _.cloneDeep(operationDetails);

                        newOperationDetails.operationRequest.headers.splice(index, 1);

                        return newOperationDetails;
                    }

                    return operationDetails;
                } else {
                    const responseData = getResponseData(operationDetails);
                    const responseIndex = getResponseIndex(operationDetails);
                    const headerIndex = responseData.headers.findIndex((header) => header.name === item.name);

                    if (responseData && responseIndex >= 0) {
                        const clonedOperationDetails = _.cloneDeep(operationDetails);
                        const clonedResponseData = _.cloneDeep(responseData);

                        clonedResponseData.headers.splice(headerIndex, 1);
                        clonedOperationDetails.operationResponse[responseIndex] = clonedResponseData;

                        return clonedOperationDetails;
                    }

                    return operationDetails;
                }
            });
        }
    };

    const onDescriptionUpdate = useCallback(
        debounce((item, value) => {
            setOperationDetails((operationDetails) => {
                if (request) {
                    let foundItem = operationDetails.operationRequest.headers.find((x) => x.name === item.name);
                    let foundItemIndex = operationDetails.operationRequest.headers.findIndex(
                        (x) => x.name === item.name,
                    );

                    if (foundItem) {
                        const clonedFoundItem = _.cloneDeep(foundItem);
                        const clonedOperationDetails = _.cloneDeep(operationDetails);

                        clonedFoundItem.description = value;
                        clonedOperationDetails.operationRequest.headers[foundItemIndex] = clonedFoundItem;

                        return clonedOperationDetails;
                    }
                } else {
                    const responseData = getResponseData(operationDetails);
                    const responseIndex = getResponseIndex(operationDetails);

                    let foundItem = responseData.headers.find((x) => x.name === item.name);
                    let foundItemIndex = responseData.headers.findIndex((x) => x.name === item.name);

                    if (foundItem) {
                        const clonedFoundItem = _.cloneDeep(foundItem);
                        const clonedOperationDetails = _.cloneDeep(operationDetails);
                        const clonedResponseData = _.cloneDeep(responseData);

                        clonedFoundItem.description = value;
                        clonedResponseData.headers[foundItemIndex] = clonedFoundItem;

                        clonedOperationDetails.operationResponse[responseIndex] = clonedResponseData;

                        return clonedOperationDetails;
                    }
                }
                return operationDetails;
            });
        }, 300),
        [], // will be created only once initially
    );

    const onPossibleValuesUpdate = useCallback(
        debounce((item, value) => {
            setOperationDetails((operationDetails) => {
                if (request) {
                    let foundItem = operationDetails.operationRequest.headers.find((x) => x.name === item.name);
                    let foundItemIndex = operationDetails.operationRequest.headers.findIndex(
                        (x) => x.name === item.name,
                    );

                    if (foundItem) {
                        const clonedFoundItem = _.cloneDeep(foundItem);
                        const clonedOperationDetails = _.cloneDeep(operationDetails);

                        clonedFoundItem.possibleValues = value;
                        clonedOperationDetails.operationRequest.headers[foundItemIndex] = clonedFoundItem;

                        return clonedOperationDetails;
                    }
                } else {
                    const responseData = getResponseData(operationDetails);
                    const responseIndex = getResponseIndex(operationDetails);

                    let foundItem = responseData.headers.find((x) => x.name === item.name);
                    let foundItemIndex = responseData.headers.findIndex((x) => x.name === item.name);

                    if (foundItem) {
                        const clonedFoundItem = _.cloneDeep(foundItem);
                        const clonedOperationDetails = _.cloneDeep(operationDetails);
                        const clonedResponseData = _.cloneDeep(responseData);

                        clonedFoundItem.possibleValues = value;
                        clonedResponseData.headers[foundItemIndex] = clonedFoundItem;

                        clonedOperationDetails.operationResponse[responseIndex] = clonedResponseData;

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
                let foundItemIndex = operationDetails.operationRequest.headers.findIndex(
                    (x) => x?.sourceName === item?.sourceName,
                );

                if (foundItemIndex !== -1) {
                    let foundItem = operationDetails.operationRequest.headers[foundItemIndex];

                    const clonedFoundItem = _.cloneDeep(foundItem);
                    const clonedOperationDetails = _.cloneDeep(operationDetails);

                    clonedFoundItem.name = name;
                    clonedOperationDetails.operationRequest.headers[foundItemIndex] = clonedFoundItem;

                    return clonedOperationDetails;
                }
            } else {
                const responseData = getResponseData(operationDetails);
                const responseIndex = getResponseIndex(operationDetails);

                let foundItemIndex = responseData.headers.findIndex((x) => x?.sourceName === item?.sourceName);

                if (foundItemIndex !== -1) {
                    const clonedFoundItem = _.cloneDeep(responseData.headers[foundItemIndex]);
                    const clonedOperationDetails = _.cloneDeep(operationDetails);
                    const clonedResponseData = _.cloneDeep(responseData);

                    clonedFoundItem.name = name;
                    clonedResponseData.headers[foundItemIndex] = clonedFoundItem;

                    clonedOperationDetails.operationResponse[responseIndex] = clonedResponseData;

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
            let foundItemIndex = operationDetails.operationRequest.headers.findIndex((x) => {
                return x?.name === name && x?.sourceName !== item?.sourceName;
            });

            if (foundItemIndex !== -1) {
                nameExists = true;
            }
        } else {
            const responseIndex = getResponseIndex(operationDetails);

            if (responseIndex !== -1) {
                let foundItemIndex = operationDetails.operationResponse[responseIndex].headers.findIndex((x) => {
                    return x?.name === name && x?.sourceName !== item?.sourceName;
                });

                if (foundItemIndex !== -1) {
                    return true;
                }
            }
        }
        return nameExists;
    };

    const onRequiredUpdate = (item, value) => {
        setOperationDetails((operationDetails) => {
            if (request) {
                let foundItem = operationDetails.operationRequest.headers.find((x) => x.name === item.name);
                let foundItemIndex = operationDetails.operationRequest.headers.findIndex((x) => x.name === item.name);

                if (foundItem) {
                    const clonedFoundItem = _.cloneDeep(foundItem);
                    const clonedOperationDetails = _.cloneDeep(operationDetails);

                    clonedFoundItem.required = value;
                    clonedOperationDetails.operationRequest.headers[foundItemIndex] = clonedFoundItem;

                    return clonedOperationDetails;
                }
            } else {
                const responseData = getResponseData(operationDetails);
                const responseIndex = getResponseIndex(operationDetails);

                let foundItem = responseData.headers.find((x) => x.name === item.name);
                let foundItemIndex = responseData.headers.findIndex((x) => x.name === item.name);

                if (foundItem) {
                    const clonedFoundItem = _.cloneDeep(foundItem);
                    const clonedOperationDetails = _.cloneDeep(operationDetails);
                    const clonedResponseData = _.cloneDeep(responseData);

                    clonedFoundItem.required = value;

                    clonedResponseData.headers[foundItemIndex] = clonedFoundItem;
                    clonedOperationDetails.operationResponse[responseIndex] = clonedResponseData;

                    return clonedOperationDetails;
                }
            }
            return operationDetails;
        });
    };

    const getResponseData = (operation) => {
        return operation?.operationResponse?.find((item) => item.responseCode === responseCode);
    };

    const getResponseIndex = (operation) => {
        return operation?.operationResponse?.findIndex((item) => item.responseCode === responseCode);
    };

    return (
        <DropArea onItemDropped={itemDropped}>
            <TableContainer
                style={{
                    maxHeight: height > 750 ? '27vh' : height > 600 ? '30vh' : '20vh',
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
                            <TableCell align="left" style={{ padding: '0' }}>
                                <p className="text-overline2 text-neutral-gray4">POSSIBLE VALUES</p>
                            </TableCell>
                            <TableCell align="left" style={{ padding: '0' }}></TableCell>
                        </TableRow>
                    </TableHead>

                    {request && !_.isEmpty(operationData?.operationRequest?.headers) && (
                        <TableBody className="w-full max-h-6">
                            {operationData?.operationRequest?.headers?.map((row) => {
                                return (
                                    <Row
                                        key={row?.name}
                                        row={row}
                                        onItemDelete={itemDeleted}
                                        onDescriptionUpdate={(item, value) => {
                                            onDescriptionUpdate(item, value);
                                        }}
                                        onPossibleValuesUpdate={(item, value) => {
                                            onPossibleValuesUpdate(item, value);
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

                    {!request && !_.isEmpty(getResponseData(operationData).headers) && (
                        <TableBody className="w-full max-h-6">
                            {getResponseData(operationData).headers?.map((row) => {
                                return (
                                    <Row
                                        key={row?.name}
                                        row={row}
                                        onItemDelete={itemDeleted}
                                        onDescriptionUpdate={(item, value) => {
                                            onDescriptionUpdate(item, value);
                                        }}
                                        onPossibleValuesUpdate={(item, value) => {
                                            onPossibleValuesUpdate(item, value);
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
                </Table>
            </TableContainer>

            {request && _.isEmpty(operationData?.operationRequest?.headers) && (
                <div className="border-dashed p-3 bg-neutral-gray7 rounded-md border-2 m-2 flex flex-row justify-center">
                    <DragAndDropMessage isAttributeAllowed />
                </div>
            )}

            {!request && _.isEmpty(getResponseData(operationData)?.headers) && (
                <div className="border-dashed p-3 bg-neutral-gray7 rounded-md border-2 m-2 flex flex-row justify-center">
                    <DragAndDropMessage isColumnAllowed />
                </div>
            )}
        </DropArea>
    );
};

export default Headers;
