import { TextField } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import _ from 'lodash';
import debounce from 'lodash.debounce';
import { useCallback, useEffect } from 'react';
import Scrollbar from 'react-smooth-scrollbar';
import { useRecoilState } from 'recoil';
import * as Yup from 'yup';
import AppIcon from '../shared/components/AppIcon';
import Messages from '../shared/messages';
import apiNameSchema from '../shared/schemas/apiNameSchema';
import projectAtom from './projectAtom';

const ProjectDetails = ({
    formRef,
    specsError,
    isDesign,
    dbsError,
    isProjectNameEmpty,
    addProjectMutation,
    uploadSpecsMutation,
    uploadDbMutation,
    aiMatcherMutation,
    isClaimSpec,
    isAdvSpec,
    isNoSpecNoDb,
    isAdvWorks,
    isMflix,
}) => {
    const [projectDetails, setProjectDetails] = useRecoilState(projectAtom);
    //console.log("projectDetails in projectdetailsjsx", projectDetails)
    console.log('isClaimSpec || isAdvSpec || isAdvWorks || isMflix', isClaimSpec, isAdvSpec, isAdvWorks, isMflix);
    useEffect(() => {
        if (formRef.current && isProjectNameEmpty) {
            formRef.current.touched.name = true;
            formRef.current.setErrors({ name: Messages.NAME_REQUIRED });
        }
    }, [isProjectNameEmpty, formRef]);

    const debouncedSetName = useCallback(
        debounce((nextValue) => {
            resetProjectApiState();
            //console.log("nextValue", nextValue)
            setProjectDetails((currProjectDetails) => {
                return {
                    ...currProjectDetails,
                    name: nextValue,
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

    return (
        <div className="p-4 mb-10">
            <p className="text-mediumLabel mb-2">API Name</p>

            <div className="mb-6">
                <Formik
                    initialValues={{
                        name: projectDetails?.prevName ?? '',
                        //name: isClaimSpec || isAdvSpec || isAdvWorks || isMflix ? projectDetails?.name : projectDetails?.prevName,
                    }}
                    validationSchema={Yup.object().shape({
                        name: apiNameSchema(Messages.NAME_REQUIRED),
                    })}
                    innerRef={formRef}
                >
                    {({ errors, touched, values, submitForm, validateForm, handleBlur, setErrors }) => (
                        <Form>
                            {isClaimSpec || isAdvSpec || isAdvWorks || isMflix ? (
                                <Field
                                    id="name"
                                    name="name"
                                    fullWidth
                                    color="primary"
                                    //value={isAdvSpec ? "BikeStore" : "Claims"}
                                    value={projectDetails?.name}
                                    disabled={true}
                                    variant="outlined"
                                    inputProps={{ maxLength: 24 }}
                                    // disabled={addProjectMutation?.isSuccess}
                                    as={TextField}
                                />
                            ) : (
                                <Field
                                    id="name"
                                    name="name"
                                    fullWidth
                                    color="primary"
                                    placeholder={projectDetails?.name}
                                    error={touched.name && Boolean(errors.name)}
                                    helperText={<ErrorMessage name="name" />}
                                    onKeyUp={(e) => {
                                        const { value } = e.target;
                                        debouncedSetName(value);
                                        setProjectDetails((projectDetails) => {
                                            const clonnedData = _.cloneDeep(projectDetails);
                                            clonnedData.prevName = value;
                                            return clonnedData;
                                        });
                                    }}
                                    disabled={false}
                                    //value={projectDetails?.name}
                                    variant="outlined"
                                    inputProps={{ maxLength: 24 }}
                                    // disabled={addProjectMutation?.isSuccess}
                                    as={TextField}
                                />
                            )}
                        </Form>
                    )}
                </Formik>
            </div>

            {!isNoSpecNoDb ? (
                <div className="mb-6">
                    <p className="text-mediumLabel mb-2">Upload Spec</p>
                    <input
                        id="specs"
                        type="file"
                        accept=".json"
                        hidden
                        onChange={(e) => {
                            handleOnSpecsPick(Array.from(e.target.files));
                            e.target.value = '';
                        }}
                        disabled={isClaimSpec || isAdvSpec || isAdvWorks || isMflix}
                    />

                    <label
                        for="specs"
                        className={`bg-brand-secondary  ${
                            isClaimSpec || isAdvSpec ? 'opacity-40' : 'hover:opacity-90'
                        }  rounded-md px-4 py-2 text-white text-mediumLabel`}
                    >
                        Upload
                    </label>

                    {/* Spec list */}
                    {!_.isEmpty(projectDetails?.specs) ? (
                        <div className="mt-3">
                            <Scrollbar className="max-h-24" alwaysShowTracks={true}>
                                <ul>
                                    {projectDetails?.specs?.map((file) => {
                                        return (
                                            <li key={file.name}>
                                                <div className="rounded-md border bg-neutral-gray7 p-2 mb-2 flex flex-row items-center justify-between">
                                                    <p className="text-overline2">
                                                        {file.name} {Math.round(file.size / 1024)} KB
                                                    </p>
                                                    {isClaimSpec || isAdvSpec ? null : (
                                                        <AppIcon
                                                            aria-label="remove"
                                                            onClick={() => {
                                                                removeSelectedSpec(file.name);
                                                            }}
                                                            style={{ width: '18px', height: '18px' }}
                                                        >
                                                            <CloseIcon />
                                                        </AppIcon>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Scrollbar>
                        </div>
                    ) : null}

                    {_.isEmpty(projectDetails?.dbs) && _.isEmpty(projectDetails?.specs) && !_.isEmpty(specsError) && (
                        <p className="text-accent-red text-overline2 mt-2">{specsError}</p>
                    )}
                </div>
            ) : null}

            {/* <div className='mb-3'>
        <p className='text-mediumLabel mb-2'>Connect DB</p>
        <input
          id='dbs'
          type='file'
          accept='.sql'
          multiple
          hidden
          onChange={(e) => {
            handleOnDbsPick(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
        <label
          for='dbs'
          className='bg-brand-secondary rounded-md px-4 py-2
           text-white text-mediumLabel hover:opacity-90'
        >
          Upload
        </label> */}

            {/* Connected Dbs */}
            {/* {!_.isEmpty(projectDetails?.dbs) ? (
          <div className='mt-3'>
            <Scrollbar className='max-h-24' alwaysShowTracks={true}>
              <ul>
                {projectDetails?.dbs?.map((file) => {
                  return (
                    <li key={file.name}>
                      <div className='rounded-md border bg-neutral-gray7 p-2 mb-2 flex flex-row items-center justify-between'>
                        <p className='text-overline2'>
                          {file.name} {Math.round(file.size / 1024)} KB
                        </p>
                        <AppIcon
                          aria-label='remove'
                          onClick={() => {
                            removeSelectedDb(file.name);
                          }}
                          style={{ width: "18px", height: "18px" }}
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
            <p className='text-accent-red text-overline2 mt-2'>{dbsError}</p>
          )}
      </div> */}
        </div>
    );
};

export default ProjectDetails;
