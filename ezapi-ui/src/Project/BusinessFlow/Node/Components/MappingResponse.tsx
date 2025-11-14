import { Add } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import Typography from '@mui/material/Typography';
import React from 'react';
import { MappingData } from '../../interfaces';
import { MappingResponseRow } from './MappingResponseRow';

interface MappingResponseProps {
    data: MappingData[];
    onAdd: Function;
    onDelete: Function;
}

export const MappingResponse = ({
    data = [],
    onAdd = () => {},
    onDelete = () => {},
}: MappingResponseProps): React.ReactElement => {
    return (
        <Stack
            sx={{
                border: '1px solid #C0CCDA',
                borderRadius: '0.5%',
                overflowX: 'none',
                minHeight: '72vh',
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
                        sx={{ fontWeight: 600, flexGrow: 1, textAlign: 'center' }}
                    >
                        API Req Attribute
                    </Typography>
                    <Typography
                        className="text-neutral-gray2"
                        sx={{ fontWeight: 600, flexGrow: 1, textAlign: 'center' }}
                    >
                        Flow/Aggregate API
                    </Typography>
                    <Typography
                        className="text-neutral-gray2"
                        sx={{ fontWeight: 600, flexGrow: 1, textAlign: 'center' }}
                    >
                        Flow/Aggregate API Attribute
                    </Typography>
                </Stack>

                {data &&
                    data.length > 0 &&
                    data?.map((item: MappingData, index: number) => {
                        return (
                            <MappingResponseRow
                                key={`${index}-${item.name}-${item.relationName}-${item.ref}`}
                                data={item}
                                onDelete={() => {
                                    const updatedData = data.filter((value, index2) => value && index !== index2);
                                    onDelete(updatedData);
                                }}
                            />
                        );
                    })}
            </Stack>

            <Button
                disabled={
                    data && data.length > 0
                        ? data[data.length - 1].name === '' || data[data.length - 1].relationName === ''
                        : false
                }
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
