import { Delete, InfoOutlined } from '@mui/icons-material';
import { Checkbox, FormControlLabel, IconButton, InputAdornment, Stack, TextField, Tooltip } from '@mui/material';
import TooltipMUI from '@mui/material/Tooltip';
import { useState } from 'react';
import { FilterRowData } from '../../interfaces/aggregate-cards';

interface FilterResponseRowProps {
    data: FilterRowData;
    onDelete: Function;
    onCheckbox?: Function;
}

export const FilterResponseRow = ({ data, onDelete = () => {}, onCheckbox = () => {} }: FilterResponseRowProps) => {
    const [checked, setChecked] = useState(data.attributeRef.includes(`[].${data.attributeName}`));
    return (
        <Stack direction={'row'} justifyContent={'space-between'} sx={{ marginBottom: '12px' }} gap={2}>
            <Stack sx={{ flexBasis: '0', flexGrow: 1, textAlign: 'center' }}>
                <TextField
                    variant="outlined"
                    sx={{
                        maxWidth: '100%',
                    }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <Tooltip title={data.attributeRef}>
                                    <IconButton size="small">
                                        <InfoOutlined fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    }}
                    inputProps={{ style: { height: '15px' } }}
                    value={data.attributeName}
                />
            </Stack>
            <FormControlLabel
                control={
                    <TooltipMUI title="Iterate through entire array" placement="top-end">
                        <Checkbox
                            checked={checked}
                            onChange={(event: any) => {
                                setChecked(event.target.checked);
                                data.iterateThroughArray = event.target.checked;
                                onCheckbox(event.target.checked);
                            }}
                            color="primary"
                        />
                    </TooltipMUI>
                }
                label=""
            />
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
