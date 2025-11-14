import { PrimaryButton, TextButton } from '@/shared/components/AppButton';
import AppIcon from '@/shared/components/AppIcon';
import { operationAtomWithMiddleware } from '@/shared/utils';
import CloseIcon from '@material-ui/icons/Close';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ConvertResponseData, structureBodyForMapping, structureFormData } from '../../businessFlowHelper';
import useNodeHook from '../../hooks/useNodeHook';
import { AggregateCard, TreeNode } from '../../interfaces';
import { NodeData } from '../../interfaces/flow';
import { BranchQueryData } from '../../interfaces/mapping';
import { fetchAllAggregateCards } from '../../services';
import { prepareNodeFromAggregateCardResponse } from '../../transformers';
import { BranchQuery } from './BranchQuery';
import { MappingTree } from './MappingTree';

const getNodeId = (ref: string, index: number = 0) => {
    const refArray = ref.split('.');
    return refArray[index];
};

const prepareTreeNode = (card?: AggregateCard) => {
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
            const structuredBody = structureBodyForMapping(JSON.stringify(card.runData?.body?.data), 'body', card.id);
            currentNode.children.push(structuredBody);
        }
    }

    return currentNode;
};

interface BranchQuerySelectorProps {
    conditionId: string;
    onClose: Function;
    nodeId: string;
    operationId: string;
    projectId: string;
    inputNodeIds: string[];
}

