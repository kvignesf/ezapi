import { Drawer } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import MappingDrawer from './MappingDrawer';
import { useGetResources } from './Resources/resourcesQuery';
//import { useGetTables } from "./AttributeDetails/recommendationQueries";
import currentViewAtom from '@/shared/atom/currentViewAtom';
import { CircularProgress, Dialog, Tab, Tabs, Tooltip } from '@material-ui/core';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import classNames from 'classnames';
import _ from 'lodash';
import { DndProvider } from 'react-dnd';
import { SocketContext } from '../Context/socket';
import { getAccessToken, getUserId } from '../shared/storage';

import { HTML5Backend } from 'react-dnd-html5-backend';
import { useGetRecoilValueInfo_UNSTABLE, useRecoilState, useResetRecoilState } from 'recoil';
import ModifyCollaborators from '../ModifyCollaborators/ModifyCollaborators';
import { useGetTables } from '../Project/SchemaDetails/schemaRecommendationQuery';
import schemaAtom from '../shared/atom/schemaAtom';
import tableAtom from '../shared/atom/tableAtom';
import { OutlineButton, PrimaryButton } from '../shared/components/AppButton';
import AppIcon from '../shared/components/AppIcon';
import EzapiFooter from '../shared/components/EzapiFooter';
import EzapiLogo from '../shared/components/EzapiLogo';
import InitialsAvatar from '../shared/components/InitialsAvatar';
import ProfileMenu from '../shared/components/ProfileMenu';
import TabLabel from '../shared/components/TabLabel';
import client, { endpoint } from '../shared/network/client';
import { useLogout } from '../shared/query/authQueries';
import { useSyncOperation } from '../shared/query/operationDetailsQuery';
import routes, { generateRoute } from '../shared/routes';
import { getEmailId, getFirstName, getLastName } from '../shared/storage';
import {
    canEdit,
    generateSyncOperationRequestRequest,
    generateSyncOperationResponseRequest,
    operationAtomWithMiddleware,
} from '../shared/utils';
import ApiErrors from './ApiErrors';
import CredentialsBeforePublish from './CredentialsBeforePublish';
import DBMappingDrawer from './DBMappingDrawer';
import ErrorDrawer from './ErrorDrawer';
import Match from './Match';
import OperationDetails from './OperationDetails';
import ProjectVerificationErrors from './ProjectVerificationErrors';
import PublishProjectMessage from './PublishProjectMessage';
import RepublishInfo from './RepublishInfo';
import Resources from './Resources/Resources';
import SaveOperationWarning from './SaveOperationWarning';
import Simulate from './Simulate.jsx';
import UserRoleProvider from './UserRoleContext';
import {
    useFetchProjectDetails,
    useGetMandMappingTableData,
    useSubmitProject,
    useVerifyProject,
} from './projectQueries';

