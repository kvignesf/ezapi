const OperationErrorsDialog = ({ errors }) => {
    return (
        <div>
            {errors?.map((error) => (
                <p>{error}</p>
            ))}
        </div>
    );
};

export default OperationErrorsDialog;