export const BranchQuerySelector = ({
    conditionId,
    onClose,
    nodeId,
    operationId,
    projectId,
    inputNodeIds,
}: BranchQuerySelectorProps) => {
    const [branchCardData, setBranchCardData] = useState<NodeData>();
    const [treeData, setTreeData] = useState<TreeNode>();
    const [selectedLHSData, setSelectedLHSData] = useState<TreeNode>();
    const [selectedRHSData, setSelectedRHSData] = useState<TreeNode>();
    const [selectedData, setSelectedData] = useState<BranchQueryData[]>([]);
    const [triggerUpdate, setTriggerUpdate] = useState(true);
    const operationState = useRecoilValue(operationAtomWithMiddleware);
    const [detailedExpressionString, setDetailedExpressionString] = useState('');
    const [rawExpressionString, setRawExpressionString] = useState('');

    const { node, setTriggerNodeSaveOnServer, triggerDelayedNodeSaveOnServer } = useNodeHook({
        nodeId: nodeId,
        getUpdatedNodeData: getUpdatedNodeDataFn,
        collapse: false,
    });

    function getUpdatedNodeDataFn() {
        const newNodeData = (_.isEmpty(branchCardData) ? {} : branchCardData) as NodeData;

        if (newNodeData && newNodeData.branchData && newNodeData.branchData.conditions) {
            newNodeData.branchData?.conditions.map((condition, index) => {
                if (condition.conditionId === conditionId) {
                    condition.rawExpression = rawExpressionString;
                    condition.detailedExpression = detailedExpressionString;
                }
                newNodeData.branchData!.conditions[index] = condition;
            });
        }

        return newNodeData;
        // return { ...newNodeData, branchData: { conditions: branchConditions } };
    }

    useEffect(() => {
        if (rawExpressionString !== '' && detailedExpressionString !== '') {
            setTriggerNodeSaveOnServer(true);
            onClose();
        }
    }, [rawExpressionString, detailedExpressionString]);

    useEffect(() => {
        const size = selectedData.length;

        if (size > 0) {
            const data = selectedData[size - 1];

            if (selectedLHSData && selectedLHSData.ref) {
                const id = getNodeId(selectedLHSData.ref, 0);
                data.name = selectedLHSData.name;
                data.id = id;
                data.ref = selectedLHSData.ref;
            }

            if (selectedRHSData && selectedRHSData.ref) {
                const id = getNodeId(selectedRHSData.ref, 0);
                data.relationName = selectedRHSData.name;
                data.relationId = id;
                data.relationRef = selectedRHSData.ref;
                data.value = '';
            }

            selectedData[size - 1] = data;

            setSelectedData(selectedData);
            setTriggerUpdate(!triggerUpdate);
            setSelectedLHSData(undefined);
            setSelectedRHSData(undefined);
        }
    }, [selectedLHSData, selectedRHSData]);

    const transformDetailedExpression = (detailedString: string) => {
        const stringDataArray = detailedString.split(' ');
        let start = 1;
        let data: BranchQueryData[] = [];
        let structure = {
            id: '',
            relationId: '',
            name: '',
            ref: '',
            conditionKey: '',
            value: '',
            relationRef: '',
            relationName: '',
            operator: '',
        };
        stringDataArray.forEach((unitData) => {
            start++;
            if (start === 1) {
                structure.operator = unitData;
            } else if (start === 2) {
                structure.ref = unitData;
                const unitAtom = unitData.split('.');
                structure.id = unitAtom[0];
                structure.name = unitAtom[unitAtom.length - 1];
            } else if (start === 3) {
                structure.conditionKey = unitData;
            } else if (start === 4) {
                structure.relationRef = unitData;
                const unitAtom = unitData.split('.');
                if (unitAtom.length === 1) {
                    structure.value = unitData;
                } else if (unitAtom.length > 1) {
                    structure.relationId = unitAtom[0];
                    structure.relationName = unitAtom[unitAtom.length - 1];
                }

                const clonedStructure = _.cloneDeep(structure);
                data.push(clonedStructure);
                structure = {
                    id: '',
                    relationId: '',
                    name: '',
                    ref: '',
                    conditionKey: '',
                    value: '',
                    relationRef: '',
                    relationName: '',
                    operator: '',
                };
                start = 0;
            }
        });

        return data;
    };

    const prepareData = async () => {
        const allCardsDataFromServer: AggregateCard[] = await fetchAllAggregateCards({ operationId, projectId });
        const currentAggregateCard = allCardsDataFromServer?.find((card: AggregateCard) => card.id === nodeId);
        const node = prepareNodeFromAggregateCardResponse(currentAggregateCard);
        setBranchCardData(node.data);

        node.data.branchData?.conditions.forEach((condition) => {
            if (condition.conditionId === conditionId) {
                const QueryData = transformDetailedExpression(condition.detailedExpression);
                setSelectedData(QueryData);
            }
        });

        const filteredAggregateCards = allCardsDataFromServer?.filter((card: AggregateCard) =>
            inputNodeIds.includes(card.id),
        );

        const parentNode: TreeNode = {
            id: 'parent-root',
            name: 'parent-root',
            children: [],
            ref: '',
        };

        // set tree data
        filteredAggregateCards.forEach((aggregateCard: any) => {
            const currentNode = prepareTreeNode(aggregateCard);

            if (aggregateCard.id !== nodeId) {
                if (aggregateCard?.runData?.output && aggregateCard?.runData?.output.data) {
                    const structuredOutput = structureBodyForMapping(
                        JSON.stringify(aggregateCard?.runData?.output?.data),
                        'output',
                        aggregateCard.id,
                        'branch',
                    );
                    currentNode.children.push(structuredOutput);
                }
                parentNode.children.push(currentNode);
            }
        });

        if (operationState && operationState.operationRequest) {
            const superNode: TreeNode = {
                id: 'rootNode',
                name: operationState.operation.operationName,
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
            const headerData = ConvertResponseData(operationState.operationRequest.headers, 'headers', unitNode.ref);
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
            parentNode.children.push(superNode);
        }

        setTreeData(parentNode);
    };

    useEffect(() => {
        prepareData();
    }, []);

    return (
        <div
            style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
            className="flex flex-col"
        >
            <div className="p-4 border-b-1 flex flex-row justify-between">
                <p className="text-subtitle1">Branch Query</p>
                {/*@ts-ignore */}
                <AppIcon
                    onClick={() => {
                        onClose();
                    }}
                >
                    <CloseIcon />
                </AppIcon>
            </div>
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
                <div style={{ flexBasis: '0', flexGrow: 1, maxWidth: '300px', marginRight: '16px' }}>
                    <p className="text-neutral-gray2 mb-4" style={{ marginRight: '12px', fontWeight: 600 }}>
                        Aggregate API
                    </p>
                    {treeData && (
                        <MappingTree
                            disable={selectedData.length === 0}
                            data={treeData}
                            onSelect={(data: TreeNode) => {
                                setSelectedLHSData(data);
                            }}
                        />
                    )}
                </div>
                <div style={{ flexBasis: '0', flexGrow: 2, margin: '0 16px' }}>
                    <p className="text-neutral-gray2 mb-4" style={{ marginRight: '12px', fontWeight: 600 }}>
                        Query
                    </p>
                    <BranchQuery
                        key={'query'}
                        data={selectedData}
                        onUpdate={(dataAfterUpdate: BranchQueryData[]) => {
                            setSelectedData(dataAfterUpdate);
                        }}
                        onAdd={() => {
                            const newData = selectedData;
                            newData.push({
                                id: '',
                                relationId: '',
                                name: '',
                                ref: '',
                                conditionKey: '>',
                                value: '',
                                relationRef: '',
                                relationName: '',
                                operator: '&&',
                            });
                            setSelectedData(newData);
                            setTriggerUpdate(!triggerUpdate);
                        }}
                    />
                </div>
                <div style={{ flexBasis: '0', flexGrow: 1, maxWidth: '300px', marginLeft: '16px' }}>
                    <p className="text-neutral-gray2 mb-4" style={{ marginRight: '12px', fontWeight: 600 }}>
                        Aggregate API
                    </p>
                    {treeData && (
                        <MappingTree
                            key={`${selectedData.length} + ${triggerUpdate}`}
                            disable={selectedData.length === 0}
                            data={treeData}
                            isCurrentNode={false}
                            onSelect={(data: TreeNode) => {
                                setSelectedRHSData(data);
                            }}
                        />
                    )}
                </div>
            </div>

            <div className="p-4 border-t-1 flex flex-row justify-between" style={{ flexShrink: 0 }}>
                {/*@ts-ignore */}

                <TextButton
                    onClick={() => {
                        onClose();
                    }}
                >
                    Cancel
                </TextButton>

                {/*@ts-ignore */}

                <PrimaryButton
                    disabled={
                        selectedData && selectedData.length > 0
                            ? selectedData[selectedData.length]?.name === '' ||
                              selectedData[selectedData.length]?.relationName === ''
                            : false
                    }
                    onClick={() => {
                        if (selectedData.length > 0) {
                            let conditionString = '';
                            let detailedString = '';
                            selectedData.forEach((value, index) => {
                                if (index === 0) {
                                    if (value.relationId === '') {
                                        detailedString = value.ref + ' ' + value.conditionKey + ' ' + value.value;

                                        conditionString = value.name + ' ' + value.conditionKey + ' ' + value.value;
                                    } else {
                                        detailedString = value.ref + ' ' + value.conditionKey + ' ' + value.relationRef;

                                        conditionString =
                                            value.name + ' ' + value.conditionKey + ' ' + value.relationName;
                                    }
                                } else {
                                    if (value.relationId === '') {
                                        conditionString =
                                            conditionString +
                                            ' ' +
                                            value.operator +
                                            ' ' +
                                            value.name +
                                            ' ' +
                                            value.conditionKey +
                                            ' ' +
                                            value.value;

                                        detailedString =
                                            detailedString +
                                            ' ' +
                                            value.operator +
                                            ' ' +
                                            value.ref +
                                            ' ' +
                                            value.conditionKey +
                                            ' ' +
                                            value.value;
                                    } else {
                                        conditionString =
                                            conditionString +
                                            ' ' +
                                            value.operator +
                                            ' ' +
                                            value.name +
                                            ' ' +
                                            value.conditionKey +
                                            ' ' +
                                            value.relationName;

                                        detailedString =
                                            detailedString +
                                            ' ' +
                                            value.operator +
                                            ' ' +
                                            value.ref +
                                            ' ' +
                                            value.conditionKey +
                                            ' ' +
                                            value.relationRef;
                                    }
                                }
                            });
                            setRawExpressionString(conditionString);
                            setDetailedExpressionString(detailedString);
                        }
                    }}
                >
                    Save & Proceed
                </PrimaryButton>
            </div>
        </div>
    );
};
