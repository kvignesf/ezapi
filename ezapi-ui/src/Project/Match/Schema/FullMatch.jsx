import Scrollbar from 'react-smooth-scrollbar';
import { useRecoilValue } from 'recoil';
import { operationAtomWithMiddleware } from '../../../shared/utils';
import DraggableSchemaMatchItem from '../DraggableSchemaMatchItem';

const FullMatch = ({ items, onItemClick }) => {
    const operationState = useRecoilValue(operationAtomWithMiddleware);

    return (
        <div className="flex flex-col">
            <div className="flex flex-row justify-between">
                <p className="text-overline2 mb-2">Full Match</p>
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
                                <DraggableSchemaMatchItem
                                    index={index}
                                    item={item}
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

export default FullMatch;
