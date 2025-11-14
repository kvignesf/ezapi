import { makeStyles, Tab, Tabs } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useRecoilState } from 'recoil';
import Colors from '../../shared/colors';
import LoaderWithMessage from '../../shared/components/LoaderWithMessage';
import TabLabel from '../../shared/components/TabLabel';
import { useGetOperation } from '../../shared/query/operationDetailsQuery';
import { operationAtomWithMiddleware } from '../../shared/utils';
import Request from './Request/Request';
import Response from './Response/Response';

const tabsStyles = makeStyles({
    indicator: {
        top: '0px',
    },
});

const tabStyles = makeStyles({
    tab: {
        background: Colors.neutral.gray7,
        '&.Mui-selected': {
            background: 'white',
        },
    },
});

const OperationDetails = ({ resource, path, operation, className, projectType, onDelete = () => {}, ...props }) => {
    // console.log(props.canEdit);
    const { projectId } = useParams();
    const tabsClasses = tabsStyles();
    const tabClasses = tabStyles();
    const [currentTab, setTab] = useState(0);
    const [operationState, setOperationState] = useRecoilState(operationAtomWithMiddleware);

    const getOperationMutation = useGetOperation();

    useEffect(() => {
        if (operationState?.operationIndex && operationState?.operation) {
            getOperationMutation.mutate({
                operationId: operationState.operation.operationId,
                pathId: operationState.path.pathId,
                resourceId: operationState.resource.resourceId,
                projectId: projectId,
            });
        }
    }, [operationState?.operationIndex]);

    if (getOperationMutation?.isLoading) {
        return (
            <div className={`border-t-2 h-full flex flex-col justify-center ${className}`} {...props}>
                <LoaderWithMessage contained message={'Fetching Operation Details'} />
            </div>
        );
    }

    return (
        <div className={`border-t-2 h-full ${className}`} {...props}>
            {operationState?.resource && operationState?.path && operationState?.operation && (
                <div>
                    <div className="h-full flex flex-row">
                        <Tabs
                            classes={{
                                indicator: tabsClasses.indicator,
                            }}
                            value={currentTab}
                            onChange={(_, index) => {
                                setTab(index);
                            }}
                            aria-label="add project tabs"
                            indicatorColor="primary"
                            textColor="primary"
                            style={{ width: 'min-content' }}
                        >
                            <Tab
                                label={<TabLabel label={'Request'} />}
                                classes={{ root: tabClasses.tab }}
                                style={{
                                    borderRight: `2px solid ${Colors.neutral.gray6}`,
                                    outline: 'none',
                                }}
                            />

                            <Tab
                                label={<TabLabel label={'Response'} />}
                                classes={{ root: tabClasses.tab }}
                                style={{
                                    outline: 'none',
                                    borderRight: `2px solid ${Colors.neutral.gray6}`,
                                }}
                            />
                        </Tabs>

                        <div className="flex-1 flex flex-row pr-2 bg-neutral-gray7 items-center justify-end">
                            <p className="text-overline2 text-neutral-gray4">
                                {`${operationState?.resource?.resourceName} / ${operationState?.path?.pathName} /`}
                            </p>
                            <span className="ml-1 text-overline2">{`${operationState?.operation?.operationName}`}</span>
                        </div>
                    </div>

                    {currentTab === 0 ? (
                        <div className="h-full">
                            <Request
                                canEdit={props.canEdit}
                                getDetailsMutation={getOperationMutation}
                                projectType={projectType}
                                onDelete={() => {
                                    onDelete();
                                }}
                            />
                        </div>
                    ) : (
                        <div className="h-full">
                            <Response
                                getDetailsMutation={getOperationMutation}
                                projectType={projectType}
                                onDelete={() => {
                                    onDelete();
                                }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OperationDetails;
