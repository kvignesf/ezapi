import { createTheme, Grid, IconButton, Tab, Tabs, TextField } from '@material-ui/core';
import Snackbar from '@material-ui/core/Snackbar';
import { withStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import MuiAlert from '@material-ui/lab/Alert';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Checkbox, FormControlLabel, FormGroup, FormHelperText } from '@mui/material';
import Button from '@mui/material/Button';
import { ConnectedFocusError } from 'focus-formik-error';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import _ from 'lodash';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useState } from 'react';
import Scrollbar from 'react-smooth-scrollbar';
import { useRecoilState } from 'recoil';
import * as Yup from 'yup';
import AppIcon from '../shared/components/AppIcon';
import TabLabel from '../shared/components/TabLabel';
import projectAtom from './projectAtom';

const displayOracleDB = process.env.REACT_APP_DISABLE_ORACLEDB;

const theme = createTheme({
    overrides: {
        MuiFormControl: {
            root: {
                height: '50px',
            },
        },
        MuiInputBase: {
            root: {
                height: '50px',
            },
            input: {
                height: '50px',
            },
        },
        MuiOutlinedInput: {
            root: {
                height: '50px',
            },
        },
    },
});

const ConnectDatabase = ({
    formRef,
    specsError,
    dbsError,
    addProjectMutation,
    uploadSpecsMutation,
    uploadDbMutation,
    aiMatcherMutation,
    activeTab,
    handleTabChange,
    isClaimSpec,
    isAdvSpec,
    isAdvWorks,
    isMflix,
    connectors,
}) => {
    const [projectDetails, setProjectDetails] = useRecoilState(projectAtom);
    const [open, setOpen] = useState(false);
    /* const [connectors, setConnectors] = useState({
    ms_sql: true,
    my_sql: true,
    postgres: false,
  });
 */
    const debouncedSetDatabase = useCallback(
        debounce((nextValue) => {
            resetProjectApiState();

            setProjectDetails((currProjectDetails) => {
                return {
                    ...currProjectDetails,
                    database: nextValue,
                };
            });
        }, 300),
        [], // will be created only once initially
    );

    //   const pricingData = async () => {
    //     const { data } = await client.get(endpoint.products2);

    //     return data;
    //   };

    //   const userProfile = async () => {
    //     try {
    //       const { data } = await client.get(endpoint.userProfile);
    //       return data;
    //     } catch (error) {
    //       // throw getApiError(error);
    //     }
    //   };

    //  const usePricingData = () => {
    //     return useQuery([queries.products], pricingData, {
    //       refetchOnWindowFocus: false,
    //       fetchPolicy: "no-cache",
    //     });
    //   };

    //  const useUserProfile = () => {
    //     return useQuery([queries.userProfile], userProfile, {
    //       refetchOnWindowFocus: false,
    //       fetchPolicy: "no-cache",
    //     });
    //   };

    const debouncedSetHost = useCallback(
        debounce((nextValue) => {
            resetProjectApiState();

            setProjectDetails((currProjectDetails) => {
                return {
                    ...currProjectDetails,
                    host: nextValue,
                };
            });
        }, 300),
        [], // will be created only once initially
    );

    const debouncedSetPort = useCallback(
        debounce((nextValue) => {
            resetProjectApiState();

            setProjectDetails((currProjectDetails) => {
                return {
                    ...currProjectDetails,
                    port: nextValue,
                };
            });
        }, 300),
        [], // will be created only once initially
    );

    const debouncedSetUsername = useCallback(
        debounce((nextValue) => {
            resetProjectApiState();

            setProjectDetails((currProjectDetails) => {
                return {
                    ...currProjectDetails,
                    username: nextValue,
                };
            });
        }, 300),
        [], // will be created only once initially
    );
    const debouncedSetPassword = useCallback(
        debounce((nextValue) => {
            resetProjectApiState();

            setProjectDetails((currProjectDetails) => {
                return {
                    ...currProjectDetails,
                    password: nextValue,
                };
            });
        }, 300),
        [], // will be created only once initially
    );

    const debouncedSetDbType = useCallback(
        debounce((nextValue) => {
            resetProjectApiState();

            setProjectDetails((currProjectDetails) => {
                return {
                    ...currProjectDetails,
                    dbType: nextValue,
                };
            });
        }, 300),
        [], // will be created only once initially
    );

    const debouncedSetType = useCallback(
        debounce((nextValue) => {
            resetProjectApiState();

            setProjectDetails((currProjectDetails) => {
                return {
                    ...currProjectDetails,
                    type: nextValue,
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

    const resetProjectApiState = () => {
        addProjectMutation?.reset();
        uploadSpecsMutation?.reset();
        uploadDbMutation?.reset();
        aiMatcherMutation?.reset();
    };

    const handleOnSpecsPick = (pickedSpecs) => {
        setProjectDetails((currProjectDetails) => {
            const updatedProjectDetails = _.cloneDeep(currProjectDetails);

            pickedSpecs.forEach((pickedSpec) => {
                if (!_.find(updatedProjectDetails.specs, (existingSpec) => existingSpec.name === pickedSpec.name)) {
                    if (!updatedProjectDetails.specs) {
                        updatedProjectDetails.specs = [];
                    }

                    updatedProjectDetails.specs.push(pickedSpec);
                }
            });

            return updatedProjectDetails;
        });

        resetProjectApiState();
    };

    const handleOnKeysPick = (pickedKeys) => {
        setProjectDetails((currProjectDetails) => {
            const updatedProjectDetails = _.cloneDeep(currProjectDetails);
            pickedKeys.forEach((pickedKey) => {
                if (!_.find(updatedProjectDetails.keys, (existingKey) => existingKey.name === pickedKey.name)) {
                    if (!updatedProjectDetails.keys) {
                        updatedProjectDetails.keys = [];
                    }
                    updatedProjectDetails?.keys?.push(pickedKey);
                }
            });

            return updatedProjectDetails;
        });

        resetProjectApiState();
    };

    const handleOnCertificatesPick = (pickedCertificates) => {
        setProjectDetails((currProjectDetails) => {
            const updatedProjectDetails = _.cloneDeep(currProjectDetails);
            pickedCertificates.forEach((pickedCertificate) => {
                if (
                    !_.find(
                        updatedProjectDetails.certificates,
                        (existingCertificate) => existingCertificate.name === pickedCertificate.name,
                    )
                ) {
                    if (!updatedProjectDetails.certificates) {
                        updatedProjectDetails.certificates = [];
                    }
                    updatedProjectDetails?.certificates?.push(pickedCertificate);
                }
            });

            return updatedProjectDetails;
        });

        resetProjectApiState();
    };

    const handleOnCACertificatesPick = (pickedCACertificates) => {
        setProjectDetails((currProjectDetails) => {
            const updatedProjectDetails = _.cloneDeep(currProjectDetails);
            pickedCACertificates.forEach((pickedCACertificate) => {
                if (
                    !_.find(
                        updatedProjectDetails.caCertificates,
                        (existingCACertificate) => existingCACertificate.name === pickedCACertificate.name,
                    )
                ) {
                    if (!updatedProjectDetails.caCertificates) {
                        updatedProjectDetails.caCertificates = [];
                    }
                    updatedProjectDetails?.caCertificates?.push(pickedCACertificate);
                }
            });

            return updatedProjectDetails;
        });

        resetProjectApiState();
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };
    const handleClick = () => {
        setOpen(true);
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
    const handleOnDbsPick = (pickedDbs) => {
        setProjectDetails((currProjectDetails) => {
            const updatedProjectDetails = _.cloneDeep(currProjectDetails);

            pickedDbs.forEach((pickedDb) => {
                if (!_.find(updatedProjectDetails.dbs, (existingDb) => existingDb.name === pickedDb.name)) {
                    if (!updatedProjectDetails.dbs) {
                        updatedProjectDetails.dbs = [];
                    }

                    updatedProjectDetails.dbs.push(pickedDb);
                }
            });

            return updatedProjectDetails;
        });

        resetProjectApiState();
    };

    const removeSelectedSpec = (filename) => {
        setProjectDetails((currProjectDetails) => {
            const updatedProjectDetails = _.cloneDeep(currProjectDetails);

            updatedProjectDetails.specs = _.filter(updatedProjectDetails.specs, (spec) => {
                return spec.name !== filename;
            });

            return updatedProjectDetails;
        });

        resetProjectApiState();
    };

    const removeSelectedKey = (filename) => {
        setProjectDetails((currProjectDetails) => {
            const updatedProjectDetails = _.cloneDeep(currProjectDetails);

            updatedProjectDetails.keys = _.filter(updatedProjectDetails.keys, (key) => {
                return key.name !== filename;
            });

            return updatedProjectDetails;
        });

        resetProjectApiState();
    };

    const removeSelectedCertificate = (filename) => {
        setProjectDetails((currProjectDetails) => {
            const updatedProjectDetails = _.cloneDeep(currProjectDetails);

            updatedProjectDetails.certificates = _.filter(updatedProjectDetails.certificates, (certificate) => {
                return certificate.name !== filename;
            });

            return updatedProjectDetails;
        });

        resetProjectApiState();
    };

    const removeSelectedCACertificate = (filename) => {
        setProjectDetails((currProjectDetails) => {
            const updatedProjectDetails = _.cloneDeep(currProjectDetails);

            updatedProjectDetails.caCertificates = _.filter(updatedProjectDetails.caCertificates, (caCertificate) => {
                return caCertificate.name !== filename;
            });

            return updatedProjectDetails;
        });

        resetProjectApiState();
    };

    const removeSelectedDb = (filename) => {
        setProjectDetails((currProjectDetails) => {
            const updatedProjectDetails = _.cloneDeep(currProjectDetails);

            updatedProjectDetails.dbs = _.filter(updatedProjectDetails.dbs, (db) => {
                return db.name !== filename;
            });

            return updatedProjectDetails;
        });

        resetProjectApiState();
    };

    const CustomTab = withStyles({
        root: {
            backgroundColor: 'white',
            borderRadius: '10px',
            width: '100%',
        },
        selected: {
            color: 'white',
            backgroundColor: '#24a0ed',
            borderRadius: '10px',
        },
    })(Tab);

    const CustomTabs = withStyles({
        root: {
            border: '1px solid #d2d2d2',
            borderRadius: '10px',
        },
    })(Tabs);

    let databaseTypes = [
        { value: 'mysql', label: 'MySQL', check: 'my_sql' },
        { value: 'mssql', label: 'SQL Server', check: 'ms_sql' },
        { value: 'postgres', label: 'Postgres', check: 'postgres' },
        { value: 'mongo', label: 'MongoDb', check: 'mongo' },
        { value: 'oracle', label: 'Oracle', check: 'oracle' },
    ];
    if (displayOracleDB == 'true') {
        databaseTypes = [
            { value: 'mysql', label: 'MySQL', check: 'my_sql' },
            { value: 'mssql', label: 'SQL Server', check: 'ms_sql' },
            { value: 'postgres', label: 'Postgres', check: 'postgres' },
            { value: 'mongo', label: 'MongoDb', check: 'mongo' },
        ];
    }

    //const { data: pricing_data } = usePricingData();
    //const { data: userProfile_data } = useUserProfile();

    useEffect(() => {
        /* if (pricing_data && userProfile_data) {
      if (
        userProfile_data["plan_name"] == null ||
        userProfile_data["plan_name"] === "Basic"
      ) {
        debouncedSetNumberOfCollaborators(2);
        setConnectors({ ms_sql: true, my_sql: true, postgres: true, mongodb: true });
      } else {
        const filtered_plan = pricing_data["products"].filter(
          (item) => item["plan_name"] == userProfile_data["plan_name"]
        )[0];
        debouncedSetNumberOfCollaborators(filtered_plan["no_of_collaborators"]);
        setConnectors(filtered_plan["connectors"]);
      }
    } */
        if (isClaimSpec || isAdvSpec || isAdvWorks) {
            debouncedSetDbType('mssql');
        } else if (isMflix) {
            debouncedSetDbType('mongo');
        }
    }, [isClaimSpec, isAdvSpec, isAdvWorks, isMflix]);
    //}, [pricing_data, userProfile_data, isClaimSpec, isAdvSpec, isAdvWorks, isMflix]);

    return (
        <div className="pl-4 pr-4" style={{ height: '420px', overflowY: 'scroll' }}>
            {/* <Scrollbar className="max-h-60" alwaysShowTracks={true}> */}
            <>
                {process.env.REACT_APP_DISABLE_DDL !== 'true' && (
                    <CustomTabs
                        value={activeTab}
                        onChange={(_, index) => {
                            handleTabChange(index);
                        }}
                        aria-label="add project tabs"
                        indicatorColor="white"
                        // textColor="primary"
                        centered
                    >
                        <CustomTab label={<TabLabel label={'Connect'} />} style={{ outline: 'none', border: 'none' }} />
                        <CustomTab label={<TabLabel label={'Upload'} />} style={{ outline: 'none', border: 'none' }} />
                    </CustomTabs>
                )}
                {/* Content */}
                <div>
                    {activeTab === 0 ? (
                        <div className="mt-6 mb-6">
                            <Formik
                                initialValues={{
                                    type: projectDetails?.type ?? '',
                                    authdb: projectDetails?.authdb ?? false,
                                    host: projectDetails?.host ?? '',
                                    port: projectDetails?.port ?? '',
                                    database: projectDetails?.database ?? '',
                                    username: projectDetails?.username ?? '',
                                    password: projectDetails?.password ?? '',
                                    toggle:
                                        (projectDetails?.certificates && projectDetails?.certificates?.length > 0) ||
                                        (projectDetails?.keys && projectDetails?.keys?.length > 0) ||
                                        (projectDetails?.caCertificates && projectDetails?.caCertificates?.length > 0)
                                            ? true
                                            : false,
                                }}
                                validationSchema={Yup.object().shape({
                                    // name: apiNameSchema(Messages.NAME_REQUIRED),
                                    type: Yup.string().required('  Database type is required.'),
                                    host: Yup.string().required('host is required.'),
                                    port: Yup.string().when('type', {
                                        is: (type) => {
                                            return type !== 'mongo';
                                        },
                                        then: Yup.string().required('port is required.'),
                                    }),
                                    database: Yup.string().required('database is required.'),
                                    username: Yup.string().required('username is required.'),
                                })}
                                innerRef={formRef}
                            >
                                {({
                                    errors,
                                    touched,
                                    values,
                                    submitForm,
                                    validateForm,
                                    handleChange,
                                    handleBlur,
                                    setErrors,
                                }) => (
                                    <Form>
                                        <ConnectedFocusError />
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <p className="text-mediumLabel mb-2">DB Server Type</p>
                                                <Field
                                                    id="type"
                                                    name="type"
                                                    value={
                                                        isClaimSpec || isAdvSpec || isAdvWorks ? 'mssql' : values.type
                                                    }
                                                    // color = "primary"
                                                    onChange={handleChange}
                                                    onBlur={(e) => {
                                                        debouncedSetType(values.type);
                                                    }}
                                                    disabled={isClaimSpec || isAdvSpec || isAdvWorks || isMflix}
                                                    error={
                                                        (!isClaimSpec || !isAdvSpec || !isAdvWorks || !isMflix) &&
                                                        touched.type &&
                                                        Boolean(errors.type)
                                                    }
                                                    helperText={
                                                        (!isClaimSpec || !isAdvSpec || isAdvWorks || isMflix) && (
                                                            <ErrorMessage name="type" />
                                                        )
                                                    }
                                                    variant="outlined"
                                                    style={{
                                                        border: '1px solid #d2d2d2',
                                                        height: '50px',
                                                        borderRadius: '4px',
                                                        width: '100%',
                                                        color: 'primary',
                                                        backgroundColor: '#ffffff',
                                                        borderColor: touched.type && errors.type && 'red',
                                                    }}
                                                    as="select"
                                                >
                                                    <option value="" label="Select db type" />

                                                    {databaseTypes?.map((item) => {
                                                        if (connectors) {
                                                            if (connectors[item.check]) {
                                                                return <option value={item.value} label={item.label} />;
                                                            } else {
                                                                return (
                                                                    <option
                                                                        value={item.value}
                                                                        label={item.label}
                                                                        disabled
                                                                    />
                                                                );
                                                            }
                                                        }
                                                    })}
                                                </Field>
                                                {touched.type && errors.type && (
                                                    <FormHelperText htmlFor="render-select" error>
                                                        {errors.type}
                                                    </FormHelperText>
                                                )}
                                            </Grid>
                                            <Grid item xs={6}>
                                                <p className="text-mediumLabel mb-2">Database</p>
                                                <Field
                                                    id="database"
                                                    name="database"
                                                    fullWidth
                                                    color="primary"
                                                    theme={theme}
                                                    variant="outlined"
                                                    InputProps={{ style: { height: '50px' } }}
                                                    value={
                                                        isClaimSpec
                                                            ? 'db_claimsstaging'
                                                            : isAdvSpec
                                                            ? 'bikestoredb'
                                                            : values.database
                                                    }
                                                    error={
                                                        (!isClaimSpec || !isAdvSpec || !isAdvWorks || !isMflix) &&
                                                        touched.database &&
                                                        Boolean(errors.database)
                                                    }
                                                    helperText={
                                                        (!isClaimSpec || !isAdvSpec || !isAdvWorks || !isMflix) && (
                                                            <ErrorMessage name="database" />
                                                        )
                                                    }
                                                    onKeyUp={(e) => {
                                                        const { value } = e.target;
                                                        debouncedSetDatabase(value);
                                                    }}
                                                    //variant="outlined"
                                                    inputProps={{ maxLength: 55 }}
                                                    disabled={isClaimSpec || isAdvSpec || isAdvWorks || isMflix}
                                                    // disabled={addProjectMutation?.isSuccess}
                                                    as={TextField}
                                                />
                                                {values.type === 'mongo' && (
                                                    <FormGroup id="authdb" name="authdb">
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={projectDetails.authdb}
                                                                    onChange={(e) => {
                                                                        setProjectDetails((currProjectDetails) => {
                                                                            return {
                                                                                ...currProjectDetails,
                                                                                authdb: e.target.checked,
                                                                            };
                                                                        });
                                                                    }}
                                                                />
                                                            }
                                                            label="mark db as auth db"
                                                        />
                                                    </FormGroup>
                                                )}
                                            </Grid>
                                            <Grid item xs={6}>
                                                <p className="text-mediumLabel mb-2">Host</p>
                                                <Field
                                                    id="host"
                                                    name="host"
                                                    fullWidth
                                                    color="primary"
                                                    InputProps={{ style: { height: '50px' } }}
                                                    placeholder="127.0.0.1"
                                                    value={
                                                        isClaimSpec || isAdvSpec || isAdvWorks || isMflix
                                                            ? '3*.*.*.*'
                                                            : values.host
                                                    }
                                                    error={
                                                        (!isClaimSpec || !isAdvSpec || isAdvWorks || isMflix) &&
                                                        touched.host &&
                                                        Boolean(errors.host)
                                                    }
                                                    helperText={
                                                        (!isClaimSpec || !isAdvSpec || !isAdvWorks || !isMflix) && (
                                                            <ErrorMessage name="host" />
                                                        )
                                                    }
                                                    onKeyUp={(e) => {
                                                        const { value } = e.target;
                                                        debouncedSetHost(value);
                                                    }}
                                                    variant="outlined"
                                                    inputProps={{ maxLength: 128 }}
                                                    disabled={isClaimSpec || isAdvSpec || isAdvWorks || isMflix}
                                                    // disabled={addProjectMutation?.isSuccess}
                                                    as={TextField}
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <p className="text-mediumLabel mb-2">Port</p>
                                                <Field
                                                    id="port"
                                                    name="port"
                                                    fullWidth
                                                    color="primary"
                                                    InputProps={{ style: { height: '50px' } }}
                                                    placeholder="7744"
                                                    value={
                                                        isAdvSpec || isClaimSpec || isAdvWorks || isMflix
                                                            ? '1433'
                                                            : values.port
                                                    }
                                                    error={
                                                        (!isClaimSpec || !isAdvSpec || !isAdvWorks || !isMflix) &&
                                                        touched.port &&
                                                        Boolean(errors.port)
                                                    }
                                                    helperText={
                                                        (!isClaimSpec || !isAdvSpec || isAdvWorks || isMflix) && (
                                                            <ErrorMessage name="port" />
                                                        )
                                                    }
                                                    onKeyUp={(e) => {
                                                        const { value } = e.target;
                                                        debouncedSetPort(value);
                                                    }}
                                                    variant="outlined"
                                                    inputProps={{ maxLength: 24 }}
                                                    disabled={isClaimSpec || isAdvSpec || isAdvWorks || isMflix}
                                                    // disabled={addProjectMutation?.isSuccess}
                                                    as={TextField}
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <p className="text-mediumLabel mb-2">Username</p>
                                                <Field
                                                    id="username"
                                                    name="username"
                                                    fullWidth
                                                    InputProps={{ style: { height: '50px' } }}
                                                    color="primary"
                                                    value={
                                                        isClaimSpec || isAdvSpec || isAdvWorks || isMflix
                                                            ? 'sa'
                                                            : values.username
                                                    }
                                                    error={
                                                        (!isClaimSpec || !isAdvSpec || !isAdvWorks || !isMflix) &&
                                                        touched.username &&
                                                        Boolean(errors.username)
                                                    }
                                                    helperText={
                                                        (!isClaimSpec || !isAdvSpec || isAdvWorks || isMflix) && (
                                                            <ErrorMessage name="username" />
                                                        )
                                                    }
                                                    onKeyUp={(e) => {
                                                        const { value } = e.target;
                                                        debouncedSetUsername(value);
                                                    }}
                                                    variant="outlined"
                                                    inputProps={{ maxLength: 24 }}
                                                    disabled={isClaimSpec || isAdvSpec || isAdvWorks || isMflix}
                                                    // disabled={addProjectMutation?.isSuccess}
                                                    as={TextField}
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <p className="text-mediumLabel mb-2">Password</p>
                                                <Field
                                                    id="password"
                                                    name="password"
                                                    type="password"
                                                    autocomplete="off"
                                                    InputProps={{ style: { height: '50px' } }}
                                                    fullWidth
                                                    color="primary"
                                                    value={
                                                        isClaimSpec || isAdvSpec || isAdvWorks || isMflix
                                                            ? 'S0mbari@2022'
                                                            : values.password
                                                    }
                                                    error={
                                                        (!isClaimSpec || !isAdvSpec || !isAdvWorks || !isMflix) &&
                                                        touched.password &&
                                                        Boolean(errors.password)
                                                    }
                                                    helperText={
                                                        (!isClaimSpec || !isAdvSpec || isAdvWorks || isMflix) && (
                                                            <ErrorMessage name="password" />
                                                        )
                                                    }
                                                    onKeyUp={(e) => {
                                                        const { value } = e.target;
                                                        debouncedSetPassword(value);
                                                    }}
                                                    variant="outlined"
                                                    //inputProps={{ maxLength: 24 }}
                                                    disabled={isClaimSpec || isAdvSpec || isAdvWorks || isMflix}
                                                    // disabled={addProjectMutation?.isSuccess}
                                                    as={TextField}
                                                />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <label class="text-mediumLabel mb-2">
                                                    <Field
                                                        type="checkbox"
                                                        name="toggle"
                                                        disabled={
                                                            isClaimSpec ||
                                                            isAdvSpec ||
                                                            isAdvWorks ||
                                                            isMflix ||
                                                            !_.isEmpty(projectDetails?.password)
                                                        }
                                                        onClick={(e) => {
                                                            setProjectDetails((currProjectDetails) => {
                                                                return {
                                                                    ...currProjectDetails,
                                                                    overssl: e.target.value,
                                                                };
                                                            });
                                                        }}
                                                    />
                                                    {' Over SSL'}
                                                </label>
                                                {values.toggle ? (
                                                    <>
                                                        <div className="mb-6 mt-2">
                                                            <Grid container spacing={2}>
                                                                <Grid item xs={4}>
                                                                    <p className="text-mediumLabel mb-2">
                                                                        {/* Upload Certificate */}
                                                                    </p>
                                                                    <input
                                                                        id="keys"
                                                                        type="file"
                                                                        accept=".key,.pem"
                                                                        multiple
                                                                        hidden
                                                                        className="pt-3"
                                                                        disabled={
                                                                            isClaimSpec ||
                                                                            isAdvSpec ||
                                                                            isAdvWorks ||
                                                                            isMflix ||
                                                                            !_.isEmpty(projectDetails?.keys)
                                                                        }
                                                                        onChange={(e) => {
                                                                            handleOnKeysPick(
                                                                                Array.from(e.target.files),
                                                                            );
                                                                            e.target.value = '';
                                                                        }}
                                                                    />
                                                                    <label
                                                                        for="keys"
                                                                        className="bg-brand-secondary rounded-md px-11 py-2 text-white text-smallLabel hover:opacity-90"
                                                                    >
                                                                        Upload Key
                                                                    </label>
                                                                </Grid>

                                                                {/* Spec list */}
                                                                <Grid item xs={8}>
                                                                    {!_.isEmpty(projectDetails?.keys) ? (
                                                                        <div className="mt-1">
                                                                            <Scrollbar
                                                                                className="max-h-24"
                                                                                alwaysShowTracks={true}
                                                                            >
                                                                                <ul>
                                                                                    {projectDetails?.keys?.map(
                                                                                        (file) => {
                                                                                            return (
                                                                                                <li key={file.name}>
                                                                                                    <div className="rounded-md border bg-neutral-gray7 p-2 mb-2 flex flex-row items-center justify-between">
                                                                                                        <p className="text-overline3">
                                                                                                            {file.name}{' '}
                                                                                                            {Math.round(
                                                                                                                file.size /
                                                                                                                    1024,
                                                                                                            )}{' '}
                                                                                                            KB
                                                                                                        </p>
                                                                                                        <AppIcon
                                                                                                            aria-label="remove"
                                                                                                            onClick={() => {
                                                                                                                removeSelectedKey(
                                                                                                                    file.name,
                                                                                                                );
                                                                                                            }}
                                                                                                            style={{
                                                                                                                width: '18px',
                                                                                                                height: '18px',
                                                                                                            }}
                                                                                                        >
                                                                                                            <CloseIcon />
                                                                                                        </AppIcon>
                                                                                                    </div>
                                                                                                </li>
                                                                                            );
                                                                                        },
                                                                                    )}
                                                                                </ul>
                                                                            </Scrollbar>
                                                                        </div>
                                                                    ) : null}
                                                                </Grid>
                                                                {_.isEmpty(projectDetails?.dbs) &&
                                                                    _.isEmpty(projectDetails?.specs) &&
                                                                    !_.isEmpty(specsError) && (
                                                                        <p className="text-accent-red text-overline2 mt-2">
                                                                            {specsError}
                                                                        </p>
                                                                    )}
                                                            </Grid>
                                                        </div>

                                                        <div className="mb-6">
                                                            <Grid container spacing={2}>
                                                                <Grid item xs={4}>
                                                                    <p className="text-mediumLabel mb-2">
                                                                        {/* Upload Certificate */}
                                                                    </p>
                                                                    <input
                                                                        id="certificates"
                                                                        type="file"
                                                                        accept=".pem,.crt"
                                                                        multiple
                                                                        hidden
                                                                        disabled={
                                                                            !_.isEmpty(projectDetails?.certificates)
                                                                        }
                                                                        onChange={(e) => {
                                                                            handleOnCertificatesPick(
                                                                                Array.from(e.target.files),
                                                                            );
                                                                            e.target.value = '';
                                                                        }}
                                                                    />
                                                                    <label
                                                                        for="certificates"
                                                                        className="bg-brand-secondary rounded-md px-6 py-2 text-white text-smallLabel hover:opacity-90"
                                                                        style={{ width: '100%' }}
                                                                    >
                                                                        Upload Certificate
                                                                    </label>
                                                                </Grid>

                                                                {/* Spec list */}
                                                                <Grid item xs={8}>
                                                                    {!_.isEmpty(projectDetails?.certificates) ? (
                                                                        <div className="mt-1">
                                                                            <Scrollbar
                                                                                className="max-h-24"
                                                                                alwaysShowTracks={true}
                                                                            >
                                                                                <ul>
                                                                                    {projectDetails?.certificates?.map(
                                                                                        (file) => {
                                                                                            return (
                                                                                                <li key={file.name}>
                                                                                                    <div className="rounded-md border bg-neutral-gray7 p-2 mb-2 flex flex-row items-center justify-between">
                                                                                                        <p className="text-overline3">
                                                                                                            {file.name}{' '}
                                                                                                            {Math.round(
                                                                                                                file.size /
                                                                                                                    1024,
                                                                                                            )}{' '}
                                                                                                            KB
                                                                                                        </p>
                                                                                                        <AppIcon
                                                                                                            aria-label="remove"
                                                                                                            onClick={() => {
                                                                                                                removeSelectedCertificate(
                                                                                                                    file.name,
                                                                                                                );
                                                                                                            }}
                                                                                                            style={{
                                                                                                                width: '18px',
                                                                                                                height: '18px',
                                                                                                            }}
                                                                                                        >
                                                                                                            <CloseIcon />
                                                                                                        </AppIcon>
                                                                                                    </div>
                                                                                                </li>
                                                                                            );
                                                                                        },
                                                                                    )}
                                                                                </ul>
                                                                            </Scrollbar>
                                                                        </div>
                                                                    ) : null}
                                                                </Grid>

                                                                {_.isEmpty(projectDetails?.dbs) &&
                                                                    _.isEmpty(projectDetails?.specs) &&
                                                                    !_.isEmpty(specsError) && (
                                                                        <p className="text-accent-red text-overline2 mt-2">
                                                                            {specsError}
                                                                        </p>
                                                                    )}
                                                            </Grid>
                                                        </div>

                                                        <div className="mb-6">
                                                            <Grid container spacing={2}>
                                                                <Grid item xs={4}>
                                                                    <p className="text-mediumLabel mb-2">
                                                                        {/* Upload CA Certificate */}
                                                                    </p>
                                                                    <input
                                                                        id="caCertificates"
                                                                        type="file"
                                                                        accept=".pem,.crt"
                                                                        multiple
                                                                        hidden
                                                                        disabled={
                                                                            !_.isEmpty(projectDetails?.caCertificates)
                                                                        }
                                                                        onChange={(e) => {
                                                                            handleOnCACertificatesPick(
                                                                                Array.from(e.target.files),
                                                                            );
                                                                            e.target.value = '';
                                                                        }}
                                                                    />
                                                                    <label
                                                                        for="caCertificates"
                                                                        className="bg-brand-secondary rounded-md px-4 pr-3 py-2 text-white text-smallLabel hover:opacity-90"
                                                                        style={{ width: '100%' }}
                                                                    >
                                                                        Upload CA Certificate
                                                                    </label>
                                                                </Grid>

                                                                {/* Spec list */}
                                                                <Grid item xs={8}>
                                                                    {!_.isEmpty(projectDetails?.caCertificates) ? (
                                                                        <div className="mt-1">
                                                                            <Scrollbar
                                                                                className="max-h-24"
                                                                                alwaysShowTracks={true}
                                                                            >
                                                                                <ul>
                                                                                    {projectDetails?.caCertificates?.map(
                                                                                        (file) => {
                                                                                            return (
                                                                                                <li key={file.name}>
                                                                                                    <div className="rounded-md border bg-neutral-gray7 p-2 mb-2 flex flex-row items-center justify-between">
                                                                                                        <p className="text-overline3">
                                                                                                            {file.name}{' '}
                                                                                                            {Math.round(
                                                                                                                file.size /
                                                                                                                    1024,
                                                                                                            )}{' '}
                                                                                                            KB
                                                                                                        </p>
                                                                                                        <AppIcon
                                                                                                            aria-label="remove"
                                                                                                            onClick={() => {
                                                                                                                removeSelectedCACertificate(
                                                                                                                    file.name,
                                                                                                                );
                                                                                                            }}
                                                                                                            style={{
                                                                                                                width: '18px',
                                                                                                                height: '18px',
                                                                                                            }}
                                                                                                        >
                                                                                                            <CloseIcon />
                                                                                                        </AppIcon>
                                                                                                    </div>
                                                                                                </li>
                                                                                            );
                                                                                        },
                                                                                    )}
                                                                                </ul>
                                                                            </Scrollbar>
                                                                        </div>
                                                                    ) : null}
                                                                </Grid>

                                                                {_.isEmpty(projectDetails?.dbs) &&
                                                                    _.isEmpty(projectDetails?.specs) &&
                                                                    !_.isEmpty(specsError) && (
                                                                        <p className="text-accent-red text-overline2 mt-2">
                                                                            {specsError}
                                                                        </p>
                                                                    )}
                                                            </Grid>
                                                        </div>
                                                    </>
                                                ) : (
                                                    ''
                                                )}
                                            </Grid>
                                            {/* <Grid item xl={12}>
                          <p className="text-mediumLabel mb-2">ssl</p>
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
                            }}
                            variant="outlined"
                            inputProps={{ maxLength: 24 }}
                            // disabled={addProjectMutation?.isSuccess}
                            as={TextField}
                          />
                        </Grid> */}
                                        </Grid>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    ) : (
                        <div className="h-80 pt-4 mb-4">
                            <div className="mb-3">
                                <Formik
                                    initialValues={{
                                        dbType: projectDetails?.dbType ?? '',
                                    }}
                                    validationSchema={Yup.object().shape({
                                        dbType: Yup.string().required('  Database type is required.'),
                                    })}
                                    innerRef={formRef}
                                >
                                    {({
                                        errors,
                                        touched,
                                        values,
                                        submitForm,
                                        validateForm,
                                        handleChange,
                                        handleBlur,
                                        setErrors,
                                    }) => (
                                        <Form>
                                            <ConnectedFocusError />
                                            <div className="mb-3">
                                                <Grid item xs={12}>
                                                    {/* <select
                          name="dbType"
                          value={values.dbType}
                          // color = "primary"
                          onChange={handleChange}
                          onBlur={(e) => {
                            debouncedSetDbType(values.dbType);
                          }}
                          variant="outlined"
                          style={{
                            border: "1px solid #d2d2d2",
                            height: "60px",
                            marginBottom: "10px",
                            borderRadius: "4px",
                            width: "100%",
                            color: "primary",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          <option value="" label="Select db type" />

                          {databaseTypes?.map((item) => {
                            if (connectors) {
                              if (connectors[item.check]) {
                                return (
                                  <option
                                    value={item.value}
                                    label={item.label}
                                  />
                                );
                              } else {
                                return (
                                  <option
                                    value={item.value}
                                    label={item.label}
                                    disabled
                                  />
                                );
                              }
                            }
                          })}
                        </select> */}

                                                    <Field
                                                        id="dbType"
                                                        name="dbType"
                                                        value={values.dbType}
                                                        // color = "primary"
                                                        onChange={handleChange}
                                                        onBlur={(e) => {
                                                            debouncedSetDbType(values.dbType);
                                                        }}
                                                        error={touched.dbType && Boolean(errors.dbType)}
                                                        helperText={<ErrorMessage name="dbType" />}
                                                        variant="outlined"
                                                        style={{
                                                            border: '1px solid #d2d2d2',
                                                            height: '60px',
                                                            borderRadius: '4px',
                                                            width: '100%',
                                                            color: 'primary',
                                                            backgroundColor: '#ffffff',
                                                            borderColor: touched.dbType && errors.dbType && 'red',
                                                        }}
                                                        as="select"
                                                        disabled={isClaimSpec || isAdvSpec || isAdvWorks || isMflix}
                                                    >
                                                        <option value="" label="Select db type" />

                                                        {databaseTypes?.map((item) => {
                                                            if (connectors) {
                                                                if (connectors[item.check]) {
                                                                    return (
                                                                        <option value={item.value} label={item.label} />
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <option
                                                                            value={item.value}
                                                                            label={item.label}
                                                                            disabled
                                                                        />
                                                                    );
                                                                }
                                                            }
                                                        })}
                                                    </Field>
                                                    {touched.dbType && errors.dbType && (
                                                        <FormHelperText htmlFor="render-select" error>
                                                            {errors.dbType}
                                                        </FormHelperText>
                                                    )}
                                                </Grid>
                                            </div>
                                        </Form>
                                    )}
                                </Formik>
                            </div>
                            <div className="mb-3">
                                <p className="text-mediumLabel mb-2">
                                    Connect DB{' '}
                                    <span>
                                        <InfoOutlinedIcon />
                                    </span>
                                </p>
                                <input
                                    id="dbs"
                                    type="file"
                                    accept=".sql"
                                    // multiple
                                    hidden
                                    disabled={
                                        isAdvSpec ||
                                        isClaimSpec ||
                                        isAdvWorks ||
                                        isMflix ||
                                        projectDetails?.dbs !== null
                                            ? projectDetails?.dbs?.length === 0
                                                ? false
                                                : true
                                            : false
                                    }
                                    onChange={(e) => {
                                        handleOnDbsPick(Array.from(e.target.files));
                                        e.target.value = '';
                                    }}
                                />
                                <label
                                    for="dbs"
                                    onClick={() => {
                                        if (projectDetails?.dbs !== null && projectDetails?.dbs?.length !== 0) {
                                            handleClick();
                                        }
                                    }}
                                    className={`bg-brand-secondary  ${
                                        isClaimSpec || isAdvSpec || isAdvWorks || isMflix
                                            ? 'opacity-40'
                                            : 'hover:opacity-90'
                                    }  rounded-md px-4 py-2 text-white text-mediumLabel`}
                                >
                                    Upload DDL
                                </label>

                                <Snackbar open={open} autoHideDuration={6000} onClose={handleClose} action={action}>
                                    <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
                                        Only one file Upload is allowed
                                    </Alert>
                                </Snackbar>
                                {/* Connected Dbs */}
                                {!_.isEmpty(projectDetails?.dbs) ? (
                                    <div className="mt-3">
                                        <Scrollbar className="max-h-24" alwaysShowTracks={true}>
                                            <ul>
                                                {projectDetails?.dbs?.map((file) => {
                                                    return (
                                                        <li key={file.name}>
                                                            <div className="rounded-md border bg-neutral-gray7 p-2 mb-2 flex flex-row items-center justify-between">
                                                                <p className="text-overline2">
                                                                    {file.name} {Math.round(file.size / 1024)} KB
                                                                </p>
                                                                <AppIcon
                                                                    aria-label="remove"
                                                                    onClick={() => {
                                                                        removeSelectedDb(file.name);
                                                                    }}
                                                                    style={{
                                                                        width: '18px',
                                                                        height: '18px',
                                                                    }}
                                                                >
                                                                    <CloseIcon />
                                                                </AppIcon>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </Scrollbar>
                                    </div>
                                ) : null}

                                {_.isEmpty(projectDetails?.dbs) &&
                                    _.isEmpty(projectDetails?.specs) &&
                                    !_.isEmpty(dbsError) && (
                                        <p className="text-accent-red text-overline2 mt-2">{dbsError}</p>
                                    )}
                            </div>
                        </div>
                    )}
                </div>
            </>
            {/* </Scrollbar> */}
        </div>
    );
};

// const CustomizedSelectForFormik = ({ children, form, field }) => {
//   const { name, value } = field;
//   const { setFieldValue } = form;

//   return (
//     <Select
//       name={name}
//       value={value}
//       input={<OutlinedInput />}
//       label={name}
//       style={{ width: "100%" }}
//       onChange={(e) => {
//         setFieldValue(name, e.target.value);
//       }}
//     >
//       {children}
//     </Select>
//   );
// };

export default ConnectDatabase;
