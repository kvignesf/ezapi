import { Fade, Tab, Tabs, TextField } from '@material-ui/core';
import { Menu, MenuItem } from '@material-ui/core/index';
import AddIcon from '@material-ui/icons/Add';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import classNames from 'classnames';
import _, { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGetRecoilValueInfo_UNSTABLE, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import Colors from '../../../shared/colors';
import AppIcon from '../../../shared/components/AppIcon';
import LoaderWithMessage from '../../../shared/components/LoaderWithMessage';
import TabLabel from '../../../shared/components/TabLabel';
import Constants from '../../../shared/constants';
import { operationAtomWithMiddleware, useCanEdit } from '../../../shared/utils';
import Body from '../Body/Body';
import Headers from '../Headers/Headers';

const Response = ({
    getDetailsMutation: { isLoading: isLoadingOperationResponse, data: operationData, mutate: getOperationDetails },
    onDelete = () => {},
    projectType = 'schema',
}) => {
    const operationState = useRecoilValue(operationAtomWithMiddleware);
    const [selectedResponseCode, setSelectedResponseCode] = useState(
        operationState?.operationResponse[0]?.responseCode ?? 200,
    );
    const canEdit = useCanEdit();
    const getRecoilValueInfo = useGetRecoilValueInfo_UNSTABLE();

    const changeResponseCode = (value) => {
        setSelectedResponseCode(value);
    };

    const getSelectedResponse = () => {
        const { loadable: operationAtomLoadable } = getRecoilValueInfo(operationAtomWithMiddleware);
        const operationState = operationAtomLoadable?.contents;

        const response = operationState?.operationResponse?.find((item) => item.responseCode === selectedResponseCode);

        return response;
    };

    const selectedReponse = useMemo(() => getSelectedResponse(), [selectedResponseCode, operationState]);

    if (isLoadingOperationResponse) {
        return (
            <div className="mt-24">
                <LoaderWithMessage message={'Fetching details'} contained />
            </div>
        );
    }

    return (
        <div className="h-full">
            <div className="flex flex-row items-center">
                <div className="flex flex-row w-min mb-2 m-3 mr-10">
                    <ResponseCodeSelection onChange={changeResponseCode} selectedCode={selectedResponseCode} />

                    {canEdit() && <AddResponseCode />}
                </div>

                <div className="">
                    <Description value={selectedReponse?.description} selectedResponseCode={selectedResponseCode} />
                </div>
            </div>

            <ResponseContent
                selectedCode={selectedResponseCode}
                projectType={projectType}
                onDelete={() => {
                    onDelete();
                }}
            />
        </div>
    );
};

const Description = ({ value, selectedResponseCode }) => {
    const canEdit = useCanEdit();
    const setOperationDetails = useSetRecoilState(operationAtomWithMiddleware);

    const onDescriptionUpdate = useCallback(
        debounce((value) => {
            if (canEdit()) {
                setOperationDetails((operationDetails) => {
                    const clonedOperationDetails = _.cloneDeep(operationDetails);
                    const responseIndex = operationDetails?.operationResponse?.findIndex(
                        (item) => item.responseCode === selectedResponseCode,
                    );

                    if (responseIndex >= 0) {
                        const responseData = operationDetails?.operationResponse[responseIndex];
                        const clonedResponseData = _.cloneDeep(responseData);

                        clonedResponseData.description = value;

                        clonedOperationDetails.operationResponse[responseIndex] = clonedResponseData;

                        return clonedOperationDetails;
                    }

                    return operationDetails;
                });
            }
        }, 300),
        [selectedResponseCode],
    );

    return (
        <div className="flex flex-row mr-2 items-center">
            <p className="text-overline2 mr-2">Status Message</p>

            <TextField
                key={`${selectedResponseCode}`}
                variant="outlined"
                defaultValue={value ?? ''}
                disabled={!canEdit()}
                onKeyUp={(e) => {
                    if (canEdit()) {
                        const { value } = e.target;

                        onDescriptionUpdate(value);
                    }
                }}
                inputProps={{
                    style: {
                        padding: '0.5rem',
                    },
                }}
            />
        </div>
    );
};

const ResponseContent = ({ selectedCode, projectType, onDelete = () => {} }) => {
    const [currentTab, setTab] = useState(0);
    const [operationState, setOperationState] = useRecoilState(operationAtomWithMiddleware);
    const [responseData, setData] = useState(null);

    useEffect(() => {
        const responseContent = operationState.operationResponse.find((item) => item.responseCode === selectedCode);

        setData(responseContent);
    }, [selectedCode]);

    if (!responseData) {
        return null;
    }

    return (
        <div>
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
                    label={<TabLabel label={'Headers'} />}
                    style={{
                        outline: 'none',
                    }}
                />

                <Tab
                    label={<TabLabel label={'Response Body'} />}
                    style={{
                        outline: 'none',
                    }}
                />
            </Tabs>

            {currentTab === 0 && <Headers key={selectedCode} request={false} responseCode={selectedCode} />}
            {currentTab === 1 && (
                <Body
                    key={selectedCode}
                    request={false}
                    responseCode={selectedCode}
                    projectType={projectType}
                    onDelete={() => {
                        onDelete();
                    }}
                />
            )}
        </div>
    );
};

const AddResponseCode = () => {
    const [profileMenuAnchorEl, setProfilemenuAnchorEl] = useState(null);
    const [operationState, setOperationState] = useRecoilState(operationAtomWithMiddleware);

    const getAvailableResponseCodes = () => {
        const clonedAllResponse = _.cloneDeep(Constants.allResponses);

        for (let index = 0; index < operationState?.operationResponse?.length; index++) {
            const element = operationState?.operationResponse[index];

            _.remove(clonedAllResponse, (item) => item?.code === element?.responseCode);
        }

        return clonedAllResponse;
    };

    const availableResponseCodes = useMemo(() => getAvailableResponseCodes(), [operationState]);

    const onAdd = (response) => {
        setOperationState((operationState) => {
            const clonedOperationState = _.cloneDeep(operationState);

            clonedOperationState.operationResponse.push({
                responseCode: response?.code,
                description: response?.description,
                headers: [],
                body: [],
            });

            return clonedOperationState;
        });
    };

    if (_.isEmpty(availableResponseCodes)) {
        return null;
    }

    return (
        <div className="p-1 pl-2 pr-2  flex flex-row items-center rounded-r-md border-2">
            <AppIcon
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setProfilemenuAnchorEl(e?.currentTarget);
                }}
            >
                <AddIcon style={{ fontSize: '18px', color: Colors.neutral.gray5 }} />
            </AppIcon>

            <Menu
                id="add-response-code-menu"
                anchorEl={profileMenuAnchorEl}
                keepMounted
                open={Boolean(profileMenuAnchorEl)}
                onClose={() => {
                    setProfilemenuAnchorEl(null);
                }}
                TransitionComponent={Fade}
                style={{ borderRadius: '1rem', zIndex: '100' }}
            >
                {availableResponseCodes.map((response) => {
                    return (
                        <MenuItem
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setProfilemenuAnchorEl(null);

                                onAdd(response);
                            }}
                        >
                            {response?.code}
                        </MenuItem>
                    );
                })}
            </Menu>
        </div>
    );
};

