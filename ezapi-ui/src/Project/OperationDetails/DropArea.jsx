import { useDrop } from 'react-dnd';

const DropArea = ({ children, onItemDropped, state, ...rest }) => {
    const [{ isOver }, drop] = useDrop(
        () => ({
            accept: 'drag_item',
            drop: (item, monitor) => {
                // setUpdateData(!updateData);
                const didDrop = monitor.didDrop();
                if (didDrop) {
                    return;
                }
                onItemDropped(item, children);
            },
            // Props to collect
            collect: (monitor) => ({
                isOver: monitor.isOver(),
            }),
        }),
        [state],
    );

    return (
        <div ref={drop} style={{ opacity: isOver ? 0.6 : 1 }} {...rest}>
            {children}
        </div>
    );
};

export default DropArea;
