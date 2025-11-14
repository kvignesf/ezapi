import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import _ from 'lodash';
import React, { useEffect } from 'react';

import { useParams } from 'react-router';
import { useRecoilState } from 'recoil';
import { operationAtomWithMiddleware } from '../../../shared/utils';

export default function Authorization({ request = true, responseCode, ...props }) {
    let [operationData, setOperationDetails] = useRecoilState(operationAtomWithMiddleware);

    const { projectId } = useParams();
    const [authtype, setAuthtype] = React.useState('No Auth');
    const [tokentype, setTokentype] = React.useState('');

    const handleChangeAuthType = (event) => {
        var tempTokenType = tokentype;
        if (event.target.value === 'Bearer Token') {
            tempTokenType = 'JWT';
        }

        setOperationDetails((operationDetails) => {
            if (request) {
                const newOperationDetails = _.cloneDeep(operationDetails);
                const clonedAuthType = _.cloneDeep(event.target.value);
                const clonedTokenType = _.cloneDeep(tempTokenType);
                newOperationDetails.operationRequest['authorization'] = {
                    authType: clonedAuthType,
                    tokenType: clonedTokenType,
                };
                return newOperationDetails;
            }
        });
    };
    const handleChangeTokenType = (event) => {
        setOperationDetails((operationDetails) => {
            if (request) {
                const newOperationDetails = _.cloneDeep(operationDetails);
                const clonedAuthType = _.cloneDeep(authtype);
                const clonedTokenType = _.cloneDeep(event.target.value);
                newOperationDetails.operationRequest['authorization'] = {
                    authType: clonedAuthType,
                    tokenType: clonedTokenType,
                };
                return newOperationDetails;
            }
        });
    };
    useEffect(() => {
        if (operationData?.operationRequest?.authorization) {
            setAuthtype(operationData?.operationRequest?.authorization?.authType);
            setTokentype(operationData?.operationRequest?.authorization?.tokenType);
        }
    }, [operationData?.operationRequest?.authorization]);

    return (
        <div className="w-1/2 m-6">
            {' '}
            {request && (
                <div className="grid  grid-cols-2 gap-1 ">
                    {' '}
                    <div className="grid items-center grid-cols-1 gap-2 ">
                        <p className="">Auth Type: </p>
                        <Box>
                            {' '}
                            <FormControl style={{ width: '200px' }}>
                                <Select
                                    disabled={!props.canEdit}
                                    labelId="demo-simple-select-label"
                                    id="demo-simple-select"
                                    value={authtype}
                                    onChange={handleChangeAuthType}
                                >
                                    <MenuItem value="No Auth">No Auth</MenuItem>
                                    <MenuItem value="Bearer Token">Bearer Token</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </div>
                    {operationData.operationRequest?.authorization?.authType == 'Bearer Token' && (
                        <div className="grid items-center grid-cols-1 col-start-2 gap-1">
                            <p className="mr-4 self-center">Token Type: </p>
                            <Box>
                                <FormControl style={{ width: '200px' }}>
                                    <Select
                                        disabled={!props.canEdit}
                                        labelId="demo-simple-select-label"
                                        id="demo-simple-select"
                                        value={tokentype}
                                        onChange={handleChangeTokenType}
                                    >
                                        <MenuItem value="JWT">JWT</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
