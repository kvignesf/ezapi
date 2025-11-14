import Editor from '@monaco-editor/react';
import { Add, Close, Create, Upload } from '@mui/icons-material';
import { Button, Stack, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';
import { KeyValueProps, ValueCardProps } from '../../interfaces';
import { ValueCardRow } from './ValueCardRow';

export const ValueCard = (props: ValueCardProps): React.ReactElement => {
    const {
        value,
        disabled = false,
        onChange = () => {},
        onDone,
        isHeader = false,
        isDrawer = false,
        disableAdd = false,
        onSubmit = () => {},
        disableKey = false,
        disableDelete = false,
        iconSelector = 'delete',
        cardType = 'node',
        nodeType = '',
    } = props;

    const [data, setData] = useState<KeyValueProps[]>(value ?? []);
    const [isEditor, setIsEditor] = useState<boolean>(false);
    const [displayValue, setDisplayValue] = useState<string>('');

    useEffect(() => {
        setData(value ?? []);
    }, [value]);

    const prepareFormData = () => {
        const regex = /[^\n]+/g;
        const matches = displayValue.match(regex);

        if (matches) {
            const formData = matches.map((item: string) => {
                const [key, ...rest] = item.split(':');
                const value = rest.join(':');
                return { key, value };
            });
            setData(formData);
        }
        setIsEditor(false);
    };

    const prepareEditorData = () => {
        const output = data.map((item: any) => `${item.key}:${item.value}`).join('\n');
        setDisplayValue(output);
        setIsEditor(true);
    };

    return (
        <Stack
            sx={{
                border: '1px solid #C0CCDA',
                borderRadius: '2.5%',
                width: cardType === 'node' ? '460px' : '100%',
                minHeight: cardType === 'node' ? '200px' : '211px',
                overflow: 'auto',
                padding: '12px 18px',
                whiteSpace: 'nowrap',
                WebkitOverflowScrolling: 'touch',
            }}
        >
            <Stack>
                <Stack direction="row">
                    <div className="flex flex-row justify-start bg-neutral-gray6 rounded-md p-1 py-2 mb-2">
                        {isEditor ? (
                            <>
                                <p
                                    className="flex-1 text-smallLabel uppercase text-neutral-gray2"
                                    style={{ width: cardType === 'node' ? '300px' : disableAdd ? '841px' : '845px' }}
                                ></p>
                                <div className="w-9" />
                            </>
                        ) : (
                            <>
                                <p
                                    className="flex-1 text-smallLabel ml-7 text-neutral-gray2 uppercase"
                                    style={{ width: cardType === 'node' ? '130px' : '225px' }}
                                >
                                    Key
                                </p>
                                <p
                                    className="flex-1 text-smallLabel uppercase text-neutral-gray2"
                                    style={{ width: cardType === 'node' ? '200px' : '650px' }}
                                >
                                    Value
                                </p>
                                <div className="w-9" />
                            </>
                        )}
                        {!isEditor ? (
                            nodeType !== 'main' && (
                                <Tooltip title={disableAdd ? 'Editor View' : 'Bulk Edit'} arrow placement={'top'}>
                                    <Create
                                        sx={{ alignSelf: 'center', padding: '0 1px', cursor: 'pointer' }}
                                        onClick={() => {
                                            prepareEditorData();
                                        }}
                                    />
                                </Tooltip>
                            )
                        ) : (
                            <Stack
                                direction="row"
                                onClick={() => {
                                    prepareFormData();
                                }}
                                sx={{ cursor: 'pointer' }}
                            >
                                {disableAdd ? (
                                    <p
                                        className="flex-1 text-smallLabel ml-3 text-neutral-gray2 uppercase pt-1"
                                        style={{ width: '50px' }}
                                    >
                                        cancel
                                    </p>
                                ) : (
                                    <p
                                        className="flex-1 text-smallLabel ml-7 text-neutral-gray2 uppercase pt-1"
                                        style={{ width: '30px' }}
                                    >
                                        save
                                    </p>
                                )}
                                {disableAdd ? (
                                    <Close sx={{ alignSelf: 'center', padding: '0 1px' }} />
                                ) : (
                                    <Upload sx={{ alignSelf: 'center', padding: '0 1px' }} />
                                )}
                            </Stack>
                        )}
                    </div>
                </Stack>
                {isEditor ? (
                    <Editor
                        height="172px"
                        defaultLanguage="csv"
                        options={{
                            readOnly: disableAdd,
                        }}
                        value={displayValue}
                        onChange={(event) => {
                            setDisplayValue(event ?? '');
                        }}
                    />
                ) : (
                    data?.map((item, index) => {
                        return (
                            <ValueCardRow
                                key={index}
                                nodeType={nodeType}
                                data={item}
                                onDone={onDone}
                                disableKey={disableKey}
                                isHeader={isHeader}
                                cardType={cardType}
                                onDelete={() => {
                                    const updatedData = data.filter((value, index2) => value && index !== index2);
                                    onChange(updatedData);
                                }}
                                disabled={disabled}
                                disableDelete={disableDelete}
                                onChange={(value: KeyValueProps) => {
                                    const updatedData = data.map((item, index2) => {
                                        if (index === index2) {
                                            return value;
                                        } else {
                                            return item;
                                        }
                                    });
                                    onChange(updatedData);
                                }}
                            />
                        );
                    })
                )}
            </Stack>
            <Stack direction={'row'} justifyContent={'space-between'} sx={{ marginBottom: '12px' }}>
                <Stack>
                    {!disableAdd && nodeType !== 'main' && !isEditor && (
                        <Button
                            onClick={() => {
                                setData([
                                    ...data,
                                    {
                                        key: '',
                                        value: '',
                                    },
                                ]);
                            }}
                            startIcon={<Add />}
                            variant="contained"
                            color="primary"
                            sx={{ mt: 2, textTransform: 'none', height: '36px', cursor: 'pointer' }}
                            disabled={disabled}
                        >
                            Add
                        </Button>
                    )}
                </Stack>

                {/* <Stack>
                    <Button
                        onClick={() => {
                            const length = data.length;
                            onSubmit();
                        }}
                        variant="contained"
                        sx={{
                            mt: 2,
                            textTransform: 'none',
                            bgcolor: 'green',
                            color: 'white',
                            height: '36px',
                            '&:hover': {
                                backgroundColor: 'darkgreen',
                            },

                        }}
                        disabled={disabled}
                    >
                        Submit
                    </Button>
                </Stack> */}
            </Stack>
        </Stack>
    );
};
