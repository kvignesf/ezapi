import _ from 'lodash';
import Scrollbar from 'react-smooth-scrollbar';
import { useRecoilValue } from 'recoil';
import primaryAtom from '../../../shared/atom/primaryAtom';
import { isColumn, isDatabase, isMongoDb, operationAtomWithMiddleware } from '../../../shared/utils';
import DraggableDatabaseItem from './DraggableDatabaseItem';

const DatabaseSection = ({ items, onItemClick, section }) => {
    const operationState = useRecoilValue(operationAtomWithMiddleware);
    const primaryKeyRef = useRecoilValue(primaryAtom);

    const isItemsTypeTable = () => {
        if (items && !_.isEmpty(items)) {
            const firstItem = items[0];

            if (isDatabase(firstItem)) {
                return 'Tables';
            } else if (isMongoDb(firstItem)) {
                return 'Collections';
            } else if (isColumn(firstItem)) {
                return 'Columns';
            } else {
                return 'Documents';
            }
        }
        return '-';
    };

    return (
        <div className="flex flex-col">
            <div className="flex flex-row justify-between">
                <p className="text-overline2 mb-2">{isItemsTypeTable()}</p>
                <p className="text-overline2">{items?.length}</p>
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
                                <DraggableDatabaseItem
                                    index={index}
                                    item={item}
                                    section={section}
                                    primaryKey={primaryKeyRef}
                                    onClick={(e) => {
                                        e?.preventDefault();
                                        e?.stopPropagation();

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

export default DatabaseSection;
