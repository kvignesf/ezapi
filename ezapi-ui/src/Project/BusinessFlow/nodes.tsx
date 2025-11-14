import { Node } from './interfaces';

const defaultNodes: Node[] = [
    {
        id: 'main-node',
        type: 'mainNode',
        parentNode: '',
        data: {
            commonData: {
                name: 'Main',
                parentNode: '',
                nonDeletable: true,
            },
        },
        position: { x: 25, y: 25 },
    },
];

export default defaultNodes;
