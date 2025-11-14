import { PrimaryButton, TextButton } from '@/shared/components/AppButton';
import AppIcon from '@/shared/components/AppIcon';
import { operationAtomWithMiddleware } from '@/shared/utils';
import CloseIcon from '@material-ui/icons/Close';
import { Box, Checkbox, FormControlLabel } from '@mui/material';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import LoaderWithMessage from '../../../../shared/components/LoaderWithMessage';

import { ConvertResponseData, structureBodyForMapping, structureFormData } from '../../businessFlowHelper';
import {
    getMappingData,
    getResponseMappingData,
    saveAggregateMappings,
    saveResponseMappings,
} from '../../businessFlowQueries';
import { NODE_TYPES } from '../../constants';
import {
    AggregateCard,
    AggregateMappingDataProps,
    AggregateMappingProps,
    MappingData,
    ResponseMappingDataProps,
    StructuredMappingData,
    TreeNode,
} from '../../interfaces';
import { fetchAllAggregateCards } from '../../services';
import { MappingResponse } from './MappingResponse';
import { MappingTree } from './MappingTree';

const getNodeId = (ref: string, index: number = 0) => {
    const refArray = ref.split('.');
    return refArray[index];
};

const prepareTreeNode = (card?: AggregateCard, selectedNodeCardType?: any) => {
    let currentNode: TreeNode = {
        id: '',
        name: 'parent',
        children: [],
        ref: '',
    };

    if (card) {
        currentNode = {
            id: card.id,
            name: card.name,
            children: [],
            ref: card.id,
        };

        if (card.runData?.headers && card.runData?.headers.length > 0) {
            const structuredHeaders = structureFormData(card.runData?.headers, 'headers', card.id);
            currentNode.children.push(structuredHeaders);
        }

        if (card.runData?.queryParams && card.runData?.queryParams.length > 0) {
            const structuredQueryParams = structureFormData(card.runData?.queryParams, 'queryParams', card.id);
            currentNode.children.push(structuredQueryParams);
        }

        if (card.runData?.pathParams && card.runData?.pathParams.length > 0) {
            const structuredPathParams = structureFormData(card.runData?.pathParams, 'pathParams', card.id);
            currentNode.children.push(structuredPathParams);
        }

        if (card.runData?.body && card.runData?.body.data) {
            const structuredBody = structureBodyForMapping(
                JSON.stringify(card.runData?.body?.data),
                'body',
                card.id,
                selectedNodeCardType,
            );
            currentNode.children.push(structuredBody);
        }
    }

    return currentNode;
};

