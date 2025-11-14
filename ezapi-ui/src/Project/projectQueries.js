import aes from 'crypto-js/aes';
import _ from 'lodash';
import { useMutation, useQuery } from 'react-query';
import { uploadProjectCACertificate, uploadProjectCertificate, uploadProjectKey } from '../AddProject/addProjectQuery';
import client, { endpoint } from '../shared/network/client';
import { queries } from '../shared/network/queryClient';
import { getApiError } from '../shared/utils';

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

const verifyProject = async ({ projectId }) => {
    try {
        const { data } = await client.post(endpoint.verifyProject, {
            projectId,
        });
        return data;
    } catch (error) {
        console.log('errror', error);
        throw getApiError(error);
    }
};

export const getTablesRelations = async (projectId) => {
    try {
        const { data } = await client.post(
            endpoint.tableRelations,
            { projectId },
            {
                validateStatus: function (status) {
                    return status === 200 || status === 400;
                },
                timeout: 300000,
            },
        );

        return data;
    } catch (error) {
        throw error;
    }
};

export const tableMappings = async (projectId, filters, relations, password) => {
    var ciphertext = aes.encrypt(password ?? '', process.env.REACT_APP_AES_ENCRYPTION_KEY).toString();

    try {
        const { data } = await client.post(
            endpoint.tableMappings,
            {
                projectId: projectId,
                relations: relations,
                filters: filters,
                password: ciphertext,
            },
            {
                validateStatus: function (status) {
                    return status === 200 || status === 400;
                },
                timeout: 120000,
            },
        );

        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const publishProject = async ({ projectId, newProjectDetails }) => {
    let keys = null;
    let certificates = null;
    let caCertificates = null;
    const userId = sessionStorage.getItem('user_id');

    if (newProjectDetails?.keys && newProjectDetails?.keys?.length > 0) {
        keys = await uploadProjectKey({ projectId, file: newProjectDetails?.keys[0], userId, test: false });
    }

    if (newProjectDetails?.certificates && newProjectDetails?.certificates?.length > 0) {
        certificates = await uploadProjectCertificate({
            projectId,
            file: newProjectDetails?.certificates[0],
            userId,
            test: false,
        });
    }

    if (newProjectDetails?.caCertificates && newProjectDetails?.caCertificates?.length > 0) {
        caCertificates = await uploadProjectCACertificate({
            projectId,
            file: newProjectDetails?.caCertificates[0],
            userId,
            test: false,
        });
    }

    var ciphertext = aes.encrypt(newProjectDetails?.password, process.env.REACT_APP_AES_ENCRYPTION_KEY).toString();
    try {
        const { data } = await client.post(
            endpoint.publishProject,
            {
                projectId,
                keyPath: keys ? keys.url : null,
                certPath: certificates ? certificates.url : null,
                rootPath: caCertificates ? caCertificates.url : null,
                password: ciphertext,
            },
            {
                validateStatus: function (status) {
                    return status === 200 || status === 400;
                },

                timeout: 480000,
            },
        );
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const usePublishProject = () => {
    const publishProjectMutation = useMutation(publishProject, {
        onSuccess: (data) => {},
    });

    return publishProjectMutation;
};

export const useSubmitProject = (projectId, newProjectDetails) => {
    //console.log(newProjectDetails);
    const publishProjectMutation = useMutation(publishProject);

    const verifyProjectMutation = useMutation(verifyProject, {
        onSuccess: (data) => {
            if (!data?.response || _.isEmpty(data?.response)) {
                publishProjectMutation.mutate({ projectId, newProjectDetails });
            }
        },
    });

    return { verifyProjectMutation, publishProjectMutation };
};

export const useVerifyProject = ({ projectId, newProjectDetails }) => {
    const verifyProjectMutation = useMutation(verifyProject, {
        onSuccess: (data) => {},
    });

    return verifyProjectMutation;
};
const getMandMappingTableData = async ({ projectId }) => {
    try {
        const { data } = await client.post(endpoint.mandMappingTableData, {
            projectId,
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const useGetMandMappingTableData = () => {
    const mutation = useMutation(getMandMappingTableData, {});

    return mutation;
};

/* export const useGetEntityMapping = () => {
  const mutation = useMutation(tableMappings, {});

  return mutation;
}; */
