import { Delete } from '@mui/icons-material';
import { FormControl, MenuItem, Select, SelectChangeEvent, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { BranchQueryData } from '../../interfaces/mapping';

interface BranchQueryRowProps {
    data: BranchQueryData;
    onDelete: Function;
    firstIndex?: boolean;
    onChange: Function;
}

export const BranchQueryRow = ({
    data,
    onDelete = () => {},
    firstIndex = false,
    onChange = () => {},
}: BranchQueryRowProps) => {
    const [operator, setOperator] = useState(data.operator);
    const [conditionKey, setConditionKey] = useState(data.conditionKey);
    const [value, setValue] = useState(data.relationName === '' ? data.value : data.relationName);

    const handleOperatorChange = (event: SelectChangeEvent) => {
        setOperator(event.target.value as string);
        data.operator = event.target.value as string;
        onChange(data);
    };

    const handleConditionKeyChange = (event: SelectChangeEvent) => {
        setConditionKey(event.target.value as string);
        data.conditionKey = event.target.value as string;
        onChange(data);
    };
    return (
        <Stack
            direction={'row'}
            justifyContent={'space-between'}
            sx={{ marginBottom: '12px', alignItems: 'center', p: 2, mb: 2 }}
            gap={2}
        >
            <Stack sx={{ flexBasis: '0', flexGrow: 0.5, textAlign: 'left' }}>
                {firstIndex ? (
                    <Typography sx={{ fontWeight: 700 }}>If</Typography>
                ) : (
                    <FormControl fullWidth>
                        <Select
                            sx={{ height: '48px' }}
                            id="ConditionType"
                            value={operator}
                            onChange={handleOperatorChange}
                        >
                            <MenuItem value={'||'}>OR</MenuItem>
                            <MenuItem value={'&&'}>AND</MenuItem>
                        </Select>
                    </FormControl>
                )}
            </Stack>
            <Stack sx={{ flexBasis: '0', flexGrow: 1, textAlign: 'center' }}>
                <TextField
                    required={true}
                    variant="outlined"
                    inputProps={{ style: { height: '15px' } }}
                    value={data.name}
                />
            </Stack>
            <Stack sx={{ flexBasis: '0', flexGrow: 1, textAlign: 'center' }}>
                <FormControl fullWidth>
                    <Select
                        sx={{ height: '48px' }}
                        id="ConditionKey"
                        value={conditionKey}
                        onChange={handleConditionKeyChange}
                    >
                        <MenuItem value={'>'}>{'>'}</MenuItem>
                        <MenuItem value={'<'}>{'<'}</MenuItem>
                        <MenuItem value={'>='}>{'> ='}</MenuItem>
                        <MenuItem value={'<='}>{'< ='}</MenuItem>
                        <MenuItem value={'=='}>{'= ='}</MenuItem>
                    </Select>
                </FormControl>
            </Stack>
            <Stack sx={{ flexBasis: '0', flexGrow: 1, textAlign: 'center' }}>
                <TextField
                    variant="outlined"
                    inputProps={{ style: { height: '15px' } }}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        data.value = e.target.value;
                        data.relationId = '';
                        data.relationName = '';
                        data.relationRef = '';
                        onChange(data);
                    }}
                />
            </Stack>
            <Delete
                color={'error'}
                sx={{ alignSelf: 'flex-end', cursor: 'pointer' }}
                onClick={() => {
                    onDelete();
                }}
            />
        </Stack>
    );
};
