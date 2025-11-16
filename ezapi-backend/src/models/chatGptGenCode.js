const mongoose = require('mongoose');
//const AutoIncrement = require('mongoose-sequence')(mongoose);

const chatGptCodeResponse = new mongoose.Schema(
	{
		codeResponse : { type: String, required: false }
	},
	{ timestamps: true, _id: false }
);

const chatGptGenCodeSchema = new mongoose.Schema(

    {
        projectId: {
			type: String,
			//unique: true,
			required: true
		},
		chtgptRunId: {
			type: Number,
			required: true
		},
        generatedCode : [chatGptCodeResponse] ,
		endpointinfo: {
			type: String
		}
    }
    
)

//chatGptGenCodeSchema.plugin(AutoIncrement, {inc_field : 'chtgptRunId'});
const chatGptGeneratedCode = mongoose.model('chatGptgenCode', chatGptGenCodeSchema);

module.exports = chatGptGeneratedCode;