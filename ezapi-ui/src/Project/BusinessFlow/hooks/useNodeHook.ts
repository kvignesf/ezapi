import axios, { CancelTokenSource } from 'axios';
import _ from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { BusinessFlowContext } from '../BusinessFlowContext';
import { GetNodeAPIProps, Node, UpdateNodeAPIProps } from '../interfaces';
import { fetchNodeFromServer, updateNodeOnServer } from '../services';
import { MyReactFlowState, getInputNodeIdsFromNode } from '../store';
import { prepareAggregateCardFromNode } from '../transformers';

interface NodeHookProps {
    nodeId: string;
    getUpdatedNodeData: Function;
    collapse?: boolean;
}

const useNodeHook = ({ nodeId, getUpdatedNodeData, collapse = false }: NodeHookProps) => {
    const { projectId, operationId, useStore } = useContext(BusinessFlowContext);
    const updateNodeData = useStore((state: MyReactFlowState) => state.updateNodeData);

    const nodes = useStore((state: MyReactFlowState) => state.nodes);
    const edges = useStore((state: MyReactFlowState) => state.edges);

    const [node, setNode] = useState<Node | undefined>();

    const [isNodeDataLoaded, setIsNodeDataLoaded] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isUpdateNodeOnServerDone, setIsUpdateNodeOnServerDone] = useState<boolean>(true);

    const [intervalID, setIntervalID] = useState<number | undefined>();
    const [triggerNodeSaveOnServer, setTriggerNodeSaveOnServer] = useState<boolean>(false);

    function intervalManager(flag: boolean, callback?: Function, time?: number) {
        if (flag && callback && time) {
            if (intervalID) {
                clearTimeout(intervalID);
            }

            const newIntervalId = setTimeout(callback, time);
            setIntervalID(newIntervalId);
        } else {
            clearTimeout(intervalID);
        }
    }

    function loadNodeDataFromServer() {
        if (!isLoading) {
            setIsLoading(true);
            const loadNodeData = async () => {
                const getNodeData: GetNodeAPIProps = {
                    projectId,
                    operationId,
                    nodeId,
                };
                const latestNodeInfo = await fetchNodeFromServer(getNodeData);
                setNode(latestNodeInfo);
                setIsNodeDataLoaded(true);
                setIsLoading(false);
            };
            loadNodeData();
        }
    }

    function nodeSaveHandler() {
        if (triggerNodeSaveOnServer) {
            const source: CancelTokenSource = axios.CancelToken.source();
            const inputNodeIds = getInputNodeIdsFromNode(nodeId, edges);

            // eslint-disable-next-line no-underscore-dangle
            const _node: any = { ...nodes.find((node: Node) => node.id === nodeId) };
            _node.data = getUpdatedNodeData();

            const commonData = _.isEmpty(_node.data.commonData) ? {} : { ..._node.data.commonData };
            commonData.inputNodeIds = inputNodeIds;
            _node.data.commonData = commonData;

            const updatedNodeRequestData: UpdateNodeAPIProps = {
                card: prepareAggregateCardFromNode(_node, projectId, operationId),
                updateNodeData,
            };
            updateNodeOnServer(updatedNodeRequestData, source);
            setIsUpdateNodeOnServerDone(true);

            setTriggerNodeSaveOnServer(false);
            intervalID && clearTimeout(intervalID);
        }
    }

    function triggerDelayedNodeSaveOnServer(delayTime: number = 2000) {
        setIsUpdateNodeOnServerDone(false);
        intervalManager(
            true,
            () => {
                setTriggerNodeSaveOnServer(true);
            },
            delayTime,
        );
    }

    useEffect(() => {
        if (collapse && !isLoading) {
            loadNodeDataFromServer();
        }
    }, [collapse]);

    useEffect(() => {
        if (triggerNodeSaveOnServer) {
            nodeSaveHandler();
        }
    }, [triggerNodeSaveOnServer]);

    return {
        node,
        setNode,
        isLoading,
        isNodeDataLoaded,
        loadNodeDataFromServer,
        triggerNodeSaveOnServer,
        setTriggerNodeSaveOnServer,
        triggerDelayedNodeSaveOnServer,
        isUpdateNodeOnServerDone,
    };
};

export default useNodeHook;
