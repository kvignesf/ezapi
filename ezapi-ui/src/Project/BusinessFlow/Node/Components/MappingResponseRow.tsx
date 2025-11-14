import { Delete, InfoOutlined } from '@mui/icons-material';
import { IconButton, InputAdornment, Stack, TextField, Tooltip } from '@mui/material';
import { MappingData } from '../../interfaces';

interface MappingResponseRowProps {
    data: MappingData;
    onDelete: Function;
}

export const MappingResponseRow = ({ data, onDelete = () => {} }: MappingResponseRowProps) => {
    return (
        <Stack direction={'row'} justifyContent={'space-between'} sx={{ marginBottom: '12px' }} gap={2}>
            <Stack sx={{ flexBasis: '0', flexGrow: 1, textAlign: 'center' }}>
                <TextField
                    required={true}
                    variant="outlined"
                    sx={{
                        maxWidth: '100%',
                    }}
                    inputProps={{ style: { height: '15px' } }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <Tooltip title={data.ref}>
                                    <IconButton size="small">
                                        <InfoOutlined fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    }}
                    value={data.name}
                />
            </Stack>
            <Stack sx={{ flexBasis: '0', flexGrow: 1, textAlign: 'center' }}>
                <TextField
                    required={true}
                    variant="outlined"
                    sx={{
                        maxWidth: '100%',
                    }}
                    inputProps={{ style: { height: '15px' } }}
                    value={data.relationNode}
                />
            </Stack>
            <Stack sx={{ flexBasis: '0', flexGrow: 1, textAlign: 'center' }}>
                <TextField
                    variant="outlined"
                    sx={{
                        maxWidth: '100%',
                    }}
                    inputProps={{ style: { height: '15px' } }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <Tooltip title={data.relationRef}>
                                    <IconButton size="small">
                                        <InfoOutlined fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    }}
                    value={data.relationName}
                />
            </Stack>
            <Delete
                color={'error'}
                sx={{ alignSelf: 'center', cursor: 'pointer' }}
                onClick={() => {
                    onDelete();
                }}
            />
        </Stack>
    );
};
