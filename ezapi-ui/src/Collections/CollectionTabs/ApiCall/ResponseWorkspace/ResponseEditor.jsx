import MonacoEditor from '@monaco-editor/react';
import { useRecoilValue } from 'recoil';
import { responseInfo } from '../../../CollectionsAtom';

export default function ResponseEditor() {
    const response = useRecoilValue(responseInfo);
    return (
        <div className="m-4 h-full mb-16">
            <div className="  flex flex-col" style={{ height: `calc(100% - 80px)` }}>
                <MonacoEditor
                    height="90vh"
                    value={response.data && response.data ? JSON.stringify(response.data, null, 2) : '{}'}
                    language="json"
                    options={{
                        contextmenu: false,
                        readOnly:true,
                        minimap: {
                            enabled: false,
                        },
                        renderWhitespace: 'all',
                        wordWrap: 'on',
                        wordWrapColumn: 80,
                    }}
                    style={{ backgroundColor: '#f5f5f5' }}
                />
            </div>
        </div>
    );
}
