import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router';
import { useRecoilState, useRecoilValue } from 'recoil';
import storedProcedureAtom from '../../../shared/atom/storedProcedureAtom';
import LoaderWithMessage from '../../../shared/components/LoaderWithMessage';
import { operationAtomWithMiddleware, useCanEdit } from '../../../shared/utils';
import StoredProcedureSection from './StoredProcedureSection';
import { useGetStoredProcedures } from './storedProceduresQuery';

const StoredProcedures = () => {
    const { projectId } = useParams();
    const {
        isLoading: isFetchingStoredProcedures,
        data: storedProceduresData,
        error: getStoredProceduresError,
        mutate: fetchStoredProceduresData,
    } = useGetStoredProcedures();
    const operationState = useRecoilValue(operationAtomWithMiddleware);
    const [storedProcedureState, setStoredProcedureState] = useRecoilState(storedProcedureAtom);
    const [isHovering, setHovering] = useState(false);
    const [content, setContent] = useState(null);
    const [menuAnchorEl, setMenuAnchorEl] = useState(false);
    const [addClicked, setAddClicked] = useState([false, null]);
    const [dialog, setDialog] = useState({
        show: false,
        type: null,
        data: null,
    });
    const canEdit = useCanEdit();
    const Alert = React.forwardRef(function Alert(props, ref) {
        return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
    });
    useEffect(() => {
        fetchStoredProceduresData({ projectId });
    }, []);

    useEffect(() => {
        if (storedProcedureState?.selected) {
            const inputData = _.cloneDeep(storedProcedureState?.selected?.inputAttributes);
            const outputData = _.cloneDeep(storedProcedureState?.selected?.outputAttributes);

            setContent({
                name: storedProcedureState?.selected?.storedProcedure,
                contentType: 'input/output',
                data: [inputData, outputData],
                type: storedProcedureState?.selected?.type,
            });
        } else if (storedProceduresData && !_.isEmpty(storedProceduresData)) {
            setStoredProcedureState(storedProceduresData);

            const clonedStoredProceduresData = _.cloneDeep(storedProceduresData);

            setContent({
                name: storedProcedureState?.selected?.storedProcedure,
                contentType: 'storedProcedures',
                data: clonedStoredProceduresData,
                type: storedProcedureState?.selected?.type,
            });
        }
    }, [storedProceduresData, storedProcedureState?.selected]);

    if (isFetchingStoredProcedures) {
        return <LoaderWithMessage message="Loading Stored Procedures" className="h-full" contained />;
    }

    function handleClose() {
        setAddClicked([false, null]);
    }

    return (
        <div className="mx-4 py-4">
            <div className="flex flex-row gap-x-5 justify-center">
                {content?.contentType === 'storedProcedures' && (
                    <div className="flex-1 h-fit bg-neutral-gray7 rounded-md p-2">
                        <StoredProcedureSection
                            isAddClicked={(value, name) => setAddClicked([value, name])}
                            section={'0'}
                            items={content?.data?.data}
                            onItemClick={(item) => {
                                setStoredProcedureState((storedProcedureState) => {
                                    const clonedStoredProcedureState = _.cloneDeep(storedProcedureState);

                                    clonedStoredProcedureState.selected = item;

                                    return clonedStoredProcedureState;
                                });
                            }}
                        />

                        <Snackbar open={addClicked[0]} autoHideDuration={3000} onClose={handleClose}>
                            <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
                                {addClicked[1]} added in Request Body and Response Body
                            </Alert>
                        </Snackbar>
                    </div>
                )}
                {content?.contentType === 'input/output' && (
                    <>
                        {' '}
                        <div className="flex-1 h-fit bg-neutral-gray7 rounded-md p-2">
                            <StoredProcedureSection
                                section={'1'}
                                items={content}
                                onItemClick={(item) => {
                                    //do nothing
                                }}
                            />
                        </div>
                        <div className="flex-1 h-fit bg-neutral-gray7 rounded-md p-2">
                            <StoredProcedureSection
                                section={'2'}
                                items={content}
                                onItemClick={(item) => {
                                    //do nothing
                                }}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default StoredProcedures;
