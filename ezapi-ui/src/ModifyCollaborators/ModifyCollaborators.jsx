import { CircularProgress } from '@material-ui/core';
import Fade from '@material-ui/core/Fade';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import CloseIcon from '@material-ui/icons/Close';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { useInviteCollaborator, useUpdateProject } from '../Projects/projectQueries';
import Colors from '../shared/colors';
import { PrimaryButton } from '../shared/components/AppButton';
import AppIcon from '../shared/components/AppIcon';
import InitialsAvatar from '../shared/components/InitialsAvatar';
import InviteCollaborators from '../shared/components/InviteCollaborators';
import { getEmailId } from '../shared/storage';

const ExistingCollaborator = ({ projectId, collab, handleDeletedCollab }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const {
        isLoading: isUpdatingProject,
        isSuccess: isProjectUpdated,
        error: updateProjectError,
        data: updateProjectData,
        mutate: updateProject,
    } = useUpdateProject();
    const loggedInUserEmail = getEmailId();

    useEffect(() => {
        if (isProjectUpdated) {
            handleDeletedCollab(updateProjectData?.project?.members);
        }
    }, [isProjectUpdated]);

    let firstName, lastName;

    if (collab?.user_data?.firstName) {
        firstName = collab?.user_data?.firstName;
    } else if (collab?.firstName) {
        firstName = collab?.firstName;
    }

    if (collab?.user_data?.lastName) {
        lastName = collab?.user_data?.lastName;
    } else if (collab?.lastName) {
        lastName = collab?.lastName;
    }

    if (!firstName || _.isEmpty(firstName)) {
        firstName = collab?.email?.charAt(0);
        lastName = collab?.email?.charAt(0);
    }

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleOnRemove = (collab) => {
        if (collab && !_.isEmpty(collab) && loggedInUserEmail !== collab?.email) {
            updateProject({ id: projectId, removeInvites: [collab] });
        }
    };

    return (
        <div className="flex flex-row items-center mb-2">
            <InitialsAvatar firstName={firstName} lastName={lastName} className="border-none mr-3" />

            <div className="flex flex-col w-full">
                <p className="text-mediumLabel capitalize">
                    {firstName} {lastName}
                    {loggedInUserEmail === collab?.email ? ' (you)' : ''}
                </p>

                <p className="text-overline2 text-neutral-gray3">{collab?.email}</p>
            </div>

            {loggedInUserEmail !== collab?.email ? (
                !isUpdatingProject ? (
                    <AppIcon
                        onClick={(e) => {
                            if (!isUpdatingProject) {
                                handleClick(e);
                            }
                        }}
                    >
                        <MoreVertIcon />
                    </AppIcon>
                ) : (
                    <div className="mr-3 flex items-center justify-center">
                        <CircularProgress size="24px" />
                    </div>
                )
            ) : null}

            <Menu
                id="fade-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={() => {
                    setAnchorEl(null);
                }}
                TransitionComponent={Fade}
            >
                <MenuItem
                    onClick={() => {
                        setAnchorEl(null);
                        handleOnRemove(collab);
                    }}
                    style={{ color: Colors.accent.red }}
                >
                    Remove
                </MenuItem>
            </Menu>
        </div>
    );
};

const ModifyCollaborators = ({ projectId, invitedCollaborators, onClose }) => {
    // const {
    //   data: projects,
    //   isLoading: isFetchingProjects,
    //   error: fetchProjectsError,
    //   isFetching: isFetchingProjectsBg,
    //   refetch: refetchProjects,
    // } = useGetProjects();

    const {
        isLoading: isInvitingCollaborators,
        isSuccess: isInviteCollaboratorsSuccess,
        error: inviteCollaboratorsError,
        mutate: inviteCollaborators,
    } = useInviteCollaborator();

    const [toBeInvitedCollabs, setToBeInvitedCollabs] = useState([]);
    const [updatedInvitedCollabs, setUpdatedInvitedCollabs] = useState([]);
    const [isInvitedCollabsUpdated, setUpdated] = useState(false);

    const handleCollaboratorsChange = (newCollabs) => {
        setToBeInvitedCollabs(newCollabs);
    };

    const handleInviteCollabs = () => {
        if (toBeInvitedCollabs && !_.isEmpty(toBeInvitedCollabs)) {
            inviteCollaborators({ id: projectId, collaborators: toBeInvitedCollabs });
        }
    };

    const handleDeletedCollab = (updatedCollabs) => {
        setUpdatedInvitedCollabs(updatedCollabs);
        setUpdated(true);
    };

    const getInvitedCollabs = () => {
        if (isInvitedCollabsUpdated) {
            return updatedInvitedCollabs;
        }
        return invitedCollaborators;
    };

    if (isInviteCollaboratorsSuccess) {
        onClose();
        return null;
    }

    return (
        <div className="p-4">
            <div className="flex flex-row justify-between items-center mb-3">
                <h5>Invite Collaborators</h5>

                <AppIcon onClick={onClose}>
                    <CloseIcon />
                </AppIcon>
            </div>

            <div className="flex flex-cols ">
                <InviteCollaborators
                    collaborators={toBeInvitedCollabs}
                    handleChange={handleCollaboratorsChange}
                    style={{ width: '100%', marginRight: '1rem' }}
                />
                <div className=" mt-10 pt-1">
                    {' '}
                    {!isInvitingCollaborators ? (
                        <PrimaryButton classes=" h-12" onClick={handleInviteCollabs}>
                            Send Invite
                        </PrimaryButton>
                    ) : (
                        <CircularProgress size="24px" className="mb-3" />
                    )}
                </div>
            </div>
            {inviteCollaboratorsError && (
                <p className="mb-3 ml-4 text-overline2 text-accent-red">{inviteCollaboratorsError?.message}</p>
            )}

            {!_.isEmpty(getInvitedCollabs()) ? (
                <div className="border-t-2 pt-3">
                    {getInvitedCollabs()?.map((collab) => {
                        return (
                            <ExistingCollaborator
                                key={collab?.email}
                                projectId={projectId}
                                collab={collab}
                                handleDeletedCollab={handleDeletedCollab}
                            />
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
};

export default ModifyCollaborators;
