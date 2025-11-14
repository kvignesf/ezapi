/* eslint-disable no-underscore-dangle */
//@ts-nocheck

import { Box, TextField } from '@mui/material';
import TreeSelect, { FreeSoloNode } from 'mui-tree-select';
// const sampleData = [
//     {
//         _id: '637b263781221f72cfbf1bf4',
//         resources: [
//             {
//                 _id: '637b2b86b3a799116fd00d53',
//                 resourceId: '9fb5524a-b653-4402-ae9e-27740cfd69e8',
//                 __v: 2,
//                 name: 'ds',
//                 operations: [
//                     {
//                         operationType: 'POST',
//                         operationId: '41d4b6d2-ec90-455e-8b44-3433d352fa7b',
//                         operationDescription: 'w',
//                         name: 'SR-test',
//                         pathName: 'sendData',
//                         pathId: 'K4Dv_8rgM',
//                     },
//                 ],
//             },
//         ],
//         name: 'entity_maping',
//     },
//     {
//         _id: '637b4c0fb3a799116fd00ff5',
//         resources: [
//             {
//                 _id: '637b4c6db3a799116fd01013',
//                 resourceId: 'efa48e64-4cbd-44a6-b950-0deb705ccccf',
//                 __v: 3,
//                 name: 'get',
//                 operations: [
//                     {
//                         operationType: 'POST',
//                         operationId: '6f63cc5f-7bac-49ab-9db5-112e37b8d2a5',
//                         operationDescription: 's',
//                         name: 'BikeStore',
//                         pathName: 'BikeStore',
//                         pathId: 'RwSU4mXAK',
//                     },
//                     {
//                         operationType: 'GET',
//                         operationId: 'f00fe28a-761d-4390-b684-e6badf07787e',
//                         operationDescription: 'ds',
//                         name: 'we',
//                         pathName: 'BikeStore',
//                         pathId: 'RwSU4mXAK',
//                     },
//                 ],
//             },
//         ],
//         name: 'entity',
//     },
//     {
//         _id: '637b7563b3a799116fd01477',
//         resources: [
//             {
//                 _id: '637b7614b3a799116fd014a5',
//                 resourceId: '52507dc8-be15-4877-bda1-3e4cca86549e',
//                 __v: 2,
//                 name: 'BikeStore',
//                 operations: [
//                     {
//                         operationType: 'GET',
//                         operationId: '9905c12e-9422-4c5e-8d16-ce706b54afb1',
//                         operationDescription: 'q',
//                         name: 'cd_plan_codes',
//                         pathName: 'SR-test',
//                         pathId: 'jJ6kpwsb3',
//                     },
//                 ],
//             },
//         ],
//         name: 'projectwithpassword',
//     },
//     {
//         _id: '637da6e2f4b6c730d3c8b0d2',
//         resources: [
//             {
//                 _id: '637da728f4b6c730d3c8b0ee',
//                 resourceId: '46612972-16b5-46bc-96a4-b463b62b9187',
//                 __v: 2,
//                 name: 'SR-test',
//                 operations: [
//                     {
//                         operationType: 'POST',
//                         operationId: '7b71d57b-2f88-450a-abde-756f69fcc6f4',
//                         operationDescription: 'd',
//                         name: 'SR-test',
//                         pathName: 'cd_plan_codes',
//                         pathId: 'wdyaaCY6O',
//                     },
//                 ],
//             },
//         ],
//         name: 'newentity',
//     },
//     {
//         _id: '637dac48f4b6c730d3c8b1e4',
//         resources: [
//             {
//                 _id: '637dac62f4b6c730d3c8b200',
//                 resourceId: 'aea5cf81-c638-4afc-bdc9-98aed2980f66',
//                 __v: 2,
//                 name: 'SR-test',
//                 operations: [
//                     {
//                         operationType: 'GET',
//                         operationId: 'fe41e0c5-ea9c-4b63-a6be-e6fadc37bdfc',
//                         operationDescription: 'this is for test',
//                         name: 'SR-test',
//                         pathName: 'get-data',
//                         pathId: 'NYqIhx4am',
//                     },
//                 ],
//             },
//         ],
//         name: 'test',
//     },
//     {
//         _id: '637dd9dd50a6fc607c89b3b7',
//         resources: [
//             {
//                 _id: '637dd9eb50a6fc607c89b3d3',
//                 resourceId: 'f89f9383-dfe3-4671-a31f-88e2edf0c09c',
//                 __v: 2,
//                 name: 'SR-test',
//                 operations: [
//                     {
//                         operationType: 'GET',
//                         operationId: '5eab8343-b343-4311-8d70-075d61335d06',
//                         operationDescription: 's',
//                         name: 'get-data',
//                         pathName: 'BikeStore',
//                         pathId: 'hfpKHLVmW',
//                     },
//                 ],
//             },
//         ],
//         name: 'test2',
//     },
// ];

class Node {
    constructor(value) {
        this.value = value;
    }
    getParent(sampleData) {
        const parent = (() => {
            if ('resources' in this.value) {
                return null;
            } else if ('operations' in this.value) {
                return sampleData.find(({ resources }) => resources.some(({ _id }) => _id === this.value._id)) || null;
            } else {
                for (const { resources } of sampleData) {
                    const resource = resources.find(({ operations }) =>
                        operations.some(({ _id }) => _id === this.value._id),
                    );
                    if (resource) {
                        return resource;
                    }
                }
                return null;
            }
        })();
        return parent ? new Node(parent) : parent;
    }
    getChildren() {
        if ('resources' in this.value) {
            return this.value.resources.map((resource) => new Node(resource));
        } else if ('operations' in this.value) {
            return this.value.operations.map((operation) => new Node(operation));
        } else {
            return null;
        }
    }
    isBranch() {
        return 'resources' in this.value || 'operations' in this.value;
    }
    isEqual(to) {
        return to.value._id === this.value._id;
    }
    toString() {
        if (this.value.operationType && this.value.pathName) {
            return ' [ ' + this.value.operationType + ' ] ' + this.value.pathName + ' / ' + this.value.name;
        }
        return this.value.name;
    }
}

const Sample = ({ sampleData }) => {
    return (
        <div style={{ width: 480 }}>
            <TreeSelect
                getChildren={(node) => (node ? node.getChildren() : sampleData.map((country) => new Node(country)))}
                getOptionDisabled={(option) => {
                    var a;
                    return (
                        option.isBranch() && !((a = option.getChildren()) === null || a === void 0 ? void 0 : a.length)
                    );
                }}
                getParent={(node) => node.getParent(sampleData)}
                isBranch={(node) => node.isBranch()}
                isOptionEqualToValue={(option, value) => {
                    return option instanceof FreeSoloNode ? false : option.isEqual(value);
                }}
                renderInput={(params) => <TextField {...params} label="System Api" />}
            />
        </div>
    );
};

export const TreeDropDown = ({ data }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
            }}
        >
            <Sample sampleData={data} />
        </Box>
    );
};
