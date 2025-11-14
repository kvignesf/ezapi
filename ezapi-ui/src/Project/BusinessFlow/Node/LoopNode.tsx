import { Card, Stack, Tooltip, Typography } from '@mui/material';
import { Handle, NodeProps, Position } from 'reactflow';

interface LoopNodeProps extends NodeProps {}

const LoopNode = (props: LoopNodeProps) => {
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
                <Tooltip title="Loop Node" arrow placement="top">
                    <Stack
                        direction={'row'}
                        sx={{ borderBottom: '1px solid #C0CCDA', height: '52px', padding: '24px 16px' }}
                        justifyContent={'space-between'}
                        className={'custom-drag-handle'} //This is required to make only the header section draggable
                    >
                        <Stack direction={'row'}>
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
                                Loop Node
                            </Typography>
                        </Stack>
                    </Stack>
                </Tooltip>
            </Card>
        </>
    );
};

export { LoopNode, LoopNodeProps };
