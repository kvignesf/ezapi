import MonacoEditor from '@monaco-editor/react';
import { useRef } from 'react';
import { useRecoilState } from 'recoil';
import { requestParams } from '../../../CollectionsAtom';

export default function ReqBodyEditor() {
    const [req, setBody] = useRecoilState(requestParams);

    const handleChange = (value, event) => {
        try {
            setBody((prevData) => ({
                ...prevData,
                body: value,
            }));
        } catch (error) {
            // Handle any parsing errors here
            console.error('Invalid JSON:', error);
        }
    };

    const handleFormat = () => {
        const editor = editorRef.current;
        if (editor) {
            const unformattedValue = editor.getValue();
            const formattedValue = editor.getModel().getOptions().tabSize
                ? JSON.stringify(JSON.parse(unformattedValue), null, 2)
                : unformattedValue;

            editor.setValue(formattedValue);
        }
    };

    const editorRef = useRef();

    return (
        <div className="m-4 h-full mb-16">
            <div className="flex flex-col" style={{ height: `calc(100% - 80px)` }}>
                <MonacoEditor
                    height="90vh"
                    language="json"
                    value={
                        req.body &&
                        Object.keys(req.body).length > 0 &&
                        JSON.stringify(req.body) !== JSON.stringify({ '': '' })
                            ? req.body
                            : JSON.stringify({ '': '' }, null, 2)
                    }
                    options={{
                        contextmenu: false,
                        minimap: {
                            enabled: false,
                        },
                        suggestOnTriggerCharacters: false, // Disable suggestions
                        quickSuggestions: false, // Disable quick suggestions
                        formatOnPaste: true, // Enable formatting on paste
                        formatOnType: true, // Enable formatting on type
                        autoIndent: 'full',
                        wordWrap: 'on',
                        wordWrapColumn: 80,
                    }}
                    onChange={handleChange}
                    editorDidMount={(editor, monaco) => {
                        editorRef.current = editor;
                    }}
                    style={{ backgroundColor: '#f5f5f5' }}
                />
                <button onClick={handleFormat}>Format</button>
            </div>
        </div>
    );
}
