import Editor from '@monaco-editor/react';
import { Stack } from '@mui/material';
import React, { useEffect, useState } from 'react';

interface ResponseTabProps {
    isResponse?: boolean;
    displayTitle?: string;
    value?: object | string;
    disabled?: boolean;
    message?: string;
    isError?: boolean | undefined;
    onChange?: Function;
    editable?: boolean;
}

export const ResponseTab = ({
    isResponse = true,
    value,
    displayTitle = '',
    disabled = false,
    message = '',
    editable = true,
    isError = undefined,
    onChange = () => {},
}: ResponseTabProps): React.ReactElement => {
    const [displayValue, setDisplayValue] = useState(
        typeof value === 'object' ? JSON.stringify(value ?? '', null, 8) : value,
    );

    function handleEditorChange(event: any) {
        if (!disabled) {
            onChange(event);
        }
    }
    useEffect(() => {
        setDisplayValue(typeof value === 'object' ? JSON.stringify(value ?? '', null, 8) : value);
    }, [value]);

    return (
        <Stack width="100%">
            {isResponse ? (
                isError !== undefined &&
                message != '0' && (
                    <Stack
                        height={'32px'}
                        sx={{
                            backgroundColor: isError ? '#ff3333' : '#71C72C',
                            color: '#fff',
                            fontWeight: 600,
                            padding: ' 2px 16px',
                        }}
                    >
                        {isError ? `error: ${message}` : `success: ${message}`}
                    </Stack>
                )
            ) : (
                <Stack
                    height={'32px'}
                    sx={{
                        color: '#000',
                        fontWeight: 600,
                        padding: ' 2px 16px',
                    }}
                >
                    {displayTitle}
                </Stack>
            )}
            <Stack sx={{ padding: '8px' }}>
                <Stack
                    style={{
                        border: '1px solid #C0CCDA',
                        borderRadius: '2%',
                        whiteSpace: 'pre',
                        fontSize: '13px',
                        padding: '2px',
                    }}
                >
                    <Editor
                        height="300px"
                        defaultLanguage="json"
                        // defaultValue={displayValue}
                        options={{
                            readOnly: !editable,
                        }}
                        value={displayValue}
                        onChange={(event) => {
                            handleEditorChange(event);
                        }}
                    />
                </Stack>
            </Stack>
        </Stack>
    );
};
