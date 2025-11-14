import { saveAs } from 'file-saver';
import _ from 'lodash';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import client, { endpoint } from '../shared/network/client';
import { queries } from '../shared/network/queryClient';
import { getApiError, getOs } from '../shared/utils';

const fetchProjectDetails = async ({ queryKey }) => {
    const { projectId } = queryKey[1];

    if (projectId) {
        try {
            const { data } = await client.get(`${endpoint.project}/${projectId}`);
            return data;
        } catch (error) {
            if (error?.response?.status === 404) {
                throw Error('no_access');
            }
            throw getApiError(error);
        }
    }
};

export const useFetchProjectDetails = (projectId, options = {}) => {
    const query = useQuery([`${queries.projects}-${projectId}`, { projectId }], fetchProjectDetails, {
        ...options,
    });

    return query;
};

const getProjects = async () => {
    try {
        const { data } = await client.get(endpoint.project, {
            timeout: 480000,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetProjects = () => {
    const mutation = useQuery([queries.projects], getProjects, {
        refetchOnWindowFocus: false,
    });

    return mutation;
};

const updateProject = async ({ id, projectName, removeInvites }) => {
    let requestData = {};

    if (projectName && !_.isEmpty(projectName)) {
        requestData['projectName'] = projectName;
    }

    if (removeInvites && !_.isEmpty(removeInvites)) {
        requestData['removeInvites'] = removeInvites.map((invite) => {
            return invite?.email;
        });
    }

    if (requestData && !_.isEmpty(requestData)) {
        try {
            const { data } = await client.patch(`${endpoint.project}/${id}/update`, requestData);
            return data;
        } catch (error) {
            throw getApiError(error);
        }
    }
};

const push_to_github = async ({ code, projectId }) => {
    try {
        console.log('projectid::', projectId);
        const { data } = await client.post(
            endpoint.push_to_github,
            {
                code: code,
                projectid: projectId,
                isMaster: true,
            },
            { timeout: 600000 },
        );
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const usePushToGithub = () => {
    const mutation = useMutation(push_to_github);
    return mutation;
};

const view_repo = async ({ projectId }) => {
    try {
        const { data } = await client.post(endpoint.view_repo, {
            projectid: projectId,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useVIewRepo = () => {
    const mutation = useMutation(view_repo, {
        onSuccess: (data) => {
            //console.log("view_repo_data:",data);
            if (data?.repo_url) {
                window.open(data.repo_url, '_blank');
            }
        },
    });
    return mutation;
};

export const useUpdateProject = () => {
    const queryClient = useQueryClient();

    const mutation = new useMutation(updateProject, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(queries.projects);
        },
    });

    return mutation;
};

const inviteCollaborators = async ({ id, collaborators }) => {
    try {
        const { data } = await client.post('/invite_collabrator', {
            projectId: id,
            emails: collaborators,
        });

        return data;
    } catch (error) {
        if (error?.response?.data?.errorType === 'COLLABRATOR_LIMIT_REACHED') {
            throw Error(error?.response?.data?.message);
        }
        throw getApiError(error);
    }
};

export const useInviteCollaborator = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation(inviteCollaborators, {
        onSuccess: (data) => {
            queryClient.invalidateQueries(queries.projects);
        },
    });

    return mutation;
};

const downloadSpecs = async ({ projectId }) => {
    try {
        const osName = getOs();

        const { data } = await client.post(endpoint.downloadSpec, {
            projectId,
            os_type: osName,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useDownloadSpecs = () => {
    const mutation = useMutation(downloadSpecs, {
        onSuccess: (data) => {
            if (data?.downloadUrl && !_.isEmpty(data?.downloadUrl)) {
                const link = data?.downloadUrl;

                // const filename = link.substring('link.lastIndexOf("/")' + 1);
                const filename = 'project_spec';
                saveAs(link, filename);
            }
        },
    });

    return mutation;
};

const downloadArtifacts = async ({ projectId }) => {
    try {
        const osName = getOs();

        const { data } = await client.post(
            endpoint.downloadArtifact,
            {
                projectId,
                os_type: osName,
            },
            {
                timeout: 480000,
            },
        );
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useDownloadArtifacts = () => {
    const mutation = useMutation(downloadArtifacts, {
        onSuccess: (data) => {
            if (data?.downloadUrl && !_.isEmpty(data?.downloadUrl)) {
                const link = data?.downloadUrl;

                // const filename = link.substring(link.lastIndexOf("/") + 1);
                const filename = 'project_artifacts';
                saveAs(link, filename);
            }
        },
    });

    return mutation;
};

const downloadDatabase = async ({ projectId }) => {
    try {
        const osName = getOs();

        const { data } = await client.post(
            endpoint.downloadDatabase,
            {
                projectId,
                os_type: osName,
            },
            {
                timeout: 480000,
            },
        );
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

const downloadApigee = async ({ projectId }) => {
    try {
        const { data } = await client.post(
            endpoint.downloadApigee,
            {
                projectId,
            },
            {
                timeout: 480000,
            },
        );
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useDownloadDatabase = () => {
    const mutation = useMutation(downloadDatabase, {
        onSuccess: (data) => {
            if (data?.downloadUrl && !_.isEmpty(data?.downloadUrl)) {
                const link = data?.downloadUrl;

                // const filename = link.substring(link.lastIndexOf("/") + 1);
                const filename = 'project_database';
                saveAs(link, filename);
            }
        },
    });

    return mutation;
};

export const useDownloadApigee = () => {
    const mutation = useMutation(downloadApigee, {
        onSuccess: (data) => {
            if (data?.downloadUrl && !_.isEmpty(data?.downloadUrl)) {
                const link = data?.downloadUrl;

                // const filename = link.substring(link.lastIndexOf("/") + 1);
                const filename = 'project_apigee';
                saveAs(link, filename);
            }
        },
    });

    return mutation;
};

const downloadCodegen = async ({ projectId }) => {
    try {
        const { data } = await client.post(
            endpoint.downloadCodegen,
            {
                projectId,
            },
            {
                timeout: 480000,
            },
        );
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

const downloadNodeCodegen = async ({ projectId }) => {
    try {
        const { data } = await client.post(
            endpoint.downloadNodeCodegen,
            {
                projectId,
            },
            {
                timeout: 480000,
            },
        );
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

const downloadPythonCodegen = async ({ projectId }) => {
    try {
        const { data } = await client.post(
            endpoint.downloadPythonCodegen,
            {
                projectId,
            },
            {
                timeout: 480000,
            },
        );
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

const downloadDotnetCodegen = async ({ projectId }) => {
    try {
        const { data } = await client.post(
            endpoint.downloadDotNetCodegen,
            {
                projectId,
            },
            {
                timeout: 480000,
            },
        );
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useDownloadNodeCodegen = () => {
    const mutation = useMutation(downloadNodeCodegen, {
        onSuccess: (data) => {
            if (data?.downloadUrl && !_.isEmpty(data?.downloadUrl)) {
                const link = data?.downloadUrl;

                // const filename = link.substring(link.lastIndexOf("/") + 1);
                const filename = 'project_codegen_node';
                saveAs(link, filename);
            }
        },
    });

    return mutation;
};

export const useDownloadPythonCodegen = () => {
    const mutation = useMutation(downloadPythonCodegen, {
        onSuccess: (data) => {
            if (data?.downloadUrl && !_.isEmpty(data?.downloadUrl)) {
                const link = data?.downloadUrl;

                // const filename = link.substring(link.lastIndexOf("/") + 1);
                const filename = 'project_codegen_python';
                saveAs(link, filename);
            }
        },
    });

    return mutation;
};

export const useDownloadDotnetCodegen = () => {
    const mutation = useMutation(downloadDotnetCodegen, {
        onSuccess: (data) => {
            if (data?.downloadUrl && !_.isEmpty(data?.downloadUrl)) {
                const link = data?.downloadUrl;

                // const filename = link.substring(link.lastIndexOf("/") + 1);
                const filename = 'project_codegen_dotnet';
                saveAs(link, filename);
            }
        },
    });

    return mutation;
};

export const useDownloadCodegen = () => {
    const mutation = useMutation(downloadCodegen, {
        onSuccess: (data) => {
            if (data?.downloadUrl && !_.isEmpty(data?.downloadUrl)) {
                const link = data?.downloadUrl;

                // const filename = link.substring(link.lastIndexOf("/") + 1);
                const filename = 'project_codegen';
                saveAs(link, filename);
            }
        },
    });

    return mutation;
};
