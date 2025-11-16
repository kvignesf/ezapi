const mongoose = require('mongoose');

const promptsSchema = new mongoose.Schema(
	{
		modelPrompt : { type: String, required: false },
		opDataPrompt : { type: String, required: false },
		codegenLang: {type: String, required: false}
	},
	{ timestamps: true, _id: false }
);

const codegenPromptSchema = new mongoose.Schema(

    {
        projectId: {
			type: String,
			unique: true,
			required: true
		},
        prompts : [promptsSchema]
    }
    
)

const codegenPrompts = mongoose.model('codegenPrompts', codegenPromptSchema);

module.exports = codegenPrompts;