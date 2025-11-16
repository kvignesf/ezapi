const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async (prompt) => {
	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4',
			temperature: 0,
			messages: [{ role: 'user', content: prompt }]
		});
		return response.choices[0].message['content'];
	} catch (error) {
		return { error };
	}
};
