const express = require('express');
const router = new express.Router();

const authenticate = require('../authentication/authentication');
const authorize = require('../authentication/authorization');

const validator = require('../middlewares/validators/validateRequest');
const schema = require('../middlewares/validators/chatGPTCodegen')


const {
	generateModelPromptSchema,
	generateModelCodeSchema,
	generateODPromptSchema,
	generateODCodeSchema,
	arrangeFilesSchema,
	genPythonProjSchema,
	pythonMongoCodeGenSchema
} = require('../middlewares/validators/chatGpt');

const {
	modelPromptController,
	modelCodeGenerator,
	ODPromptController,
	ODCodeGenerator,
	assortIntoFiles,
	codeGenpython,
	generatePyMongoCodeGen,
	genPythonCodegenV2,
	genPythonMongoCodegenV2,
	iterateAndMerge
} = require('../utility/getPromptsCompletions');

router.post(
	'/generateModelPrompt',
	authenticate,
	authorize,
	validator(generateModelPromptSchema),
	async (req, res) => {
		const { projectId, codegenLang, codegenDb } = req.body;

		try {
			const { prompt, errMdlPrmpt } = await modelPromptController(
				projectId,
				codegenLang,
				codegenDb
			);
			if (!prompt) throw errMdlPrmpt;
			return res.json({ prompt: prompt });
		} catch (error) {
			return res.status(500).send({ error: error.message });
		}
	}
);

router.post(
	'/generateModelCode',
	authenticate,
	authorize,
	validator(generateModelCodeSchema),
	async (req, res) => {
		const { codegenPrompt, projectId } = req.body;
		try {
			const { gencode, error } = await modelCodeGenerator(projectId, codegenPrompt);
			if (!gencode) throw error;
			return res.json({ code: gencode });
		} catch (error) {
			return res.status(500).send({ error: error.message });
		}
	}
);

router.post(
	'/generateODPrompt',
	authenticate,
	authorize,
	validator(generateODPromptSchema),
	async (req, res) => {
		const { projectId, codegenLang, codegenDb } = req.body;
		try {
			const { finalprompt, errODPrmpt } = await ODPromptController(
				projectId,
				codegenLang,
				codegenDb
			);
			if (!finalprompt) throw errODPrmpt;
			return res.json({ prompt: finalprompt });
		} catch (error) {
			console.log(error);

			return res.status(500).send({ error: error.message });
		}
	}
);

router.post(
	'/generateODCode',
	authenticate,
	authorize,
	validator(generateODCodeSchema),
	async (req, res) => {
		const { modelPrompt, projectId, prompt } = req.body;
		try {
			const { gencode, errODCdPrmpt } = await ODCodeGenerator(projectId, prompt, modelPrompt);
			if (!gencode) throw errODCdPrmpt;
			return res.status(200).json({ code: gencode });
		} catch (error) {
			return res.status(500).send({ error: error.message });
		}
	}
);

router.post(
	'/arrangeFiles',
	authenticate,
	authorize,
	validator(arrangeFilesSchema),
	async (req, res) => {
		// db crendentials to edit the database URI in the .env configuration file
		const { dbUserName, dbPassword, dbHost, dbPort, dbName, genCode, projectId } = req.body;
		try {
			const { responseMsg, errAssrtFile } = await assortIntoFiles(
				projectId,
				genCode,
				req.body
			);
			if (!responseMsg) throw errAssrtFile;
			return res.json({ prompt: responseMsg });
		} catch (error) {
			console.log(error);
			return res.status(500).send({ error: error });
		}
	}
);

// authenticate, authorize, - removed for testing purpose , add it later

router.post('/genPythonProj', authenticate, authorize, validator(genPythonProjSchema), async (req, res) => {
	const { projectId, codegenLang, codegenDb } = req.body;
	try {
		const { finalResponseMsg, errCodeGen } = await codeGenpython(
			projectId,
			codegenLang,
			codegenDb,
			req.body
		);
		if (!finalResponseMsg) throw errCodeGen;
		return res.json({ message: finalResponseMsg });
	} catch (error) {
		return res.status(500).send({ error: error.message });
	}
});

router.post('/pythonMongoCodeGen', validator(pythonMongoCodeGenSchema), async (req, res) => {
	const { projectId } = req.body;
	try {
		const { responseMsg, errCodeGen } = await generatePyMongoCodeGen(projectId, req.body);
		if (!responseMsg) throw errCodeGen;

		return res.json({ message: responseMsg });
	} catch (error) {
		return res.status(500).send({ error: error.message });
	}
});

router.post('/pythonCodegenV2',validator(schema.pythonCodegenSchema) ,async(req,res)=>{

    let {projectId} = req.body;
    try{
    await genPythonCodegenV2(projectId, req.body, req.body.codegenLang, req.body.codegenDb)
    }catch(e){
        return res.status(500).json({error:"Something went wrong"})
    }
    return res.send("SUCCESS")
    
});

// enspoint by endpoint - python mongoDB
router.post('/pythonMongoCodegenV2',async(req,res)=>{
    
    try{
    await genPythonMongoCodegenV2(req.body)
    }catch(e){
        console.log(e)
        return res.status(500).json({error:"Something went wrong"})
    }
    return res.send("SUCCESS")
})

// enspoint by endpoint - python mongoDB
router.post('/runMergePythonCodeV2',async(req,res)=>{
    let {projectId} = req.body;
    try{
    await iterateAndMerge(projectId, req.body)
    }catch(e){
        console.log(e)
        return res.status(500).json({error:"Something went wrong"})
    }
    return res.send("SUCCESS")
})

module.exports = router;
