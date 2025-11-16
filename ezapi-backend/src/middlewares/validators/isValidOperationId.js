const OperationData = require('../../models/operationData');

const { OPERATION_ID_NOT_VALID } = require('../../utility/errorMessages');

async function isValidOperationId(next) {
	if (this.isNew) {
		const { operationId, projectId: projectid } = this;
		const count = await OperationData.countDocuments({ id: operationId, projectid });
		if (count) return next();
		throw new Error(OPERATION_ID_NOT_VALID);
	}
}

module.exports = isValidOperationId;