export const AggregateMapping = ({
    onClose,
    nodeId,
    operationId,
    projectId,
    isResponse,
    inputNodeIds,
    selectedNodeCardType,
}: AggregateMappingProps) => {
    const [allCards, setAllCards] = useState<AggregateCard[]>([]);
    const [currentNodeData, setCurrentNodeData] = useState<TreeNode>();
    const [parentNodeData, setParentNodeData] = useState<TreeNode[]>();
    const [selectedNode, setSelectedNode] = useState<TreeNode>();
    const [isLoading, setIsLoading] = useState(true);

    const [selectedParent, setSelectedParent] = useState<TreeNode>();
    const [selectedData, setSelectedData] = useState<MappingData[]>([]);
    const [triggerUpdate, setTriggerUpdate] = useState(true);
    const [isCheckedBearer, setIsCheckedBearer] = useState(false);

    const operationState = useRecoilValue(operationAtomWithMiddleware);

    useEffect(() => {
        const size = selectedData.length;

        if (size > 0) {
            const data = selectedData[size - 1];
            if (selectedNode && selectedNode.ref) {
                data.id = getNodeId(selectedNode.ref, 0);
                data.parent = getNodeId(selectedNode.ref, 1);
                data.name = selectedNode.name;
                data.type = selectedNode.type ?? '';
                data.ref = selectedNode.ref ?? '';
            }

            if (selectedParent && selectedParent.ref) {
                const id = getNodeId(selectedParent.ref, 0);
                data.relationParent = getNodeId(selectedParent.ref, 1);
                data.relationName = selectedParent.name;
                const nodeName = allCards.find((card: AggregateCard) => card.id === id)?.name;
                data.relationNode = nodeName ?? 'node';
                data.relationId = id;
                data.relationRef = selectedParent.ref;
            }

            selectedData[size - 1] = data;
            setSelectedData(selectedData);
            setTriggerUpdate(!triggerUpdate);
            setSelectedNode(undefined);
            setSelectedParent(undefined);
        }
    }, [selectedNode, selectedParent]);

    const prepareData = async (selectedNodeCardType: any) => {
        const allCardsDataFromServer: AggregateCard[] = await fetchAllAggregateCards({ operationId, projectId });
        if (isResponse) {
            const mappingData = await getResponseMappingData(operationId, projectId);
            if (mappingData && mappingData.data && !_.isEmpty(mappingData.data)) {
                let mappingResponseData: MappingData[] = [];

                if (mappingData.data.responseHeaders.length > 0) {
                    mappingData.data.responseHeaders.map((item: StructuredMappingData) => {
                        let itemData: MappingData = {
                            parent: '',
                            id: '',
                            ref: '',
                            relationRef: '',
                            relationId: '',
                            name: '',
                            relationName: '',
                            relationNode: '',
                            relationParent: '',
                        };
                        const mappedCardData = allCardsDataFromServer?.find(
                            (card: AggregateCard) => card.id === item.mappedAttributeAPI,
                        );

                        itemData.id = item.attributeAPI ?? '';
                        itemData.parent = item.attributeType ?? '';
                        itemData.name = item.attributeName ?? '';
                        itemData.ref = item.attributeRef ?? '';
                        itemData.relationRef = item.mappedAttributeRef ?? '';
                        itemData.relationId = item.mappedAttributeAPI ?? '';
                        itemData.relationName = item.mappedAttributeName ?? '';
                        itemData.relationNode = mappedCardData?.name ?? 'op/ ' + operationState.operation.operationName;
                        itemData.relationParent = item.mappedAttributeType ?? '';
                        mappingResponseData.push(itemData);
                    });
                }

                if (mappingData.data.responseBody.length > 0) {
                    mappingData.data.responseBody.map((item: StructuredMappingData) => {
                        let itemData: MappingData = {
                            parent: '',
                            ref: '',
                            relationRef: '',
                            id: '',
                            relationId: '',
                            name: '',
                            relationName: '',
                            relationNode: '',
                            relationParent: '',
                        };
                        const mappedCardData = allCardsDataFromServer?.find(
                            (card: AggregateCard) => card.id === item.mappedAttributeAPI,
                        );

                        itemData.id = item.attributeAPI ?? '';
                        itemData.parent = item.attributeType ?? '';
                        itemData.name = item.attributeName ?? '';
                        itemData.relationId = item.mappedAttributeAPI ?? '';
                        itemData.ref = item.attributeRef ?? '';
                        itemData.relationRef = item.mappedAttributeRef ?? '';
                        itemData.relationName = item.mappedAttributeName ?? '';
                        itemData.relationNode = mappedCardData?.name ?? 'op/ ' + operationState.operation.operationName;
                        itemData.relationParent = item.mappedAttributeType ?? '';
                        mappingResponseData.push(itemData);
                    });
                }
                setSelectedData(mappingResponseData);
            }
            const parentNode: TreeNode[] = [];

            const filteredAggregateCards = allCardsDataFromServer?.filter(
                (card: AggregateCard) =>
                    card.type === NODE_TYPES.EXTERNAL_API_NODE || card.type === NODE_TYPES.EXTERNAL_API_NODE_LOOP,
            );
            setAllCards(filteredAggregateCards);
            filteredAggregateCards.forEach((card: AggregateCard) => {
                const currentNode: TreeNode = {
                    id: card.id,
                    name: card.name ?? 'parent',
                    children: [],
                    ref: card.id,
                };

                if (card.runData?.output && card.runData?.output.data) {
                    const structuredOutput = structureBodyForMapping(
                        JSON.stringify(card.runData?.output?.data),
                        'output',
                        card.id,
                        selectedNodeCardType,
                    );
                    currentNode.children.push(structuredOutput);
                }
                parentNode.push(currentNode);
            });

            setParentNodeData(parentNode);

            if (operationState && operationState.operationResponse) {
                const superNode: TreeNode = {
                    id: 'rootNode',
                    name: 'op/ ' + operationState.operation.operationName,
                    children: [],
                    ref: operationState.operation.operationName,
                };
                operationState.operationResponse.forEach((operation) => {
                    const unitNode: TreeNode = {
                        id: operation.responseCode.toString(),
                        name: `Response- ${operation.responseCode}`,
                        children: [],
                        ref: `Response- ${operation.responseCode}`,
                    };
                    const bodyData = ConvertResponseData(operation.body, 'body', unitNode.ref);
                    unitNode.children.push(bodyData);
                    const headerData = ConvertResponseData(operation.headers, 'headers', unitNode.ref);
                    unitNode.children.push(headerData);
                    superNode.children.push(unitNode);
                });
                setCurrentNodeData(superNode);
            }
        } else {
            const currentAggregateCard = allCardsDataFromServer?.find((card: AggregateCard) => card.id === nodeId);
            const filteredAggregateCards = allCardsDataFromServer?.filter((card: AggregateCard) =>
                inputNodeIds.includes(card.id),
            );

            setAllCards(filteredAggregateCards);

            // const cardData = await getAggregateCard(nodeId, operationId, projectId);
            const mappingData = await getMappingData(nodeId, operationId, projectId);

            const parentNode: TreeNode[] = [];

            if (mappingData && mappingData.data && !_.isEmpty(mappingData.data)) {
                let mappingResponseData: MappingData[] = [];

                if (mappingData.data.relationsParams.length > 0) {
                    mappingData.data.relationsParams.map((item: StructuredMappingData) => {
                        let itemData: MappingData = {
                            parent: '',
                            id: '',
                            relationId: '',
                            ref: '',
                            relationRef: '',
                            name: '',
                            relationName: '',
                            relationNode: '',
                            relationParent: '',
                        };
                        const mappedCardData = allCardsDataFromServer?.find(
                            (card: AggregateCard) => card.id === item.mappedAttributeAPI,
                        );

                        itemData.id = item.attributeAPI ?? '';
                        itemData.parent = item.attributeType ?? '';
                        itemData.name = item.attributeName ?? '';
                        itemData.ref = item.attributeRef ?? '';
                        itemData.relationRef = item.mappedAttributeRef ?? '';
                        itemData.relationId = item.mappedAttributeAPI ?? '';
                        itemData.relationName = item.mappedAttributeName ?? '';
                        itemData.relationNode = mappedCardData?.name ?? 'op/ ' + operationState.operation.operationName;
                        itemData.relationParent = item.mappedAttributeType ?? '';
                        mappingResponseData.push(itemData);
                    });
                }

                if (mappingData.data.relationsHeaders.length > 0) {
                    mappingData.data.relationsHeaders.map((item: StructuredMappingData) => {
                        let itemData: MappingData = {
                            parent: '',
                            id: '',
                            ref: '',
                            relationRef: '',
                            relationId: '',
                            name: '',
                            relationName: '',
                            relationNode: '',
                            relationParent: '',
                        };
                        const mappedCardData = allCardsDataFromServer?.find(
                            (card: AggregateCard) => card.id === item.mappedAttributeAPI,
                        );
                        itemData.id = item.attributeAPI ?? '';
                        itemData.parent = item.attributeType ?? '';
                        itemData.name = item.attributeName ?? '';
                        itemData.relationRef = item.mappedAttributeRef ?? '';
                        itemData.bearer = item.bearer ?? false;
                        setIsCheckedBearer(item.bearer ?? false);
                        itemData.ref = item.attributeRef ?? '';
                        itemData.relationId = item.mappedAttributeAPI ?? '';
                        itemData.relationName = item.mappedAttributeName ?? '';
                        itemData.relationNode = mappedCardData?.name ?? 'op/ ' + operationState.operation.operationName;
                        itemData.relationParent = item.mappedAttributeType ?? '';
                        mappingResponseData.push(itemData);
                    });
                }

                if (mappingData.data.relationsRequestBody.length > 0) {
                    mappingData.data.relationsRequestBody.map((item: StructuredMappingData) => {
                        let itemData: MappingData = {
                            parent: '',
                            ref: '',
                            relationRef: '',
                            id: '',
                            relationId: '',
                            name: '',
                            relationName: '',
                            relationNode: '',
                            relationParent: '',
                        };
                        const mappedCardData = allCardsDataFromServer?.find(
                            (card: AggregateCard) => card.id === item.mappedAttributeAPI,
                        );
                        itemData.id = item.attributeAPI ?? '';
                        itemData.parent = item.attributeType ?? '';
                        itemData.name = item.attributeName ?? '';
                        itemData.ref = item.attributeRef ?? '';
                        itemData.relationRef = item.mappedAttributeRef ?? '';
                        itemData.relationId = item.mappedAttributeAPI ?? '';
                        itemData.relationName = item.mappedAttributeName ?? '';
                        itemData.relationNode = mappedCardData?.name ?? 'op/ ' + operationState.operation.operationName;
                        itemData.relationParent = item.mappedAttributeType ?? '';
                        mappingResponseData.push(itemData);
                    });
                }

                setSelectedData(mappingResponseData);
            }

            // set left hand side tree
            setCurrentNodeData(prepareTreeNode(currentAggregateCard, selectedNodeCardType));

            // set right hand side tree
            filteredAggregateCards.forEach((aggregateCard: any) => {
                const currentNode = prepareTreeNode(aggregateCard, selectedNodeCardType);

                if (aggregateCard.id !== nodeId) {
                    if (aggregateCard?.runData?.output && aggregateCard?.runData?.output.data) {
                        const structuredOutput = structureBodyForMapping(
                            JSON.stringify(aggregateCard?.runData?.output?.data),
                            'output',
                            aggregateCard.id,
                            selectedNodeCardType,
                        );
                        currentNode.children.push(structuredOutput);
                    }
                    parentNode.push(currentNode);
                }
            });

            if (operationState && operationState.operationRequest) {
                const superNode: TreeNode = {
                    id: 'rootNode',
                    name: 'op/ ' + operationState.operation.operationName,
                    children: [],
                    ref: operationState.operation.operationName,
                };

                const unitNode: TreeNode = {
                    id: `Request`,
                    name: `Request`,
                    children: [],
                    ref: `Request`,
                };

                if (operationState.operation.operationType !== 'GET') {
                    const bodyData = ConvertResponseData(operationState.operationRequest.body, 'body', unitNode.ref);
                    unitNode.children.push(bodyData);
                }
                const headerData = ConvertResponseData(
                    operationState.operationRequest.headers,
                    'headers',
                    unitNode.ref,
                );
                const pathParamsData = ConvertResponseData(
                    operationState.operationRequest.pathParams,
                    'pathParams',
                    unitNode.ref,
                );
                const queryParamsData = ConvertResponseData(
                    operationState.operationRequest.queryParams,
                    'queryParams',
                    unitNode.ref,
                );
                unitNode.children.push(headerData);
                unitNode.children.push(pathParamsData);
                unitNode.children.push(queryParamsData);
                superNode.children.push(unitNode);

                parentNode.push(superNode);
            }

            setParentNodeData(parentNode);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        prepareData(selectedNodeCardType ?? '')
            .then(() => {
                setIsLoading(false);
            })
            .catch((error) => {
                console.log(error);
            });
    }, []);

    return (
        <div
            style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
            className="flex flex-col"
        >
            <div className="p-4 border-b-1 flex flex-row justify-between">
                <p className="text-subtitle1">Mapping</p>
                {/*@ts-ignore */}
                <AppIcon onClick={() => onClose('cancel')}>
                    {/*@ts-ignore */}
                    <CloseIcon />
                </AppIcon>
            </div>

            {isLoading ? (
                <LoaderWithMessage message="Loading data" />
            ) : (
                <div
                    style={{
                        flexGrow: 1,
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'row',
                        padding: '16px',
                        flexWrap: 'nowrap',
                    }}
                >
                    <div style={{ flex: '20%', marginRight: '16px' }}>
                        <p className="text-neutral-gray2 mb-4" style={{ marginRight: '12px', fontWeight: 600 }}>
                            Current Node
                        </p>
                        {currentNodeData && (
                            <MappingTree
                                disable={selectedData.length === 0}
                                data={currentNodeData}
                                onSelect={(data: TreeNode) => {
                                    setSelectedNode(data);
                                }}
                            />
                        )}
                    </div>
                    <div style={{ flex: '60%', margin: '0 16px' }}>
                        <p className="text-neutral-gray2 mb-4" style={{ marginRight: '12px', fontWeight: 600 }}>
                            Map Response Element
                        </p>
                        <MappingResponse
                            key={'mapping-response'}
                            data={selectedData}
                            onDelete={(dataAfterDelete: MappingData[]) => {
                                setSelectedData(dataAfterDelete);
                            }}
                            onAdd={() => {
                                const newData = selectedData;
                                newData.push({
                                    parent: '',
                                    id: '',
                                    relationId: '',
                                    name: '',
                                    ref: '',
                                    relationRef: '',
                                    relationName: '',
                                    relationNode: '',
                                    relationParent: '',
                                    type: '',
                                });
                                setSelectedData(newData);
                                setTriggerUpdate(!triggerUpdate);
                            }}
                        />
                    </div>
                    <div style={{ flex: '20%', marginLeft: '16px' }}>
                        <p className="text-neutral-gray2 mb-4" style={{ marginRight: '12px', fontWeight: 600 }}>
                            Aggregate API
                        </p>
                        {parentNodeData && (
                            <MappingTree
                                // key={`${selectedData.length} + ${triggerUpdate}`}
                                disable={selectedData.length === 0}
                                data={parentNodeData}
                                isCurrentNode={false}
                                onSelect={(data: TreeNode) => {
                                    setSelectedParent(data);
                                }}
                            />
                        )}
                    </div>
                </div>
            )}

            <div className="p-4 border-t-1 flex flex-row justify-between" style={{ flexShrink: 0 }}>
                {/*@ts-ignore */}

                <TextButton
                    onClick={() => {
                        onClose('cancel');
                    }}
                >
                    Cancel
                </TextButton>
                <Box display="flex" alignItems="center">
                    {selectedData.some((item) => item.name === 'Authorization') ? (
                        <>
                            <label style={{ fontWeight: 'bold', marginRight: '20px' }}>
                                Add Bearer prefix to Authorization value
                            </label>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={isCheckedBearer}
                                        onChange={(event) => {
                                            const checked = event.target.checked;
                                            setIsCheckedBearer(checked);
                                            setSelectedData(
                                                selectedData.map((item) => {
                                                    if (item.name === 'Authorization') {
                                                        return {
                                                            ...item,
                                                            bearer: checked,
                                                        };
                                                    }
                                                    return item;
                                                }),
                                            );
                                        }}
                                    />
                                }
                                label=""
                            />
                        </>
                    ) : (
                        // This is the "ghost" element that maintains the layout's spacing Authorization is not there
                        <div style={{ visibility: 'hidden' }}>
                            <label style={{ fontWeight: 'bold', marginRight: '20px' }}>Placeholder</label>
                            <FormControlLabel control={<Checkbox checked={false} />} label="" />
                        </div>
                    )}
                </Box>

                {/*@ts-ignore */}

                <PrimaryButton
                    disabled={
                        selectedData && selectedData.length > 0
                            ? selectedData[selectedData.length]?.name === '' ||
                              selectedData[selectedData.length]?.relationName === ''
                            : false
                    }
                    onClick={async () => {
                        if (
                            selectedData &&
                            (selectedData[selectedData.length]?.name !== '' ||
                                selectedData[selectedData.length]?.relationName !== '')
                        ) {
                            let structuredData: StructuredMappingData;

                            if (isResponse) {
                                const responseData: ResponseMappingDataProps = {
                                    projectId,
                                    operationId,
                                    responseHeaders: [],
                                    responseBody: [],
                                };
                                selectedData.map((unitData) => {
                                    structuredData = {
                                        relation: 'equals',
                                        attributeName: unitData.name,
                                        attributeAPI: '',
                                        attributeType: unitData.parent,
                                        attributeRef: unitData.ref,
                                        attributeDataType: unitData.type
                                            ? unitData.type === ''
                                                ? 'string'
                                                : unitData.type
                                            : 'string',
                                        mappedAttributeName: unitData.relationName,
                                        mappedAttributeType: unitData.relationParent,
                                        bearer: unitData.bearer,

                                        mappedAttributeRef: unitData.relationRef,
                                        mappedAttributeAPI: unitData.relationId,
                                        mappedAttributeDataType: 'string',
                                    };

                                    if (unitData.parent === 'headers') {
                                        responseData.responseHeaders.push(structuredData);
                                    }
                                    if (unitData.parent === 'body') {
                                        responseData.responseBody.push(structuredData);
                                    }
                                });

                                await saveResponseMappings(responseData);
                            } else {
                                const requestData: AggregateMappingDataProps = {
                                    projectId,
                                    operationId,
                                    cardId: nodeId,
                                    relationsParams: [],
                                    relationsRequestBody: [],
                                    relationsHeaders: [],
                                };
                                selectedData.map((unitData) => {
                                    structuredData = {
                                        relation: 'equals',
                                        attributeName: unitData.name,
                                        attributeAPI: unitData.id,
                                        attributeType: unitData.parent,
                                        attributeDataType: 'string',
                                        attributeRef: unitData.ref,
                                        mappedAttributeRef: unitData.relationRef,
                                        mappedAttributeName: unitData.relationName,
                                        mappedAttributeType: unitData.relationParent,
                                        mappedAttributeAPI: unitData.relationId,
                                        bearer: unitData.bearer,
                                        mappedAttributeDataType: 'string',
                                    };

                                    if (unitData.parent === 'headers') {
                                        requestData.relationsHeaders.push(structuredData);
                                    }

                                    if (unitData.parent === 'queryParams' || unitData.parent === 'pathParams') {
                                        requestData.relationsParams.push(structuredData);
                                    }

                                    if (unitData.parent === 'body') {
                                        requestData.relationsRequestBody.push(structuredData);
                                    }
                                });

                                await saveAggregateMappings(requestData);
                            }
                            onClose('save');
                        }
                    }}
                >
                    Save & Proceed
                </PrimaryButton>
            </div>
        </div>
    );
};
