import CloseIcon from '@material-ui/icons/Close';
import { PrimaryButton, TextButton } from '../../shared/components/AppButton';
import AppIcon from '../../shared/components/AppIcon';
import LoaderWithMessage from '../../shared/components/LoaderWithMessage';
import { useDeleteProject } from './deleteProjectQueries';

const DeleteProject = ({ project, onClose }) => {
    const {
        isLoading: isDeletingProject,
        isSuccess: isDeleteSuccess,
        error: deleteProjectError,
        mutate: deleteProject,
    } = useDeleteProject();

    const handleOnDelete = () => {
        deleteProject({ id: project?.projectId });
    };

    if (isDeleteSuccess) {
        onClose();
        return null;
    }

    return (
        <>
            <div className="flex flex-row justify-between items-center px-4 py-2 mb-2">
                <h5>Delete Project</h5>

                {!isDeletingProject && (
                    <AppIcon onClick={onClose}>
                        <CloseIcon />
                    </AppIcon>
                )}
            </div>

            {!isDeletingProject ? (
                <>
                    <p className="px-4 pb-4 text-body2">{`Are you sure want to delete “${project?.projectName}” API project? Once deleted you can’t get it back.`}</p>

                    {deleteProjectError && (
                        <p className="text-accent-red text-overline2 my-2 ml-4">{deleteProjectError?.message}</p>
                    )}

                    <div className="border-t-2 border-neutral-gray7 flex flex-row items-center justify-end p-4">
                        <TextButton
                            onClick={() => {
                                onClose();
                            }}
                            classes="mr-3"
                        >
                            Cancel
                        </TextButton>

                        <PrimaryButton type="submit" classes="bg-accent-red" onClick={handleOnDelete}>
                            Delete
                        </PrimaryButton>
                    </div>
                </>
            ) : (
                <LoaderWithMessage message={`Deleting ${project?.projectName}`} contained className="my-5" />
            )}
        </>
    );
};

export default DeleteProject;
