const DragAndDropMessage = ({
    isAttributeAllowed = false,
    isSchemaAllowed = false,
    isTableAllowed = false,
    isColumnAllowed = false,
}) => {
    if (isAttributeAllowed || isSchemaAllowed) {
        return (
            <p className="text-overline3">
                <span>Drag and Drop </span>
                {isSchemaAllowed && <span className="text-brand-primary">Schema </span>}
                {isAttributeAllowed && isSchemaAllowed && <span>and </span>}
                {isAttributeAllowed && <span className="text-brand-secondary">Attribute </span>}
                here
            </p>
        );
    }

    if (isTableAllowed || isColumnAllowed) {
        return (
            <p className="text-overline3">
                <span>Drag and Drop </span>
                {isTableAllowed && <span className="text-brand-primary">Table </span>}
                {isColumnAllowed && isTableAllowed && <span>and </span>}
                {isColumnAllowed && <span className="text-brand-secondary">Column </span>}
                here
            </p>
        );
    }
};

export default DragAndDropMessage;
