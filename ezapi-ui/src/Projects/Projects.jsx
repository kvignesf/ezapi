import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import SystemUpdateAltIcon from '@material-ui/icons/SystemUpdateAlt';
import { styled, Tooltip, tooltipClasses } from '@mui/material';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useContext, useEffect, useRef, useState } from 'react';
import LoginGithub from 'react-login-github';
import TimeAgo from 'react-timeago';
// import client, { endpoint } from './shared/network/client';
import { CircularProgress, Dialog } from '@material-ui/core';
import Fade from '@material-ui/core/Fade';
// import { useHistory } from 'react-router';
import ReplayIcon from '@material-ui/icons/Replay';
import InfoIcon from '@mui/icons-material/Info';
import SearchBar from 'material-ui-search-bar';
import moment from 'moment';
import ReactPaginate from 'react-paginate';
import { useQuery } from 'react-query';
import { useHistory, useLocation } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { SocketContext } from '../Context/socket';
import Dashboard from '../Dashboard';
import { downloadIconProj, downloadIconSts } from '../Dashboard/dwnDataGenAtom';
import ModifyCollaborators from '../ModifyCollaborators/ModifyCollaborators';
import Colors from '../shared/colors';
import { PrimaryButton } from '../shared/components/AppButton';
import AppIcon from '../shared/components/AppIcon';
import InitialsAvatar from '../shared/components/InitialsAvatar';
import LoaderWithMessage from '../shared/components/LoaderWithMessage';
import client, { endpoint } from '../shared/network/client';
import routes, { generateRoute } from '../shared/routes';
import { getAccessToken, getUserId } from '../shared/storage';
import EmptyLogo from '../static/images/empty-state.svg';
import githubCustomSpinner from '../static/images/githubCommit-InProgress.gif';
import viewgithubLogo from '../static/images/GitHubView.svg';
import ApigeeLogo from '../static/images/logo/CloudLogo.png';
import DatabaseLogo from '../static/images/logo/database_download.svg';
import dotnetLogo from '../static/images/logo/dotnetlogo.svg';
import githubLogo from '../static/images/logo/github-icon.svg';
import javaLogo from '../static/images/logo/java-vertical.svg';
import nodeLogo from '../static/images/logo/nodejs.svg';
import pythonLogo from '../static/images/logo/pythonlogo.svg';
import Logo from '../static/images/logo/svg.svg';
import DeleteProject from './DeleteProject/DeleteProject';
import './pagination.css';
import {
    useDownloadApigee,
    useDownloadArtifacts,
    useDownloadCodegen,
    useDownloadDatabase,
    useDownloadDotnetCodegen,
    useDownloadNodeCodegen,
    useDownloadPythonCodegen,
    useDownloadSpecs,
    useGetProjects,
    usePushToGithub,
    useVIewRepo,
} from './projectQueries';
import RenameProject from './RenameProject/RenameProject';

//import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';

const acc_token = getAccessToken();

const MembersImages = ({ project, ...rest }) => {
    const loggedInUserId = getUserId();
    const userId = getUserId();

    return (
        <div
            className={classNames('flex flex-row', {
                'cursor-pointer': project?.author === userId,
            })}
            {...rest}
        >
            {_.isEmpty(project?.members) && loggedInUserId === project?.author ? (
                <p className="capitalize text-brand-secondary text-overline2">Invite Collaborators</p>
            ) : null}

            {project?.members?.map((member, index) => {
                if (index < 3) {
                    let firstName, lastName;

                    if (member?.user_data?.firstName) {
                        firstName = member?.user_data?.firstName;
                    }

                    if (member?.user_data?.lastName) {
                        lastName = member?.user_data?.lastName;
                    }

                    if (!firstName || _.isEmpty(firstName)) {
                        firstName = member?.email?.charAt(0);
                        lastName = member?.email?.charAt(0);
                    }

                    return (
                        <InitialsAvatar
                            key={member?.email}
                            firstName={firstName}
                            lastName={lastName}
                            className={classNames('rounded-full p-2 bg-brand-primarySubtle w-min', {
                                '-ml-2': index != 0,
                            })}
                        />
                    );
                }
                return null;
            })}

            {project?.members?.length > 3 ? (
                <p className="text-overline2 self-center ml-2">+ {project?.members?.length - 3} more</p>
            ) : null}
        </div>
    );
};
const baseUrl = process.env.REACT_APP_API_URL;
//const baseUrl = "http://localhost:7744"