const Project = () => {
    const acc_token = getAccessToken();
    const { projectId } = useParams();
    const history = useHistory();
    const firstName = getFirstName();
    const lastName = getLastName();
    const [displayEntityMapping, setDisplayEntityMapping] = useState(false);
    const [mappedEntityData, setMappedEntityData] = useState();
    const [dataFetched, setDataFetched] = useState(false);
    const [mandMappingErr, setMandMappinErr] = useState(false);
    const [memberList, setMemberList] = useState();
    const [inProgress, setInProgress] = useState(false);
    const [entityMappingData, setEntityMappingData] = useState();
    const [entityMappingError, setEntityMappingError] = useState();
    const [currentView, setCurrentView] = useRecoilState(currentViewAtom);

    const {
        isLoading: isFetchingProjectDetails,
        isSuccess: isProjectDetailsFetched,
        error: projectDetailsError,
        data: projectDetails,
        remove: resetFetchProject,
    } = useFetchProjectDetails(projectId, { refetchOnWindowFocus: false });

    const [currentTab, setCurrentTab] = useState(0);
    const [operationState, setOperationState] = useRecoilState(operationAtomWithMiddleware);
    const {
        isLoading: isLoadingResources,
        data: resources,
        isFetching: isLoadingResourcesBg,
        error: getResourcesError,
    } = useGetResources(projectId, {
        refetchOnWindowFocus: false,
    });
    // console.log(resources);
    const {
        isLoading: isSyncingOperation,
        isSuccess: isSyncOperationSuccess,
        error: syncOperationError,
        mutate: syncOperation,
        reset: resetSyncOperationMutation,
    } = useSyncOperation();
    const [newProjectDetails, setNewProjectDetails] = useState(null);
    const {
        publishProjectMutation: {
            isLoading: isPublishingProject,
            isSuccess: isPublishProjectSuccess,
            data: publishProjectData,
            error: publishProjectError,
            mutate: publish,
            reset: resetPublishMutation,
        },
    } = useSubmitProject(projectId, newProjectDetails);

    const {
        isLoading: isVerifying,
        isSuccess: verificationSuccess,
        data: verifyData,
        error: verifyError,
        mutate: verifyProject,
        reset: resetVerify,
    } = useVerifyProject({ projectId, newProjectDetails });

    const {
        isLoading: isMMFetchingTables,
        error: fetchMMTablesError,
        data: mmtablesData,
        mutate: fetchMMTablesData,
    } = useGetMandMappingTableData(projectId);

    /*const {
    isLoading: inProgress,
    error: entityMappingError,
    data: entityMappingData,
    mutate: pushMapppingData,
    reset: resetEntityMapping,
  } = useGetEntityMapping(
    projectId,
    mappedEntityData?.filters,
    mappedEntityData?.relations,
    newProjectDetails?.password
  );*/

    const {
        isLoading: isFetchingTables,
        data: tablesData,
        error: fetchTablesError,
        mutate: fetchTables,
    } = useGetTables();
    const resetSchemaState = useResetRecoilState(schemaAtom);
    const resetTableState = useResetRecoilState(tableAtom);
    const resetOperationState = useResetRecoilState(operationAtomWithMiddleware);
    const [profileMenuAnchorEl, setProfilemenuAnchorEl] = useState(false);
    const { isLoading: isLoggingOut, mutate: logout } = useLogout();
    const [dialog, setDialog] = useState({
        show: false,
        type: null,
        data: null,
    });
    const getRecoilValueInfo = useGetRecoilValueInfo_UNSTABLE();
    const [userRole, setRole] = useState(null);
    const [isDeleteError, setIsDeleteError] = useState(false);
    const [passwordBeforePublish, setPasswordBeforePublish] = useState(null);
    const [simulateVirtualData, setSimulateVirtualData] = useState(null);
    const [simulateData, setSimulateData] = useState(null);
    const [autoSyncIntervalId, setAutoSync] = useState(0);
    const [showUnsavedPopup, setUnsavedPopup] = useState(true);
    const [apiError, setApiError] = useState(null);
    const [checkBusinessFlow, setBusinessFlow] = useState(false);
    const socket = useContext(SocketContext);
    const userId = getUserId();

    useEffect(() => {
        if (socket) {
            if (!socket.connected) {
                socket.emit('userConnected', {
                    user: getUserId(),
                });
            }
        }
    }, []);

    useEffect(() => {
        if (canEdit(userRole)) {
            startAutoSync();
        }
        return () => stopAutoSync();
    }, [userRole]);

    useEffect(() => {
        if (currentTab === 1) {
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${acc_token}` },
                body: JSON.stringify({
                    projectid: projectId,
                }),
            };
            fetch(process.env.REACT_APP_API_URL + '/simulation_artefacts', requestOptions)
                .then((response) => {
                    return response.json();
                })
                .then((data) => {
                    if (data?.message && data?.message === 'Ok') {
                        virtualDataAPI();
                    } else {
                        throw data;
                    }
                })

                .catch((error) => {
                    if (error?.message) {
                        console.log('Response status:', error.message);
                    }
                    setApiError(error);
                    setDialog({
                        show: true,
                        type: 'api-error',
                        data: null,
                    });
                    console.error('There was an error!', error);
                    // throw getApiError(error);
                });
        }
        if (currentTab === 0) {
            resetSchemaState();
        }
    }, [currentTab]);

    useEffect(() => {
        setMemberList(projectDetails?.['members']);
    }, [projectDetails]);
    useEffect(() => {
        if (operationState?.isModified) {
            setUnsavedPopup(true);
        }
    }, [operationState?.isModified]);

    useEffect(() => {
        resetProjectState();
    }, [projectId]);

    useEffect(() => {
        if (projectDetails) {
            // Get user role
            // console.log(projectDetails?.members);
            if (projectDetails?.members && !_.isEmpty(projectDetails?.members)) {
                const userEmail = getEmailId();
                const currentUserDetails = projectDetails?.members?.find((member) => member?.email === userEmail);

                setRole(currentUserDetails?.role);
            }

            if (
                projectDetails?.status?.toLowerCase() !== 'in_progress' &&
                projectDetails?.status?.toLowerCase() !== 'complete'
            ) {
                navigateBack();
            }
        }
    }, [projectDetails]);

    useEffect(() => {
        if (projectDetailsError?.message?.toLowerCase() === 'no_access') {
            // No access
            navigateBack();
        }
    }, [projectDetailsError]);

    useEffect(() => {
        console.log('projectDetails', projectDetails?.projectType);

        if (verifyData && verifyData.message.length == 0) {
            if (projectDetails?.projectType !== 'noinput' || projectDetails?.projectType !== 'aggregate') {
                fetchTables({ projectId });
                setDisplayEntityMapping(true);
            } else {
                publish({ projectId, newProjectDetails });
            }
            setMandMappinErr(false);
        } else if (verifyError && verifyError.message === 'Mandatory mapping is required') {
            setMandMappinErr(true);
        } else {
            setMandMappinErr(false);
        }
        sessionStorage.removeItem('pageIndex');
    }, [verifyError, verifyData]);

    useEffect(() => {
        if (isSyncOperationSuccess && dialog?.show && dialog?.type === 'save-operation-warning') {
            handleCloseDialog();
            resetSyncOperationMutation();

            // if (dialog?.data === "with-nav") {
            //   navigateBack();
            // }
        }
    }, [isSyncOperationSuccess]);

    useEffect(() => {
        /* if (publishProjectData?.message == "Mandatory mapping is required") {
      setMandMappinErr(true);
    } else {
      setMandMappinErr(false);
    } */
        setNewProjectDetails(null);
    }, [publishProjectData, publishProjectError]);
    const startAutoSync = () => {
        stopAutoSync();

        const id = setInterval(() => {
            const { loadable: operationAtomLoadable } = getRecoilValueInfo(operationAtomWithMiddleware);
            const operationState = operationAtomLoadable?.contents;

            if (operationState?.isModified) {
                saveProject();
            }
        }, 6500);

        setAutoSync(id);
    };

    const stopAutoSync = () => {
        if (autoSyncIntervalId) {
            clearInterval(autoSyncIntervalId);
            setAutoSync(0);
        }
    };

    const resetProjectState = () => {
        resetTableState();
        resetOperationState();
        resetSchemaState();
        setCurrentView('grid');
    };

    const saveProject = () => {
        if (canEdit(userRole)) {
            const { loadable: operationAtomLoadable } = getRecoilValueInfo(operationAtomWithMiddleware);
            const operationState = operationAtomLoadable?.contents;
            const saveRequestApiRequest = generateSyncOperationRequestRequest(operationState?.operationRequest);
            const saveResponseApiRequest = generateSyncOperationResponseRequest(operationState?.operationResponse);

            syncOperation({
                projectId: operationState?.projectId,
                operationId: operationState?.operation?.operationId,
                pathId: operationState?.path?.pathId,
                resourceId: operationState?.resource?.resourceId,
                requestData: saveRequestApiRequest,
                responseData: saveResponseApiRequest,
            });
        }
    };

    const submitProject = () => {
        if (canEdit(userRole)) {
            const { loadable: operationAtomLoadable } = getRecoilValueInfo(operationAtomWithMiddleware);
            const operationState = operationAtomLoadable?.contents;

            if (operationState?.isModified) {
                showSaveOperationWarning();
            } else {
                resetPublishMutation();
                //console.log("newProjectDetails", newProjectDetails)
                publish({ projectId, newProjectDetails });
                //console.log("newProjectDetails2", newProjectDetails)
            }
        }
    };

    const closePublishProjectSuccess = () => {
        //resetEntityMapping();
        setEntityMappingData(undefined);
        setEntityMappingError(undefined);
        resetPublishMutation();
        resetVerify();
        history.push({
            pathname: routes.projects,
            state: { allow: true },
        });
    };

    const handleProfileMenuClick = (event) => {
        setProfilemenuAnchorEl(event?.currentTarget);
    };

    const showSaveOperationWarning = (dontSaveAction) => {
        stopAutoSync();

        setDialog({
            show: true,
            type: 'save-operation-warning',
            data: dontSaveAction,
        });
    };

    const apihandleCloseDialog = () => {
        setDialog({
            show: false,
            type: null,
            data: null,
        });
        setCurrentTab(0);
    };

    const handleCloseDialog = () => {
        if (dialog?.type === 'save-operation-warning') {
            startAutoSync();
        }

        setDialog({
            show: false,
            type: null,
            data: null,
        });
        setDataFetched(false);
        setDisplayEntityMapping(false);
    };

    const navigateBack = () => {
        resetSubmitProjectMutation();
        resetFetchProject();
        resetSyncOperationMutation();

        history.replace({
            pathname: routes.projects,
            state: { allow: true },
        });
        // history.goBack();
    };

    const resetSubmitProjectMutation = () => {
        resetPublishMutation();
        //resetVerifyMutation();
        resetVerify();
    };

    /* const isProjectHavingErrors = () =>
    isVerifyProjectSuccess &&
    verifyProjectData?.response &&
    !_.isEmpty(verifyProjectData?.response);
 */
    const didVerifyFailed = () => verificationSuccess && verifyData?.response && !_.isEmpty(verifyData?.response);

    const handleInviteClick = () => {
        async function projectdetails() {
            const { data } = await client.get(`${endpoint.project}/${projectId}`);
            // console.log(data?.["members"]);
            setMemberList(data?.['members']);
            setDataFetched(true);
        }
        projectdetails();

        if (canEdit(userRole)) {
            setDialog({
                show: true,
                type: 'members',
            });
        }
    };

    const isOperationSelected = () => {
        return (
            operationState?.operationIndex != null &&
            operationState?.operation != null &&
            operationState?.resource != null &&
            operationState?.path != null
        );
    };
    const isOperationExists = () => {
        var numberOfOp = 0;
        resources?.map((resource) => {
            resource?.path?.map((path) => {
                numberOfOp = numberOfOp + path?.operations?.length;
            });
        });

        return numberOfOp;
    };

    const isPublishLimitReached = () => {
        return publishProjectError?.response?.data?.errorType === 'PUBLISH_LIMIT_REACHED';
    };

    const isFreePublishesExhausted = () => {
        return publishProjectError?.response?.data?.errorType === 'FREE_PROJECTS_EXHAUSTED';
    };

    /* const updateMappingData = async () => {

    setInProgress(true);
    const data = projectDetails.dbDetails;
    /** IS THIS BELOW COMMENTING REQUIRED
    await publishProject({ projectId, data })
      .then((data) => {
        console.log("publish");
        setEntityMappingData(data);
      })
      .catch((err) => {
        console.log("not publish");
        setEntityMappingError(err);
    });

    publish({ projectId, data });
    setInProgress(false);
  }; */

    /*const updateMappingData = async (mappingData, credentials) => {
    const password = credentials ?? null;
    const data = await tableMappings(
      projectId,
      mappingData.filters,
      mappingData.relations,
      password
    ).then(closePublishProjectSuccess);
  };*/
    /* const updateMappingData = (mappingData, credentials) => {
    const password = credentials ?? null;

    pushMapppingData(
      projectId,
      mappingData.filters,
      mappingData.relations,
      password
    );
  }; */

    const getPublishButtonText = () => {
        if (projectDetails?.publishCount === 0) {
            return 'Publish';
        } else if (projectDetails?.publishCount > 0) {
            return 'Republish';
        }

        return 'Publish';
    };

    const canShowPublishCountStatus = () => {
        return projectDetails?.publishCount > 0 ?? false;
    };

    const showRepublishStatus = () => {
        setDialog({
            show: true,
            type: 'republish-status',
            data: null,
        });
    };

    const virtualDataAPI = () => {
        fetch(process.env.REACT_APP_API_URL + '/virtualData?projectId=' + projectId, {
            headers: {
                Authorization: `Bearer ${acc_token}`,
            },
        })
            .then((res) => {
                return res.json();
            })
            .then((result) => {
                if (result?.data) {
                    setSimulateVirtualData(result);
                    simulateAPI(result?.data?.[0]);
                } else {
                    throw result;
                }
            })

            .catch((error) => {
                setApiError(error);
                setDialog({
                    show: true,
                    type: 'api-error',
                    data: null,
                });
            });
    };

    const ErrorMessageClose = () => {
        setIsDeleteError(false);
    };

    const simulateAPI = (operation) => {
        //console.log(operation);
        fetch(process.env.REACT_APP_API_URL + '/simulate', {
            headers: {
                Authorization: `Bearer ${acc_token}`,
                'Content-Type': 'application/json',
            },
            method: 'POST',

            body: JSON.stringify({
                projectId: projectId,
                operation_id: operation.operation_id,
                httpMethod: operation.httpMethod,
                endpoint: operation.endpoint,
            }),
        })
            .then((res) => {
                return res.json();
            })
            .then((result) => {
                if (result?.data) {
                    setSimulateData(result?.data?.[0]);
                } else {
                    throw result;
                }
            })
            .catch((error) => {
                setApiError(error);
                setDialog({
                    show: true,
                    type: 'api-error',
                    data: null,
                });
            });
    };

    useEffect(() => {
        //console.log("outisde if", newProjectDetails)
        if (
            newProjectDetails?.password ||
            (newProjectDetails?.certificates &&
                newProjectDetails?.certificates?.length > 0 &&
                newProjectDetails?.caCertificates &&
                newProjectDetails?.caCertificates?.length > 0 &&
                newProjectDetails?.keys &&
                newProjectDetails?.keys?.length > 0)
        ) {
            //console.log("inside if", newProjectDetails)
            submitProject();
        }
    }, [newProjectDetails]);

    return (
        <UserRoleProvider role={userRole}>
            <>
                <Dialog
                    aria-labelledby="save-operation-dialog"
                    open={
                        isPublishingProject ||
                        //isVerifyingProject ||
                        isDeleteError ||
                        isVerifying ||
                        inProgress ||
                        publishProjectData ||
                        publishProjectError ||
                        entityMappingData ||
                        entityMappingError ||
                        //verifyProjectError ||
                        verifyError ||
                        (verifyData && verifyData?.message.length > 0) ||
                        //isProjectHavingErrors() ||
                        didVerifyFailed() ||
                        passwordBeforePublish ||
                        dialog?.show
                    }
                    closeAfterTransition={
                        isPublishingProject ||
                        inProgress ||
                        //isVerifyingProject ||
                        isVerifying ||
                        isDeleteError ||
                        entityMappingError ||
                        //verifyProjectError ||
                        publishProjectData ||
                        publishProjectError ||
                        //verifyProjectError ||
                        verifyError ||
                        (verifyData && verifyData?.message.length > 0) ||
                        //isProjectHavingErrors() ||
                        didVerifyFailed() ||
                        dialog?.show
                    }
                    fullWidth
                    PaperProps={{
                        style: { borderRadius: 8 },
                    }}
                    onClose={(event, reason) => {
                        if (reason !== 'backdropClick') {
                            // Handle your close dialog logic here
                        }
                    }}
                >
                    {(isPublishingProject || inProgress || isVerifying || isLoggingOut) && (
                        <div className="p-6">
                            <div className="w-full flex flex-row items-center">
                                <p className="text-overline mr-3">
                                    {isPublishingProject || inProgress
                                        ? 'Publishing project'
                                        : isLoggingOut
                                        ? 'Logging out'
                                        : isVerifying
                                        ? 'Logging in'
                                        : verificationSuccess
                                        ? 'Verifying Project'
                                        : null}
                                </p>
                                <CircularProgress style={{ width: '20px', height: '20px' }} />
                            </div>
                        </div>
                    )}

                    {/* {verifyProjectError && (
            <VerifyProjectError
              error={verifyProjectError}
              onClose={resetSubmitProjectMutation}
              onRetry={() => {
                verify({ projectId });
              }}
            />
          )}

          {verifyError && (
            <VerifyProjectError
              error={verifyError}
              onClose={resetSubmitProjectMutation}
              onRetry={() => {
                verifyProject({ projectId });
              }}
            />
          )}

          {isProjectHavingErrors() && (
            <ProjectVerificationErrors
              response={verifyProjectData?.response}
              onClose={resetSubmitProjectMutation}
            />
          )}

          {didVerifyFailed() && (
            <ProjectVerificationErrors
              response={verifyData?.response}
              onClose={resetSubmitProjectMutation}
            />
          )} */}

                    {verifyError && verifyError?.message !== 'Mandatory mapping is required' && (
                        <ProjectVerificationErrors error={verifyError} onClose={resetVerify} />
                    )}

                    {verifyData && verifyData?.message.length > 0 && (
                        <ProjectVerificationErrors error={verifyData} onClose={resetVerify} />
                    )}

                    {isDeleteError && (
                        <ErrorDrawer
                            message={'Object Cannot be empty inside another Object or Array'}
                            title={'Delete Failure'}
                            onClose={ErrorMessageClose}
                        />
                    )}

                    {(mandMappingErr || publishProjectData || publishProjectError) && (
                        <PublishProjectMessage
                            publishProjectData={publishProjectData}
                            publishProjectError={publishProjectError}
                            project={projectDetails}
                            mandMappingErr={mandMappingErr}
                            onButtonClick={() => {
                                if (publishProjectData?.success) {
                                    closePublishProjectSuccess();
                                } else {
                                    resetSubmitProjectMutation();
                                    if (mandMappingErr) {
                                        setDialog({
                                            show: true,
                                            type: 'mandatory_mapping',
                                            data: null,
                                        });
                                    }
                                    setMandMappinErr(false);
                                    fetchMMTablesData({ projectId });
                                    fetchTables({ projectId });
                                    if (isFreePublishesExhausted()) {
                                        history.push(generateRoute(routes.payment, projectId));
                                    } else if (isPublishLimitReached()) {
                                        history.push(routes.contact);
                                    }
                                }
                            }}
                            onClose={() => {
                                if (publishProjectData?.success) {
                                    closePublishProjectSuccess();
                                } else {
                                    resetSubmitProjectMutation();
                                }
                            }}
                        />
                    )}

                    {(entityMappingData || entityMappingError) && (
                        <PublishProjectMessage
                            publishProjectData={entityMappingData}
                            publishProjectError={entityMappingError}
                            project={projectDetails}
                            onButtonClick={() => {
                                if (entityMappingData?.success) {
                                    closePublishProjectSuccess();
                                } else {
                                    //resetEntityMapping();
                                    setEntityMappingData(undefined);
                                    setEntityMappingError(undefined);
                                    if (isFreePublishesExhausted()) {
                                        history.push(generateRoute(routes.payment, projectId));
                                    } else if (isPublishLimitReached()) {
                                        history.push(routes.contact);
                                    }
                                }
                            }}
                            onClose={() => {
                                if (entityMappingData?.success) {
                                    closePublishProjectSuccess();
                                } else {
                                    //resetEntityMapping();
                                    setEntityMappingData(undefined);
                                    setEntityMappingError(undefined);
                                }
                            }}
                        />
                    )}

                    {!isSyncingOperation && dialog?.show && dialog?.type === 'save-operation-warning' && (
                        <SaveOperationWarning
                            onClose={handleCloseDialog}
                            onDontSave={() => {
                                handleCloseDialog();
                                setUnsavedPopup(false);

                                if (dialog?.data === 'reset_operation_state') {
                                    resetProjectState();
                                }
                            }}
                            saveProject={() => {
                                if (dialog?.data === 'reset_operation_state') {
                                    resetProjectState();
                                }
                                handleCloseDialog();
                                saveProject();
                            }}
                        />
                    )}

                    {dialog?.type === 'members' && dataFetched && (
                        <ModifyCollaborators
                            projectId={projectId}
                            onClose={handleCloseDialog}
                            invitedCollaborators={memberList}
                        />
                    )}
                    {dialog?.type === 'api-error' && <ApiErrors error={apiError} onClose={apihandleCloseDialog} />}
                    {dialog?.type === 'republish-status' && (
                        <RepublishInfo project={projectDetails} onClose={handleCloseDialog} />
                    )}
                    {passwordBeforePublish && (
                        <CredentialsBeforePublish
                            onClose={() => {
                                setPasswordBeforePublish(false);
                            }}
                            newProjectDetails={projectDetails.dbDetails}
                            isDefaultproj={projectDetails.isDefaultSpecDb}
                            dbType={projectDetails.dbDetails.dbtype}
                            onPublish={(newProjectDetails, isDefaultproj, dbType) => {
                                //console.log("newProjectDetails,,",newProjectDetails)
                                setPasswordBeforePublish(false);
                                setNewProjectDetails(newProjectDetails, isDefaultproj, dbType);
                                /* if (projectDetails?.projectType === "db") {
                  //updateMappingData(mappedEntityData, newProjectDetails["password"]);
                  verifyProject({ projectId, newProjectDetails });
                } else {
                  //setNewProjectDetails(newProjectDetails, isDefaultproj);
                  submitProject();
                } */
                                //submitProject();
                            }}
                        />
                    )}
                </Dialog>
                <Drawer
                    anchor={'right'}
                    open={dialog?.show && dialog?.type === 'mandatory_mapping'}
                    onClose={handleCloseDialog}
                >
                    <MappingDrawer
                        newProjectDetails={newProjectDetails}
                        onClose={(data) => {
                            if (data === 'publish') {
                                //resetPublishMutation();
                                //verify({ projectId, newProjectDetails });
                                fetchTables({ projectId });
                                setMandMappinErr(false);
                                setDisplayEntityMapping(true);
                            } else {
                                handleCloseDialog();
                            }
                        }}
                        mmtableData={mmtablesData}
                        tablesData={tablesData}
                    />
                </Drawer>
                <Drawer
                    sx={{ overflowY: 'clip' }}
                    anchor={'right'}
                    open={displayEntityMapping}
                    onClose={handleCloseDialog}
                >
                    <DBMappingDrawer
                        projectId={projectId}
                        onClose={handleCloseDialog}
                        onSubmit={(mappedData) => {
                            setMappedEntityData(mappedData);
                            if (projectDetails?.isConnectDB && projectDetails?.dbDetails) {
                                setPasswordBeforePublish(true);
                            } else {
                                //updateMappingData(mappedData);
                                //verifyProject({ projectId, newProjectDetails });
                                setPasswordBeforePublish(false);
                                publish({ projectId, newProjectDetails });
                            }
                        }}
                        tablesData={tablesData}
                    />
                </Drawer>
                <DndProvider backend={HTML5Backend}>
                    <header
                        className="fixed top-0 w-full px-2 border-b-2 flex flex-row items-center bg-white z-50"
                        style={{ height: '50px' }}
                    >
                        <div className="flex flex-row py-2 items-center">
                            <AppIcon
                                style={{ marginRight: '1rem' }}
                                onClick={(event) => {
                                    event?.preventDefault();
                                    event?.stopPropagation();

                                    if (showUnsavedPopup && operationState?.isModified) {
                                        showSaveOperationWarning();
                                    } else {
                                        resetProjectState();
                                        navigateBack();
                                    }
                                }}
                            >
                                <ArrowBackIcon />
                            </AppIcon>

                            <p className="text-overline1 mr-3">{projectDetails?.projectName}</p>

                            <EzapiLogo />

                            {canEdit(userRole) && isOperationSelected() && (
                                <div className="ml-4">
                                    {!isSyncingOperation ? (
                                        <AppIcon
                                            onClick={(e) => {
                                                e?.preventDefault();
                                                e?.stopPropagation();

                                                saveProject();
                                            }}
                                        >
                                            <Tooltip title="Save changes">
                                                <CloudUploadIcon style={{ color: 'lightblue' }} />
                                            </Tooltip>
                                        </AppIcon>
                                    ) : (
                                        <div className="flex flex-row items-center">
                                            <CircularProgress
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    marginRight: '0.5rem',
                                                }}
                                            />

                                            <p className="text-overline2 opacity-60">Saving ...</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center flex-1">
                            <Tabs
                                value={currentTab}
                                onChange={(_, index) => {
                                    setCurrentTab(index);
                                }}
                                aria-label="add project tabs"
                                indicatorColor="primary"
                                textColor="primary"
                            >
                                <Tab
                                    label={<TabLabel label={'Design'} />}
                                    style={{ outline: 'none', border: 'none' }}
                                    // indicatorColor='primary'
                                    // textColor='primary'
                                />

                                {isOperationExists() && (
                                    <Tab
                                        label={<TabLabel label={'Simulate'} />}
                                        style={{ outline: 'none', border: 'none' }}
                                        // indicatorColor='primary'
                                        // textColor='primary'
                                    />
                                )}
                            </Tabs>
                        </div>

                        <div className="flex flex-row py-2">
                            {canEdit(userRole) && (
                                <OutlineButton classes="mr-3" onClick={handleInviteClick}>
                                    Invite
                                </OutlineButton>
                            )}

                            {canEdit(userRole) && (
                                <PrimaryButton
                                    classes={canShowPublishCountStatus() ? '' : 'mr-3'}
                                    onClick={(e) => {
                                        e?.preventDefault();
                                        e?.stopPropagation();
                                        // console.log(projectDetails?.isConnectDB);
                                        //console.log("githubCommit" , projectDetails?.githubCommit);
                                        /* if (projectDetails?.projectType === "db") {
                      fetchTables({ projectId });
                      setDisplayEntityMapping(true);
                    } else {
                      if (
                        projectDetails?.isConnectDB &&
                        projectDetails?.dbDetails
                      ) {
                        console.log("if password");
                        setPasswordBeforePublish(true);
                      } else {
                        console.log("without password");
                        submitProject();
                      }
                    } */ console.log('projectDetails2', projectDetails?.projectType);
                                        if (projectDetails?.projectType !== 'aggregate') {
                                            verifyProject({ projectId, newProjectDetails });
                                        } else {
                                            publish({ projectId, projectDetails });
                                        }
                                    }}
                                >
                                    {getPublishButtonText()}
                                </PrimaryButton>
                            )}

                            {canEdit(userRole) && canShowPublishCountStatus() && (
                                <div
                                    className="flex flex-col py-1 px-3 border-1 border-l-0 border-brand-secondary mr-3 justify-center cursor-pointer"
                                    style={{
                                        borderRadius: '4px',
                                        borderTopLeftRadius: '0px',
                                        borderBottomLeftRadius: '0px',
                                    }}
                                    onClick={(e) => {
                                        e?.preventDefault();
                                        e?.stopPropagation();

                                        showRepublishStatus();
                                    }}
                                >
                                    {projectDetails?.projectType !== 'noinput' ? (
                                        <p className="text-overline2 text-brand-secondary text-center">{`${projectDetails?.publishCount} / ${projectDetails?.publishLimit}`}</p>
                                    ) : (
                                        <p className="text-overline2 text-brand-secondary text-center">{`${projectDetails?.publishCount} / 999`}</p>
                                    )}
                                </div>
                            )}

                            <div>
                                <InitialsAvatar
                                    firstName={firstName}
                                    lastName={lastName}
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                        e?.preventDefault();
                                        e?.stopPropagation();

                                        handleProfileMenuClick(e);
                                    }}
                                />

                                <ProfileMenu
                                    onLogout={logout}
                                    profileMenuAnchorEl={profileMenuAnchorEl}
                                    setProfilemenuAnchorEl={setProfilemenuAnchorEl}
                                />
                            </div>
                        </div>
                    </header>

                    <div className="flex flex-row mt-14">
                        <section
                            className="border-r-2"
                            style={{
                                width: '300px',

                                height: `calc(100vh - 100px)`,
                            }}
                        >
                            {/* <Scrollbar style={{ height: `calc(100vh - 100px)` }}> */}
                            <Resources
                                className="h-full flex flex-col"
                                projectType={projectDetails?.projectType}
                                projectId={projectId}
                                onOperationSelect={(index, resource, path, operation) => {
                                    if (index === null && resource === null && path === null && operation === null) {
                                        if (showUnsavedPopup && operationState?.isModified) {
                                            showSaveOperationWarning('reset_operation_state');
                                        } else {
                                            resetOperationState();
                                        }
                                    } else if (index !== operationState.operationIndex) {
                                        if (showUnsavedPopup && operationState?.isModified) {
                                            showSaveOperationWarning('reset_operation_state');
                                        } else {
                                            // console.log(operationState);
                                            const cloned = _.cloneDeep(operationState);
                                            cloned.operation = operation;
                                            cloned.resource = resource;
                                            cloned.path = path;
                                            cloned.operationIndex = index;

                                            // console.log(cloned);

                                            setOperationState(cloned);
                                        }
                                    }
                                }}
                                isDesign={projectDetails?.isDesign}
                                onSimulateSelect={(operation) => simulateAPI(operation)}
                                currentTab={currentTab}
                                simulateData={simulateVirtualData}
                            />
                            {/* </Scrollbar> */}
                        </section>
                        <section className="w-full flex flex-col" style={{ height: `calc(100vh - 100px)` }}>
                            {currentTab === 0 && (
                                <>
                                    {' '}
                                    <div
                                        className={classNames(``, {
                                            'h-1/2': operationState.operationIndex && !checkBusinessFlow,
                                            'h-full': !operationState.operationIndex || checkBusinessFlow,
                                        })}
                                    >
                                        <Match
                                            projectType={projectDetails?.projectType}
                                            style={{ height: '100%' }}
                                            isBusinessFlow={(value) => {
                                                setBusinessFlow(value);
                                            }}
                                        />
                                    </div>
                                    {operationState.resource &&
                                        operationState.path &&
                                        operationState.operation &&
                                        !checkBusinessFlow && (
                                            <div
                                                className={classNames({
                                                    'h-1/2': operationState.operationIndex !== null,
                                                })}
                                            >
                                                <OperationDetails
                                                    projectType={projectDetails?.projectType}
                                                    canEdit={canEdit(userRole)}
                                                    onDelete={() => {
                                                        setIsDeleteError(true);
                                                    }}
                                                />
                                            </div>
                                        )}
                                </>
                            )}
                            {currentTab === 1 && <Simulate simulateData={simulateData} />}
                        </section>
                    </div>

                    <EzapiFooter />
                </DndProvider>
            </>
        </UserRoleProvider>
    );
};

export default Project;
