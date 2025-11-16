const axios = require('axios');

const CodegenPrompts = require('../models/codegenPrompts');

module.exports = async (prompt, projectId, codegenLang) => {
	const codegenUrl = 'https://api.openai.com/v1/chat/completions';
	let promptData = { opDataPrompt: prompt, codegenLang: codegenLang };
	try {
		await CodegenPrompts.findOneAndUpdate(
			{ projectId: projectId },
			{ $push: { prompts: promptData } },
			{ useFindAndModify: false, upsert: true }
		);

		const response = await axios.post(
			codegenUrl,
			{
				model: 'gpt-4',
				temperature: 0,
				messages: [
					{
						role: 'user',
						content: prompt
					}
				]
			},
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer ' + process.env.OPENAI_API_KEY
				}
			}
		);
		const codegenResponse = response.data;
		const genCode = codegenResponse.choices[0].message.content;
		const codegenFailMsgs = [
			'i apologize',
			'unfortunately',
			'as an ai model',
			'unclear',
			'sample implemenatation',
			'sorry'
		];
		let failMsgCount = 0;

		for (let f = 0; f < codegenFailMsgs.length; f++) {
			if (String(genCode).toLowerCase().includes(codegenFailMsgs[f])) {
				failMsgCount++;
			}
		}
		const CHAT_GPT_ERROR = 'UNEXPECTED_CHATGPT_RESPONSE';
		if (failMsgCount > 0) {
			throw new Error(CHAT_GPT_ERROR);
		}
		console.log('genCode..', genCode);
		return { code: genCode };
	} catch (err) {
		console.log('generateCodeUsingPrompt:', err.message);
		return { err: `generateCodeUsingPrompt: ${err.message} ` };
	}
};