const ProjectRow = ({
    project,
    showMembersDialog,
    handleOnDeleteApi,
    handleOnView,
    handleOnInvite,
    handleOnRename,
    handlePushToGithub,
}) => {
    const CustomTooltip = styled(({ className, ...props }) => <Tooltip {...props} classes={{ popper: className }} />)(
        ({ theme }) => ({
            [`& .${tooltipClasses.arrow}`]: {
                color: Colors.brand.primarySubtle,
            },
            [`& .${tooltipClasses.tooltip}`]: {
                backgroundColor: Colors.brand.primarySubtle,
                color: Colors.brand.primary,
            },
        }),
    );

    const [anchorEl, setAnchorEl] = React.useState(null);
    const [lastDataGenerated, setLastDataGenerated] = useState('Download Data');
    const datetime = new Date(project?.updatedAt);
    const loggedInUserId = getUserId();
    const { isLoading: isDownloadingSpecs, mutate: downloadSpecs } = useDownloadSpecs();
    const { isLoading: isDownloadingDatabase, mutate: downloadDatabase } = useDownloadDatabase();
    const { isLoading: isDownloadingApigee, mutate: downloadApigee } = useDownloadApigee();
    const { isLoading: isDownloadingArtifacts, mutate: downloadArtifacts } = useDownloadArtifacts();
    const { isLoading: isDownloadingCodegen, mutate: downloadCodegen } = useDownloadCodegen();
    const { isLoading: isDownloadingDotnetCodegen, mutate: downloadDotnetCodegen } = useDownloadDotnetCodegen();
    const { isLoading: isDownloadingPythonCodegen, mutate: downloadPythonCodegen } = useDownloadPythonCodegen();
    const { isLoading: isDownloadingNodeCodegen, mutate: downloadNodeCodegen } = useDownloadNodeCodegen();

    const handleOnOptionsClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const onDownloadSpecs = () => {
        downloadSpecs({ projectId: project?.projectId });
    };

    const onDownloadDatabase = () => {
        downloadDatabase({ projectId: project?.projectId });
    };

    const onDownloadApigee = () => {
        downloadApigee({ projectId: project?.projectId });
    };

    const onDownloadArtifact = () => {
        downloadArtifacts({ projectId: project?.projectId });
    };

    const onDownloadCodegen = () => {
        downloadCodegen({ projectId: project?.projectId });
    };

    const onDownloadDotnetCodegen = () => {
        downloadDotnetCodegen({ projectId: project?.projectId });
    };

    const onDownloadPythonCodegen = () => {
        downloadPythonCodegen({ projectId: project?.projectId });
    };

    const onDownloadNodeCodegen = () => {
        downloadNodeCodegen({ projectId: project?.projectId });
    };

    const onPushViewRepo = () => {
        viewRepo({ projectId: project?.projectId });
    };

    const [enableIcon, setEnableIcon] = useRecoilState(downloadIconSts);
    const [projectIden, setProjectIden] = useRecoilState(downloadIconProj);
    const [githubIcon, setGithubIcon] = React.useState(true);

    // console.log("enableIcon..", enableIcon);
    // console.log("projectIden..", projectIden);
    const {
        error: githubLoginError,
        isLoading: isgithubLoggingIn,
        isSuccess: isgithubLoginSuccess,
        mutate: pushToGithub,
        //data: githubPushResponse,
        //reset: resetgithubLogin,
    } = usePushToGithub();

    const { mutate: viewRepo } = useVIewRepo();

    const onGitHubLoginSuccess = async (response) => {
        console.log('..response..', response);
        const { code } = response;
        if (code) {
            pushToGithub({ code: code, projectId: project?.projectId });
        }
    };
    useEffect(() => {
        if (isgithubLoginSuccess) {
            //console.log("entered into useeffectt");
            setGithubIcon(false);
        }
    }, [isgithubLoginSuccess]);

    useEffect(() => {
        if (project?.lastDataGenerated) {
            const p = 'Download Data '.concat(moment(parseInt(project?.lastDataGenerated)).format('llll'));
            setLastDataGenerated(p);
        }
    }, [project?.lastDataGenerated]);

    return (
        <tr className="text-overline2">
            <td
                className="p-3 text-brand-secondary cursor-pointer"
                onClick={(event) => {
                    event?.preventDefault();
                    event?.stopPropagation();
                    handleOnView(project);
                }}
            >
                {project?.projectName}
                <CustomTooltip
                    // maxwidth={'10px'}
                    arrow
                    placement="right"
                    title={
                        project?.projectType === 'noinput' ? (
                            <span>Free Format API</span>
                        ) : project?.projectType === 'aggregate' ? (
                            <span>Aggregate API</span>
                        ) : project?.projectType === 'both' ? (
                            <span>
                                Data API
                                <br /> Spec Name: {project?.apiSpec[0]?.name ?? ''}
                                <br /> db Name: {project?.dbDetails?.database ?? ''}
                            </span>
                        ) : (
                            <span>
                                Data API
                                <br /> db Name: {project?.dbDetails?.database ?? ''}
                            </span>
                        )
                    }
                >
                    <InfoIcon fontSize="small" sx={{ ml: '3px', mb: '2px' }} />
                </CustomTooltip>
            </td>
            <td>
                <MembersImages
                    project={project}
                    onClick={() => {
                        if (loggedInUserId === project?.author) {
                            showMembersDialog(project);
                        }
                    }}
                />
            </td>
            <td>
                <TimeAgo date={datetime} />
            </td>
            <td>
                <p className="text-overline2">{project?.status}</p>
            </td>

            <td align="left">
                <div className="text-overline2">{project?.isDesign ? 'DESIGN' : 'TEST'}</div>
            </td>
            <td align="center" className="download-icons-styling">
                <div className="flex flex-row items-center gap-2">
                    {/* Codegen download */}
                    <div className="w-8">
                        {project?.status?.toLowerCase() === 'complete' &&
                            project?.projectType?.toLowerCase() !== 'schema' &&
                            !isDownloadingCodegen &&
                            project?.isDesign &&
                            project?.projectType !== 'noinput' && (
                                <Tooltip title={project?.codegen ? 'Java' : 'Java Code getting ready'}>
                                    <div
                                        style={{
                                            marginTop: '-15px',
                                            width: '18px',
                                            height: '18px',
                                        }}
                                    >
                                        <img
                                            src={javaLogo}
                                            alt="conektto logo"
                                            className={classNames({
                                                'opacity-50 cursor-default': !project?.codegen,
                                                'cursor-pointer text-brand-primary': project?.codegen,
                                            })}
                                            onClick={(e) => {
                                                e?.preventDefault();
                                                e?.stopPropagation();

                                                if (project?.codegen) {
                                                    onDownloadCodegen();
                                                }
                                            }}
                                        />
                                    </div>
                                </Tooltip>
                            )}
                        {isDownloadingCodegen && <CircularProgress style={{ width: '24px', height: '24px' }} />}
                    </div>
                    {/* <div className='w-8'>
            {project?.status?.toLowerCase() === "complete" &&
              project?.projectType?.toLowerCase() !== "schema" &&
              !isDownloadingCodegen && (
                <AppIcon
                  onClick={(e) => {
                    e?.preventDefault();
                    e?.stopPropagation();

                    if (project?.codegen) {
                      onDownloadCodegen();
                    }
                  }}
                >
                  <Tooltip
                    title={
                      project?.codegen
                        ? "Download Codegen"
                        : "Preparing Codegen"
                    }
                  >
                    <CodeIcon
                      className={classNames({
                        "opacity-50 cursor-default": !project?.codegen,
                        "cursor-pointer text-brand-primary": project?.codegen,
                      })}
                    />
                  </Tooltip>
                </AppIcon>
              )}

            {isDownloadingCodegen && (
              <CircularProgress style={{ width: "24px", height: "24px" }} />
            )}
          </div> */}
                    {/* dotnetCodegen download */}
                    <div className="w-8">
                        {project?.status?.toLowerCase() === 'complete' &&
                            project?.projectType?.toLowerCase() !== 'schema' &&
                            !isDownloadingDotnetCodegen &&
                            project?.isDesign &&
                            project?.projectType !== 'noinput' && (
                                <Tooltip title={project?.dotnetcodegen ? 'dotnet' : 'dotnet code getting ready'}>
                                    <div
                                        style={{
                                            marginTop: '-3px',
                                            width: '20px',
                                            height: '20px',
                                        }}
                                    >
                                        <img
                                            src={dotnetLogo}
                                            alt="conektto logo"
                                            className={classNames({
                                                'opacity-50 cursor-default': !project?.dotnetcodegen,
                                                'cursor-pointer text-brand-primary': project?.dotnetcodegen,
                                            })}
                                            onClick={(e) => {
                                                e?.preventDefault();
                                                e?.stopPropagation();

                                                if (project?.dotnetcodegen) {
                                                    onDownloadDotnetCodegen();
                                                }
                                            }}
                                        />
                                    </div>
                                </Tooltip>
                            )}
                        {isDownloadingDotnetCodegen && <CircularProgress style={{ width: '24px', height: '24px' }} />}
                    </div>
                    {/* pythoncodegen download */}
                    <div className="w-8">
                        {project?.status?.toLowerCase() === 'complete' &&
                            project?.projectType?.toLowerCase() !== 'schema' &&
                            !isDownloadingPythonCodegen &&
                            project?.isDesign &&
                            project?.projectType !== 'noinput' && (
                                <Tooltip title={project?.pythoncodegen ? 'python' : 'python code getting ready'}>
                                    <div
                                        style={{
                                            marginTop: '1px',
                                            width: '22px',
                                            height: '22px',
                                        }}
                                    >
                                        <img
                                            src={pythonLogo}
                                            alt="conektto logo"
                                            className={classNames({
                                                'opacity-50 cursor-default': !project?.pythoncodegen,
                                                'cursor-pointer text-brand-primary': project?.pythoncodegen,
                                            })}
                                            onClick={(e) => {
                                                e?.preventDefault();
                                                e?.stopPropagation();

                                                if (project?.pythoncodegen) {
                                                    onDownloadPythonCodegen();
                                                }
                                            }}
                                        />
                                    </div>
                                </Tooltip>
                            )}
                        {isDownloadingPythonCodegen && <CircularProgress style={{ width: '24px', height: '24px' }} />}
                    </div>
                    {/* nodecodegen download */}
                    <div className="w-8">
                        {project?.status?.toLowerCase() === 'complete' &&
                            project?.projectType?.toLowerCase() !== 'schema' &&
                            !isDownloadingNodeCodegen &&
                            project?.isDesign &&
                            project?.projectType !== 'noinput' && (
                                <Tooltip title={project?.nodecodegen ? 'node' : 'node code getting ready'}>
                                    <div
                                        style={{
                                            marginTop: '1px',
                                            width: '22px',
                                            height: '22px',
                                        }}
                                    >
                                        <img
                                            src={nodeLogo}
                                            alt="conektto logo"
                                            className={classNames({
                                                'opacity-40 cursor-default': !project?.nodecodegen,
                                                'cursor-pointer text-brand-primary': project?.nodecodegen,
                                            })}
                                            onClick={(e) => {
                                                e?.preventDefault();
                                                e?.stopPropagation();

                                                if (project?.nodecodegen) {
                                                    onDownloadNodeCodegen();
                                                }
                                            }}
                                        />
                                    </div>
                                </Tooltip>
                            )}
                        {isDownloadingNodeCodegen && <CircularProgress style={{ width: '24px', height: '24px' }} />}
                    </div>
                    {/* Spec download */}
                    <div className="w-8">
                        {' '}
                        {project?.status?.toLowerCase() === 'complete' &&
                            project?.publishStatus?.SpecGeneration?.success &&
                            !isDownloadingSpecs && (
                                <Tooltip title="Open API Spec">
                                    <div
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                        }}
                                    >
                                        <img
                                            src={Logo}
                                            alt="conektto logo"
                                            className="cursor-pointer"
                                            onClick={(e) => {
                                                e?.preventDefault();
                                                e?.stopPropagation();

                                                onDownloadSpecs();
                                            }}
                                        />
                                    </div>
                                </Tooltip>
                            )}
                        {isDownloadingSpecs && <CircularProgress style={{ width: '24px', height: '24px' }} />}
                    </div>

                    {/* Artefact download */}
                    <div className="w-8">
                        {' '}
                        {project?.status?.toLowerCase() === 'complete' &&
                            project?.publishStatus?.SankyGeneration?.success &&
                            project?.publishStatus?.ArtefactGeneration?.success &&
                            !isDownloadingArtifacts && (
                                <AppIcon
                                    onClick={(e) => {
                                        e?.preventDefault();
                                        e?.stopPropagation();

                                        onDownloadArtifact();
                                    }}
                                >
                                    <Tooltip title="API Workspace">
                                        <SystemUpdateAltIcon style={{ color: Colors.brand.primary }} />
                                    </Tooltip>
                                </AppIcon>
                            )}
                        {isDownloadingArtifacts && <CircularProgress style={{ width: '24px', height: '24px' }} />}
                    </div>

                    {/* Data download */}
                    <div className="w-8">
                        {' '}
                        {project?.status?.toLowerCase() === 'complete' &&
                            project?.isConnectDB &&
                            (project?.datagen_count > 0 || project?.datagen_perf_count > 0) &&
                            project?.lastDataGenRequestOffline &&
                            !isDownloadingDatabase && (
                                <Tooltip title={lastDataGenerated}>
                                    <div
                                        style={{
                                            marginTop: '12px',
                                            width: '36px',
                                            height: '36px',
                                        }}
                                    >
                                        <img
                                            src={DatabaseLogo}
                                            alt="conektto logo"
                                            className="cursor-pointer"
                                            onClick={(e) => {
                                                e?.preventDefault();
                                                e?.stopPropagation();

                                                onDownloadDatabase();
                                            }}
                                        />
                                    </div>
                                </Tooltip>
                            )}
                        {isDownloadingDatabase && <CircularProgress style={{ width: '24px', height: '24px' }} />}
                    </div>
                    {/* Apigee download */}
                    <div className="w-8">
                        {' '}
                        {project?.status?.toLowerCase() === 'complete' &&
                            project?.publishStatus?.SankyGeneration?.success &&
                            project?.publishStatus?.ArtefactGeneration?.success &&
                            !isDownloadingApigee &&
                            project?.isDesign && (
                                <Tooltip title="Apigee Bundle">
                                    <div
                                        style={{
                                            marginTop: '12px',
                                            width: '36px',
                                            height: '36px',
                                        }}
                                        className=" -ml-1"
                                    >
                                        <img
                                            src={ApigeeLogo}
                                            alt="Apigee logo"
                                            className="cursor-pointer"
                                            onClick={(e) => {
                                                e?.preventDefault();
                                                e?.stopPropagation();

                                                onDownloadApigee();
                                            }}
                                        />
                                    </div>
                                </Tooltip>
                            )}
                        {isDownloadingApigee && <CircularProgress style={{ width: '24px', height: '24px' }} />}
                    </div>
                </div>
            </td>

            <td align="left">
                {/* Github Upload */}
                <div className="w-8">
                    {project?.status?.toLowerCase() === 'complete' &&
                        project?.projectType?.toLowerCase() !== 'schema' &&
                        project?.isDesign && (
                            <Tooltip
                                title={
                                    project?.githubCommit === 'ReadyForPush' &&
                                    (project?.codegen || project?.dotnetcodegen || project?.pythoncodegen)
                                        ? 'Push to Github'
                                        : project?.githubCommit === 'ReadyForView'
                                        ? 'View on Github'
                                        : project?.githubCommit === 'CommitInProgress'
                                        ? 'Commit In Progress'
                                        : ''
                                }
                            >
                                <div
                                    style={{
                                        marginTop: '-12px',
                                        width: '18px',
                                        height: '18px',
                                    }}
                                >
                                    {/* <GitHubIcon
                    className='cursor-pointer'
                    onClick={() => {
                      // setAnchorEl(null);
                      handlePushToGithub(project);
                    }}
                    /> */}
                                    {project?.githubCommit === 'ReadyForPush' &&
                                        (project?.codegen || project?.dotnetcodegen || project?.pythoncodegen) && (
                                            <LoginGithub
                                                clientId={process.env.REACT_APP_GITHUB_CLIENT_ID}
                                                redirectUri={process.env.REACT_APP_REDIRECT_URI}
                                                onSuccess={onGitHubLoginSuccess}
                                                //onSuccess={() => {console.log("onSuccess")}}
                                                scope="user project repo email"
                                                // onFailure={onGitHubFailure}
                                                // className="github-push-button"
                                            >
                                                {/* <GitHubIcon  style={{ color: "#000000", height: "18px", width: "18px" }} />     */}
                                                <div className="pl-1 pr-2" style={{ width: '32px' }}>
                                                    <div className="github-ico-wrapper">
                                                        <img
                                                            src={githubLogo}
                                                            alt="github logo to commit"
                                                            style={{ width: '28px', height: '28px' }}
                                                        />
                                                    </div>
                                                </div>
                                            </LoginGithub>
                                        )}
                                    {project?.githubCommit === 'ReadyForView' && (
                                        <div className="pl-1" style={{ width: '32px', align: 'left' }}>
                                            <div className="github-ico-wrapper">
                                                <img
                                                    src={viewgithubLogo}
                                                    alt="view github logo after commit"
                                                    style={{ width: '32px', height: '32px' }}
                                                    onClick={(e) => {
                                                        e?.preventDefault();
                                                        e?.stopPropagation();
                                                        onPushViewRepo();
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Tooltip>
                        )}
                    {project?.githubCommit === 'CommitInProgress' && (
                        <Tooltip title={'Commit In Progress'}>
                            <img
                                src={githubCustomSpinner}
                                alt="github commit in progress..."
                                style={{ width: '32px', height: '32px' }}
                            />
                        </Tooltip>
                    )}
                </div>
            </td>

            <td align="center">
                <AppIcon onClick={handleOnOptionsClick}>
                    <MoreVertIcon />
                </AppIcon>
            </td>

            {/* Profile options */}
            <Menu
                id={`fade-menu-${project?.projectName}`}
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={() => {
                    setAnchorEl(null);
                }}
                TransitionComponent={Fade}
                style={{ borderRadius: '1rem' }}
            >
                <MenuItem
                    onClick={() => {
                        setAnchorEl(null);
                        handleOnView(project);
                    }}
                >
                    View
                </MenuItem>

                {loggedInUserId === project?.author && (
                    <div>
                        <MenuItem
                            onClick={() => {
                                setAnchorEl(null);
                                handleOnInvite(project);
                            }}
                        >
                            Invite
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                setAnchorEl(null);
                                handleOnRename(project);
                            }}
                        >
                            Rename
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                setAnchorEl(null);
                                handleOnDeleteApi(project);
                            }}
                            style={{ color: Colors.accent.red }}
                        >
                            Delete API
                        </MenuItem>
                    </div>
                )}
            </Menu>
        </tr>
    );
};

