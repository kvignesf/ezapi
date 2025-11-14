import { Add } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import Typography from '@mui/material/Typography';
import { BranchQueryData } from '../../interfaces/mapping';
import { BranchQueryRow } from './BranchQueryRow';

interface BranchQueryProps {
    data: BranchQueryData[];
    onAdd: Function;
    onUpdate: Function;
}

export const BranchQuery = ({
    data = [],
    onAdd = () => {},
    onUpdate = () => {},
}: BranchQueryProps): React.ReactElement => {
    return (
        <Stack
            sx={{
                border: '1px solid #C0CCDA',
                borderRadius: '0.5%',
                overflowX: 'none',
                height: '72vh',
                padding: '12px 12px',
            }}
        >
            <Stack>
                <Stack
                    direction="row"
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        mb: 2,
                    }}
                >
                    <Typography
                        className="text-neutral-gray2"
                        sx={{ fontWeight: 600, flexGrow: 0.5, textAlign: 'center' }}
                    ></Typography>
                    <Typography
                        className="text-neutral-gray2"
                        sx={{ fontWeight: 600, flexGrow: 1, textAlign: 'center' }}
                    >
                        Attribute
                    </Typography>
                    <Typography
                        className="text-neutral-gray2"
                        sx={{ fontWeight: 600, flexGrow: 1, textAlign: 'center' }}
                    >
                        Condition Key
                    </Typography>
                    <Typography
                        className="text-neutral-gray2"
                        sx={{ fontWeight: 600, flexGrow: 1, textAlign: 'center' }}
                    >
                        Value
                    </Typography>
                </Stack>

                {data &&
                    data.length > 0 &&
                    data?.map((item: BranchQueryData, index: number) => {
                        return (
                            <BranchQueryRow
                                firstIndex={index === 0}
                                key={`${index}-${item.name}-${item.relationName}-${item.ref}`}
                                data={item}
                                onDelete={() => {
                                    const updatedData = data.filter((value, index2) => value && index !== index2);
                                    onUpdate(updatedData);
                                }}
                                onChange={(changedData: BranchQueryData) => {
                                    const updatedData = data.map((value, index2) => {
                                        if (index === index2) {
                                            return changedData;
                                        } else {
                                            return value;
                                        }
                                    });
                                    onUpdate(updatedData);
                                }}
                            />
                        );
                    })}
            </Stack>

            <Button
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
