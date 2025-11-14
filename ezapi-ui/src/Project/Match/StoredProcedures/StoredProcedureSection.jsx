import DragIndicatorIcon from '@material-ui/icons/DragIndicator';
import classNames from 'classnames';
import { useDrag } from 'react-dnd';
import Scrollbar from 'react-smooth-scrollbar';
import { useRecoilValue } from 'recoil';
import primaryAtom from '../../../shared/atom/primaryAtom';
import AppIcon from '../../../shared/components/AppIcon';
import { isArray, isObject, isSchema, operationAtomWithMiddleware, useCanEdit } from '../../../shared/utils';
import StoredProcedureItem from './StoredProcedureItem';

const StoredProcedureSection = ({ items, onItemClick, section, isAddClicked }) => {
    var storedProcedureObjectItem;
    if (section != 0) {
        storedProcedureObjectItem = items;
        if (section == 1) {
            storedProcedureObjectItem['draggedFrom'] = 'input';
        } else if (section == 2) {
            storedProcedureObjectItem['draggedFrom'] = 'output';
        }

        items = items?.data[section - 1];
    }
    // console.log(storedProcedureObjectItem);
    const operationState = useRecoilValue(operationAtomWithMiddleware);
    const primaryKeyRef = useRecoilValue(primaryAtom);
    const canEdit = useCanEdit();
    const [{ isDragging }, drag, dragPreview] = useDrag(
        () => ({
            type: 'drag_item',
            item: storedProcedureObjectItem,
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        }),
        [storedProcedureObjectItem],
    );
    return (
        <div
            className="flex flex-col"
            ref={canEdit() && section != 0 ? drag : null}
            style={{
                opacity: isDragging ? 0.5 : 1,
            }}
        >
            <div className="flex flex-row justify-start">
                {section != 0 && (
                    <AppIcon className="mr-1 opacity-50">
                        <DragIndicatorIcon
                            className={classNames({
                                'cursor-move': !isArray(items) && !isSchema(items) && !isObject(items) && canEdit(),
                            })}
                            style={{ height: '1.25rem' }}
                        />
                    </AppIcon>
                )}
                <p className="flex w-full text-overline2 mb-2 ">
                    {section == 0 ? 'Stored Procedures' : section == 1 ? 'Input' : 'Output'}
                </p>
                <p className=" text-overline2">{items?.length}</p>
            </div>

            {items && (
                <Scrollbar>
                    <div
                        style={{
                            height: !operationState?.operationIndex && items?.length > 0 ? `calc(100vh - 230px)` : null,
                            maxHeight: operationState?.operationIndex ? `calc(50vh - 180px)` : null,
                        }}
                    >
                        {items?.map((item, index) => {
                            return (
                                <StoredProcedureItem
                                    isAddClicked={isAddClicked}
                                    index={index}
                                    item={item}
                                    itemObject={storedProcedureObjectItem}
                                    section={section}
                                    primaryKey={primaryKeyRef}
                                    onItemClick2={(item) => {
                                        // console.log("inside draggable" + item);
                                        onItemClick(item);
                                    }}
                                />
                            );
                        })}
                    </div>
                </Scrollbar>
            )}
        </div>
    );
};

export default StoredProcedureSection;
