import { Button, makeStyles } from '@material-ui/core';
import { useRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { requestParams } from '../../../../CollectionsAtom';
import KeyValueEditor from './KeyValueEditor';

const useStyles = makeStyles((theme) => ({
    button: {
        padding: '3px',
        fontSize: '12px',
        fontWeight: 500,
        marginLeft: '12px',
        marginBottom: theme.spacing(2),
        marginTop: '12px',
        boxShadow: 'none',
    },
}));

export default function KeyValuePanel({ tab }) {
    const [request, setRequest] = useRecoilState(requestParams);
    const styles = useStyles();

    const onKeyPairAdd = () => {
        if (tab === 0) {
            setRequest((oldRequestParams) => ({
                ...oldRequestParams,
                queryParams: [
                    ...oldRequestParams.queryParams,
                    { id: uuidv4(), keyItem: '', valueItem: '', isEditable: false },
                ],
            }));
        }
        if (tab === 1) {
            setRequest((oldRequestParams) => ({
                ...oldRequestParams,
                header: [...oldRequestParams.header, { id: uuidv4(), keyItem: '', valueItem: '', isEditable: false }],
            }));
        }
    };

    const onKeyPairRemove = (keyPair) => {
        if (tab === 0) {
            let newKeyValues = [...request.queryParams];
            newKeyValues = newKeyValues.filter((x) => x.id !== keyPair.id);
            setRequest((oldRequestParams) => ({
                ...oldRequestParams,
                queryParams: newKeyValues,
            }));
        }
        if (tab === 1) {
            let newKeyValues = [...request.header];
            newKeyValues = newKeyValues.filter((x) => x.id !== keyPair.id);
            setRequest((oldRequestParams) => ({
                ...oldRequestParams,
                header: newKeyValues,
            }));
        }
    };

    return (
        <>
            <div>
                {tab === 0
                    ? request['queryParams']?.map((keyPair) => {
                          return (
                              <KeyValueEditor
                                  key={keyPair.id}
                                  keyPair={keyPair}
                                  tab={0}
                                  onKeyPairRemove={() => onKeyPairRemove(keyPair)}
                              />
                          );
                      })
                    : tab === 1
                    ? request['header']?.map((keyPair) => {
                          return (
                              <KeyValueEditor
                                  key={keyPair.id}
                                  keyPair={keyPair}
                                  tab={1}
                                  onKeyPairRemove={() => onKeyPairRemove(keyPair)}
                              />
                          );
                      })
                    : null}

                <Button variant="contained" color="primary" onClick={() => onKeyPairAdd()} className={styles.button}>
                    + Add
                </Button>
            </div>
        </>
    );
}
