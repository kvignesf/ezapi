import { Delete } from '@mui/icons-material';
import DoneIcon from '@mui/icons-material/Done';
import { Autocomplete, Stack, TextField } from '@mui/material';
import { ValueCardRowProps } from '../../interfaces';
export const ValueCardRow = (props: ValueCardRowProps) => {
    const {
        data,
        onDelete,
        onDone,
        disableKey,
        isHeader = false,
        disabled = false,
        nodeType = '',
        cardType = 'node',
        disableDelete = false,
        iconSelector = 'delete',
        onChange = () => {},
    } = props;

    return (
        <Stack direction={'row'} spacing={3} sx={{ marginBottom: '12px' }}>
            <Stack>
                {isHeader ? (
                    <Autocomplete
                        options={['Authorization']}
                        freeSolo
                        clearIcon={null}
                        inputValue={data.key}
                        onInputChange={(event, newInputValue) => {
                            console.log(event);
                            onChange({ key: newInputValue, value: data.value });
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                required
                                variant="outlined"
                                disabled={disabled || nodeType === 'main'}
                                sx={{ minWidth: cardType === 'node' ? '140px' : '400px' }}
                                inputProps={{ ...params.inputProps, style: { height: '15px' } }}
                            />
                        )}
                    />
                ) : (
                    <TextField
                        required={true}
                        variant="outlined"
                        value={data.key}
                        disabled={disabled || nodeType === 'main' || disableKey}
                        onChange={(e) => {
                            onChange({ key: e.target.value, value: data.value });
                        }}
                        sx={{ minWidth: cardType === 'node' ? '140px' : '400px' }}
                        inputProps={{ style: { height: '15px' } }}
                    />
                )}
            </Stack>

            <Stack>
                <TextField
                    required={true}
                    value={data.value}
                    disabled={disabled}
                    variant="outlined"
                    onChange={(e) => {
                        onChange({ key: data.key, value: e.target.value });
                    }}
                    sx={{
                        width: cardType === 'node' ? '228px' : '495px',
                    }}
                    inputProps={{ style: { height: '15px' } }}
                />
            </Stack>

            {!disableDelete &&
                nodeType !== 'main' &&
                (iconSelector === 'delete' ? (
                    <Delete
                        color={disabled ? 'disabled' : 'error'}
                        sx={{ alignSelf: 'center', cursor: 'pointer' }}
                        onClick={() => {
                            if (!disabled) {
                                onDelete();
                            }
                        }}
                    />
                ) : (
                    <DoneIcon
                        color="primary"
                        sx={{ alignSelf: 'center', cursor: 'pointer' }}
                        onClick={() => {
                            // @ts-expect-error
                            onDone();
                        }}
                    />
                ))}
        </Stack>
    );
};
