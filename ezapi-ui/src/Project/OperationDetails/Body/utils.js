import { useState } from 'react';

export const useExpandedIds = () => {
    const [expandedIds, setExpandedIds] = useState([]);

    const getExandedIds = () => expandedIds;

    return {
        getExandedIds,
        setExpandedIds,
    };
};
