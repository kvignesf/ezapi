import { KeyValueProps, TreeNode } from './interfaces';

export const checkValidJson = (value: any) => {
    if (!value) return;
    if (typeof value === 'object') {
        return true;
    }

    try {
        JSON.parse(value.replace(/^\s+|\s+$/gm, ''));
    } catch (e) {
        console.log('request-body.checkValidJson.error', e);
        return false;
    }
    return true;
};

export function formDataToObject(formData: KeyValueProps[]) {
    const obj: any = {};
    for (let pair of formData) {
        obj[pair.key] = pair.value;
    }
    return obj;
}

export const convertObjectToFormData = (data: string | object) => {
    const keyValuePairs = [];

    if (checkValidJson(data)) {
        if (typeof data !== 'object') {
            data = JSON.parse(data);
        }

        for (const [key, value] of Object.entries(data)) {
            keyValuePairs.push({ key, value });
        }
    }
    return keyValuePairs;
};
// Structures body into the required TreeNode structure
export const structureBodyForMapping = (data: any, parentName: string, oldRef: string, selectedNodeCardType?: any) => {
    // id counter to help create unique id for each node
    let id = 1;

    // recursively transforms input data into the required TreeNode structure
    function convertData(data: any, name = parentName, prevRef = oldRef): TreeNode {
        // handle special case when name is 'n'(loop node check)
        let newRef = '';
        if (name === 'n') {
            newRef = prevRef + '[' + name + ']';
        } else {
            newRef = prevRef + '.' + name;
        }

        // Create a new node
        const result: TreeNode = {
            id: parentName + id.toString(),
            name,
            children: [],
            //ref: prevRef + '.' + name,
            ref: newRef,
        };

        id++;
        // Check if data is an array
        if (Array.isArray(data) && selectedNodeCardType === 'externalAPILoopNode') {
            // If the array has at least one element, and it is an object (but not an array)
            if (data.length > 0 && typeof data[0] === 'object' && !Array.isArray(data[0])) {
                // create 'n' node using the 0th element of the array
                const nodeN = convertData(data[0], 'n', result.ref);
                result.children.push(nodeN);
            }
            // For each element in the array, recursively transform it to TreeNode and add it as a child
            data.forEach((value: any, index: number) => {
                const child = convertData(value, index.toString(), result.ref);
                result.children.push(child);
            });
            // If data is an object (but not an array)
        } else if (typeof data === 'object') {
            // For each key-value pair in the object, recursively transform it to TreeNode and add it as a child
            for (const key in data) {
                const child = convertData(data[key], key, result.ref);
                result.children.push(child);
            }
        }
        return result;
    }
    // Parse the input data (which is in JSON string format) into an object
    const updatedData = convertData(JSON.parse(data), parentName);

    return updatedData;
};

export function structureFormData(data: KeyValueProps[], name: string, oldRef = ''): TreeNode {
    let id = 1;
    const result: TreeNode = {
        id: name + id.toString(),
        name,
        children: [],
        ref: oldRef + '.' + name,
    };
    id++;

    data.forEach((obj) => {
        const node: TreeNode = {
            id: name + id.toString(),
            name: obj.key,
            children: [],
            ref: result.ref + '.' + obj.key,
        };
        id++;
        result.children.push(node);
    });

    return result;
}

export function ConvertResponseData(data: any[], rootName: string, rootRef: string): TreeNode {
    const parentNode: TreeNode = {
        id: 'parent-root' + rootName + (Math.random() + 1).toString(36).substring(7),
        name: rootName,
        children: [],
        ref: rootRef + '.' + rootName,
    };

    const getNode = (node: any, prevRef: string = ''): TreeNode => {
        const id = node.id ?? (Math.random() + 1).toString(36).substring(7);
        const name = node.name;
        const children: TreeNode[] = [];
        const type = node.type ?? '';
        const ref = `${prevRef}.${node.name}`;

        if (node.type === 'object' && node.properties) {
            for (const [propName, propNode] of Object.entries(node.properties)) {
                children.push(getNode(propNode, ref));
            }
        } else if (node.type === 'arrayOfObjects' && node.items && node.items.properties) {
            for (const [propName, propNode] of Object.entries(node.items.properties)) {
                children.push(getNode(propNode, ref));
            }
        }

        return { id, name, children, type, ref };
    };

    for (const node of data) {
        const childNode = getNode(node, parentNode.ref);
        parentNode.children.push(childNode);
    }

    return parentNode;
}
