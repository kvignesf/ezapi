import { Delete } from '@mui/icons-material';
import { Button, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { MAXIMUM_BRANCH_CONDITIONS } from '../../constants';
import { BranchCondition } from '../../interfaces/aggregate-cards';
// import { Handle, Position } from 'reactflow';

interface BranchProps {
    branchCondition: BranchCondition;
    positionHandle: Function;
    isConnectable: boolean;
    branchConditions: BranchCondition[];
    setBranchConditions: Function;
    setTriggerNodeSaveOnServer: Function;
    triggerDelayedNodeSaveOnServer: Function;
    onClick: Function;
}

export const Branch = ({
    branchCondition,

    onClick,
    // positionHandle,
    // isConnectable,
    branchConditions,
    setBranchConditions,
    setTriggerNodeSaveOnServer,
    triggerDelayedNodeSaveOnServer,
}: BranchProps) => {
    const handleDelete = () => {
        if (branchCondition.conditionType !== 'if') {
            setBranchConditions(
                branchConditions.filter(
                    (_branchCondition: BranchCondition) => _branchCondition.conditionId !== branchCondition.conditionId,
                ),
            );
        }
        setTriggerNodeSaveOnServer(true);
    };

    function setRawExpression(newExpression: string) {
        const newBranchCondition = { ...branchCondition, rawExpression: newExpression };
        const updatedBranchConditions = branchConditions.map((_branchCondition: BranchCondition) => {
            if (_branchCondition.conditionId === branchCondition.conditionId) {
                return newBranchCondition;
            }
            return _branchCondition;
        });
        setBranchConditions(updatedBranchConditions);
        triggerDelayedNodeSaveOnServer();
    }

    function updatedBranchCondition(value: string) {
        const newBranchCondition = { ...branchCondition, conditionType: value };
        const updatedBranchConditions = branchConditions.map((_branchCondition: BranchCondition) => {
            if (_branchCondition.conditionId === branchCondition.conditionId) {
                return newBranchCondition;
            }
            return _branchCondition;
        });
        setBranchConditions(updatedBranchConditions);
        setTriggerNodeSaveOnServer(true);
    }

    return (
        <Stack justifyContent={'space-around'} sx={{ height: '105px' }}>
            {branchCondition.conditionType === 'if' && (
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }} color="text.primary" gutterBottom>
                    if
                </Typography>
            )}

            {branchCondition.conditionType === 'elif' && (
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }} color="text.primary" gutterBottom>
                    Else if
                </Typography>
            )}

            <Stack
                direction="row"
                justifyContent={'space-between'}
                alignItems={'center'}
                sx={{ background: branchCondition.conditionType === 'else' ? '#E5F3FF' : 'none' }}
            >
                {branchCondition.conditionType === 'else' ? (
                    <Stack
                        sx={{ width: '440px', margin: '6px 0', height: '48px' }}
                        direction="row"
                        alignItems={'center'}
                    >
                        <>
                            <Button
                                onClick={() => {
                                    updatedBranchCondition('else');
                                }}
                                sx={
                                    branchCondition.conditionType === 'else'
                                        ? { color: '#000', fontWeight: '700', textTransform: 'none' }
                                        : { color: 'grey', textTransform: 'none' }
                                }
                            >
                                Else
                            </Button>
                            <Tooltip
                                arrow
                                title={
                                    branchConditions.length >= MAXIMUM_BRANCH_CONDITIONS
                                        ? `can add a maximum of ${MAXIMUM_BRANCH_CONDITIONS} branches`
                                        : ''
                                }
                            >
                                <Button
                                    onClick={() => {
                                        if (branchConditions.length < MAXIMUM_BRANCH_CONDITIONS) {
                                            updatedBranchCondition('elif');
                                        }
                                    }}
                                    sx={
                                        branchCondition.conditionType !== 'else'
                                            ? { color: '#000', fontWeight: '700', textTransform: 'none' }
                                            : { color: 'grey', textTransform: 'none' }
                                    }
                                >
                                    Else if
                                </Button>
                            </Tooltip>
                        </>
                    </Stack>
                ) : (
                    <TextField
                        value={branchCondition.rawExpression}
                        required={true}
                        variant="outlined"
                        /* onChange={(e) => {
                            setRawExpression(e.target.value);
                        }} */
                        onClick={() => {
                            onClick();
                        }}
                        sx={{
                            width: '440px',
                            marginBottom: '12px',
                        }}
                        inputProps={{ style: { height: '15px' } }}
                    />
                )}
                <Delete
                    sx={{ cursor: 'pointer' }}
                    color={branchCondition.conditionType === 'if' ? 'disabled' : 'error'}
                    onClick={handleDelete}
                />
            </Stack>
        </Stack>
    );
};
