import { IconButton, Tab, Tabs, TextField } from '@material-ui/core';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReward } from 'react-rewards';
import * as Yup from 'yup';
import apiNameSchema from '../shared/schemas/apiNameSchema';
//import { ReactComponent as Logo } from "../static/images/logo/connectoLogo.svg";
import CloseIcon from '@material-ui/icons/Close';
import Button from '@mui/material/Button';
import Logo from '../static/images/logo/newconnectoLogo.svg';
//import InfoIcon from '@mui/icons-material/Info';
import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import FormControl from '@mui/material/FormControl';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import aes from 'crypto-js/aes';
import _ from 'lodash';
import { useHistory } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { PrimaryButton, TextButton } from '../shared/components/AppButton';
import AppIcon from '../shared/components/AppIcon';
import InviteCollaborators from '../shared/components/InviteCollaborators';
import LoaderWithMessage from '../shared/components/LoaderWithMessage';
import TabLabel from '../shared/components/TabLabel';
import Messages from '../shared/messages';
import routes from '../shared/routes';
import { getUserId } from '../shared/storage';
import { isEmailValid } from '../shared/utils';
import ProductHunt from '../static/images/ProductHunt.jpg';
import ConnectDatabase from './ConnectDatabase';
import NoSpecNoDb from './NoSpecNoDb';
import ProjectDetails from './ProjectDetails';
import { useAddProject, usePricingData, useUserProfile } from './addProjectQuery';
import projectAtom from './projectAtom';

