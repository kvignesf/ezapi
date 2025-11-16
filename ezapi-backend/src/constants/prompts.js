module.exports = {
	NESTJSPROMPT: `\nYou are an experienced nestjs developer. Your task is to give me nestjs code with platform-express using the standard folder structure. I will have a src folder & inside this folder i need to have all files. 

	Your output: Should be a parsable JSON object with keys as filenames and each file related code as the values. Also don't give me any informational sentences. I need just a parsable json object.
	Important instructions to follow while generating code are given below: 
	1)Handle adding global exception handler using log4js package. It should automatically log any errors in any api to a file.So please add this file code also in final JSON.\n
	2)"No strict typing".\n
	3)Don't pass model class Instances as arguments directly for services, instead use 'Partial<ModelClassName>' whereever required..
	4)Final output should be a parsable single JSON object as requested\n
	.
	`,
	/* NESTJSPROMPT: `Please generate nest js code with express platform using the standard folder structure. Give me code blocks for each seperate file code like #MODULE#, #CONTROLLER# #SERVICE# #MODELS# #MAIN#, etc .I will have a src folder and inside that i need to have files app.module.ts, app.controller.ts,app.service.ts,app.models.ts and main.ts  So keep this in mind while doing importing from one file to another. Note: once done, I will handle the code splitting and writing to files. Don't add any informative sentences in code. I need just the code. I need all the required files to be included in code blocks. Please don't forget any file. Most importantly always give me codeblocks with above mentioned names only, I must need code blocks to be in order #MODULE# #CONTROLLER#  #SERVICE#  #MODELS# #MAIN#. If there is no need of any code block just give me empty lines for that particular block.
    Ensure that the code is well-organized with proper indentation and follows best practices for nestjs development. `, */
	NESTJSDBCONNECTION: `Note: Assume I already have a .env file which has following variables: DB_HOST,DB_PORT,DB_USERNAME,DB_PASSWORD,DB_NAME. So use these values while initializing database connection using TypeORM library. `,
	/* NESTJSDBCONNECTION: `One more important thing to note: Assume I already have a .env file which has following variables: DB_HOST,DB_PORT,DB_USERNAME,DB_PASSWORD,DB_NAME. So use these values while initializing database connection and also dont forget to import config module in #MODULE block`, */
	NODEJSPROMPT: `Please generate Node.js code using the MVC architecture. Please give me seperate code blocks for each file code like #MODELS# #CONTROLLERS# #INDEX#. Please insert the generated models code below this comment: "#MODELS#" . Please insert the generated controllers code below this comment: "#CONTROLLERS#".Please insert the generated index.js code below this comment: "#INDEX#"
	Once done, I will handle the code splitting and writing to files. 
	Note: If there is no need of any models for the given conditions, please give me empty lines.
	I will have {projectName}.js file in models folder, similarly I will have {projectName}.js file in controllers folder, Keep this in mind while importing one file into other. Most importantly always give me codeblocks with above mentioned names only. I must need code blocks to be in order #MODELS# #CONTROLLERS# #INDEX#.
	Note: Inside #INDEX# code, i want winston logging library which should handle error logging to a file.
	Ensure that the code is well-organized, with proper indentation and follows best practices for Node.js development. Don't add any informative sentences in code. I need just the code.`,
	NODEJSDBCONNECTION: `One more important thing to note: Assume I already have a .env file which has following variables: DB_HOST,DB_PORT,DB_USERNAME,DB_PASSWORD,DB_NAME. So use these values while instantiating database connection and always keep full database instantiation and connection code in #INDEX# code block itself. Never require database instantiation code or any single piece of code which is related to database instantiating from any other file. Never assume this.  All database  instantiation related code must be in #INDEX# code block itself. `
};
