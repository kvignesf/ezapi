import { useState } from 'react';
import { useDrag } from 'react-dnd';
import { isColumn, useCanEdit } from '../../../shared/utils';

const DraggableBodyItem = ({ index, item, section, primaryKey, children, state, ...rest }) => {
    const [dialog, setDialog] = useState({
        show: false,
        type: null,
        data: null,
    });
    const [{ isDragging }, drag, dragPreview] = useDrag(
        () => ({
            type: 'drag_item',
            item: children,
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        }),
        [state],
    );
    const canEdit = useCanEdit();

    return (
        <>
            <div
                ref={canEdit() ? drag : null}
                style={{
                    opacity: isDragging ? 0.5 : 1,
                    backgroundColor: isColumn(item) ? '#FFB6C1' : 'white',
                    cursor: isColumn(item) && canEdit() ? 'pointer' : null,
                }}
                // className='p-2 mb-2 rounded-md flex flex-row items-center'
                {...rest}
            >
                {children}
            </div>
        </>
    );
};

export default DraggableBodyItem;
