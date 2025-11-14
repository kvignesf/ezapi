import DragIndicatorIcon from '@material-ui/icons/DragIndicator';
import classNames from 'classnames';
import { useState } from 'react';
import { useDrag } from 'react-dnd';
import AppIcon from '../../../shared/components/AppIcon';
import {
    isArray,
    isArrayOfObject,
    isColumn,
    isDatabase,
    isMongoDb,
    isObject,
    isSchema,
    useCanEdit,
} from '../../../shared/utils';
import ArrayOfObjectsIcon from '../../../static/images/array-icon.svg';
import ArrayIcon from '../../../static/images/array.svg';
import ArrayIcon2 from '../../../static/images/array2.svg';
import AttributeIcon from '../../../static/images/attribute.svg';
import autoGenrateIcon from '../../../static/images/auto-generate.svg';
import collectionIcon from '../../../static/images/collection-icon.svg';
import ColumnIcon from '../../../static/images/column-icon.svg';
import ObjectIcon from '../../../static/images/object-icon.svg';
import TableIcon from '../../../static/images/table-icon.svg';

const DraggableDatabaseItem = ({ index, item, section, primaryKey, ...rest }) => {
    const [dialog, setDialog] = useState({
        show: false,
        type: null,
        data: null,
    });
    const [{ isDragging }, drag, dragPreview] = useDrag(
        () => ({
            type: 'drag_item',
            item: item,
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        }),
        [item],
    );
    const canEdit = useCanEdit();

    return (
        <>
            {/* <Drawer anchor={"right"} open={dialog?.show} onClose={handleCloseDialog}>
        {dialog?.type === "show-attribute-details" && (
          <AttributeDetails attribute={item} onClose={handleCloseDialog} />
        )}
        {dialog?.type === "show-schema-details" && (
          <SchemaDetails schema={item} onClose={handleCloseDialog} />
        )}
      </Drawer> */}

            <div
                ref={canEdit() ? drag : null}
                style={{
                    opacity: isDragging ? 0.5 : 1,
                    backgroundColor: isDatabase(item) && primaryKey.includes(item.name) ? '#FFB6C1' : 'white',
                    cursor: isDatabase(item) && canEdit() ? 'pointer' : null,
                }}
                className="p-2 mb-2 rounded-md flex flex-row items-center"
                {...rest}
            >
                <AppIcon className="mr-1 opacity-50">
                    <DragIndicatorIcon
                        className={classNames({
                            'cursor-move':
                                (isDatabase(item) || isColumn(item)) &&
                                !isArray(item) &&
                                !isSchema(item) &&
                                !isObject(item) &&
                                canEdit(),
                        })}
                        style={{ height: '1.25rem' }}
                    />
                </AppIcon>

                <img
                    className="mr-2"
                    src={
                        isDatabase(item)
                            ? TableIcon
                            : isColumn(item)
                            ? ColumnIcon
                            : isMongoDb(item)
                            ? collectionIcon
                            : isArrayOfObject(item)
                            ? ArrayOfObjectsIcon
                            : isObject(item)
                            ? ObjectIcon
                            : isArray(item) && !item.is_child
                            ? ArrayIcon
                            : isArray(item) && item.is_child
                            ? ArrayIcon2
                            : AttributeIcon
                    }
                    style={{ width: '24px', height: '24px' }}
                />

                <p className="flex-1 text-overline3 mr-2 overflow-ellipsis">{item?.name}</p>

                {item.auto && (
                    <img
                        className="mr-2"
                        src={item.auto ? autoGenrateIcon : null}
                        style={{ width: '24px', height: '24px' }}
                    />
                )}

                {/* <div
          className={classNames("w-12 max-w-3 h-6 rounded-sm", {
            "bg-brand-green": section === "1",
            "bg-score-yellow": section === "2",
            "bg-score-red": section === "3",
          })}
        /> */}
            </div>
        </>
    );
};

export default DraggableDatabaseItem;
