import { Tab, Tabs, TextField } from '@material-ui/core';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router';
import { useRecoilState } from 'recoil';
import { operationAtomWithMiddleware } from '../../../shared/utils';
// import { useParams } from "react-router";
// import { useGetOperation } from "../../../shared/query/operationDetailsQuery";
import LoaderWithMessage from '../../../shared/components/LoaderWithMessage';
import TabLabel from '../../../shared/components/TabLabel';
import Authorization from '../Authorization/Authorization';
import Body from '../Body/Body';
import FormData from '../FormData/FormData';
import Headers from '../Headers/Headers';
import PathParams from '../PathParams/PathParams';
import QueryParams from '../QueryParams/QueryParams';
// import { operationAtomWithMiddleware } from "../../../shared/utils";

const Request = ({
    getDetailsMutation: { isLoading: isLoadingOperationRequest },
    onDelete = () => {},
    projectType = 'schema',
    ...props
}) => {
    const { projectId } = useParams();
    const [operationState, setOperationState] = useRecoilState(operationAtomWithMiddleware);

    const [paramNameArr, setParamNameArr] = useState([]);
    const [pathValidator, setPathValidator] = useState(true);
    const [pathParam, setPathParam] = useState();
    const [firstTime, setFirstTime] = useState(true);
    const [prevPath, setPrevPath] = useState('');
    const [selected, setSelected] = React.useState(false);
    const [customPath, setCustomPath] = useState(operationState?.operationRequest?.endpoint);

    function buildcustomPath(currentPath) {
        if (!validateBrackets(currentPath)) {
            // setPathValidator(false);
        } else {
            var c_name = currentPath;
            var path_name = '/' + operationState.path.pathName;
            //path
            if (c_name?.includes(path_name + '/') && path_name[1] == c_name?.[1]) {
            } else {
                c_name = path_name;
            }
            //adding

            var uiPath = CalcPathParArr();
            uiPath.map((paramItem, index) => {
                if (c_name.includes('{' + paramItem + '}')) {
                } else {
                    c_name = c_name?.concat('/{' + paramItem + '}');
                }
            });
            //deleting
            var paramsToDelete = [];
            var pattern = /\{(.*?)\}/g;
            var match;
            while ((match = pattern.exec(c_name)) != null) {
                paramsToDelete.push(match[1]);
            }

            var paramsToDelete = paramsToDelete.filter((paramItem) => !uiPath.includes(paramItem));
            paramsToDelete.map((deleteItem) => {
                c_name = c_name?.replace('/{' + deleteItem + '}', '');
            });
            setCustomPath(c_name);
            setPathValidator(validateBrackets(customPath));
        }
        return currentPath;
    }

    const validateBrackets = (str = '') => {
        const strArr = str.split('');
        let counter = 0;
        for (let i = 0, len = strArr.length; i < len; i++) {
            if (strArr[i] === '{') {
                counter++;
            } else if (strArr[i] === '}') {
                counter--;
            }
            if (counter < 0) {
                return false;
            }
        }
        if (counter === 0) {
            return true;
        }
        return false;
    };

    useEffect(() => {
        if (operationState?.operationRequest?.endpoint != undefined) {
            buildcustomPath(operationState?.operationRequest?.endpoint);
        }
    }, [operationState?.operationRequest?.endpoint]);

    function CalcPathParArr() {
        let pathParamArray = operationState.operationRequest.pathParams;
        var tempArr = [];
        if (pathParamArray.length == 0) {
            tempArr = [];
        } else {
            pathParamArray.map((item) => {
                tempArr.push(item['name']);
            });
        }
        if ((JSON.stringify(pathParam) != JSON.stringify(tempArr) && pathParam) || firstTime) {
            setFirstTime(false);
            setParamNameArr(tempArr);
            setPathParam(tempArr);
        }
        return tempArr;
    }

    useEffect(() => {
        buildcustomPath(customPath);
        postSinkRequest(customPath);
    }, [operationState.operationRequest.pathParams]);

    const [currentTab, setTab] = useState(0);

    if (isLoadingOperationRequest) {
        return (
            <div className="mt-24">
                <LoaderWithMessage message={'Fetching details'} contained />
            </div>
        );
    }

    function postSinkRequest(currentPath) {
        if (currentPath != prevPath) {
            setPrevPath(currentPath);
            setOperationState((operationState) => {
                const newOperationDetails = _.cloneDeep(operationState);
                const clonedCustomPat = _.cloneDeep(customPath);
                newOperationDetails.operationRequest['endpoint'] = clonedCustomPat;
                return newOperationDetails;
            });
        }
    }

    return (
        <div>
            <div className="border-b-2 mx-3 h-full">
                <Tabs
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
                        label={<TabLabel label={'Authorization'} />}
                        style={{
                            outline: 'none',
                        }}
                    />
                    <Tab
                        label={<TabLabel label={'Headers'} />}
                        style={{
                            outline: 'none',
                        }}
                    />

                    <Tab
                        label={<TabLabel label={'Form Data'} />}
                        style={{
                            outline: 'none',
                        }}
                    />
                    <Tab
                        label={<TabLabel label={'Path Params'} />}
                        style={{
                            outline: 'none',
                        }}
                    />
                    <Tab
                        label={<TabLabel label={'Query Params'} />}
                        style={{
                            outline: 'none',
                        }}
                    />
                    {operationState?.operation?.operationType?.toLowerCase() !== 'get' && (
                        <Tab
                            label={<TabLabel label={'Request Body'} />}
                            style={{
                                outline: 'none',
                            }}
                        />
                    )}
                </Tabs>
            </div>
            {currentTab == 3 && (
                <div className="flex flex-row justify-end mr-2 ">
                    {' '}
                    <p className="  self-center mr-5">Path: </p>
                    {props.canEdit ? (
                        <TextField
                            defaultValue={customPath}
                            className="path"
                            disabled={!props.canEdit}
                            error={!pathValidator}
                            helperText={!pathValidator ? 'Invalid Path' : null}
                            onBlur={(e) => {
                                postSinkRequest(e?.target?.value);
                            }}
                            id="outlined-basic"
                            variant="outlined"
                            size="small"
                            onDes
                            style={{ width: '75%', color: 'red', textColor: 'red' }}
                            value={customPath}
                            onChange={(e) => {
                                buildcustomPath(e?.currentTarget?.value);
                                // setTempPath(e?.currentTarget?.value);
                            }}
                        />
                    ) : (
                        <p className="h-5 my-2 mr-44  self-center">{customPath}</p>
                    )}
                    {/* <AppIcon
            onClick={(e) => {
              e?.preventDefault();
              e?.stopPropagation();

              customPathSave();
            }}
          >
            <Tooltip title='Save changes'>
              <CloudUploadIcon style={{ color: "lightblue" }} />
            </Tooltip>
          </AppIcon> */}
                </div>
            )}
            {currentTab === 0 && <Authorization canEdit={props.canEdit} request={true} />}
            {currentTab === 1 && <Headers request={true} />}
            {currentTab === 2 && <FormData request={true} />}
            {currentTab === 3 && <PathParams canEdit={props.canEdit} request={true} />}
            {currentTab === 4 && <QueryParams request={true} />}
            {currentTab === 5 && (
                <Body
                    request={true}
                    projectType={projectType}
                    onDelete={() => {
                        onDelete();
                    }}
                />
            )}
        </div>
    );
};

export default Request;
