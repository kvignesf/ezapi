import { Drawer } from '@material-ui/core';
import DragIndicatorIcon from '@material-ui/icons/DragIndicator';
import classNames from 'classnames';
import { useState } from 'react';
import { useDrag } from 'react-dnd';
import AppIcon from '../../shared/components/AppIcon';
import {
    isArray,
    isAttribute,
    isFullMatch,
    isNoMatch,
    isObject,
    isPartialMatch,
    isSchema,
    useCanEdit,
} from '../../shared/utils';
import AttributeIcon from '../../static/images/attribute.svg';
import SchemaIcon from '../../static/images/schema-icon.svg';
import AttributeDetails from '../AttributeDetails/AttributeDetails';
import SchemaDetails from '../SchemaDetails/SchemaDetails';

const DraggableSchemaMatchItem = ({ index, item, ...rest }) => {
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

    const showDetailsDialog = () => {
        if (isSchema(item)) {
            setDialog({
                show: true,
                type: 'show-schema-details',
            });
        } else if (isAttribute(item)) {
            setDialog({
                show: true,
                type: 'show-attribute-details',
            });
        }
    };

    const handleCloseDialog = () => {
        setDialog({
            show: false,
            type: null,
        });
    };

    return (
        <>
            <Drawer anchor={'right'} open={dialog?.show} onClose={handleCloseDialog}>
                {dialog?.type === 'show-attribute-details' && (
                    <AttributeDetails attribute={item} onClose={handleCloseDialog} />
                )}
                {dialog?.type === 'show-schema-details' && <SchemaDetails schema={item} onClose={handleCloseDialog} />}
            </Drawer>

            <div
                ref={canEdit() ? drag : null}
                style={{
                    opacity: isDragging ? 0.5 : 1,
                    cursor: (isArray(item) || isSchema(item) || isObject(item)) && canEdit() ? 'pointer' : null,
                }}
                className="p-2 mb-2 rounded-md bg-white flex flex-row items-center"
                {...rest}
            >
                <AppIcon className="mr-1 opacity-50">
                    <DragIndicatorIcon
                        className={classNames({
                            'cursor-move':
                                (isSchema(item) || isAttribute(item)) && !isArray(item) && !isObject(item) && canEdit(),
                        })}
                        style={{ height: '1.25rem' }}
                    />
                </AppIcon>

                <img
                    className="mr-2"
                    src={isArray(item) || isSchema(item) || isObject(item) ? SchemaIcon : AttributeIcon}
                    style={{ width: '24px', height: '24px' }}
                />

                <p className="flex-1 text-overline3 mr-2 overflow-ellipsis">
                    {item?.name} {isArray(item) ? ' [ ]' : ''}
                </p>

                <div
                    className={classNames('w-12 max-w-3 h-6 rounded-sm', {
                        'bg-brand-green': isFullMatch(item),
                        'bg-score-yellow': isPartialMatch(item),
                        'bg-score-red': isNoMatch(item),
                        'cursor-pointer': isAttribute(item) || isSchema(item),
                    })}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        showDetailsDialog();
                    }}
                />
            </div>
        </>
    );
};

export default DraggableSchemaMatchItem;
