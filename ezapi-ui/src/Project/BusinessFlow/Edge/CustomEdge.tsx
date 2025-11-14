import { BaseEdge, EdgeProps, getBezierPath } from 'reactflow';

function CustomEdge(props: EdgeProps) {
    const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props;

    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    console.log('CustomEdge.props', props);

    return <BaseEdge path={edgePath}></BaseEdge>;
}

export { CustomEdge };
