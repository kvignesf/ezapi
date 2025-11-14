import { Card, MenuItem, Select, Stack, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react';

import { Handle, NodeProps, Position } from 'reactflow';
import BackButton from '../../../icons/backButton.svg';
import Collapse from '../../../icons/collapse.svg';
import DialogIcon from '../../../icons/dialogIcon.svg';

interface StartNodeProps extends NodeProps {}

const StartNode = (props: StartNodeProps): React.ReactElement => {
    const [collapse, setCollapse] = useState(true);

    return (
        <>
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#555' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={props.isConnectable}
            />
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#555' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={props.isConnectable}
            />
            <Card sx={{ width: '360px' }}>
                <Tooltip title={'Start Node'} arrow placement="top">
                    <Stack
                        direction={'row'}
                        sx={{ borderBottom: '1px solid #C0CCDA', height: '52px', padding: '24px 16px' }}
                        justifyContent={'space-between'}
                        className={'custom-drag-handle'} //This is required to make only the header section draggable
                    >
                        <Stack direction={'row'}>
                            <img src={BackButton} style={{ width: '24px', height: '24px', alignSelf: 'center' }} />
                            <Typography
                                sx={{
                                    fontSize: '16px',
                                    alignSelf: 'center',
                                    marginBottom: '0',
                                    fontWeight: 600,
                                    paddingLeft: '8px',
                                }}
                                color="text.primary"
                                gutterBottom
                            >
                                Start
                            </Typography>
                        </Stack>
                        <Stack direction={'row'} spacing={1}>
                            <img
                                src={Collapse}
                                style={{ width: '24px', height: '24px', alignSelf: 'center' }}
                                onClick={() => {
                                    setCollapse(!collapse);
                                }}
                            />
                            <img src={DialogIcon} style={{ width: '24px', height: '24px', alignSelf: 'center' }} />
                        </Stack>
                    </Stack>
                </Tooltip>
                {!collapse && (
                    <Stack justifyContent={'space-around'} sx={{ padding: '24px 16px', height: '120px' }}>
                        <Typography sx={{ fontSize: '14px', fontWeight: 600 }} color="text.primary" gutterBottom>
                            Process API input
                        </Typography>
                        <Select
                            required={true}
                            variant="outlined"
                            onChange={() => {}}
                            style={{
                                width: '328px',
                                height: '48px',
                            }}
                        >
                            <MenuItem value={'QWERTY'}>
                                <p className="text-overline2">{'QWERTY'}</p>
                            </MenuItem>
                            <MenuItem value={'QWERTY1'}>
                                <p className="text-overline2">{'QWERTY1'}</p>
                            </MenuItem>
                            <MenuItem value={'QWERTY2'}>
                                <p className="text-overline2">{'QWERTY2'}</p>
                            </MenuItem>
                            <MenuItem value={'QWERTY3'}>
                                <p className="text-overline2">{'QWERTY3'}</p>
                            </MenuItem>
                            <MenuItem value={'QWERTY4'}>
                                <p className="text-overline2">{'QWERTY4'}</p>
                            </MenuItem>
                        </Select>
                    </Stack>
                )}
            </Card>
        </>
    );
};

export { StartNode, StartNodeProps };
