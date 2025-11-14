import { Grid, TextField } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { ConnectedFocusError } from 'focus-formik-error';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import _ from 'lodash';
import { useRef, useState } from 'react';
import Scrollbar from 'react-smooth-scrollbar';
import { PrimaryButton, TextButton } from '../shared/components/AppButton';
import AppIcon from '../shared/components/AppIcon';

const CredentialsBeforePublish = ({ onClose, onPublish, newProjectDetails, isDefaultproj, dbType }) => {
    const formRef = useRef();
    const [projectDetails, setProjectDetails] = useState(newProjectDetails);
    //console.log("isDefaultproj.. ", isDefaultproj, dbType)

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

        // resetProjectApiState();
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

        // resetProjectApiState();
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

        // resetProjectApiState();
    };

    const removeSelectedKey = (filename) => {
        setProjectDetails((currProjectDetails) => {
            const updatedProjectDetails = _.cloneDeep(currProjectDetails);

            updatedProjectDetails.keys = _.filter(updatedProjectDetails.keys, (key) => {
                return key.name !== filename;
            });

            return updatedProjectDetails;
        });

        // resetProjectApiState();
    };

    const removeSelectedCertificate = (filename) => {
        setProjectDetails((currProjectDetails) => {
            const updatedProjectDetails = _.cloneDeep(currProjectDetails);

            updatedProjectDetails.certificates = _.filter(updatedProjectDetails.certificates, (certificate) => {
                return certificate.name !== filename;
            });

            return updatedProjectDetails;
        });

        // resetProjectApiState();
    };

    const removeSelectedCACertificate = (filename) => {
        setProjectDetails((currProjectDetails) => {
            const updatedProjectDetails = _.cloneDeep(currProjectDetails);

            updatedProjectDetails.caCertificates = _.filter(updatedProjectDetails.caCertificates, (caCertificate) => {
                return caCertificate.name !== filename;
            });

            return updatedProjectDetails;
        });

        // resetProjectApiState();
    };

    return (
        <div className="p-4">
            <>
                {/* Header */}
                <div className="flex flex-row items-center justify-between mb-3">
                    <h5>Enter Password </h5>

                    <AppIcon aria-label="close" onClick={onClose}>
                        <CloseIcon />
                    </AppIcon>
                </div>
                {/* Form */}
                <div className="p-4" style={{ height: '395px', overflowY: 'scroll', overflowX: 'hidden' }}>
                    {/* <div className=' mb-6'>
            <Formik
              initialValues={{
                type: newProjectDetails.dbtype,
                host: newProjectDetails.server,
                port: newProjectDetails.port,
                database: newProjectDetails.database,
                username: newProjectDetails.username,
                password: (isDefaultproj && dbType === "mssql") ? "S0mbari@2022" : (isDefaultproj && dbType === "mongo") ? "JRVvuh9D5V0IZxCW" : null

              }}
              validationSchema={Yup.object().shape({
                password: Yup.string().required("Password is required"),
              })}
              innerRef={formRef}
            >
              {({ errors, touched, values }) => (
                <Form>
                  <ConnectedFocusError />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <p className='text-mediumLabel mb-2'>Server Type</p>
                      <Field
                        id='type'
                        name='type'
                        fullWidth
                        color='primary'
                        value={newProjectDetails.dbtype}
                        // error={touched.host && Boolean(errors.type)}
                        helperText={<ErrorMessage name='type' />}
                        variant='outlined'
                        inputProps={{ maxLength: 55 }}
                        // disabled={true}
                        as={TextField}
                      ></Field>
                    </Grid>
                    <Grid item xs={6}>
                      <p className='text-mediumLabel mb-2'>Host</p>
                      <Field
                        id='host'
                        name='host'
                        fullWidth
                        value={newProjectDetails.server}
                        color='primary'
                        placeholder='127.0.0.1'
                        // error={touched.host && Boolean(errors.host)}
                        helperText={<ErrorMessage name='host' />}
                        variant='outlined'
                        inputProps={{ maxLength: 55 }}
                        as={TextField}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <p className='text-mediumLabel mb-2'>Port</p>
                      <Field
                        id='port'
                        name='port'
                        fullWidth
                        color='primary'
                        value={newProjectDetails.portNo}
                        placeholder='7744'
                        // error={touched.port && Boolean(errors.port)}
                        helperText={<ErrorMessage name='port' />}
                        // onKeyUp={(e) => {
                        //   const { value } = e.target;
                        //   debouncedSetPort(value);
                        // }}
                        variant='outlined'
                        inputProps={{ maxLength: 24 }}
                        // disabled={addProjectMutation?.isSuccess}
                        as={TextField}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <p className='text-mediumLabel mb-2'>Username</p>
                      <Field
                        id='username'
                        name='username'
                        fullWidth
                        value={newProjectDetails.username}
                        color='primary'
                        // error={touched.username && Boolean(errors.username)}
                        helperText={<ErrorMessage name='username' />}
                        // onKeyUp={(e) => {
                        //   const { value } = e.target;
                        //   debouncedSetUsername(value);
                        // }}
                        variant='outlined'
                        inputProps={{ maxLength: 24 }}
                        // disabled={addProjectMutation?.isSuccess}
                        as={TextField}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <p className='text-mediumLabel mb-2'>Password</p>
                      <Field
                        id='password'
                        name='password'
                        // value={newProjectDetails.server}
                        type='password'
                        autocomplete='off'
                        fullWidth
                        disabled={isDefaultproj}

                        value={(isDefaultproj && dbType === "mssql") ? "S0mbari@2022" : (isDefaultproj && dbType === "mongo") ? "JRVvuh9D5V0IZxCW" : null}
                        color='primary'
                        error={(!isDefaultproj) && Boolean(errors.password)}
                        helperText={errors.password}
                        // onKeyUp={(e) => {
                        //   const { value } = e.target;
                        //   debouncedSetPassword(value);
                        // }}
                        variant='outlined'
                        inputProps={{ maxLength: 24 }}
                        // disabled={addProjectMutation?.isSuccess}
                        as={TextField}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <p className='text-mediumLabel mb-2'>Database</p>
                      <Field
                        id='database'
                        name='database'
                        fullWidth
                        value={newProjectDetails.database}
                        color='primary'
                        // error={touched.database && Boolean(errors.database)}
                        helperText={<ErrorMessage name='database' />}
                        // onKeyUp={(e) => {
                        //   const { value } = e.target;
                        //   debouncedSetDatabase(value);
                        // }}
                        variant='outlined'
                        inputProps={{ maxLength: 55 }}
                        // disabled={addProjectMutation?.isSuccess}
                        as={TextField}
                      />
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          </div> */}

                    <div className="mt-6 mb-6">
                        <Formik
                            initialValues={{
                                type: newProjectDetails?.dbtype ?? '',
                                host: newProjectDetails?.server ?? '',
                                port: newProjectDetails?.portNo ?? '',
                                database: newProjectDetails?.database ?? '',
                                username: newProjectDetails?.username ?? '',
                                password:
                                    isDefaultproj && dbType === 'mssql'
                                        ? 'S0mbari@2022'
                                        : isDefaultproj && dbType === 'mongo'
                                        ? 'JRVvuh9D5V0IZxCW'
                                        : null,
                                toggle: false,
                            }}
                            innerRef={formRef}
                        >
                            {({ errors, touched, values }) => (
                                <Form>
                                    <ConnectedFocusError />
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <p className="text-mediumLabel mb-2">DB Server Type</p>
                                            <Field
                                                id="type"
                                                name="type"
                                                color="primary"
                                                fullWidth
                                                value={newProjectDetails.dbtype}
                                                helperText={<ErrorMessage name="type" />}
                                                variant="outlined"
                                                InputProps={{ style: { height: '50px', background: '#E0E0E0' } }}
                                                as={TextField}
                                            ></Field>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <p className="text-mediumLabel mb-2">Database</p>
                                            <Field
                                                id="database"
                                                name="database"
                                                fullWidth
                                                color="primary"
                                                helperText={<ErrorMessage name="database" />}
                                                variant="outlined"
                                                InputProps={{ style: { height: '50px', background: '#E0E0E0' } }}
                                                value={newProjectDetails.database}
                                                as={TextField}
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <p className="text-mediumLabel mb-2">Host</p>
                                            <Field
                                                id="host"
                                                name="host"
                                                fullWidth
                                                value={newProjectDetails.server}
                                                color="primary"
                                                InputProps={{ style: { height: '50px', background: '#E0E0E0' } }}
                                                placeholder="127.0.0.1"
                                                variant="outlined"
                                                inputProps={{ maxLength: 128 }}
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
                                                InputProps={{ style: { height: '50px', background: '#E0E0E0' } }}
                                                placeholder="    "
                                                value={newProjectDetails.portNo}
                                                variant="outlined"
                                                inputProps={{ maxLength: 24 }}
                                                helperText={<ErrorMessage name="port" />}
                                                as={TextField}
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <p className="text-mediumLabel mb-2">Username</p>
                                            <Field
                                                id="username"
                                                name="username"
                                                fullWidth
                                                InputProps={{ style: { height: '50px', background: '#E0E0E0' } }}
                                                color="primary"
                                                value={newProjectDetails.username}
                                                helperText={<ErrorMessage name="username" />}
                                                variant="outlined"
                                                inputProps={{ maxLength: 24 }}
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
                                                disabled={isDefaultproj}
                                                fullWidth
                                                error={!isDefaultproj && Boolean(errors.password)}
                                                color="primary"
                                                value={
                                                    isDefaultproj && dbType === 'mssql'
                                                        ? 'S0mbari@2022'
                                                        : isDefaultproj && dbType === 'mongo'
                                                        ? 'JRVvuh9D5V0IZxCW'
                                                        : values.password
                                                }
                                                variant="outlined"
                                                helperText={values.toggle ? '' : errors.password}
                                                // disabled={addProjectMutation?.isSuccess}
                                                as={TextField}
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <label class="text-mediumLabel mb-2">
                                                <Field type="checkbox" name="toggle" />
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
                                                                    disabled={!_.isEmpty(projectDetails?.keys)}
                                                                    onChange={(e) => {
                                                                        handleOnKeysPick(Array.from(e.target.files));
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
                                                                                {projectDetails?.keys?.map((file) => {
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
                                                                                })}
                                                                            </ul>
                                                                        </Scrollbar>
                                                                    </div>
                                                                ) : null}
                                                            </Grid>
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
                                                                    disabled={!_.isEmpty(projectDetails?.certificates)}
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
                </div>
                {/* Footer */}
                <div className="border-t-2 border-neutral-gray7 flex flex-row items-center justify-end pt-4">
                    <TextButton classes="mr-3" onClick={onClose}>
                        Cancel
                    </TextButton>

                    <PrimaryButton
                        type="submit"
                        onClick={() => {
                            if (!isDefaultproj) formRef.current.handleSubmit();
                            setTimeout(function () {
                                if (formRef.current.isValid) {
                                    console.log('formRef.current', formRef.current.values.password);
                                    newProjectDetails['password'] = formRef.current.values.password;
                                    newProjectDetails['keys'] = projectDetails.keys ?? null;
                                    newProjectDetails['caCertificates'] = projectDetails.caCertificates ?? null;
                                    newProjectDetails['certificates'] = projectDetails.certificates ?? null;
                                    console.log('newProjectDetails', newProjectDetails);
                                    onPublish(newProjectDetails);
                                }
                            }, 100);
                        }}
                    >
                        Publish
                    </PrimaryButton>
                </div>
            </>
        </div>
    );
};

export default CredentialsBeforePublish;
