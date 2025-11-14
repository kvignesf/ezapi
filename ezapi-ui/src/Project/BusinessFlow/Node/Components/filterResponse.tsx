import { Add } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import { FilterRowData } from '../../interfaces/aggregate-cards';
import { FilterResponseRow } from './FilterResponseRow';

interface FilterResponseProps {
    data: FilterRowData[];
    onAdd: Function;
    onDelete: Function;
    onCheckbox?: Function;
}

export const FilterResponse = ({
    data = [],
    onAdd = () => {},
    onDelete = () => {},
    onCheckbox = () => {},
}: FilterResponseProps): React.ReactElement => {
    return (
        <Stack
            sx={{
                border: '1px solid #C0CCDA',
                borderRadius: '0.5%',
                overflowX: 'none',
                minHeight: '72vh', // changed from height to minHeight
                padding: '12px 12px',
            }}
        >
            <Stack>
                {data &&
                    data.length > 0 &&
                    data?.map((item: FilterRowData, index: number) => {
                        return (
                            <FilterResponseRow
                                key={`${index}-${item.attributeName}`}
                                data={item}
                                onCheckbox={onCheckbox}
                                onDelete={() => {
                                    const updatedData = data.filter((value, index2) => value && index !== index2);
                                    onDelete(updatedData);
                                }}
                            />
                        );
                    })}
            </Stack>

            <Button
                disabled={false}
                onClick={() => {
                    onAdd();
                }}
                startIcon={<Add />}
                variant="outlined"
                color="primary"
                sx={{ maxWidth: '68px', height: '30px', marginTop: '12px', textTransform: 'none' }}
            >
                Add
            </Button>
        </Stack>
    );
};
