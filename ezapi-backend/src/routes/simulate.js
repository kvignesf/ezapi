const router = require('express').Router();

const authenticate = require('../authentication/authentication');
const VirtualSim = require('../models/virtualSim');

router.post('/simulate', authenticate, async (req, res) => {
	try {
		const { projectId: projectid, endpoint, httpMethod, operation_id } = req.body;
		if (!projectid || !endpoint || !httpMethod)
			return res.status(400).json({ message: 'Please provide correct values' });
		const filters = {
			projectid,
			endpoint,
			httpMethod,
			operation_id,
			responseStatusCode: '200'
		};
		const data = await VirtualSim.find(filters).lean();
		if (data.length) return res.status(200).json({ data });
		return res.status(400).json({ message: 'Unable to fetch simulation data' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
});

router.get('/simulate/:projectId/:operationId', authenticate, async (req, res) => {
	try {
		const { projectId, operationId } = req.params;
		if (!projectId || !operationId)
			return res.status(400).json({ message: 'Please provide correct values' });
		const filters = {
			projectid: projectId,		
			operationId
		};
		const data = await VirtualSim.findOne(filters).lean();
		if (data) return res.status(200).json({ data });
		return res.status(400).json({ message: 'Unable to fetch simulation data' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
});

router.get('/virtualData', async (req, res) => {
	try {
		const { projectId: projectid } = req.query;
		if (!projectid) return res.status(400).json({ message: 'No projectId passed' });
		const filters = { projectid, responseStatusCode: '200' };
		const requiredFields = { projectid: 1, httpMethod: 1, endpoint: 1, operation_id: 1 };
		const virtualData = await VirtualSim.find(filters, requiredFields).lean();
		if (virtualData.length) return res.status(200).json({ data: virtualData });
		return res.status(400).json({ message: 'Unable to fetch simulation data' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
});
module.exports = router;