const Content = ({ showCreateProjectDialog }) => {
    //socket related code for event handling
    //load socket from context
    const socket = useContext(SocketContext);

    useEffect(() => {
        // listen to events emitted by socker server (from node)

        if (socket) {
            socket.emit('userConnected', {
                user: getUserId(),
            });

            let fetchProjects = (eventName) => {
                refetchProjects();
            };
            // look for when the server emits the updated count
            socket.on('githubEvent', (eventName) => {
                fetchProjects(eventName);
            });

            socket.on('projectStatusEvent', (eventName) => {
                fetchProjects(eventName);
            });

            socket.on('codegenEvent', (eventName) => {
                fetchProjects(eventName);
            });

            socket.on('dotnetcodegenEvent', (eventName) => {
                fetchProjects(eventName);
            });

            socket.on('pythoncodegenEvent', (eventName) => {
                fetchProjects(eventName);
            });

            socket.on('nodecodegenEvent', (eventName) => {
                fetchProjects(eventName);
            });
        }
    }, []);

    const {
        data: projects,
        isLoading: isFetchingProjects,
        error: fetchProjectsError,
        isFetching: isFetchingProjectsBg,
        refetch: refetchProjects,
    } = useGetProjects();

    const [dialog, setDialog] = useState({
        show: false,
        type: null,
        data: null,
    });
    const itemsPerPage = 8;
    // We start with an empty list of items.
    const [itemOffset, setItemOffset] = useState(0);
    const [currentItems, setCurrentItems] = useState(projects?.slice(itemOffset, itemOffset + itemsPerPage));
    const [filteredRow, setFilteredRow] = useState(currentItems);
    const [pageCount, setPageCount] = useState(0);
    const [searched, setSearched] = useState('');
    // Here we use item offsets; we could also use page offsets
    // following the API or data you're working with.

    const history = useHistory();
    const pagination = useRef();

    //commenting code - this is handled thru socket-events
    /*  useEffect(() => {
    const projectsFetchInterval = setInterval(() => refetchProjects(), 45000);
    return () => {
      clearInterval(projectsFetchInterval);
    };
  }); */

    useEffect(() => {
        // Fetch items from another resources.
        const endOffset = itemOffset + itemsPerPage;
        setCurrentItems(projects?.slice(itemOffset, endOffset));
        setPageCount(Math.ceil(projects?.length / itemsPerPage));
    }, [itemOffset, itemsPerPage, projects]);

    const handlePageClick = (event) => {
        sessionStorage.setItem('pageIndex', event.selected);
        const newOffset = (event.selected * itemsPerPage) % projects.length;
        setItemOffset(newOffset);
    };

    const requestSearch = (searchedVal) => {
        //console.log(searchedVal);
        if (searchedVal) {
            document.querySelector('[aria-label="Page 1"]')?.click();
            const filteredRows = projects.filter((row) => {
                let membersExists = false;
                row.members.map((member) => {
                    // console.log(member);
                    if (member.email.toLowerCase().includes(searchedVal.toLowerCase())) {
                        membersExists = true;
                        return;
                    }
                });

                return (
                    row.projectName.toLowerCase().includes(searchedVal.toLowerCase()) ||
                    row.status.toLowerCase().includes(searchedVal.toLowerCase()) ||
                    membersExists
                );
            });
            setCurrentItems(filteredRows?.slice(itemOffset, itemOffset + itemsPerPage));
        } else {
            setCurrentItems(projects?.slice(itemOffset, itemOffset + itemsPerPage));
        }
    };

    const cancelSearch = (searched) => {
        setCurrentItems(projects?.slice(itemOffset, itemOffset + itemsPerPage));
        document.querySelector('[aria-label="Page 1"]')?.click();
    };

    const showMembersDialog = (project) => {
        setDialog({
            show: true,
            type: 'members',
            data: project,
        });
    };

    const showRenameProjectDialog = (project) => {
        setDialog({
            show: true,
            type: 'rename-project',
            data: project,
        });
    };

    const showPushToGithubProjectDialog = (project) => {
        setDialog({
            show: true,
            type: 'push-to-github',
            data: project,
        });
    };

    const showDeleteProjectDialog = (project) => {
        setDialog({
            show: true,
            type: 'del-project',
            data: project,
        });
    };

    const handleCloseDialog = () => {
        setDialog({
            show: false,
            data: null,
            type: null,
        });
    };

    const handleOnView = (project) => {
        if (project?.status === 'IN_PROGRESS' || project?.status === 'COMPLETE') {
            // history.push(generateRoute(routes.projects, project?.projectId));
            history.push({
                pathname: generateRoute(routes.projects, project?.projectId),
                state: { allow: true },
            });
        }
    };

    const handleOnInvite = (project) => {
        showMembersDialog(project);
    };

    const handleOnRename = (project) => {
        showRenameProjectDialog(project);
    };

    const handlePushToGithub = (project) => {
        showPushToGithubProjectDialog(project);
    };

    const handleOnDeleteApi = (project) => {
        showDeleteProjectDialog(project);
    };

    if (isFetchingProjects) {
        return <LoaderWithMessage message={'Fetching Projects'} />;
    }
    // console.log(dialog?.data);
    //console.log(projects);

    // console.log(projects);
    return (
        <>
            {' '}
            <div className="p-3 h-full">
                <Dialog
                    aria-labelledby="projects-dialog"
                    open={dialog?.show ?? false}
                    fullWidth
                    PaperProps={{
                        style: { borderRadius: 8 },
                    }}
                    onClose={(event, reason) => {
                        if (reason !== 'backdropClick') {
                            handleCloseDialog();
                        }
                    }}
                >
                    {dialog?.type === 'members' && (
                        <ModifyCollaborators
                            projectId={dialog?.data?.projectId}
                            onClose={handleCloseDialog}
                            invitedCollaborators={dialog?.data?.members}
                        />
                    )}

                    {dialog?.type === 'rename-project' && (
                        <RenameProject onClose={handleCloseDialog} project={dialog?.data} />
                    )}

                    {dialog?.type === 'del-project' && (
                        <DeleteProject onClose={handleCloseDialog} project={dialog?.data} />
                    )}
                </Dialog>

                {projects && !_.isEmpty(projects) && (
                    <div className="flex flex-col">
                        {' '}
                        <div className="flex flex-col h-full">
                            <div className=" flex justify-end pb-1 mb-1">
                                <SearchBar
                                    style={{ height: 35, width: 500 }}
                                    value={searched}
                                    onChange={(searchVal) => requestSearch(searchVal)}
                                    onCancelSearch={(searchVal) => cancelSearch(searchVal)}
                                />
                            </div>

                            <div className="h-full">
                                <table className="w-full">
                                    <thead>
                                        <tr className="mr-16 bg-neutral-gray6 w-full text-left text-neutral-gray4 text-mediumLabel">
                                            <th className="p-2 w-1/5 rounded-tl-md rounded-bl-md">API PROJECT</th>
                                            <th className="">COLLABORATORS</th>
                                            <th className="">LAST ACTIVITY</th>
                                            <th className="">STATUS</th>
                                            <th className="">DESIGN / TEST</th>
                                            <th className="pl-8">DOWNLOAD</th>
                                            <th className="">GITHUB</th>
                                            <th className="rounded-tr-md rounded-br-md text-center">
                                                {isFetchingProjectsBg ? (
                                                    <CircularProgress size="20px" />
                                                ) : (
                                                    <Tooltip title="Refresh list">
                                                        <ReplayIcon
                                                            style={{
                                                                width: '20px',
                                                                height: '20px',
                                                                color: Colors.brand.primary,
                                                                cursor: 'pointer',
                                                            }}
                                                            onClick={(e) => {
                                                                e?.preventDefault();
                                                                e?.stopPropagation();
                                                                refetchProjects();
                                                            }}
                                                        />
                                                    </Tooltip>
                                                )}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems?.map((project) => {
                                            return (
                                                <ProjectRow
                                                    project={project}
                                                    showMembersDialog={showMembersDialog}
                                                    handleOnRename={handleOnRename}
                                                    handleOnInvite={handleOnInvite}
                                                    handleOnView={handleOnView}
                                                    handleOnDeleteApi={handleOnDeleteApi}
                                                    handlePushToGithub={handlePushToGithub}
                                                    key={project?.['_id']}
                                                />
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!projects ||
                    (_.isEmpty(projects) && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <img src={EmptyLogo} className="mb-4" style={{ width: '100px', height: '100px' }} />

                            <h5 className="mb-3">No API project available</h5>

                            <h6 className="mb-11 text-neutral-gray3">Start creating a new API project</h6>

                            <PrimaryButton
                                onClick={() => {
                                    showCreateProjectDialog();
                                }}
                            >
                                Create new API Project
                            </PrimaryButton>
                        </div>
                    ))}
            </div>
            <div className="flex h mb-64 justify-center mt-5 align-bottom items-end">
                {' '}
                <ReactPaginate
                    // class='pagination'
                    // className='flex'
                    initialPage={Number(sessionStorage.getItem('pageIndex'))}
                    ref={pagination}
                    pageCount={projects.length / itemsPerPage}
                    pageRangeDisplayed={5}
                    marginPagesDisplayed={1}
                    onPageChange={handlePageClick}
                    containerClassName="pagination"
                    activeClassName="active"
                    previousLabel={<>&laquo;</>}
                    nextLabel={<>&raquo;</>}
                />
            </div>
        </>
    );
};

const Projects = () => {
    const [stay, setStay] = React.useState(true);
    const [renderNow, setRenderNow] = React.useState(false);
    const location = useLocation();

    useEffect(
        () => {
            // console.log(locatison.state?.['allow']);
            if (location.state?.['allow'] == true) {
                setStay(true);
            } else {
                setStay(false);
            }
        },
        [location],
        [],
    );
    const history = useHistory();
    const userProfile = async () => {
        try {
            const { data } = await client.get(endpoint.userProfile, {
                headers: {
                    Authorization: acc_token,
                },
            });

            return data;
        } catch (error) {}
    };
    const { data } = useQuery('userProfileKey', userProfile, {
        refetchOnWindowFocus: false,
    });
    //console.log(data?.["plan_name"]);
    //console.log(stay);

    if (data?.['plan_name'] === null && !stay) {
        history.push(routes.pricing);
        // setRenderNow(false);
    }
    // else {
    //   setRenderNow(true);
    // }
    return (
        <>
            {' '}
            {
                <Dashboard selectedIndex={1}>
                    <Content />
                </Dashboard>
            }
        </>
    );
};

export default Projects;