const AddProject = ({ onClose, onSuccess }) => {
    const [currentTab, setTab] = useState(0);
    const [connectDatabaseTab, setConnectDatabaseTab] = useState(0);
    const history = useHistory();
    const [open, setOpen] = useState(false);
    const [isDesign, setIsDesign] = useState(null);
    const [isMiddleState, setIsMiddleState] = useState(false);

    // const [isDesign, setIsDesign] = useState(true);
    const [errorDisplay, setErrorDisplay] = useState(false);
    const [specErrorDisplay, setSpecErrorDisplay] = useState(false);
    const [value, setValue] = useState('dataprovider');

    const [inviteCollabsErrorMssg, setInviteCollabsErrorMssg] = useState(false);
    const [sampleProjCnt, setSampleProjCnt] = useState(1);
    const [sampleAdvWorksDBPCnt, setSampleAdvWorksDBCnt] = useState(1);
    const [sampleMFlixDBCnt, setSampleMFlixDBCnt] = useState(1);
    const loggedInUserId = getUserId();
    const { reward, isAnimating } = useReward('rewardId', 'confetti');
    const [specsError, setSpecsError] = useState(null);
    const [dbsError, setDbsError] = useState(null);
    const [isProjectNameEmpty, setIsProjectNameEmpty] = useState(false);
    const [projectDetails, setProjectDetails] = useRecoilState(projectAtom);
    const [defaultClaimSpec, setDefaultClaimSpec] = useState(false);
    const [defaultAdvSpec, setDefaultAdvSpec] = useState(false);
    const [defaultFlow, setDefaultFlow] = useState(false);
    const [aggregateFlow, setAggregateFlow] = useState(false);
    const [projectFlowType, setProjectFlowType] = useState('noinput');
    const [noSpecNoDb, setNoSpecNoDb] = useState(false);
    const [defaultAdvWorks, setDefaultAdvWorks] = useState(false);
    const [defaultMflix, setDefaultMflix] = useState(false);

    const [disableAdvSpec, setDisableAdvSpec] = useState(false);
    const [disableAdvWorks, setDisableAdvWorks] = useState(false);
    const [disableMflix, setDisableMflix] = useState(false);
    const [connectors, setConnectors] = useState({
        ms_sql: true,
        my_sql: true,
        postgres: true,
        mongo: true,
        oracle: true,
    });

    const hideClaims = false;
    const sampleProjLimit = process.env.REACT_APP_SAMPLE_PROJ_LIMIT;
    const displayAggAPI = process.env.REACT_APP_DISABLE_AGGREGATE;

    useEffect(() => {
        reward();
    }, []);

    const onAddProjectSuccess = (projectId) => {
        onSuccess(projectId);
    };
    const deployenv = process.env.REACT_APP_DEPLOY_ENV;

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
            console.log('formRef.current.values.name...', formRef.current.values.name);
            /* if (currentTab === 0) {
        debouncedSetName(formRef.current.values.name);
      } */
            formRef.current.handleSubmit();
            //console.log("currentTab in HNxt", currentTab, defaultAdvSpec, defaultAdvWorks, defaultMflix)
            //console.log("projectDetails in HNxt", projectDetails)
            if (currentTab === 0 && (defaultAdvSpec || defaultAdvWorks || defaultMflix)) {
                setTab(currentTab + 2);
                //console.log("mame", formRef.current.name)
            } else if (formRef.current.isValid) {
                //console.log("1...")
                if (
                    (currentTab === 0 && (!_.isEmpty(projectDetails?.name) || projectDetails?.name !== '')) ||
                    (currentTab === 1 && connectDatabaseTab === 0) ||
                    (currentTab === 1 && connectDatabaseTab === 1 && !_.isEmpty(projectDetails?.dbType))
                ) {
                    //console.log("2...")
                    //console.log("mame", formRef.current.values.name)
                    setTab(currentTab + 1);
                }
            }
            // if (
            //   formRef.current.isValid &&
            //   !_.isEmpty(projectDetails?.name) &&
            //   currentTab === 0
            // ) {
            //   setTab(currentTab + 1);
            //   console.log("##",formRef);

            // }
            //  else if (currentTab === 1 &&
            //   connectDatabaseTab === 1) {
            //   formRef.current.handleSubmit();
            //   setTab(currentTab + 1);
            // }
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
        } else if (
            _.isEmpty(projectDetails?.dbs) &&
            _.isEmpty(projectDetails?.type) &&
            _.isEmpty(projectDetails?.specs) &&
            isDesign
        ) {
            uploadProjectData({
                name: projectDetails?.name,
                invitees: projectDetails?.collaborators?.map((collaborator) => {
                    return {
                        email: collaborator,
                    };
                }),
                isDesign: isDesign,
                isDefaultClaimSpec: defaultClaimSpec,
                isDefaultAdvSpec: defaultAdvSpec,
                isDefaultAdvWorks: defaultAdvWorks,
                isDefaultMflix: defaultMflix,
                projectType: projectFlowType,
                authdb: projectDetails.authdb,
            });
        } else if (
            ((!defaultClaimSpec || !defaultAdvSpec || !defaultAdvWorks || !defaultMflix) &&
                _.isEmpty(projectDetails?.dbs) &&
                (_.isEmpty(projectDetails?.host) ||
                    (_.isEmpty(projectDetails?.port) && projectDetails?.type !== 'mongo') ||
                    _.isEmpty(projectDetails?.username) ||
                    (_.isEmpty(projectDetails?.password) && !projectDetails?.overssl) ||
                    _.isEmpty(projectDetails?.database) ||
                    _.isEmpty(projectDetails?.type))) ||
            (projectDetails?.overssl &&
                (_.isEmpty(projectDetails?.keys) ||
                    _.isEmpty(projectDetails?.certificates) ||
                    _.isEmpty(projectDetails?.caCertificates)) &&
                _.isEmpty(projectDetails?.specs) &&
                isDesign)
        ) {
            console.log('. add later.. error', projectDetails?.type);
            setErrorDisplay(true);
            /* uploadProjectData({
        name: projectDetails?.name,
        invitees: projectDetails?.collaborators?.map((collaborator) => {
          return {
            email: collaborator,
          };
        }),
        isDesign: isDesign,
        isDefaultClaimSpec: defaultClaimSpec,
        isDefaultAdvSpec: defaultAdvSpec,
        projectType: "noinput"
      }); */
        } else if (_.isEmpty(projectDetails?.specs) && !isDesign) {
            setTab(0);
            setSpecErrorDisplay(true);
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
                isDesign: isDesign,
                isDefaultClaimSpec: defaultClaimSpec,
                isDefaultAdvSpec: defaultAdvSpec,
                isDefaultAdvWorks: defaultAdvWorks,
                isDefaultMflix: defaultMflix,
                projectType: 'none',
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
            } else if (
                (_.isEmpty(projectDetails?.dbs) &&
                    (_.isEmpty(projectDetails?.host) ||
                        (_.isEmpty(projectDetails?.port) && projectDetails?.type !== 'mongo') ||
                        _.isEmpty(projectDetails?.username) ||
                        (_.isEmpty(projectDetails?.password) && !projectDetails?.overssl) ||
                        _.isEmpty(projectDetails?.database) ||
                        _.isEmpty(projectDetails?.type))) ||
                (projectDetails?.overssl &&
                    (_.isEmpty(projectDetails?.keys) ||
                        _.isEmpty(projectDetails?.certificates) ||
                        _.isEmpty(projectDetails?.caCertificates)))
            ) {
                //console.log("..done error here..")
                setErrorDisplay(true);
            } else if (_.isEmpty(projectDetails?.specs) && !isDesign) {
                setSpecErrorDisplay(true);
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
                    isDesign: isDesign,
                    isDefaultClaimSpec: defaultClaimSpec,
                    isDefaultAdvSpec: defaultAdvSpec,
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

    const openInNewTab = (url) => {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (newWindow) newWindow.opener = null;
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

    const databaseConnectionTest = () => {
        uploadKeyApi();
        uploadCertificateApi();
        uploadCaCertificateApi();
        dbConnectionTestApi();
        if (
            !_.isEmpty(projectDetails?.keys) &&
            !_.isEmpty(projectDetails?.certificates) &&
            !_.isEmpty(projectDetails?.caCertificates)
        ) {
            keyMutation.mutate({
                projectId: loggedInUserId,
                file: projectDetails?.keys[0],
                userId: loggedInUserId,
                test: true,
            });
        } else {
            var ciphertext = aes.encrypt(projectDetails.password, process.env.REACT_APP_AES_ENCRYPTION_KEY).toString();
            let payload = {
                host: projectDetails.host,
                port: projectDetails.port,
                username: projectDetails.username,
                password: ciphertext,
                database: projectDetails.database,
                type: projectDetails.type,
                authdb: projectDetails.authdb,
            };
            testDatabase(payload);
        }
    };

    const handleClick = () => {
        setOpen(true);
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpen(false);
    };

    const action = (
        <React.Fragment>
            <Button color="secondary" size="small" onClick={handleClose}>
                UNDO
            </Button>
            <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                <CloseIcon fontSize="small" />
            </IconButton>
        </React.Fragment>
    );

    const Alert = React.forwardRef(function Alert(props, ref) {
        return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
    });

    const handleClaimCheck = (e) => {
        setDefaultClaimSpec(e.target.checked);
    };
    const handleAdvCheck = (e) => {
        setDefaultAdvSpec(e.target.checked);
        setDisableMflix(e.target.checked);
        setDisableAdvWorks(e.target.checked);
    };
    const handleDefaultFlow = () => {
        setDefaultFlow(true);
        setAggregateFlow(false);
        setProjectFlowType('noinput');
    };
    const handleAggregateFlow = () => {
        setAggregateFlow(true);
        setDefaultFlow(false);
        setProjectFlowType('aggregate');
    };
    const handleChange = (event) => {
        if (event.target.value === 'noinput') {
            handleDefaultFlow();
        } else if (event.target.value === 'aggregate') {
            handleAggregateFlow();
        } else if (event.target.value === 'dataprovider') {
            setAggregateFlow(false);
            setDefaultFlow(false);
        }
        setValue(event.target.value);
    };

    const handleAdvWorks = (e) => {
        setDefaultAdvWorks(e.target.checked);
        setDisableMflix(e.target.checked);
        setDisableAdvSpec(e.target.checked);
    };
    const handleMflix = (e) => {
        //console.log("chk status", e.target.checked)
        setDefaultMflix(e.target.checked);
        setDisableAdvWorks(e.target.checked);
        setDisableAdvSpec(e.target.checked);
    };

    const handlingFlow = () => {
        if (_.isEmpty(projectDetails?.name)) {
            // setTab(0);
            // setIsProjectNameEmpty(true);
            if (formRef.current) {
                formRef.current.handleSubmit();
            }

            return;
        }
        if (defaultFlow || aggregateFlow) {
            setNoSpecNoDb(true);
            setIsDesign(null);
        } else {
            setIsDesign(true);
            setIsMiddleState(false);
        }
        return;
    };
    const { data: userProfile_data } = useUserProfile();

    useEffect(() => {
        //console.log("userdata", userProfile_data)
        setSampleProjCnt(userProfile_data?.['sampleProjCount']);
        setSampleAdvWorksDBCnt(userProfile_data?.['sampleAdvWorksDBProjCnt']);
        setSampleMFlixDBCnt(userProfile_data?.['sampleMFlixDBProjCnt']);
    }, [userProfile_data]);

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
            } else if (defaultAdvWorks) {
                setProjectDetails((currProjectDetails) => {
                    return {
                        ...currProjectDetails,
                        name: 'AdvWorks',
                        specs: [],
                        database: 'AdventureWorks2019',
                        host: '34.82.24.189',
                        port: '1433',
                        username: 'sa',
                        password: 'S0mbari@2022',
                        dbType: 'db',
                        type: 'mssql',
                    };
                });
            } else if (defaultMflix) {
                setProjectDetails((currProjectDetails) => {
                    return {
                        ...currProjectDetails,
                        name: 'MflixDB',
                        specs: [],
                        database: 'mflix',
                        host: '34.66.45.162',
                        port: '27017',
                        username: 'root',
                        password: 'JRVvuh9D5V0IZxCW',
                        dbType: 'db',
                        type: 'mongo',
                    };
                });
            } else if (!defaultAdvSpec || !defaultAdvWorks || !defaultMflix) {
                //console.log("useeffect-call any is true")
                setProjectDetails((currProjectDetails) => {
                    return {
                        ...currProjectDetails,
                        name: currProjectDetails.prevName,
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
                        name: currProjectDetails.prevName,
                        specs: null,
                        dbs: null,
                    };
                });
            }
        };
        setDefault();
    }, [defaultClaimSpec, defaultAdvSpec, defaultAdvWorks, defaultMflix, setProjectDetails]);

    const isClaimChecked = () => {
        setDefaultAdvSpec(false);
    };
    const isAdvChecked = () => {
        setDefaultClaimSpec(false);
    };
    const isAdvWorksChecked = () => {
        setDefaultAdvWorks(false);
    };
    const isMflixChecked = () => {
        setDefaultMflix(false);
    };
    const resetProjectApiState = () => {
        addProjectMutation?.reset();
        uploadSpecsMutation?.reset();
        uploadDbMutation?.reset();
        aiMatcherMutation?.reset();
    };
    const debouncedSetName = useCallback(
        debounce((nextValue) => {
            // resetProjectApiState();

            setProjectDetails((currProjectDetails) => {
                return {
                    ...currProjectDetails,
                    name: nextValue,
                };
            });
        }, 300),
        [], // will be created only once initially
    );

    const debouncedSetPrevName = useCallback(
        debounce((nextValue) => {
            //resetProjectApiState();
            //console.log("nextValue", nextValue)
            setProjectDetails((currProjectDetails) => {
                return {
                    ...currProjectDetails,
                    prevName: nextValue,
                };
            });
        }, 300),
        [], // will be created only once initially
    );

    const debouncedSetNumberOfCollaborators = useCallback(
        debounce((nextValue) => {
            resetProjectApiState();

            setProjectDetails((currProjectDetails) => {
                return {
                    ...currProjectDetails,
                    numberOfCollaborators: nextValue,
                };
            });
        }, 300),
        [], // will be created only once initially
    );
    const { data: pricing_data } = usePricingData();
    useEffect(() => {
        if (pricing_data && userProfile_data) {
            if (userProfile_data['plan_name'] == null || userProfile_data['plan_name'] == 'Basic') {
                debouncedSetNumberOfCollaborators(2);
                setConnectors({ ms_sql: true, my_sql: true, postgres: true, mongodb: true, oracle: true });
            } else {
                const filtered_plan = pricing_data['products'].filter(
                    (item) => item['plan_name'] == userProfile_data['plan_name'],
                )[0];
                debouncedSetNumberOfCollaborators(filtered_plan['no_of_collaborators']);
                setConnectors(filtered_plan['connectors']);
            }
        }
    }, [pricing_data, userProfile_data]);

    //console.log("projectdetails in AddProject", projectDetails);

    return (
        <>
            {noSpecNoDb && (
                <NoSpecNoDb
                    onClose={onClose}
                    onSuccess={onSuccess}
                    noSpecNoDb={noSpecNoDb}
                    projectFlowType={projectFlowType}
                />
            )}
            {isDesign != null && isMiddleState && (
                <div className="p-4">
                    <div className="flex flex-row items-center justify-between mb-3">
                        {<h5>Create API</h5>}
                        <div>
                            {' '}
                            <img style={{ width: '150px' }} src={ProductHunt} alt="producthunt" />
                        </div>
                        <AppIcon aria-label="close" onClick={onClose}>
                            <CloseIcon />
                        </AppIcon>
                    </div>{' '}
                    <p className="text-mediumLabel mb-2">API Name</p>
                    <div className="mb-4">
                        <Formik
                            initialValues={{
                                name: projectDetails?.name ?? '',
                            }}
                            validationSchema={Yup.object().shape({
                                name: apiNameSchema(Messages.NAME_REQUIRED),
                            })}
                            innerRef={formRef}
                        >
                            {({ errors, touched, values, submitForm, validateForm, handleBlur, setErrors }) => (
                                <Form>
                                    <Field
                                        id="name"
                                        name="name"
                                        fullWidth
                                        color="primary"
                                        error={touched.name && Boolean(errors.name)}
                                        helperText={<ErrorMessage name="name" />}
                                        onKeyUp={(e) => {
                                            const { value } = e.target;
                                            debouncedSetName(value);
                                            debouncedSetPrevName(value);
                                        }}
                                        variant="outlined"
                                        inputProps={{ maxLength: 24 }}
                                        // disabled={addProjectMutation?.isSuccess}
                                        as={TextField}
                                    />
                                </Form>
                            )}
                        </Formik>
                    </div>
                    <FormControl>
                        <RadioGroup
                            aria-labelledby="demo-row-radio-buttons-group-label"
                            row
                            name="radio-buttons-group"
                            defaultValue="dataprovider"
                            value={value}
                            onChange={handleChange}
                        >
                            <FormControlLabel
                                className="pr-12"
                                value="noinput"
                                control={<Radio />}
                                label={<Box fontSize={14}>Free format API</Box>}
                            />
                            <FormControlLabel
                                className="pr-12"
                                value="dataprovider"
                                control={<Radio />}
                                label={<Box fontSize={14}>Data API</Box>}
                            />
                            {displayAggAPI !== 'true' ? (
                                <FormControlLabel
                                    value="aggregate"
                                    control={<Radio />}
                                    label={<Box fontSize={14}>Aggregate API </Box>}
                                />
                            ) : (
                                ''
                            )}
                        </RadioGroup>
                    </FormControl>
                    {/* <FormGroup> */}
                    {/* <div className='flex flex-row'>
            <div className = "mr-6">
            <FormControlLabel
              control={

                ( <Checkbox
                  size="small"
                  // disabled={(sampleProjCnt >= 3 || (currentTab==1 || currentTab ==2 ))}
                  onChange={(e) => handleDefaultFlow(e)}
                  checked={defaultFlow}
                  // onClick={() => isAdvChecked()}
                />
                )
              }
              label={<Box fontSize={14}>Free format API Design</Box>}
            />
            </div>
            <div>
            <FormControlLabel
              control={
                ( <Checkbox
                  size="small"
                  onChange={(e) => handleAggregateFlow(e)}
                  checked={aggregateFlow}
                />
                )
              }
              label={<Box fontSize={14}>Aggregate API Design</Box>}
            />
            </div>
          </div> */}
                    {/* </FormGroup> */}
                    <div className="border-t-2 border-neutral-gray7 flex flex-row items-center justify-end pt-4">
                        <TextButton
                            onClick={() => {
                                onClose();
                            }}
                            classes="mr-3"
                        >
                            Cancel
                        </TextButton>

                        <PrimaryButton
                            onClick={() => {
                                handlingFlow();
                            }}
                        >
                            Next
                        </PrimaryButton>
                    </div>
                </div>
            )}
            {isDesign != null && !isMiddleState && (
                <div className="p-4" style={{ height: 'auto' }}>
                    <div className="flex flex-row items-center justify-between mb-3">
                        {isDesign ? <h5>Create New API Project</h5> : <h5>Test API Project</h5>}

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
                                        label={<TabLabel label={'2. Connect Database'} />}
                                        style={{ outline: 'none', border: 'none' }}
                                    />
                                    <Tab
                                        label={<TabLabel label={'3. Invite Collaborators'} />}
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
                                                isNoSpecNoDb={false}
                                                isAdvWorks={defaultAdvWorks}
                                                isMflix={defaultMflix}
                                            />
                                        </div>
                                    ) : currentTab === 1 ? (
                                        <div className="h-95">
                                            <ConnectDatabase
                                                formRef={formRef}
                                                specsError={specsError}
                                                dbsError={dbsError}
                                                addProjectMutation={addProjectMutation}
                                                uploadSpecsMutation={uploadSpecsMutation}
                                                uploadDbMutation={uploadDbMutation}
                                                aiMatcherMutation={aiMatcherMutation}
                                                activeTab={connectDatabaseTab}
                                                handleTabChange={setConnectDatabaseTab}
                                                isClaimSpec={defaultClaimSpec}
                                                isAdvSpec={defaultAdvSpec}
                                                isAdvWorks={defaultAdvWorks}
                                                isMflix={defaultMflix}
                                                connectors={connectors}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-180">
                                            <InviteCollaborators
                                                handleChange={handleCollaboratorsChange}
                                                collaborators={projectDetails?.collaborators}
                                                addProjectMutation={addProjectMutation}
                                            />
                                        </div>
                                    )}
                                    {hideClaims && (
                                        <FormGroup>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        onChange={(e) => handleClaimCheck(e)}
                                                        checked={defaultClaimSpec}
                                                        onClick={() => isClaimChecked()}
                                                    />
                                                }
                                                label={<Box fontSize={14}>Use default Claim Spec</Box>}
                                            />
                                        </FormGroup>
                                    )}
                                    {((!defaultAdvSpec && currentTab == 0) ||
                                        (!defaultAdvWorks && currentTab == 0) ||
                                        (!defaultClaimSpec && currentTab == 0)) && (
                                        <FormGroup>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        disabled={
                                                            sampleProjCnt >= sampleProjLimit ||
                                                            currentTab == 1 ||
                                                            currentTab == 2 ||
                                                            disableAdvSpec
                                                        }
                                                        onChange={(e) => handleAdvCheck(e)}
                                                        checked={defaultAdvSpec}
                                                        onClick={() => isAdvChecked()}
                                                    />
                                                }
                                                label={
                                                    sampleProjCnt < sampleProjLimit ? (
                                                        <Box fontSize={14}>Use default BikeStore Spec</Box>
                                                    ) : (
                                                        <Box fontSize={14}>
                                                            Sample Projects limit of {sampleProjLimit} Utilized for
                                                            Bikestore Spec{' '}
                                                        </Box>
                                                    )
                                                }
                                            />
                                            {isDesign && (
                                                <>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                size="small"
                                                                disabled={
                                                                    sampleAdvWorksDBPCnt >= sampleProjLimit ||
                                                                    currentTab == 1 ||
                                                                    currentTab == 2 ||
                                                                    disableAdvWorks
                                                                }
                                                                onChange={(e) => handleAdvWorks(e)}
                                                                checked={defaultAdvWorks}
                                                                onClick={() => isAdvWorksChecked()}
                                                            />
                                                        }
                                                        label={
                                                            sampleAdvWorksDBPCnt < sampleProjLimit ? (
                                                                <Box fontSize={14}>Use default Adventure Works DB</Box>
                                                            ) : (
                                                                <Box fontSize={14}>
                                                                    Sample Projects limit of {sampleProjLimit} Utilized
                                                                    for Adventure Works DB
                                                                </Box>
                                                            )
                                                        }
                                                    />
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                size="small"
                                                                disabled={
                                                                    sampleMFlixDBCnt >= sampleProjLimit ||
                                                                    currentTab == 1 ||
                                                                    currentTab == 2 ||
                                                                    disableMflix
                                                                }
                                                                onChange={(e) => handleMflix(e)}
                                                                checked={defaultMflix}
                                                                onClick={() => isMflixChecked()}
                                                            />
                                                        }
                                                        label={
                                                            sampleMFlixDBCnt < sampleProjLimit ? (
                                                                <Box fontSize={14}>Use default Mflix MongoDB</Box>
                                                            ) : (
                                                                <Box fontSize={14}>
                                                                    Sample Projects limit of {sampleProjLimit} Utilized
                                                                    for Mflix MongoDB
                                                                </Box>
                                                            )
                                                        }
                                                    />
                                                </>
                                            )}
                                        </FormGroup>
                                    )}
                                </div>

                                {showCollabsError && projectDetailsError && (
                                    <p className="text-overline2 text-accent-red my-2">
                                        {projectDetailsError?.response?.data?.message}
                                    </p>
                                )}
                                {/* Please upload atleast one of the following - ddl file or dbconnection */}
                                {errorDisplay && currentTab === 2 && (
                                    <p className="text-overline2 text-accent-red my-2">
                                        Please enter values for all the fields in the dbconnection
                                    </p>
                                )}

                                {specErrorDisplay && !isDesign && currentTab === 0 && (
                                    <p className="text-overline2 text-accent-red my-2">Spec is required</p>
                                )}

                                {inviteCollabsErrorMssg &&
                                    currentTab == 2 &&
                                    projectDetails.collaborators.length === 0 && (
                                        <p className="text-overline2 text-accent-red mb-2">
                                            Please enter atleast one collaborator to create Project
                                        </p>
                                    )}

                                {dbConnectionTestError && (
                                    <p className="text-overline2 text-accent-red my-2">
                                        {`Failed to connect Db - ${dbConnectionTestError?.message}`}
                                    </p>
                                )}

                                {isDbConnectionSuccess && (
                                    <Snackbar open={open} autoHideDuration={6000} onClose={handleClose} action={action}>
                                        <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
                                            Db connection is successful
                                        </Alert>
                                    </Snackbar>
                                )}

                                {exportDBError && (
                                    <p className="text-overline2 text-accent-red my-2">
                                        {`Failed to export db - ${exportDBError?.message}`}
                                    </p>
                                )}
                                {uploadProjectKeyError && (
                                    <p className="text-overline2 text-accent-red my-2">
                                        {`Failed to upload key - ${uploadProjectKeyError?.message}`}
                                    </p>
                                )}
                                {uploadProjectCertificateError && (
                                    <p className="text-overline2 text-accent-red my-2">
                                        {`Failed to upload certificate - ${uploadProjectCertificateError?.message}`}
                                    </p>
                                )}
                                {uploadProjectCACertificateError && (
                                    <p className="text-overline2 text-accent-red my-2">
                                        {`Failed to upload caCertificate - ${uploadProjectCACertificateError?.message}`}
                                    </p>
                                )}
                                {uploadSpecsError && (
                                    <p className="text-overline2 text-accent-red my-2">
                                        {`Failed to upload specs - ${uploadSpecsError?.message}`}
                                    </p>
                                )}

                                {uploadDbsError && (
                                    <p className="text-overline2 text-accent-red my-2">
                                        {`Failed to upload dbs - ${uploadDbsError?.message}`}
                                    </p>
                                )}

                                {matchAiError && (
                                    <p className="text-overline2 text-accent-red my-2">{matchAiError?.message}</p>
                                )}

                                {/* Bottom section */}
                                <div className="border-t-2 border-neutral-gray7 flex flex-row items-center justify-end pt-4">
                                    {currentTab === 2 ? (
                                        <TextButton
                                            onClick={() => {
                                                handleSkipForNow();
                                            }}
                                            classes="flex-1 -ml-4 text-brand-secondary"
                                        >
                                            Add Later
                                        </TextButton>
                                    ) : null}

                                    <TextButton
                                        onClick={() => {
                                            if (currentTab === 0 || (currentTab === 1 && connectDatabaseTab === 1)) {
                                                onClose();
                                            } else if (currentTab === 1) {
                                                handleClick();
                                                if (formRef.current) {
                                                    formRef.current.handleSubmit();
                                                    if (
                                                        formRef.current.isValid &&
                                                        !_.isEmpty(projectDetails?.host) &&
                                                        // !_.isEmpty(projectDetails?.port) &&
                                                        !_.isEmpty(projectDetails?.username) &&
                                                        !_.isEmpty(projectDetails?.database) &&
                                                        !_.isEmpty(projectDetails?.type)
                                                    ) {
                                                        databaseConnectionTest();
                                                    }
                                                }
                                            } else {
                                                setTab(1);
                                            }
                                        }}
                                        classes="mr-3"
                                    >
                                        {currentTab === 0
                                            ? 'Cancel'
                                            : currentTab === 1
                                            ? connectDatabaseTab === 0
                                                ? 'Test'
                                                : 'Cancel'
                                            : 'Back'}
                                    </TextButton>

                                    <PrimaryButton
                                        onClick={() => {
                                            if (currentTab === 0 || currentTab === 1) {
                                                handleNext();
                                            } else if (
                                                prevFormRef.current.length > projectDetails.collaborators.length
                                            ) {
                                                // setShowCollabsErrorMssg(false);
                                                handleDone();
                                            } else if (
                                                projectDetailsError?.response?.data?.errorType ==
                                                    'PROJECTS_LIMIT_EXHAUSTED' ||
                                                projectDetailsError?.response?.data?.errorType ==
                                                    'TRIAL_PERIOD_EXPIRED' ||
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
                                        {currentTab === 0 || currentTab === 1
                                            ? 'Next'
                                            : prevFormRef.current.length > projectDetails.collaborators.length
                                            ? 'Done'
                                            : projectDetailsError?.response?.data?.errorType ==
                                                  'PROJECTS_LIMIT_EXHAUSTED' ||
                                              projectDetailsError?.response?.data?.errorType ==
                                                  'TRIAL_PERIOD_EXPIRED' ||
                                              projectDetailsError?.response?.data?.errorType ==
                                                  'COLLABRATOR_LIMIT_REACHED'
                                            ? 'Upgrade'
                                            : 'Done'}
                                    </PrimaryButton>
                                </div>
                            </>
                        )}

                    {isUploadingCredentials && (
                        <div className="my-7">
                            <LoaderWithMessage message="Connecting to Database" contained />
                        </div>
                    )}

                    {isUploadingProjectDetails && (
                        <div className="my-7">
                            <LoaderWithMessage message="Creating new project" contained />
                        </div>
                    )}

                    {isUploadingSpecs && (
                        <div className="my-7">
                            <LoaderWithMessage message="Uploading Spec" contained />
                        </div>
                    )}

                    {isUploadingDbs && (
                        <div className="my-7">
                            <LoaderWithMessage message="Uploading DDL" contained />
                        </div>
                    )}

                    {isUploadingProjectKey && (
                        <div className="my-7">
                            <LoaderWithMessage message="Using Connection KeyCredentials" contained />
                        </div>
                    )}
                    {isUploadingProjectCertificate && (
                        <div className="my-7">
                            <LoaderWithMessage message="Using Connection CertCredentials" contained />
                        </div>
                    )}
                    {isUploadingProjectCACertificate && (
                        <div className="my-7">
                            <LoaderWithMessage message="Using Connection RootCertCredentials" contained />
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
            )}

            {isDesign == null && !noSpecNoDb && (
                <div className="p-4">
                    <div className="flex flex-row items-center justify-between mb-3">
                        {<h5>Create API</h5>}
                        <div>
                            {' '}
                            <img style={{ width: '150px' }} src={ProductHunt} alt="producthunt" />
                        </div>
                        <AppIcon aria-label="close" onClick={onClose}>
                            <CloseIcon />
                        </AppIcon>
                    </div>{' '}
                    <div className="flex justify-center py-4">
                        <img src={Logo} alt="conektto logo" className=" w-28 h-28" />
                        {/* <Logo alt="conektto logo" className=" w-28 h-28" /> */}
                    </div>
                    <div className="flex justify-center p-2 px-36">
                        <PrimaryButton
                            //disabled={isTestTeam}
                            onClick={() => {
                                setIsDesign(true);
                                setIsMiddleState(true);
                            }}
                            classes="flex-1 -ml-4 text-brand-secondary"
                        >
                            <span id="rewardId" />
                            Design Studio
                        </PrimaryButton>
                    </div>
                    <div className="flex justify-center p-2 px-36">
                        <PrimaryButton
                            //style={{
                            //  color : "white",
                            //  background : "#9f9f9f"
                            //}}
                            //disabled={isAnimating}
                            onClick={() => {
                                //setIsDesign(null);
                                //if (deployenv == "production") {
                                //window.location.href='https://www.conektto.io/beta-signup'
                                //openInNewTab('https://www.conektto.io/beta-signup')
                                //}
                                setIsDesign(false);
                            }}
                            classes="flex-1 -ml-4 text-brand-secondary"
                        >
                            Test Studio
                        </PrimaryButton>
                    </div>
                </div>
            )}
        </>
    );
};

export default AddProject;