const ResponseCodeSelection = ({ selectedCode, onChange }) => {
    const [operationState, setOperationState] = useRecoilState(operationAtomWithMiddleware);

    const getResponseCodes = () => {
        return (
            operationState?.operationResponse?.map((item) => {
                return item?.responseCode;
            }) ?? []
        );
    };

    const responseCodes = useMemo(() => getResponseCodes(), [operationState]);

    return (
        <>
            {responseCodes?.map((code, index) => {
                return <ResponseCodeItem selectedCode={selectedCode} code={code} index={index} onChange={onChange} />;
            })}
        </>
    );
};

const ResponseCodeItem = ({ index, code, selectedCode, onChange }) => {
    const [profileMenuAnchorEl, setProfilemenuAnchorEl] = useState(null);
    const [operationState, setOperationState] = useRecoilState(operationAtomWithMiddleware);
    const canEdit = useCanEdit();

    const getResponseCodes = () => {
        return (
            operationState?.operationResponse?.map((item) => {
                return item?.responseCode;
            }) ?? []
        );
    };

    const responseCodes = useMemo(() => getResponseCodes(), [operationState]);

    const getAvailableResponseCodes = () => {
        const clonedAllResponse = _.cloneDeep(Constants.allResponses);

        for (let index = 0; index < operationState?.operationResponse?.length; index++) {
            const element = operationState?.operationResponse[index];

            _.remove(clonedAllResponse, (item) => item?.code === element?.responseCode);
        }

        return clonedAllResponse;
    };

    const availableResponseCodes = useMemo(() => getAvailableResponseCodes(), [operationState]);

    const onDelete = (code) => {
        if (canEdit()) {
            if (code !== Constants.mandatoryResponse.code) {
                setOperationState((operationState) => {
                    const clonedOperationState = _.cloneDeep(operationState);
                    const itemIndex = clonedOperationState.operationResponse.findIndex(
                        (item) => item.responseCode === code,
                    );

                    if (itemIndex >= 0) {
                        clonedOperationState.operationResponse.splice(itemIndex, 1);

                        onChange(clonedOperationState.operationResponse[0].responseCode);
                    }

                    return clonedOperationState;
                });
            }
        }
    };

    return (
        <div
            className={classNames('p-1 pl-2 pr-2 flex flex-row items-center cursor-pointer border-r-0', {
                'rounded-l-md': index === 0,

                'bg-brand-primary': code === selectedCode,
                'border-2': code !== selectedCode,

                'rounded-r-md border-r-2': index === responseCodes?.length - 1 && availableResponseCodes?.length === 0,

                'rounded-r-md border-r-2': index === responseCodes?.length - 1 && !canEdit(),
            })}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                onChange(code);
            }}
        >
            <p
                className={classNames('text-overline2', {
                    'text-white': code === selectedCode,
                    'text-neutral-gray4': code !== selectedCode,
                })}
            >
                {code}
            </p>

            {code !== Constants.mandatoryResponse.code && code === selectedCode && canEdit() && (
                <div className="ml-1 flex flex-row items-center">
                    <AppIcon
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            setProfilemenuAnchorEl(e?.currentTarget);
                        }}
                    >
                        <MoreVertIcon style={{ fontSize: '18px', color: 'white' }} />
                    </AppIcon>

                    <Menu
                        id="edit-response-code-menu"
                        anchorEl={profileMenuAnchorEl}
                        keepMounted
                        open={Boolean(profileMenuAnchorEl)}
                        onClose={() => {
                            setProfilemenuAnchorEl(null);
                        }}
                        TransitionComponent={Fade}
                        style={{ borderRadius: '1rem', zIndex: '100' }}
                    >
                        <MenuItem
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setProfilemenuAnchorEl(null);

                                onDelete(code);
                            }}
                        >
                            <p className="text-accent-red">Delete</p>
                        </MenuItem>
                    </Menu>
                </div>
            )}
        </div>
    );
};

export default Response;
