const { Router } = require('express');
const router = new Router();

const authenticate = require('../authentication/authentication');
const authorize = require('../authentication/authorization');

const validator = require('../middlewares/validators/validateRequest');

const { nodeCodeGenSchema } = require('../middlewares/validators/chatGpt');

const { sqlNodeCodeGen, mongoCodeGen } = require('../utility/nodeCodeGen');

router.post(
	'/nodeSqlCodeGen',
	authenticate,
	authorize,
	validator(nodeCodeGenSchema),
	async (req, res) => {
		const { projectId, codegenLang, codegenDb } = req.body;
		try {
			const { responseMsg, errCodeGen } = await sqlNodeCodeGen(
				projectId,
				codegenLang,
				codegenDb,
				req.body
			);
			if (!responseMsg) throw errCodeGen;
			return res.json({ message: responseMsg });
		} catch (error) {
			return res.status(500).send({ error: error.message });
		}
	}
);

router.post(
	'/nodeMongoCodeGen',
	authenticate,
	authorize,
	validator(nodeCodeGenSchema),
	async (req, res) => {
		const { projectId, codegenLang, codegenDb } = req.body;
		try {
			const { responseMsg, errCodeGen } = await mongoCodeGen(
				projectId,
				codegenLang,
				codegenDb,
				req.body
			);
			if (!responseMsg) throw errCodeGen;
			return res.json({ message: responseMsg });
		} catch (error) {
			return res.status(500).send({ error: error.message });
		}
	}
);
module.exports = router;
