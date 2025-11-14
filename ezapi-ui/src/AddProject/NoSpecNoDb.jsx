import { Tab, Tabs } from '@material-ui/core';
import { useEffect, useRef, useState } from 'react';
import { useReward } from 'react-rewards';
//import { ReactComponent as Logo } from "../static/images/logo/connectoLogo.svg";
import CloseIcon from '@material-ui/icons/Close';
//import InfoIcon from '@mui/icons-material/Info';
import _ from 'lodash';
import { useHistory } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { PrimaryButton, TextButton } from '../shared/components/AppButton';
import AppIcon from '../shared/components/AppIcon';
import InviteCollaborators from '../shared/components/InviteCollaborators';
import LoaderWithMessage from '../shared/components/LoaderWithMessage';
import TabLabel from '../shared/components/TabLabel';
import routes from '../shared/routes';
import { getUserId } from '../shared/storage';
import { isEmailValid } from '../shared/utils';
import ProjectDetails from './ProjectDetails';
import { useAddProject, useUserProfile } from './addProjectQuery';
import projectAtom from './projectAtom';

const NoSpecNoDb = ({ onClose, onSuccess, noSpecNoDb, projectFlowType }) => {
    const [currentTab, setTab] = useState(1);
    const [connectDatabaseTab, setConnectDatabaseTab] = useState(0);
    const history = useHistory();
    const [open, setOpen] = useState(false);
    const [isDesign, setIsDesign] = useState(null);
    const [isMiddleState, setIsMiddleState] = useState(null);

    // const [isDesign, setIsDesign] = useState(true);
    const [errorDisplay, setErrorDisplay] = useState(false);
    const [specErrorDisplay, setSpecErrorDisplay] = useState(false);

    const [inviteCollabsErrorMssg, setInviteCollabsErrorMssg] = useState(false);
    const loggedInUserId = getUserId();
    const { reward, isAnimating } = useReward('rewardId', 'confetti');
    const [specsError, setSpecsError] = useState(null);
    const [dbsError, setDbsError] = useState(null);
    const [isProjectNameEmpty, setIsProjectNameEmpty] = useState(false);
    const [projectDetails, setProjectDetails] = useRecoilState(projectAtom);
    const [defaultClaimSpec, setDefaultClaimSpec] = useState(false);
    const [defaultAdvSpec, setDefaultAdvSpec] = useState(false);
    const [defaultAdvWorks, setDefaultAdvWorks] = useState(false);
    const [defaultMflix, setDefaultMflix] = useState(false);

    const onAddProjectSuccess = (projectId) => {
        onSuccess(projectId);
    };

    const {
        addProjectMutation,
        uploadSpecsMutation,
        uploadDbMutation,
        aiMatcherMutation,
        exportDBSchemaMutation,
        dbConnectionTestMutation,
        caCertificateMutation,
        certificateMutation,
        keyMutation,
    } = useAddProject(onAddProjectSuccess);

    const formRef = useRef();

    const prevFormRef = useRef();

    const {
        isLoading: isUploadingProjectDetails,
        error: projectDetailsError,
        isSuccess: isProjectDetailsUploadSuccess,
        data: createdProjectDetails,
        mutate: uploadProjectData,
        reset: resetCreateProjectApi,
    } = addProjectMutation;

    const {
        isLoading: isMatchingAi,
        error: matchAiError,
        isSuccess: matchAiSuccess,
        mutate: callAiMatcher,
        reset: resetAiMatcherApi,
    } = aiMatcherMutation;

    const {
        isLoading: isUploadingSpecs,
        error: uploadSpecsError,
        isSuccess: uploadSpecsSuccess,
        mutate: uploadSpecs,
        reset: resetUploadSpecsApi,
    } = uploadSpecsMutation;

    const {
        isLoading: isUploadingDbs,
        error: uploadDbsError,
        isSuccess: uploadDbsSuccess,
        mutate: uploadDbs,
        reset: resetUploadDbsApi,
    } = uploadDbMutation;

    const handleNext = () => {
        if (formRef.current) {
            formRef.current.handleSubmit();
            setTab(currentTab + 1);
        }
    };

    const handleSkipForNow = () => {
        setErrorDisplay(false);
        setInviteCollabsErrorMssg(false);
        resetCreateProjectApi();
        resetUploadDbsApi();
        resetUploadSpecsApi();
        exportDBSchemaApi();
        resetAiMatcherApi();

        if (_.isEmpty(projectDetails?.name)) {
            setTab(0);
            setIsProjectNameEmpty(true);
            if (formRef.current) {
                formRef.current.handleSubmit();
            }

            return;
        } else {
            setErrorDisplay(false);
            setSpecErrorDisplay(false);
            uploadProjectData({
                name: projectDetails?.name,
                invitees: projectDetails?.collaborators?.map((collaborator) => {
                    return {
                        email: collaborator,
                    };
                }),
                isDesign: true,
                isDefaultClaimSpec: defaultClaimSpec,
                isDefaultAdvSpec: defaultAdvSpec,
                isDefaultAdvWorks: defaultAdvWorks,
                isDefaultMflix: defaultMflix,
                projectType: projectFlowType,
                authdb: projectDetails.authdb,
            });
        }
    };

    const handleDone = () => {
        setErrorDisplay(false);
        setSpecErrorDisplay(false);
        if (projectDetails.collaborators.length < 1) {
            setInviteCollabsErrorMssg(true);
        } else {
            setInviteCollabsErrorMssg(false);
            resetCreateProjectApi();
            resetUploadDbsApi();
            resetUploadSpecsApi();
            exportDBSchemaApi();
            resetAiMatcherApi();

            if (_.isEmpty(projectDetails?.name)) {
                setTab(0);
                setIsProjectNameEmpty(true);
                if (formRef.current) {
                    formRef.current.handleSubmit();
                }

                return;
            } else {
                setErrorDisplay(false);
                setSpecErrorDisplay(false);
                //console.log("isDesign", isDesign)
                //console.log("noSpecNoDb", noSpecNoDb)
                uploadProjectData({
                    name: projectDetails?.name,
                    invitees: projectDetails?.collaborators?.map((collaborator) => {
                        return {
                            email: collaborator,
                        };
                    }),
                    isDesign: isDesign || noSpecNoDb,
                    isDefaultClaimSpec: defaultClaimSpec,
                    isDefaultAdvSpec: defaultAdvSpec,
                    isDefaultAdvWorks: defaultAdvWorks,
                    isDefaultMflix: defaultMflix,
                    projectType: projectFlowType,
                    authdb: projectDetails.authdb,
                });
            }
        }
    };

    const handleCollaboratorsChange = (collaborators) => {
        setProjectDetails((currProjectDetails) => {
            const updatedProjectDetails = _.cloneDeep(currProjectDetails);

            updatedProjectDetails.collaborators = [];
            collaborators.forEach((collaborator) => {
                if (!_.find(updatedProjectDetails.collaborators, collaborator) && isEmailValid(collaborator)) {
                    updatedProjectDetails.collaborators.push(collaborator);
                }
            });
            return updatedProjectDetails;
        });
    };

    const {
        mutate: testDatabase,
        isLoading: isUploadingCredentials,
        error: dbConnectionTestError,
        isSuccess: isDbConnectionSuccess,
        reset: dbConnectionTestApi,
    } = dbConnectionTestMutation;
    const {
        isLoading: isExportingDb,
        error: exportDBError,
        isSuccess: isExportDBSuccess,
        reset: exportDBSchemaApi,
    } = exportDBSchemaMutation;

    const {
        isLoading: isUploadingProjectKey,
        error: uploadProjectKeyError,
        isSuccess: isUploadProjectKeySuccess,
        reset: uploadKeyApi,
    } = keyMutation;

    const {
        isLoading: isUploadingProjectCertificate,
        error: uploadProjectCertificateError,
        isSuccess: isUploadProjectCertificateSuccess,
        reset: uploadCertificateApi,
    } = certificateMutation;

    const {
        isLoading: isUploadingProjectCACertificate,
        error: uploadProjectCACertificateError,
        isSuccess: isUploadProjectCACertificateSuccess,
        reset: uploadCaCertificateApi,
    } = caCertificateMutation;

    const { data: userProfile_data } = useUserProfile();

    useEffect(() => {
        prevFormRef.current = projectDetails.collaborators;
    }, [projectDetails.collaborators]);

    var showCollabsError = true;

    if (prevFormRef.current && prevFormRef.current.length > projectDetails.collaborators.length) {
        showCollabsError = false;
        // setShowCollabsErrorMssg(false);
    }

    useEffect(() => {
        const setDefault = async () => {
            if (defaultClaimSpec) {
                const claims = await fetch('/static/docs/claim-spec.json');
                // const claimsDb = await fetch("/static/docs/claims_script.sql");

                const specBlob = new Blob([await claims.text()]);
                const claimsSpec = new File([specBlob], 'claim-spec.json');

                // const dbBlob = new Blob([await claimsDb.text()]);
                // const defaultDb = new File([dbBlob], "claims_script.sql");

                setProjectDetails((currProjectDetails) => {
                    return {
                        ...currProjectDetails,
                        name: 'Claims',
                        specs: [claimsSpec],
                        database: 'db_claimsstaging',
                        host: '34.82.24.189',
                        port: '1433',
                        username: 'sa',
                        password: 'S0mbari@2022',
                        type: 'mssql',
                        dbType: 'db',
                    };
                });
            } else if (defaultAdvSpec) {
                const advWorks = await fetch('/static/docs/bikestore-basic.json');
                // const claimsDb = await fetch("/static/docs/claims_script.sql");

                const specBlob = new Blob([await advWorks.text()]);
                const defaultAdvSpec = new File([specBlob], 'bikestore.json');
                // const defAdvWorks = new File()

                // const dbBlob = new Blob([await claimsDb.text()]);
                // const defaultDb = new File([dbBlob], "claims_script.sql");

                setProjectDetails((currProjectDetails) => {
                    return {
                        ...currProjectDetails,
                        name: 'BikeStore',
                        specs: [defaultAdvSpec],
                        database: 'bikestoredb',
                        host: '34.82.24.189',
                        port: '1433',
                        username: 'sa',
                        password: 'S0mbari@2022',
                        dbType: 'db',
                        type: 'mssql',
                    };
                });
            } else if (!defaultAdvSpec) {
                setProjectDetails((currProjectDetails) => {
                    return {
                        ...currProjectDetails,
                        // name: "",
                        specs: [],
                        database: '',
                        host: '',
                        port: '',
                        username: '',
                        password: '',
                        dbType: '',
                        type: '',
                    };
                });
            } else {
                setProjectDetails((currProjectDetails) => {
                    return {
                        ...currProjectDetails,
                        name: '',
                        specs: null,
                        dbs: null,
                    };
                });
            }
        };
        setDefault();
    }, [defaultClaimSpec, defaultAdvSpec, setProjectDetails]);

    return (
        <>
            <div className="p-4">
                <div className="flex flex-row items-center justify-between mb-3">
                    <h5>Create New API Project</h5>
                    {!isUploadingProjectDetails &&
                        !isUploadingDbs &&
                        !isUploadingSpecs &&
                        !isMatchingAi &&
                        !isUploadingCredentials &&
                        !isUploadingProjectKey &&
                        !isUploadingProjectCertificate &&
                        !isUploadingProjectCACertificate &&
                        !isExportingDb && (
                            <AppIcon aria-label="close" onClick={onClose}>
                                <CloseIcon />
                            </AppIcon>
                        )}
                </div>

                {!isUploadingProjectDetails &&
                    !isUploadingDbs &&
                    !isUploadingSpecs &&
                    !isMatchingAi &&
                    !isUploadingCredentials &&
                    !isUploadingProjectKey &&
                    !isUploadingProjectCertificate &&
                    !isUploadingProjectCACertificate &&
                    !isExportingDb && (
                        <>
                            <Tabs
                                value={currentTab}
                                onChange={(_, index) => {
                                    setTab(index);
                                }}
                                aria-label="add project tabs"
                                indicatorColor="primary"
                                textColor="primary"
                            >
                                <Tab
                                    label={<TabLabel label={'1. Create API'} />}
                                    style={{ outline: 'none', border: 'none' }}
                                />
                                <Tab
                                    label={<TabLabel label={'2. Invite Collaborators'} />}
                                    style={{ outline: 'none', border: 'none' }}
                                />
                            </Tabs>

                            {/* Content */}
                            <div>
                                {currentTab === 0 ? (
                                    <div className="h-80">
                                        <ProjectDetails
                                            formRef={formRef}
                                            isDesign={isDesign}
                                            specsError={specsError}
                                            dbsError={dbsError}
                                            isProjectNameEmpty={isProjectNameEmpty}
                                            addProjectMutation={addProjectMutation}
                                            uploadSpecsMutation={uploadSpecsMutation}
                                            uploadDbMutation={uploadDbMutation}
                                            aiMatcherMutation={aiMatcherMutation}
                                            isClaimSpec={defaultClaimSpec}
                                            isAdvSpec={defaultAdvSpec}
                                            isNoSpecNoDb={true}
                                        />
                                    </div>
                                ) : (
                                    <div className="h-80">
                                        <InviteCollaborators
                                            handleChange={handleCollaboratorsChange}
                                            collaborators={projectDetails?.collaborators}
                                            addProjectMutation={addProjectMutation}
                                        />
                                    </div>
                                )}
                            </div>

                            {showCollabsError && projectDetailsError && (
                                <p className="text-overline2 text-accent-red my-2">
                                    {projectDetailsError?.response?.data?.message}
                                </p>
                            )}

                            {errorDisplay && currentTab === 2 && (
                                <p className="text-overline2 text-accent-red my-2">
                                    Please upload atleast one of the following - ddl file or dbconnection
                                </p>
                            )}

                            {specErrorDisplay && !isDesign && currentTab === 0 && (
                                <p className="text-overline2 text-accent-red my-2">Spec is required</p>
                            )}

                            {inviteCollabsErrorMssg && (
                                <p className="text-overline2 text-accent-red my-2">
                                    Please enter atleast one collaborator to create Project
                                </p>
                            )}

                            {dbConnectionTestError && (
                                <p className="text-overline2 text-accent-red my-2">
                                    {`Failed to connect Db - ${dbConnectionTestError?.message}`}
                                </p>
                            )}

                            {/* Bottom section */}
                            <div className="border-t-2 border-neutral-gray7 flex flex-row items-center justify-end pt-4">
                                {currentTab === 1 ? (
                                    <TextButton
                                        onClick={() => {
                                            handleSkipForNow();
                                        }}
                                        classes="flex-1 -ml-4 text-brand-secondary"
                                    >
                                        Skip for now
                                    </TextButton>
                                ) : null}

                                <TextButton
                                    onClick={() => {
                                        if (currentTab === 0) {
                                            onClose();
                                        } else {
                                            setTab(0);
                                        }
                                    }}
                                    classes="mr-3"
                                >
                                    {currentTab === 0 ? 'Cancel' : 'Back'}
                                </TextButton>

                                <PrimaryButton
                                    onClick={() => {
                                        if (currentTab === 0) {
                                            handleNext();
                                        }
                                        // else if (
                                        //     prevFormRef.current.length >
                                        //     projectDetails.collaborators.length
                                        //   ) {
                                        //     // setShowCollabsErrorMssg(false);
                                        //     handleDone();
                                        //   }
                                        else if (
                                            projectDetailsError?.response?.data?.errorType ==
                                                'PROJECTS_LIMIT_EXHAUSTED' ||
                                            projectDetailsError?.response?.data?.errorType == 'TRIAL_PERIOD_EXPIRED' ||
                                            (projectDetailsError?.response?.data?.errorType ==
                                                'COLLABRATOR_LIMIT_REACHED' &&
                                                showCollabsError)
                                        ) {
                                            history.push(routes.pricing);
                                            onClose();
                                        } else {
                                            handleDone();
                                        }
                                    }}
                                >
                                    {currentTab === 0
                                        ? 'Next'
                                        : projectDetailsError?.response?.data?.errorType ==
                                              'PROJECTS_LIMIT_EXHAUSTED' ||
                                          projectDetailsError?.response?.data?.errorType == 'TRIAL_PERIOD_EXPIRED' ||
                                          projectDetailsError?.response?.data?.errorType == 'COLLABRATOR_LIMIT_REACHED'
                                        ? 'Upgrade'
                                        : 'Done'}
                                </PrimaryButton>
                            </div>
                        </>
                    )}

                {isUploadingProjectDetails && (
                    <div className="my-7">
                        <LoaderWithMessage message="Creating new project" contained />
                    </div>
                )}

                {isExportingDb && (
                    <div className="my-7">
                        <LoaderWithMessage message="Scanning Schemas" contained />
                    </div>
                )}

                {isMatchingAi && (
                    <div className="my-7">
                        <LoaderWithMessage message="Running AI Matcher" contained />
                    </div>
                )}
            </div>
        </>
    );
};

export default NoSpecNoDb;
