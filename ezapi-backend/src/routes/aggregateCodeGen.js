const { Router } = require('express');
const router = new Router();

const authenticate = require('../authentication/authentication');
const { aggregateCodeGen, promptGen } = require('../utility/aggregateCodeGen');
const generateCodeUsingPrompt = require('../utility/generateCodeUsingPrompt');

const samplePrompt = `I want you to act as a python developer. Give me python code using flask for a post endpoint "https://localhost:7733/genLeads" which 
has requestBody JSON as : 1). key with datatype as String 2) email with datatype as String 3). password with datatype as String 4). returnSecureToken with datatype as 
String 5). product with datatype as String 6). profileData with datatype as Object which has below attributes 6.1) mobile with datatype as number 6.2) email 
with datatype as String 6.3) name with datatype as String 6.4) gender with datatype as String 6.5) pan with datatype as String . Inside this endpoint , 
make a sequence of api calls API1). first make a call to "https://localhost:7744/verifyPassword", which has query parameters as: 1. key with datatype as String, 
and has request body JSON as 1). email with datatype as String 2). password with datatype as String 3). returnSecureToken with datatype and from the response JSON 
capture idToken. use this idToken value as Authorization header with Bearer as prefix for all subsequent API calls. API2). make a POST call 
to "https://localhost:7744/lead/Lead" which has request body JSON as 1). product with datatype as String 2). profileData with datatype as Object which has 
below attributes 2.1) mobile with datatype as number 2.2) email with datatype as String 2.3) name with datatype as String 2.4) gender with datatype as 
String 2.5) pan with datatype as String  and from the response JSON capture leadId. API3). make a GET call to "https://localhost:7744/lead/status", 
which has query parameters as 1. leadId from the response of API2 and from the response JSON capture the status. The final response JSON is as below: 1). product 
with datatype as String 2). leadId with datatype as String 3). status with datatype as String`;

const samplePrompt2 = `I want you to act as a c# developer. Give me C# web api code using dot NET Core 6 along with required class objects for a 
post endpoint 'https://localhost:7733/genLeads' which accepts requestBody JSON structure 
as : {\"key\":\"\",\"email\":\"\",\"password\":\"\",\"returnSecureToken\":\"\",\"product\":\"\",\"profileData\":{\"mobile\":\"\",\"email\":\"\",\"name\":\"\",
\"gender\":\"\",\"panNumber\":\"\"}} and gives response JSON structure as {\"product\":\"\",\"leadId\":\"\",\"status\":}. Inside this endpoint , make a 
sequence of api calls 1). POST call to 'https://localhost:7744/verifyPassword', which has query parameters as: 1. key with datatype as String, and has request 
body JSON structure as {\"email\":\"\",\"password\":\"\",\"returnSecureToken\":\"\"} and from the response JSON capture idToken. use this idToken value as 
Authorization header with Bearer as prefix. 2). POST call to 'https://localhost:7744/lead/Lead' which has request body JSON structure as {\"product\":\"\",
\"profileData\":{\"mobile\":\"\",\"email\":\"\",\"name\":\"\",\"gender\":\"\",\"panNumber\":\"\"}} and from the response JSON capture leadId. 3). GET call 
to 'https://localhost:7744/lead/status', which has query parameters as 1. leadId from the response of API2, and idToken value as Authorization header with 
Bearer as prefix and from the response JSON capture the status. Use httpclient postAsync, getAsync for making api calls. Create DTOs to represent all JSON 
objects in camelcase and ensure they are converted to string using JsonSerializer. Use StringContent and System.text.json JsonSerializer with JsonSerializerOptions 
for camelCaseMapping. Dont use newtonSoft.`;

router.post('/aggregatePromptGen', authenticate, async (req, res) => {
	try {
		const { projectId, projectName, operationId, codegenLang } = req.body;
		const { user_id } = req;
		const { prompt } = await promptGen(
			user_id,
			projectId,
			projectName,
			operationId,
			codegenLang
		);
		res.status(200).json({
			projectId,
			operationId,
			prompt
		});
	} catch (err) {
		res.status(500).json({ err: err.message });
	}
});

router.post('/generateCode', authenticate, async (req, res) => {
	try {
		const { projectId, projectName, operationId, codegenLang } = req.body;
		const { prompt } = await promptGen(
			req.user_id,
			projectId,
			projectName,
			operationId,
			codegenLang
		);
		const code = await generateCodeUsingPrompt(prompt, projectId, codegenLang);
		res.send({ code, prompt });
	} catch (error) {
		res.status(400).send({ error: error.message });
	}
});

router.post('/aggregateCodeGen', authenticate, async (req, res) => {
	try {
		const { projectId, codegenLang, projectName } = req.body;
		const { codegen, err, code } = await aggregateCodeGen(
			req.user_id,
			projectId,
			req.body,
			codegenLang,
			projectName
		);
		if (err) throw new Error(err);
		res.status(200).json({ codegen: codegen || false, code });
	} catch (err) {
		res.status(500).json({ err: err.message });
	}
});

module.exports = router;
