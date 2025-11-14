import { PrimaryButton, TextButton } from '@/shared/components/AppButton';
import AppIcon from '@/shared/components/AppIcon';
import CloseIcon from '@material-ui/icons/Close';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { structureBodyForMapping } from '../../businessFlowHelper';
import useNodeHook from '../../hooks/useNodeHook';
import { AggregateCard, TreeNode } from '../../interfaces';
import { FilterData, FilterRowData } from '../../interfaces/aggregate-cards';
import { NodeData } from '../../interfaces/flow';
import { FilterDrawerProps } from '../../interfaces/mapping';
import { fetchAllAggregateCards } from '../../services';
import { prepareNodeFromAggregateCardResponse } from '../../transformers';
import { MappingTree } from './MappingTree';
import { FilterResponse } from './filterResponse';

/* const getNodeId = (ref: string, index: number = 0) => {
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

        if (card.runData?.output && card.runData?.output?.data) {
            const structuredOutput = structureBodyForMapping(
                JSON.stringify(card.runData?.output?.data),
                'output',
                card.id,
            );
            currentNode.children.push(structuredOutput);
        }
    }

    return currentNode;
}; */

export const FilterDrawer = ({ onClose, nodeId, operationId, projectId, type, inputNodeIds }: FilterDrawerProps) => {
    const [filterCardData, setFilterCardData] = useState<NodeData>();
    const [currentNodeData, setCurrentNodeData] = useState<TreeNode>();
    const [triggerUpdate, setTriggerUpdate] = useState(true);
    const [excludedFields, setExcludedFields] = useState<FilterRowData[]>([]);
    const [replacedFields, setReplacedFields] = useState<FilterRowData[]>([]);

    /* const { node, setTriggerNodeSaveOnServer, triggerDelayedNodeSaveOnServer } = useNodeHook({
        nodeId: nodeId,
        getUpdatedNodeData: getUpdatedNodeDataFn,
        collapse: false,
    });

    function getUpdatedNodeDataFn() {
        const newNodeData = (_.isEmpty(filterCardData) ? {} : filterCardData) as NodeData;

        return {
            ...newNodeData,
            filterData: {
                excludedFields,
                replacedFields,
                targetNodeId: '',
            },
        };
    }
    */

    const { setTriggerNodeSaveOnServer } = useNodeHook({
        nodeId: nodeId,
        getUpdatedNodeData: getUpdatedNodeDataFn,
        collapse: false,
    });

    function getUpdatedNodeDataFn() {
        const previousNodeData = (_.isEmpty(filterCardData) ? {} : filterCardData) as NodeData;
        const previousFilterNodeData = (
            _.isEmpty(previousNodeData?.filterData) ? {} : filterCardData?.filterData
        ) as FilterData;

        return {
            ...previousNodeData,
            filterData: {
                ...previousFilterNodeData,
                excludedFields,
                replacedFields,
            },
        };
    }

    const prepareData = async () => {
        const allCardsDataFromServer: AggregateCard[] = await fetchAllAggregateCards({ operationId, projectId });
        const previousAggregateCard = allCardsDataFromServer?.find(
            (card: AggregateCard) => card.id === inputNodeIds[0],
        );

        const currentAggregateCard = allCardsDataFromServer?.find((card: AggregateCard) => card.id === nodeId);

        if (currentAggregateCard && currentAggregateCard.filterData) {
            setExcludedFields(currentAggregateCard.filterData.excludedFields ?? []);
            setReplacedFields(currentAggregateCard.filterData.replacedFields ?? []);
        }
        const currentNode = prepareNodeFromAggregateCardResponse(currentAggregateCard);
        setFilterCardData(currentNode.data);

        if (previousAggregateCard?.runData?.output && previousAggregateCard?.runData?.output?.data) {
            const structuredOutput = structureBodyForMapping(
                JSON.stringify(previousAggregateCard?.runData?.output?.data),
                'output',
                previousAggregateCard.id,
                'filter',
            );
            setCurrentNodeData(structuredOutput);
        }
    };

    useEffect(() => {
        prepareData();
    }, []);

    useEffect(() => {
        let tempArr = JSON.parse(JSON.stringify(excludedFields));
        tempArr.forEach((item: any) => {
            if (!item.originalAttributeRef) item.originalAttributeRef = item.attributeRef;
            const re = /(.*)\.(\d+)\.(.*)/;
            if (item.iterateThroughArray) {
                item.newAttributeRef = item.attributeRef.replace(re, `$1[].$3`);

                item.attributeRef = item.newAttributeRef;
            } else {
                item.attributeRef = item.originalAttributeRef;
            }
        });
        if (!_.isEqual(excludedFields, tempArr)) {
            setExcludedFields(tempArr);
        }
    }, [triggerUpdate, excludedFields]);

    useEffect(() => {
        let tempArr = JSON.parse(JSON.stringify(replacedFields));
        tempArr.forEach((item: any) => {
            if (!item.originalAttributeRef) item.originalAttributeRef = item.attributeRef;
            const re = /(.*)\.(\d+)\.(.*)/;
            if (item.iterateThroughArray) {
                item.newAttributeRef = item.attributeRef.replace(re, `$1[].$3`);

                item.attributeRef = item.newAttributeRef;
            } else {
                item.attributeRef = item.originalAttributeRef;
            }
        });
        if (!_.isEqual(replacedFields, tempArr)) {
            setReplacedFields(tempArr);
        }
    }, [triggerUpdate, replacedFields]);

    return (
        <div
            style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
            className="flex flex-col"
        >
            <div className="p-4 border-b-1 flex flex-row justify-between">
                <p className="text-subtitle1">Filter</p>
                {/*@ts-ignore */}
                <AppIcon onClick={onClose}>
                    {/*@ts-ignore */}
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
                <div style={{ flex: '20%', marginRight: '16px' }}>
                    <p className="text-neutral-gray2 mb-4" style={{ marginRight: '12px', fontWeight: 600 }}>
                        Node Response
                    </p>
                    {currentNodeData && (
                        <MappingTree
                            disable={type === 'replace' ? replacedFields.length === 0 : excludedFields.length === 0}
                            data={currentNodeData}
                            onSelect={(value: TreeNode) => {
                                if (type === 'replace') {
                                    const size = replacedFields.length;
                                    if (size > 0) {
                                        const data = replacedFields[size - 1];
                                        data.attributeName = value.name;
                                        data.attributeRef = value.ref;
                                        data.attributeDataType = value.children.length > 0 ? 'object' : 'string';
                                        replacedFields[size - 1] = data;
                                        setReplacedFields(replacedFields);
                                        setTriggerUpdate(!triggerUpdate);
                                    }
                                } else {
                                    const size = excludedFields.length;
                                    if (size > 0) {
                                        const data = excludedFields[size - 1];
                                        data.attributeName = value.name;
                                        data.attributeRef = value.ref;
                                        data.attributeDataType = value.children.length > 0 ? 'object' : 'string';
                                        excludedFields[size - 1] = data;
                                        setExcludedFields(excludedFields);
                                        setTriggerUpdate(!triggerUpdate);
                                    }
                                }
                            }}
                        />
                    )}
                </div>
                <div style={{ flex: '60%', margin: '0 16px' }}>
                    {type === 'replace' ? (
                        <>
                            <p className="text-neutral-gray2 mb-4" style={{ marginRight: '12px', fontWeight: 600 }}>
                                Replaced Fields
                            </p>
                            <FilterResponse
                                key={`filter`}
                                data={replacedFields}
                                onDelete={(dataAfterDelete: FilterRowData[]) => {
                                    setReplacedFields(dataAfterDelete);
                                }}
                                onCheckbox={() => {
                                    setTriggerUpdate(!triggerUpdate);
                                }}
                                onAdd={() => {
                                    const newData = replacedFields;
                                    newData.push({
                                        attributeRef: '',
                                        attributeDataType: '',
                                        attributeName: '',
                                        iterateThroughArray: false,
                                    });
                                    setReplacedFields(newData);
                                    setTriggerUpdate(!triggerUpdate);
                                }}
                            />
                        </>
                    ) : (
                        <>
                            <p className="text-neutral-gray2 mb-4" style={{ marginRight: '12px', fontWeight: 600 }}>
                                Excluded Fields
                            </p>
                            <FilterResponse
                                key={`filter`}
                                data={excludedFields}
                                onDelete={(dataAfterDelete: FilterRowData[]) => {
                                    setExcludedFields(dataAfterDelete);
                                }}
                                onCheckbox={() => {
                                    setTriggerUpdate(!triggerUpdate);
                                }}
                                onAdd={() => {
                                    const newData = excludedFields;
                                    newData.push({
                                        attributeRef: '',
                                        attributeDataType: '',
                                        attributeName: '',
                                        iterateThroughArray: false,
                                    });
                                    setExcludedFields(newData);
                                    setTriggerUpdate(!triggerUpdate);
                                }}
                            />
                        </>
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
                    onClick={() => {
                        setTriggerNodeSaveOnServer(true);
                        onClose();
                    }}
                >
                    Save & Proceed
                </PrimaryButton>
            </div>
        </div>
    );
};
