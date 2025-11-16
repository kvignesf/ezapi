let fs = require('fs');
let OperationData = require('../models/operationData')
let {getTableRelations} = require('../utility/getTableRelations')
let {tableData} = require('./getTableData')
let ChatGptGenCode = require('../models/chatGptGenCode')
let MongoCollections = require('../models/mongoCollections')


function findAttribute(obj,attributeToSearch) {
    if (typeof obj === 'object' && obj !== null) {
      for (const prop in obj) {
        if (prop == attributeToSearch) {
          return obj[prop];
        } else {
          const result = findAttribute(obj[prop],attributeToSearch);
          if (result) {
            return result;
          }
        }
      }
    }
    return null;
}


let writeToFilesV2 = async (directory,file,code) => {
    let respMsg
    try {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }
        
        if(file=="requirements.txt"){
            fs.writeFile(directory+'/'+file, code, (err) => {
                if (err) {
                    console.log("error while writing code to files"+err)
                    throw new Error("error while creating code files"+file);
                }            
            })
        }else if(file=="app.py"){
            fs.appendFile(directory+'/'+file, code, (err) => {
                if (err) {
                    console.log("error while writing code to files"+err)
                    throw new Error("error while creating code files"+file);
                }            
            })
        }else{
            fs.writeFile(directory+'/'+file, code, (err) => {
                if (err) {
                    console.log("error while writing code to files"+err)
                    throw new Error("error while creating code files"+file);
                }            
            })
        }
        respMsg = "filesCreated";
        return {respMsg}
    } catch(errWrtFile){
        //return res.status(500).json({message:"Error while writing into file"});
        return {errWrtFile};
    }   
}

let appCode = "";
let modelNames = [];
async function assortIntoFilesV2(projectId, genCode, codegenDb, reqData,firstLastIndicator) {
    try {
        let respMsg, errWrtFile;
        let directory = process.env.DIRECTORY_LOCATION+"/"+projectId+"/pythoncode";
        // words that are observed when a codegen fails , keep adding more based on chatgpt response
        let codegenFailMsgs = ['i apologize','unfortunately','as a ai model','unclear','sample implemenatation','sorry']
        let failMsgCount = 0;
      
        for(let f=0;f<codegenFailMsgs.length;f++){
            if(String(genCode).toLowerCase().includes(codegenFailMsgs[f])){
                failMsgCount++;
            }
        }
        let CHAT_GPT_ERROR = "UNEXPECTED_CHATGPT_RESPONSE";
        if(failMsgCount>0){
            return { CHAT_GPT_ERROR };
        }

        // get the number of ```

        const delimiterCount = (genCode.match(/```/g) || []).length;
        console.log("delimiterCount", delimiterCount)
        if(delimiterCount==4){

            // app code includes model code - 1 block
            // requirement - 1 block

            // regex to get the content between the ```
            const regexInsideDelContent = /```(.*?)```/gs;
            const matches = genCode.matchAll(regexInsideDelContent);

            const contentArray = [];

            for (const match of matches) {
                contentArray.push(match[1].trim());
            }
            

            let appCode = "";
            let reqCode = "";

            if(contentArray[0].length>contentArray[1].length){
                appCode = contentArray[0];
                reqCode = contentArray[1];
            }else{
                appCode = contentArray[1];
                reqCode = contentArray[0];
            }

            // if its a first endpoint code - add everything but remove if __name==main : app.run()
            if(firstLastIndicator=="FIRST_ENDPOINT"){

                // adding app.py file

                // removing app.run() variations
                appCode = appCode.replace(/if __name__ == ['"]__main__['"]:\n\s+app.run\(\)\n?/g, '');
                appCode = appCode.replace(/if __name__ == ['"]__main__['"]:\n\s+app\.run\(debug=True\)\n?/g, '');
                appCode = appCode.replace("python\n","");
                const {finalappCode, errReplaceErr} = replaceDBParams(appCode, codegenDb, reqData, directory)
                if (!finalappCode) throw errReplaceErr;

                if(finalappCode){
                    ({respMsg, errWrtFile} = await writeToFilesV2(directory,"app.py",finalappCode+"\n\n"));
                }

                // adding requirements.tx file
                if(reqCode){
                    ({respMsg, errWrtFile} = await writeToFilesV2(directory,"requirements.txt",reqCode));
                }
                // keep track of all the modelClass used in the code

                // add env file
                
                let envContent = "DB_USER="+reqData.dbUserName+"\n"+"DB_PASSWORD="+reqData.dbPassword+"\n"+"DB_HOST="+reqData.dbHost+"\n"+"DB_PORTNO="+reqData.dbPort+"\n"+"DB_NAME="+reqData.dbName;
                try{
                    ({respMsg, errWrtFile} = await writeToFilesV2(directory,".env",envContent));
                }catch(e){
                    console.log(e);
                }
                console.log("encontent",envContent);
                console.log('diretot',directory)
                // regex to get the content between "class" and the "db.Model"
                const modelClassNamesregex = /class (\w+)\(db\.Model\)/g;

                let match;
                while (match = modelClassNamesregex.exec(genCode)) {
                    modelNames.push(match[1]);
                }
            }
            // intermediate endpoint code - add only model and app code but remove all imports , db and app.run()
            if(firstLastIndicator=="INTERMEDIATE_ENDPOINT"){
                
                const modelClassNamesregex = /class (\w+)\(db\.Model\)/g;

                let matchIntermediateModel;
                let modelsIntermediate = []
                while (matchIntermediateModel = modelClassNamesregex.exec(genCode)) {

                    if(!modelNames.includes(matchIntermediateModel[1])){

                        // this array will help which models to add to the app.py
                        modelsIntermediate.push(matchIntermediateModel[1]);

                        // this array will help us to keep track of all the models added to app.py till now
                        modelNames.push(matchIntermediateModel[1]);

                    }
                }

                    // from gencode , get all the model code for "modelsIntermediate" array and place it in app.py
                    
                    // regex to get only the model code that are in "modelsIntermediate"
                    const regex = new RegExp(`class (${modelsIntermediate.join('|')})\\(db\\.Model\\):([\\s\\S]*?)(?=class|$|@app|\`\`\`)`, 'g');

                    let result;
                    while (result = regex.exec(genCode)) { 
                        let modelCode = `class ${result[1]}(db.Model):\n    ${result[2].trim()}\n`;
                        ({respMsg, errWrtFile} = await writeToFilesV2(directory,"app.py",modelCode+"\n"));

                    }

                    // there will be only one route , get that and add to app code
                    
                    // regex to match from "@app.route" to "if __name__"
                    let routePattern = /@app\.route[\s\S]*?(?=if __name__)/
                    routePattern = /@app\.route[\s\S]*?(?=(?:if __name__|\`\`\`))/
                    //console.log('gencodeee');
                    //console.log(genCode);
                    const matches = genCode.match(routePattern);
                    let routeCode = matches ? matches[0] : "";
                    console.log("matches[0],,",matches[0])
                    let appRunCodeVar1 = "if __name__ == '__main__':\n" +
                    '    app.run(debug=True)';
                    let appRunCodeVar2 = "if __name__ == '__main__':\n" +
                    '    app.run()';

                    routeCode = routeCode.replace(appRunCodeVar1,"");
                    routeCode = routeCode.replace(appRunCodeVar2,"");

                    ({respMsg, errWrtFile} = await writeToFilesV2(directory,"app.py",routeCode+"\n\n"));

            }
            // final endpoint code - add model , app code , remove imports but add app.run()
            if(firstLastIndicator=="LAST_ENDPOINT"){
                
                const modelClassNamesregex = /class (\w+)\(db\.Model\)/g;

                let matchIntermediateModel;
                let modelsIntermediate = []
                while (matchIntermediateModel = modelClassNamesregex.exec(genCode)) {

                    if(!modelNames.includes(matchIntermediateModel[1])){

                        // this array will help which models to add to the app.py
                        modelsIntermediate.push(matchIntermediateModel[1]);

                        // this array will help us to keep track of all the models added to app.py till now
                        modelNames.push(matchIntermediateModel[1]);

                    }
                }

                    //console.log("models that needs to be pushed to app code ")
                    //console.log(modelsIntermediate);

                    // from gencode , get all the model code for "modelsIntermediate" array and place it in app.py
                    
                    // regex to get only the model code that are in "modelsIntermediate"
                    const regex = new RegExp(`class (${modelsIntermediate.join('|')})\\(db\\.Model\\):([\\s\\S]*?)(?=class|$|@app|\`\`\`)`, 'g');

                    let result;
                    while (result = regex.exec(genCode)) {
                        let modelCode = `class ${result[1]}(db.Model):\n    ${result[2].trim()}\n\n`;
                        ({respMsg, errWrtFile} = await writeToFilesV2(directory,"app.py",modelCode+"\n"));

                    }
                    // there will be one route , get it and paste it to the app code
                    //console.log("genncodee")
                    //console.log(genCode)
                    // regex to match from "@app.route" to "if __name__"
                    let routePattern = /@app\.route[\s\S]*?(?=if __name__)/;
                    routePattern = /@app\.route[\s\S]*?(?=(?:if __name__|\`\`\`))/
                    const matches = genCode.match(routePattern);
                    console.log("matches[0],,",matches[0])

                    let routeCode = matches ? matches[0] : "\n";

                    // adding app.run()
                    routeCode = routeCode + '\n' +
                    "if __name__ == '__main__':\n" +
                    '    app.run(debug=True)';
                    //console.log("route coedeee")
                    //console.log(routeCode);
                    ({respMsg,errWrtFile} = await writeToFilesV2(directory,"app.py",routeCode+"\n"));
                    if (!respMsg) throw errWrtFile;

            }

        }else if(delimiterCount==6){

            // model code - 1 block
            // app/endpoint code - 1 block
            // requirement - 1 block

            console.log('del count is 6')
            const regexInsideDelContent = /```(.*?)```/gs;
            const matches = genCode.matchAll(regexInsideDelContent);

            const contentArray = [];

            for (const match of matches) {
                contentArray.push(match[1].trim());
            }

            let appCode = "";
            let modelCode = "";
            let reqCode = "";

            //console.log(contentArray);
            for(let k=0;k<contentArray.length;k++){
                if(contentArray[k].includes("app.route") || contentArray[k].includes("app.run")){
                    appCode = contentArray[k];
                }else if(contentArray[k].includes("db.Model") || contentArray[k].includes("db.model")){
                    modelCode = contentArray[k];
                }else{
                    reqCode = contentArray[k];
                }
            }

            // if its a first endpoint code - add everything but remove if __name==main : app.run()
            if(firstLastIndicator=="FIRST_ENDPOINT"){

                // adding app.py file

                // removing app.run() variations
                appCode = appCode.replace(/if __name__ == ['"]__main__['"]:\n\s+app.run\(\)\n?/g, '');
                appCode = appCode.replace(/if __name__ == ['"]__main__['"]:\n\s+app\.run\(debug=True\)\n?/g, '');
                appCode = appCode.replace("python\n","");

                const {finalappCode, errReplaceErr} = replaceDBParams(appCode, codegenDb, reqData, directory)
                if (!finalappCode) throw errReplaceErr;

                if(finalappCode){
                    ({respMsg, errWrtFile} = await writeToFilesV2(directory,"app.py",finalappCode+"\n\n"));
                }

                
                // env file
                let envContent = "DB_USER="+reqData.dbUserName+"\n"+"DB_PASSWORD="+reqData.dbPassword+"\n"+"DB_HOST="+reqData.dbHost+"\n"+"DB_PORTNO="+reqData.dbPort+"\n"+"DB_NAME="+reqData.dbName;
                ({respMsg, errWrtFile} = writeToFilesV2(directory,".env",envContent));
                
                // adding req file
                if(reqCode){
                    ({respMsg, errWrtFile} = await writeToFilesV2(directory,"requirements.txt",reqCode));
                }
                // keep track of all the modelClass used in the code
                
                // regex to get the content between "class" and the "db.Model"
                const modelClassNamesregex = /class (\w+)\(db\.Model\)/g;

                let match;
                while (match = modelClassNamesregex.exec(genCode)) {
                    modelNames.push(match[1]);
                } 

            }
            // intermediate endpoint code - add only model and app code but remove all imports , db and app.run()
            if(firstLastIndicator=="INTERMEDIATE_ENDPOINT"){
                
                const modelClassNamesregex = /class (\w+)\(db\.Model\)/g;

                let matchIntermediateModel;
                let modelsIntermediate = []
                while (matchIntermediateModel = modelClassNamesregex.exec(genCode)) {

                    if(!modelNames.includes(matchIntermediateModel[1])){

                        // this array will help which models to add to the app.py
                        modelsIntermediate.push(matchIntermediateModel[1]);

                        // this array will help us to keep track of all the models added to app.py till now
                        modelNames.push(matchIntermediateModel[1]);

                    }
                }

                    //console.log("models that needs to be pushed to app code ")
                    //console.log(modelsIntermediate);

                    // from gencode , get all the model code for "modelsIntermediate" array and place it in app.py
                    
                    // regex to get only the model code that are in "modelsIntermediate"
                    const regex = new RegExp(`class (${modelsIntermediate.join('|')})\\(db\\.Model\\):([\\s\\S]*?)(?=class|$|@app|\`\`\`)`, 'g');

                    let result;
                    while (result = regex.exec(genCode)) {

                        console.log("code that needs to be appended(excludes previous models) :")
                        let modelCode = `class ${result[1]}(db.Model):\n    ${result[2].trim()}\n`;
                        ({respMsg, errWrtFile} = await writeToFilesV2(directory,"app.py",modelCode+"\n\n"));

                    }

            
                    // below regx failing sometimes - need to fix
                    const routePattern = /(@app\.route[^\n]*\n)([\s\S]*)/
                    //console.log('gencodeee');
                    //console.log(genCode);
                    const matches = appCode.match(routePattern);
                    let routeCode = matches ? matches[0]+"\n" : "\n";
                    let appRunCodeVar1 = "if __name__ == '__main__':\n" +
                    '    app.run(debug=True)';
                    let appRunCodeVar2 = "if __name__ == '__main__':\n" +
                    '    app.run()';

                    routeCode = routeCode.replace(appRunCodeVar1,"");
                    routeCode = routeCode.replace(appRunCodeVar2,"");

                    ({respMsg, errWrtFile} = await writeToFilesV2(directory,"app.py",routeCode+"\n\n"));

            }
            // final endpoint code - add model , app code , remove imports but add app.run()
            if(firstLastIndicator=="LAST_ENDPOINT"){
                
                const modelClassNamesregex = /class (\w+)\(db\.Model\)/g;

                let matchIntermediateModel;
                let modelsIntermediate = []
                while (matchIntermediateModel = modelClassNamesregex.exec(genCode)) {

                    if(!modelNames.includes(matchIntermediateModel[1])){

                        // this array will help which models to add to the app.py
                        modelsIntermediate.push(matchIntermediateModel[1]);

                        // this array will help us to keep track of all the models added to app.py till now
                        modelNames.push(matchIntermediateModel[1]);

                    }
                }

                    //console.log("models that needs to be pushed to app code ")
                    //console.log(modelsIntermediate);

                    // from gencode , get all the model code for "modelsIntermediate" array and place it in app.py
                    
                    // regex to get only the model code that are in "modelsIntermediate"
                    const regex = new RegExp(`class (${modelsIntermediate.join('|')})\\(db\\.Model\\):([\\s\\S]*?)(?=class|$|@app|\`\`\`)`, 'g');

                    let result;
                    while (result = regex.exec(genCode)) {
                        let modelCode = `class ${result[1]}(db.Model):\n    ${result[2].trim()}\n\n`;
                        ({respMsg, errWrtFile} = await writeToFilesV2(directory,"app.py",modelCode+"\n\n"));

                    }


                    // there will be one route , get it and paste it to the app code
                    //console.log("genncodee")
                    //console.log(genCode)
                    // regex to match from "@app.route" to "if __name__"
                    const routePattern = /@app\.route\('(.*)'\)(.*)/s;
                    const matches = appCode.match(routePattern);
                    let routeCode = matches ? matches[0] : "\n\n";

                    // adding app.run()
                    routeCode = routeCode + '\n' +
                    "if __name__ == '__main__':\n" +
                    '    app.run(debug=True)';
                    console.log("route coedeee")
                    console.log(routeCode);
                    ({respMsg,errWrtFile} = await writeToFilesV2(directory,"app.py",routeCode+"\n\n"));
                    if (!respMsg) throw errWrtFile;

            }

        }else if (delimiterCount == 0 || delimiterCount == 2) {

            if ((genCode.indexOf("equirement") > genCode.indexOf("class ")) && (genCode.indexOf("equirement") > genCode.indexOf("@app.route"))) {
                const regEexPattern = /(from)[\s\S]*?(?=(?:[rR]equirement|```))/gm;
                const matches = genCode.match(regEexPattern);
                let appCode = matches ? matches[0] : "\n\n";

                const regExPattrn2 = /[rR]equirement.*?\n/gm;
                const reqMatchs = genCode.match(regExPattrn2);
                let reqCode = reqMatchs ? reqMatchs[1] : ""

                if(firstLastIndicator=="FIRST_ENDPOINT"){

                    // adding app.py file      4
                    // removing app.run() variations
                    appCode = appCode.replace(/if __name__ == ['"]__main__['"]:\n\s+app.run\(\)\n?/g, '');
                    appCode = appCode.replace(/if __name__ == ['"]__main__['"]:\n\s+app\.run\(debug=True\)\n?/g, '');
                    //appCode = appCode.replace("python\n","");
                    regexheader = /[pP]ython.*?\n/gm
                    let regMatchrs = appCode.match(regexheader);
                    if (regMatchrs.length > 0 )
                        appCode = appCode.replace(regMatchrs[1],"");
    
                    const {finalappCode, errReplaceErr} = replaceDBParams(appCode, codegenDb, reqData, directory)
                    if (!finalappCode) throw errReplaceErr;
    
                    if(finalappCode){
                        ({respMsg, errWrtFile} = await writeToFilesV2(directory,"app.py",finalappCode+"\n\n"));
                    }    
                    
                    // env file
                    let envContent = "DB_USER="+reqData.dbUserName+"\n"+"DB_PASSWORD="+reqData.dbPassword+"\n"+"DB_HOST="+reqData.dbHost+"\n"+"DB_PORTNO="+reqData.dbPort+"\n"+"DB_NAME="+reqData.dbName;
                    ({respMsg, errWrtFile} = writeToFilesV2(directory,".env",envContent));
                    
                    // adding req file
                    if(reqCode){
                        ({respMsg, errWrtFile} = await writeToFilesV2(directory,"requirements.txt",reqCode));
                    }
                    // keep track of all the modelClass used in the code                    
                    // regex to get the content between "class" and the "db.Model"
                    const modelClassNamesregex = /class (\w+)\(db\.Model\)/g;
    
                    let match;
                    while (match = modelClassNamesregex.exec(genCode)) {
                        modelNames.push(match[1]);
                    } 
    
                }

                if(firstLastIndicator=="INTERMEDIATE_ENDPOINT") {
                
                    const modelClassNamesregex = /class (\w+)\(db\.Model\)/g;
    
                    let matchIntermediateModel;
                    let modelsIntermediate = []
                    while (matchIntermediateModel = modelClassNamesregex.exec(genCode)) {
    
                        if(!modelNames.includes(matchIntermediateModel[1])){
    
                            // this array will help which models to add to the app.py
                            modelsIntermediate.push(matchIntermediateModel[1]);
    
                            // this array will help us to keep track of all the models added to app.py till now
                            modelNames.push(matchIntermediateModel[1]);    
                        }
                    }
    
                        // from gencode , get all the model code for "modelsIntermediate" array and place it in app.py
                        
                        // regex to get only the model code that are in "modelsIntermediate"
                        const regex = new RegExp(`class (${modelsIntermediate.join('|')})\\(db\\.Model\\):([\\s\\S]*?)(?=class|$|@app|\`\`\`)`, 'g');
    
                        let result;
                        while (result = regex.exec(genCode)) { 
                            let modelCode = `class ${result[1]}(db.Model):\n    ${result[2].trim()}\n`;
                            ({respMsg, errWrtFile} = await writeToFilesV2(directory,"app.py",modelCode+"\n"));
    
                        }
    
                        // there will be only one route , get that and add to app code
                        
                        // regex to match from "@app.route" to "if __name__"
                        const routePattern = /@app\.route[\s\S]*?(?=if __name__)/
                        //console.log('gencodeee');
                        //console.log(genCode);
                        const matches = genCode.match(routePattern);
                        let routeCode = matches ? matches[0] : "";
                        let appRunCodeVar1 = "if __name__ == '__main__':\n" +
                        '    app.run(debug=True)';
                        let appRunCodeVar2 = "if __name__ == '__main__':\n" +
                        '    app.run()';
    
                        routeCode = routeCode.replace(appRunCodeVar1,"");
                        routeCode = routeCode.replace(appRunCodeVar2,"");
    
                        ({respMsg, errWrtFile} = await writeToFilesV2(directory,"app.py",routeCode+"\n\n"));
    
                }

                if(firstLastIndicator=="LAST_ENDPOINT"){
                
                    const modelClassNamesregex = /class (\w+)\(db\.Model\)/g;
    
                    let matchIntermediateModel;
                    let modelsIntermediate = []
                    while (matchIntermediateModel = modelClassNamesregex.exec(genCode)) {
    
                        if(!modelNames.includes(matchIntermediateModel[1])){
    
                            // this array will help which models to add to the app.py
                            modelsIntermediate.push(matchIntermediateModel[1]);
    
                            // this array will help us to keep track of all the models added to app.py till now
                            modelNames.push(matchIntermediateModel[1]);
    
                        }
                    }
    
                        //console.log("models that needs to be pushed to app code ")
                        //console.log(modelsIntermediate);
    
                        // from gencode , get all the model code for "modelsIntermediate" array and place it in app.py
                        
                        // regex to get only the model code that are in "modelsIntermediate"
                        const regex = new RegExp(`class (${modelsIntermediate.join('|')})\\(db\\.Model\\):([\\s\\S]*?)(?=class|$|@app|\`\`\`)`, 'g');
    
                        let result;
                        while (result = regex.exec(genCode)) {
                            let modelCode = `class ${result[1]}(db.Model):\n    ${result[2].trim()}\n\n`;
                            ({respMsg, errWrtFile} = await writeToFilesV2(directory,"app.py",modelCode+"\n"));
    
                        }
                        // there will be one route , get it and paste it to the app code
                        //console.log("genncodee")
                        //console.log(genCode)
                        // regex to match from "@app.route" to "if __name__"
                        const routePattern = /@app\.route[\s\S]*?(?=if __name__)/;
                        const matches = genCode.match(routePattern);
                        let routeCode = matches ? matches[0] : "\n";
    
                        // adding app.run()
                        routeCode = routeCode + '\n' +
                        "if __name__ == '__main__':\n" +
                        '    app.run(debug=True)';
                        //console.log("route coedeee")
                        //console.log(routeCode);
                        ({respMsg,errWrtFile} = await writeToFilesV2(directory,"app.py",routeCode+"\n"));
                        if (!respMsg) throw errWrtFile;
    
                }

            }

        }

        let responseMsg = "success"
        return {responseMsg}
    } catch (errAssrtFile) {
        console.log("errAssrtFile : ",errAssrtFile)
		return {errAssrtFile};
	} 

}



async function assortIntoFilesMongoV2(projectId, genCode, codegenDb, reqData,firstLastIndicator) {
    try {
        let directory = process.env.DIRECTORY_LOCATION+"/"+projectId+"/pythoncode";
        // words that are observed when a codegen fails , keep adding more based on chatgpt response
        let codegenFailMsgs = ['i apologize','unfortunately','as a ai model','unclear','sample implemenatation','sorry']
        let failMsgCount = 0;
      
        for(let f=0;f<codegenFailMsgs.length;f++){
            if(String(genCode).toLowerCase().includes(codegenFailMsgs[f])){
                failMsgCount++;
            }
        }
        let CHAT_GPT_ERROR = "UNEXPECTED_CHATGPT_RESPONSE";
        if(failMsgCount>0){
            return { CHAT_GPT_ERROR };
        }

        // get the number of ```

        const delimiterCount = (genCode.match(/```/g) || []).length;

        if(delimiterCount==4){

            // app code includes model code - 1 block
            // requirement - 1 block

            // regex to get the content between the ```
            const regexInsideDelContent = /```(.*?)```/gs;
            const matches = genCode.matchAll(regexInsideDelContent);

            const contentArray = [];

            for (const match of matches) {
                contentArray.push(match[1].trim());
            }
            

            let appCode = "";
            let reqCode = "";

            if(contentArray[0].length>contentArray[1].length){
                appCode = contentArray[0];
                reqCode = contentArray[1];
            }else{
                appCode = contentArray[1];
                reqCode = contentArray[0];
            }

            // if its a first endpoint code - add everything but remove if __name==main : app.run()
            if(firstLastIndicator=="FIRST_ENDPOINT"){

                // adding app.py file

                // removing app.run() variations
                appCode = appCode.replace(/if __name__ == ['"]__main__['"]:\n\s+app\.run\(\)\n?/g, '');
                appCode = appCode.replace(/if __name__ == ['"]__main__['"]:\n\s+app\.run\(debug=True\)\n?/g, '');
                appCode = appCode.replace("python\n","");
                const {finalappCode, errReplaceErr} = replaceDBParams(appCode, codegenDb, reqData, directory)
                if (!finalappCode) throw errReplaceErr;

                if(appCode){
                    writeToFilesV2(directory,"app.py",finalappCode+"\n\n");
                }

                // adding requirements.tx file
                if(reqCode){
                    writeToFilesV2(directory,"requirements.txt",reqCode);
                }
                // keep track of all the modelClass used in the code

                // add env file
                
                let envContent = "DB_USER="+reqData.dbUserName+"\n"+"DB_PASSWORD="+reqData.dbPassword+"\n"+"DB_HOST="+reqData.dbHost+"\n"+"DB_PORTNO="+reqData.dbPort+"\n"+"DB_NAME="+reqData.dbName;
                try{
                    writeToFilesV2(directory,".env",envContent);
                }catch(e){
                    console.log(e);
                }
                console.log("encontent",envContent);
                console.log('diretot',directory)
                
                const modelClassNamesregex = /class\s+(\w+)\s*:/g;

                console.log(genCode)
                let match;
                while (match = modelClassNamesregex.exec(genCode)) {
                    modelNames.push(match[1]);
                }

                console.log("deleimtetrr  4 , first endpoint ")
                console.log(modelNames)
            }
            // intermediate endpoint code - add only model and app code but remove all imports , db and app.run()
            if(firstLastIndicator=="INTERMEDIATE_ENDPOINT") {
                
                const modelClassNamesregex = /class\s+(\w+)\s*:/g

                let matchIntermediateModel;
                let modelsIntermediate = []
                while (matchIntermediateModel = modelClassNamesregex.exec(genCode)) {

                    if(!modelNames.includes(matchIntermediateModel[1])){

                        // this array will help which models to add to the app.py
                        modelsIntermediate.push(matchIntermediateModel[1]);

                        // this array will help us to keep track of all the models added to app.py till now
                        modelNames.push(matchIntermediateModel[1]);

                    }
                }

                    console.log("del 4 , intermediate")
                    console.log(modelNames)
                    console.log("del 4 intermediate")
                    console.log(modelsIntermediate)

                    // from gencode , get all the model code for "modelsIntermediate" array and place it in app.py
                    
                    // regex to get only the model code that are in "modelsIntermediate"
                    const regex = new RegExp(`class (${modelsIntermediate.join('|')})\\s*:\\s*([\\s\\S]*?)(?=class|\\n\\s*\\n)`, 'g');

                    let result;
                    while (result = regex.exec(genCode)) { 
                        let modelCode = `class ${result[1]}:\n    ${result[2].trim()}\n`;
                        await writeToFilesV2(directory,"app.py",modelCode+"\n");

                    }

                    // there will be only one route , get that and add to app code
                    
                    // regex to match from "@app.route" to "if __name__"
                    const routePattern = /@app\.route[\s\S]*?(?=if __name__|\`\`\`|class|$)/
                    //console.log('gencodeee');
                    //console.log(genCode);
                    const matches = genCode.match(routePattern);
                    const routeCode = matches ? matches[0] : "";
                    await writeToFilesV2(directory,"app.py",routeCode+"\n\n");

            }
            // final endpoint code - add model , app code , remove imports but add app.run()
            if(firstLastIndicator=="LAST_ENDPOINT"){
                
                const modelClassNamesregex = /class\s+(\w+)\s*:/g

                let matchIntermediateModel;
                let modelsIntermediate = []
                while (matchIntermediateModel = modelClassNamesregex.exec(genCode)) {

                    if(!modelNames.includes(matchIntermediateModel[1])){

                        // this array will help which models to add to the app.py
                        modelsIntermediate.push(matchIntermediateModel[1]);

                        // this array will help us to keep track of all the models added to app.py till now
                        modelNames.push(matchIntermediateModel[1]);

                    }
                }

                console.log("del 4 , final")
                console.log(modelNames)
                console.log("del 4 final")
                console.log(modelsIntermediate)

                    //console.log("models that needs to be pushed to app code ")
                    //console.log(modelsIntermediate);

                    // from gencode , get all the model code for "modelsIntermediate" array and place it in app.py
                    
                    // regex to get only the model code that are in "modelsIntermediate"
                    const regex = new RegExp(`class (${modelsIntermediate.join('|')})\\s*:\\s*([\\s\\S]*?)(?=class|\\n\\s*\\n)`, 'g');


                    let result;
                    while (result = regex.exec(genCode)) {
                        let modelCode = `class ${result[1]}:\n    ${result[2].trim()}\n\n`;
                        await writeToFilesV2(directory,"app.py",modelCode+"\n");

                    }
                    // there will be one route , get it and paste it to the app code
                    //console.log("genncodee")
                    //console.log(genCode)
                    // regex to match from "@app.route" to "if __name__"
                    // 
                     // /@app\.route[\s\S]*?(?=if __name__)/
                     // /@app\.route[\s\S]*?(?=if __name__|\`\`\`|class)/
                     // /@app\.route[\s\S]*?(?=if __name__|\`\`\`)/;
                    const routePattern = /@app\.route[\s\S]*?(?=if __name__|\`\`\`|class|$)/;
                    const matches = genCode.match(routePattern);
                    let routeCode = matches ? matches[0] : "\n";

                    // adding app.run()
                    routeCode = routeCode + '\n' +
                    "if __name__ == '__main__':\n" +
                    '    app.run(debug=True)\n';
                    console.log("route coedeee dellllll 444")
                    console.log(routeCode);
                    await writeToFilesV2(directory,"app.py",routeCode+"\n");

            }

        }else if(delimiterCount==6){

            // model code - 1 block
            // app/endpoint code - 1 block
            // requirement - 1 block

            console.log('del count is 6')
            const regexInsideDelContent = /```(.*?)```/gs;
            const matches = genCode.matchAll(regexInsideDelContent);

            const contentArray = [];

            for (const match of matches) {
                contentArray.push(match[1].trim());
            }

            let appCode = "";
            let modelCode = "";
            let reqCode = "";

            //console.log(contentArray);
            for(let k=0;k<contentArray.length;k++){
                if(contentArray[k].includes("@app.route") || contentArray[k].includes("app.run")){
                    appCode = contentArray[k];
                }else if(contentArray[k].includes("__init__") || contentArray[k].includes("self")){
                    modelCode = contentArray[k];
                }else{
                    reqCode = contentArray[k];
                }
            }

            // if its a first endpoint code - add everything but remove if __name==main : app.run()
            if(firstLastIndicator=="FIRST_ENDPOINT"){

                // adding app.py file

                // removing app.run() variations
                appCode = appCode.replace(/if __name__ == ['"]__main__['"]:\n\s+app.run\(\)\n?/g, '');
                appCode = appCode.replace(/if __name__ == ['"]__main__['"]:\n\s+app\.run\(debug=True\)\n?/g, '');
                appCode = appCode.replace("python\n","");

                const {finalappCode, errReplaceErr} = replaceDBParams(appCode, codegenDb, reqData, directory)
                if (!finalappCode) throw errReplaceErr;

                if(finalappCode){
                    writeToFilesV2(directory,"app.py",finalappCode+"\n\n");
                }

                
                // env file
                let envContent = "DB_USER="+reqData.dbUserName+"\n"+"DB_PASSWORD="+reqData.dbPassword+"\n"+"DB_HOST="+reqData.dbHost+"\n"+"DB_PORTNO="+reqData.dbPort+"\n"+"DB_NAME="+reqData.dbName;
                writeToFilesV2(directory,".env",envContent);
                
                // adding req file
                if(reqCode){
                    writeToFilesV2(directory,"requirements.txt",reqCode);
                }
                // keep track of all the modelClass used in the code
            
                const modelClassNamesregex = /class\s+(\w+)\s*:/g

                let match;
                while (match = modelClassNamesregex.exec(genCode)) {
                    modelNames.push(match[1]);
                } 

                console.log("del 6 , intermediate")
                console.log(modelNames)
                

            }
            // intermediate endpoint code - add only model and app code but remove all imports , db and app.run()
            if(firstLastIndicator=="INTERMEDIATE_ENDPOINT"){
                
                const modelClassNamesregex = /class\s+(\w+)\s*:/g

                let matchIntermediateModel;
                let modelsIntermediate = []
                while (matchIntermediateModel = modelClassNamesregex.exec(genCode)) {

                    if(!modelNames.includes(matchIntermediateModel[1])){

                        // this array will help which models to add to the app.py
                        modelsIntermediate.push(matchIntermediateModel[1]);

                        // this array will help us to keep track of all the models added to app.py till now
                        modelNames.push(matchIntermediateModel[1]);

                    }
                }

                console.log("del 6 , intermediate")
                console.log(modelNames)
                console.log("del 6 intermediate")
                console.log(modelsIntermediate)

                    //console.log("models that needs to be pushed to app code ")
                    //console.log(modelsIntermediate);

                    // from gencode , get all the model code for "modelsIntermediate" array and place it in app.py
                    
                    // regex to get only the model code that are in "modelsIntermediate"
                    const regex = new RegExp(`class (${modelsIntermediate.join('|')})\\s*:\\s*([\\s\\S]*?)(?=class|\\n\\s*\\n)`, 'g');

                    let result;
                    while (result = regex.exec(genCode)) {

                        console.log("code that needs to be appended(excludes previous models) :")
                        let modelCode = `class ${result[1]}:\n    ${result[2].trim()}\n`;
                        await writeToFilesV2(directory,"app.py",modelCode+"\n\n");

                    }

            
                    // below regx failing sometimes - need to fix
                    // /@app\.route[\s\S]*?(?=if __name__|\`\`\`|class)/
                    // working - /(@app\.route[^\n]*\n)([\s\S]*)/
                    const routePattern = /@app\.route[\s\S]*?(?=if __name__|\`\`\`|class|$)/
                    //console.log('gencodeee');
                    //console.log(genCode);
                    const matches = appCode.match(routePattern);
                    const routeCode = matches ? matches[0]+"\n" : "\n";
                    await writeToFilesV2(directory,"app.py",routeCode+"\n\n");

            }
            // final endpoint code - add model , app code , remove imports but add app.run()
            if(firstLastIndicator=="LAST_ENDPOINT"){
                
                const modelClassNamesregex =/class\s+(\w+)\s*:/g

                let matchIntermediateModel;
                let modelsIntermediate = []
                while (matchIntermediateModel = modelClassNamesregex.exec(genCode)) {

                    if(!modelNames.includes(matchIntermediateModel[1])){

                        // this array will help which models to add to the app.py
                        modelsIntermediate.push(matchIntermediateModel[1]);

                        // this array will help us to keep track of all the models added to app.py till now
                        modelNames.push(matchIntermediateModel[1]);

                    }
                }

                console.log("del 6 , final")
                console.log(modelNames)
                console.log("del 6 final")
                console.log(modelsIntermediate)

                    //console.log("models that needs to be pushed to app code ")
                    //console.log(modelsIntermediate);

                    // from gencode , get all the model code for "modelsIntermediate" array and place it in app.py
                    
                    // regex to get only the model code that are in "modelsIntermediate"
                    const regex = new RegExp(`class (${modelsIntermediate.join('|')})\\s*:\\s*([\\s\\S]*?)(?=class|\\n\\s*\\n)`, 'g');

                    let result;
                    while (result = regex.exec(genCode)) {
                        let modelCode = `class ${result[1]}:\n    ${result[2].trim()}\n\n`;
                        await writeToFilesV2(directory,"app.py",modelCode+"\n\n");

                    }


                    // there will be one route , get it and paste it to the app code
                    //console.log("genncodee")
                    //console.log(genCode)
                    // regex to match from "@app.route" to "if __name__"
                    // /@app\.route[\s\S]*?(?=if __name__|\`\`\`|class)/
                    // working - /@app\.route\('(.*)'\)(.*)/s;
                    const routePattern = /@app\.route[\s\S]*?(?=if __name__|\`\`\`|class|$)/
                    const matches = appCode.match(routePattern);
                    let routeCode = matches ? matches[0] : appCode+"\n\n";

                    // adding app.run()
                    routeCode = routeCode + '\n' +
                    "if __name__ == '__main__':\n" +
                    '    app.run(debug=True)\n';
                    console.log("route coedeee dell 6")
                    console.log(routeCode);
                    await writeToFilesV2(directory,"app.py",routeCode+"\n\n");

            }

        }

        let responseMsg = "success"
        return {responseMsg}
    } catch (errAssrtFile) {
        console.log("errAssrtFile : ",errAssrtFile)
		return {errAssrtFile};
	} 

}

// not availble locally , later import this function and use
function replaceDBParams(appCode, codegenDb, reqData, directory) {
    try {
        let finalDBConn;
        let finalappCode;
        let regexDBConfig;
        let dataDBConfig;
        let defLoadPwd;
        console.log("appCode..", appCode)
        console.log("reqData..", reqData)

        defLoadPwd = "csPasswd = config('DB_PASSWORD') \nencoded_passwd = urllib.parse.quote_plus(csPasswd)";
        //defEnvDBConfig = "'mssql+pymssql://"+reqData.dbUserName+":"+reqData.dbPassword+"@"+reqData.dbHost+":"+reqData.dbPort+"/"+reqData.dbName + "'"
        defEnvDBConfig = "f\"mssql+pymssql://{config('DB_USER')}:{encoded_passwd}@{config('DB_HOST')}:{config('DB_PORTNO')}/{config('DB_NAME')}\""
        if(codegenDb.includes("postgre")){
            defEnvDBConfig = defEnvDBConfig.replace("mssql+pymssql","postgresql")
        }

        if(codegenDb.includes("mongo")){
            defEnvDBConfig = defEnvDBConfig.replace("mssql+pymssql","mongodb") + "\+\"?authSource=admin&readPreference=primary&directConnection=true&ssl=false\"";
        }

        appCode = "\n" + "import urllib" + "\nfrom decouple import config \n" + appCode;
        

        if (appCode.includes("Flask(__name__)")) {
            regexFlaskName = /^(.*Flask\(__name__\)*)$/gm;
            dataFlaskName = appCode.match(regexFlaskName)
            if (dataFlaskName) {
                const newImport = dataFlaskName[0] + "\n" + defLoadPwd + "\n";
                appCode = appCode.replace(dataFlaskName[0], newImport)
            } else {
                appCode = appCode;
            }
        }
        
        if (appCode.includes("app.config[")) {
            // old regex - /^(.*app\.config\[\S*\].*pymssql.*)$/gm
            regexDBConfig = /.*app\.config\['\w+'\]\s*=\s*'[^']+'\s*(?:app\.config\['\w+'\]\s*=\s*'[^']+'\s*)?/gm;
            
            dataDBConfig = appCode.match(regexDBConfig)
            if (dataDBConfig) {
                dbconfig = dataDBConfig[0]
                finalDBConn = dbconfig.split("=")[0] + " = " + defEnvDBConfig 
                appCode = appCode.replace(dbconfig, finalDBConn+"\n")
            }
        } else if (appCode.includes("pymssql.connect")) {

        }
        if (appCode.includes("create_engine")) {
            regexDBConfig = /^(.*create\_engine\(\S*.*\).*)$/gm;
            dataDBConfig = appCode.match(regexDBConfig);
            if(dataDBConfig) {
                dbconfig = dataDBConfig[0]
                finalDBConn = dbconfig.split("=")[0] + " = " + "create_engine("+ defEnvDBConfig + ")"
                appCode = appCode.replace(dbconfig, finalDBConn)
            }
        }
        finalappCode = appCode
        return {finalappCode};
    } catch (errReplaceErr) {
        console.log("errReplaceErr : ",errReplaceErr)
		return {errReplaceErr};
	} 
}

/* 
async function genPythonCodegenV2(projectId,reqData){

        let requiredTables = [];
        let prompt = "";
        let {codegenLang,codegenDb} = reqData;
        let responseData;
        let modelPrompt;

        let tablesRelations = await getTableRelations(projectId);      
        let relations;
        try{
            relations = tablesRelations.relations;
        

        const docs = await OperationData.find({ projectid: projectId });        
        let noOfOps = docs.length; 
        // looping thru endpoints
        for(let i=0;i<docs.length;i++) {

                for(let j=0;j<docs[i].data.responseData.length;j++) {
                    let schemaTable = findAttribute(docs[i].data.responseData[j].content,"key");
                    // incase of bikestore , no 'key' attributr found , then search for 'schemaName
                    let schemaName;
                    if(schemaTable == null){
                        schemaName = findAttribute(docs[i].data.responseData[j].content,"schemaName")
                    }
                    // if schema.table(key) is found and if it doesnt exist already in requiredTabele , then add it
                    if(schemaTable && !(requiredTables.includes(schemaTable))){
                        requiredTables.push(schemaTable)
                    }

                    if(schemaName && !(requiredTables.includes(schemaName))){
                        requiredTables.push(schemaName)
                    }

                    //console.log("Initial required tables :")
                    //console.log(requiredTables);
                }

                for(let r=0;r<relations.length;r++){
                    let mainTbl = relations[r].mainTableSchema+"."+relations[r].mainTable;
                    
                    // for schema.table name case
                    if(mainTbl){
                        if(requiredTables.includes(mainTbl)){
                            
                            let depTbl = relations[r].dependentTableSchema+"."+relations[r].dependentTable;
                            if(!requiredTables.includes(depTbl)){
                                requiredTables.push(depTbl);
                            }
                        }
                    }

                    // for tablesname only case (bikestore)
                    let mainTable = relations[r].mainTable;
                    if(mainTable){
                        if(requiredTables.includes(mainTable)){
                            requiredTables.push(relations[r].dependentTable)
                        }
                    }
                    
                    // to traverse second time , needed to get all dependent tables
                    if(r==relations.length){
                        r=0;
                    }
                }

                //console.log("All depedent tables (updated):");
                //console.log(requiredTables);
        
                if(codegenLang.toLowerCase().includes("node")){
                    modelPrompt = "Give me a "+codegenLang+" code for ORM model class using express and Sequelize with "+codegenDb+" as database for the following schemas and tables : ";
                }else if(codegenLang.toLowerCase().includes("python")){
                    modelPrompt = "Give me a "+codegenLang+" code for ORM model class using flask and sql_alchemy with "+codegenDb+" as database for the following schemas and tables : ";
                    //modelPrompt = "Write a "+codegenLang+" code for ORM model class using flask and sql_alchemy with appdb as database for the following schemas and tables : ";
                }
                responseData = await tableData(projectId);
                //console.log("responseData...", responseData)
                if (responseData.length == 1 && responseData[0].error) {
                    throw new Error(responseData[0].error);
                }
                for(let i=0;i<responseData.length;i++){            
                    // generates for only tables that user dragged and dropped
                    if(requiredTables.includes(responseData[i].key)||requiredTables.includes(responseData[i].name)){
                        modelPrompt +="The table name is "+responseData[i].name+" under the schema "+responseData[i].key.split(".")[0]+".";
                        let fields = responseData[i].selectedColumns;                    
                        modelPrompt+="The table has "+fields.length+" fields.";
                        for(let j=0;j<fields.length;j++){                    
                            modelPrompt+="The table has "+(j+1)+"."+fields[j].name;
                            modelPrompt+=" of type "+fields[j].type;
                            modelPrompt+=" of format "+fields[j].format+".";
                            if(fields[j].keyType==="primary"){
                                modelPrompt+=" which is a primary key. "
                            }
                            if(fields[j].foreign){
                                modelPrompt+=" which is a foreign key referencing "+fields[j].foreign.column+" from "+fields[j].foreign.table+" table."
                            }    
                        }                        
                        modelPrompt+=" Consider another table."                        
                    }
                }
        
                // replacing custom types to generic types - mssql
                modelPrompt = modelPrompt.replace(/sql_server_nvarchar/g, 'NVARCHAR');
                modelPrompt = modelPrompt.replace(/sql_server_varchar/g, 'VARCHAR');
                modelPrompt = modelPrompt.replace(/sql_server_char/g, 'CHAR');
                modelPrompt = modelPrompt.replace(/sql_server_nchar/g, 'NCHAR');
                modelPrompt = modelPrompt.replace(/sql_server_geography/g, 'Geography');
                modelPrompt = modelPrompt.replace(/sql_server_uniqueidentifier/g, 'Uniqueidentifier');
                modelPrompt = modelPrompt.replace(/sql_server_hierarchyid/g, 'Hierarchyid');
                modelPrompt = modelPrompt.replace(/sql_server_xml/g, 'XML');
                modelPrompt = modelPrompt.replace(/sql_server_ntext/g, 'ntext');
        
                // for postgreSQL db
                modelPrompt = modelPrompt.replace(/postgres_character/g,'character');
                modelPrompt = modelPrompt.replace(/postgres_text/g,'text');
                modelPrompt = modelPrompt.replace(/postgres_USER-DEFINED/g,'USER-DEFINED');
                modelPrompt = modelPrompt.replace(/postgres_timestamp/g,'timestamp');
                modelPrompt = modelPrompt.replace(/postgres_ARRAY/g,'ARRAY');
                modelPrompt = modelPrompt.replace(/postgres_tsvector/g,'tsvector');
        
                let lastIndex = modelPrompt.lastIndexOf("Consider another table.");
                
                if (lastIndex !== -1) {
                    modelPrompt = modelPrompt.slice(0, lastIndex) + modelPrompt.slice(lastIndex).replace("Consider another table.", "");
                }
                modelPrompt+="Don't give me any comments";
                
                console.log("Model prompt generated ")
                //console.log(modelPrompt);

                if(codegenLang.toLowerCase().includes("node")){
                    prompt = "Give me a "+codegenLang+" code using express and Sequelize with "+codegenDb+" as database the folowing endpoint : ";
                }else if(codegenLang.toLowerCase().includes("python")){
                    prompt = "Give me a "+codegenLang+" code using flask and sql_alchemy with "+codegenDb+" as database for the folowing endpoint : ";
                    //prompt = "Write a "+codegenLang+" code using flask and sql_alchemy with appdb as database for app.py file with the following data : ";
                }

                // prompt is operational data prompt
                prompt+="The method is "+docs[i].data.method+" method.";
                prompt+="The endpoint is "+docs[i].data.endpoint+". ";
                prompt+="The Request data is as follows :";

                let authorizationUsed = docs[i].data.requestData.authorization.authType;

                if(authorizationUsed!=="No Auth"){
                    prompt+="The authorization include a "+authorizationUsed+".";
                }

                let headersUsed = docs[i].data.requestData.header;
            
                if (headersUsed && headersUsed.length>0) {
                    prompt+="There are "+headersUsed.length+" headers used.";

                    for(let i=0;i<headersUsed.length;i++) {
                        let key = Array.from(headersUsed[i].keys())[i]
                        if(key){
                            let name = headersUsed[i].get(key).name?headersUsed[i].get(key).name:"";
                            let type = headersUsed[i].get(key).type?headersUsed[i].get(key).type:"";
                            let format = headersUsed[i].get(key).format?headersUsed[i].get(key).format:"";
                            let required = headersUsed[i].get(key).required?headersUsed[i].get(key).required:"";

                            prompt+="The header is "+name+" with the type "+type+" and of format "+format+".";

                            if(required){
                                prompt+=" It is a required header."
                            }
                        }
                    }                
                }

                let pathUsed = docs[i].data.requestData.path;            

                if(pathUsed && pathUsed.length>0){
                    prompt+="There are "+pathUsed.length+" path used.";

                    for(let i=0;i<pathUsed.length;i++){

                        let key = Array.from(pathUsed[i].keys())[i]
                        if(key){
                            let name = pathUsed[i].get(key).name?pathUsed[i].get(key).name:"";
                            let type = pathUsed[i].get(key).type?pathUsed[i].get(key).type:"";
                            let format = pathUsed[i].get(key).format?pathUsed[i].get(key).format:"";
                            let required = pathUsed[i].get(key).required?pathUsed[i].get(key).required:"";

                            prompt+="The path is "+name+" with the type "+type+" and of format "+format+".";

                            if(required){
                                prompt+=" It is a required path."
                            }
                        }

                    }                    
                }

                let queryUsed = docs[i].data.requestData.query;          

                if(queryUsed && queryUsed.length>0){
                    prompt+="There are "+queryUsed.length+" queries used.";

                    for(let i=0;i<queryUsed.length;i++){

                        let key = Array.from(queryUsed[i].keys())[i]
                        if(key){
                            let name = queryUsed[i].get(key).name?queryUsed[i].get(key).name:"";
                            let type = queryUsed[i].get(key).type?queryUsed[i].get(key).type:"";
                            let format = queryUsed[i].get(key).format?queryUsed[i].get(key).format:"";
                            let required = queryUsed[i].get(key).required?queryUsed[i].get(key).required:"";

                            prompt+="The query is "+name+" with the type "+type+" and of format "+format+".";

                            if(required){
                                prompt+=" It is a required query."
                            }
                        }

                    }                    
                }

                let formDataUsed = docs[i].data.requestData.formData;
            

                if(formDataUsed && formDataUsed.length>0){
                    prompt+="There are "+formDataUsed.length+" form datas are used.";

                    for(let i=0;i<formDataUsed.length;i++){

                        let key = Array.from(formDataUsed[i].keys())[i]
                        if(key){
                            let name = formDataUsed[i].get(key).name?formDataUsed[i].get(key).name:"";
                            let type = formDataUsed[i].get(key).type?formDataUsed[i].get(key).type:"";
                            let format = formDataUsed[i].get(key).format?formDataUsed[i].get(key).format:"";
                            let required = formDataUsed[i].get(key).required?formDataUsed[i].get(key).required:"";

                            prompt+="The query is "+name+" with the type "+type+" and of format "+format+".";

                            if(required){
                                prompt+=" It is a required formData."
                            }
                        }

                    }                    
                }

                // no request body for GET methods
            
                if((docs[i].data.method).toLowerCase()!='get') {
                
                    prompt+=" The request body include :";
                    let requestDataHeader;
                    if(requestDataHeader && requestDataHeader.length>0) {
                        prompt+="There are "+requestDataHeader.length+" response headers used.";
                        for(let i=0;i<requestDataHeader.length;i++) {
                            let key = Array.from(requestDataHeader[i].keys())[i]
                            if(key){
                                let name = requestDataHeader[i].get(key).name?requestDataHeader[i].get(key).name:"";
                                let type = requestDataHeader[i].get(key).type?requestDataHeader[i].get(key).type:"";
                                let format = requestDataHeader[i].get(key).format?requestDataHeader[i].get(key).format:"";
                                let required = requestDataHeader[i].get(key).required?requestDataHeader[i].get(key).required:"";

                                prompt+="The header is "+name+" with the type "+type+" and of format "+format+".";

                                if(required){
                                    prompt+=" It is a required request header."
                                }
                            }
                        }
                    } // headers end

                    // request body starts
                    let innerObjectNames;
                    let requestBodyExist = true;
                    try{
                        innerObjectNames = Object.keys(docs[i].data.requestData.body.properties);
                    }catch(e){
                        requestBodyExist = false;
                    }
                    if(requestBodyExist) {
                        for(let ib=0;ib<innerObjectNames.length;ib++) {
                            let innerObject = docs[i].data.requestData.body.properties[innerObjectNames[ib]];                            
                            if(innerObject.type == 'arrayOfObjects') {
                                prompt+="The JSON attribute include : "
                                prompt+=""+(ib+1)+") "  
                                let propertiesObject = innerObject.items.properties;
                                const innerObjectNames = Object.keys(propertiesObject);                
                                for(let ion=0;ion<innerObjectNames.length;ion++) {
                                    //prompt+=""+(ib+1)+"."+(ion+1)+")";  // nesting variables
                                    if(propertiesObject[innerObjectNames[ion]].type == 'ezapi_table') {
                                        // get the selected column
                                        try {
                                            selectedColumnsData = findSelectedColumns(docs[i].data.requestData.body);
                                        }catch(e){
                                            // no selected columns data , continue
                                        }  
                                                                            
                                        prompt+="The "+innerObject.name;                                        
                                        if(selectedColumnsData) {                                            
                                            prompt+=" as an array and it contains : "
                                            prompt+=""+(ib+1)+"."+(ion+1)+")";
                                            prompt+= innerObjectNames[ion]+" as object and contains "+selectedColumnsData.length+" fields :";
                                    
                                            for(let k=0;k<selectedColumnsData.length;k++){
                        
                                                let name = selectedColumnsData[k].name;
                                                let table = selectedColumnsData[k].key;
                                                prompt+=(ib+1)+"."+(ion+1)+"."+(k+1)+")"+name+" from "+table;
                        
                                            }
                                        }
                                    } else {

                                        let innerObject = propertiesObject[innerObjectNames[ion]];                                        
                                        let name = innerObject.name;
                                        let column = innerObject.sourceName;
                                        let table = innerObject.key; // schema included here
                                        prompt+=name+" from "+column+" field of "+table+" table as "+innerObjectNames[ion]+".";
                                        
                                    }
                                }
                            } else {
                                if (innerObject.type === 'ezapi_table') {
                                    //console.log("unhandled. table structure") //code to be written
                                    let sourceName = innerObject.sourceName;
                                        selectedColumnsData = findSelectedColumns(innerObject);
                                        
                                        prompt+="1) The "+sourceName;
                                            
                                        if(selectedColumnsData) {
                                            prompt+=" as an object and it contains : "
                                            for(let k=0;k<selectedColumnsData.length;k++) {
                                                let name = selectedColumnsData[k].name;
                                                let table = selectedColumnsData[k].key;
                                                prompt+="1."+(k+1)+") "+name+" from "+table+". ";
                                            }
                                        }  
                                } else {
                                    prompt+=""+(ib+1)+") "   // nesting variables
                                    let name = innerObject.name;
                                    let column = innerObject.sourceName;
                                    let table = innerObject.key; // schema included here
                                    prompt+=" "+name+" from "+column+" field of "+table+" table.";
                                }
                            }
                        }
                    }  else {
                        // only one array or object exist
                        let type = docs[i].data.requestData.body.type;                    
                        if(type === 'ezapi_table') {    
                            // get the selected column
                            let sourceName = docs[i].data.requestData.body.sourceName;
                            // get the selected column
                            selectedColumnsData = findSelectedColumns(docs[i].data.requestData.body);                       
                                
                            prompt+="1) The "+sourceName;
                                
                            if(selectedColumnsData) {
                                prompt+=" as an object and it contains : "                                    
                                for(let k=0;k<selectedColumnsData.length;k++) {             
                                    let name = selectedColumnsData[k].name;
                                    let table = selectedColumnsData[k].key;
                                    prompt+="1."+(k+1)+") "+name+" from "+table+". ";                
                                }
                            }  
                        } else {

                            let name = docs[i].data.requestData.body.name;
                            let column = docs[i].data.requestData.body.sourceName;
                            let table = docs[i].data.requestData.body.key; // schema included here
                            prompt+="1) ";
                            prompt+=name+" from "+column+" field of "+table+" table. ";
                        }
                    }          
                }

                // request data ends here

                // response data
                prompt+=" The response data is as follows : "          
                let ResponseHeadersUsed;
                for(let j=0;j<docs[i].data.responseData.length;j++) {            
                    // get staus_code and status message
                    prompt+="The status code is "+docs[i].data.responseData[j].status_code+" with status message as "+docs[i].data.responseData[j].description+".";
                    ResponseHeadersUsed = docs[i].data.responseData[j].headers;
                    if(ResponseHeadersUsed && ResponseHeadersUsed.length>0) {
                        prompt+="There are "+ResponseHeadersUsed.length+" response headers used.";
                        for(let i=0;i<ResponseHeadersUsed.length;i++) {
                            let key = Array.from(ResponseHeadersUsed[i].keys())[i]
                            if(key){
                                let name = ResponseHeadersUsed[i].get(key).name?ResponseHeadersUsed[i].get(key).name:"";
                                let type = ResponseHeadersUsed[i].get(key).type?ResponseHeadersUsed[i].get(key).type:"";
                                let format = ResponseHeadersUsed[i].get(key).format?ResponseHeadersUsed[i].get(key).format:"";
                                let required = ResponseHeadersUsed[i].get(key).required?ResponseHeadersUsed[i].get(key).required:"";

                                prompt+="The header is "+name+" with the type "+type+" and of format "+format+".";

                                if(required){
                                    prompt+=" It is a required response header."
                                }
                            }
                        }
                    } // headers end

                    // rsponse body starts

                    function findSelectedColumns(obj) {
                        if (Array.isArray(obj)) {
                        // If obj is an array, recursively call this function for each item in the array
                            for (let i = 0; i < obj.length; i++) {
                                const result = findSelectedColumns(obj[i]);
                                if (result) {
                                return result;
                                }
                            }
                        } else if (typeof obj === 'object' && obj !== null) {
                        // If obj is an object, recursively call this function for each property of the object
                            for (const prop in obj) {
                                if (prop === 'selectedColumns') {
                                // If the property name is 'selectedCoulmns', return the value
                                return obj[prop];
                                } else {
                                const result = findSelectedColumns(obj[prop]);
                                if (result) {
                                    return result;
                                }
                                }
                            }
                        }
                        // If 'selectedCoulmns' is not found, return null
                        return null;
                    }

                    prompt+=" The response body data : "  
                    let innerObjectNames
                    if (docs[i].data.responseData[j].content && docs[i].data.responseData[j].content.properties) {              
                        innerObjectNames = Object.keys(docs[i].data.responseData[j].content.properties);
                    }
            
                    if(innerObjectNames){
                        for(let ib=0;ib<innerObjectNames.length;ib++) {

                            let innerObject = docs[i].data.responseData[j].content.properties[innerObjectNames[ib]];                        
                            if(innerObject.type == 'arrayOfObjects' || innerObject.type == 'object') {

                                prompt+="The JSON attribute include : "
                                prompt+=""+(ib+1)+") "  
                                let propertiesObject;                            
                                propertiesObject = innerObject.items.properties;
                            
                                if(typeof(propertiesObject)=='undefined'){
                                    propertiesObject = innerObject.properties;
                                }

                                const innerObjectNames = Object.keys(propertiesObject);
                            
                                for(let ion=0;ion<innerObjectNames.length;ion++) {
                                
                                    if(propertiesObject[innerObjectNames[ion]].type == 'ezapi_table') {
                                        // get the selected column                                    
                                        try {
                                            selectedColumnsData = findSelectedColumns(docs[i].data.responseData[j].content);
                                        }catch(e){
                                            // no selected columns data , continue
                                        }                                    
                                        prompt+="The "+innerObject.name;                                    
                                        if(selectedColumnsData) {
                                            
                                            prompt+=" as an array and it contains : "
                                            prompt+=""+(ib+1)+"."+(ion+1)+") ";
                                            prompt+= innerObjectNames[ion]+" as object and contains "+selectedColumnsData.length+" fields :";
                                    
                                            for(let k=0;k<selectedColumnsData.length;k++) {                    
                                                let name = selectedColumnsData[k].name;
                                                let table = selectedColumnsData[k].key;
                                                prompt+=(ib+1)+"."+(ion+1)+"."+(k+1)+") "+name+" from "+table+". ";                    
                                            }
                                        }

                                    } else if(propertiesObject[innerObjectNames[ion]].type == 'arrayOfObjects' || propertiesObject[innerObjectNames[ion]].type == 'object') {
                                
                                        const inObjNames = Object.keys(propertiesObject[innerObjectNames[ion]].properties);
                                        for(let nesIon=0;nesIon<inObjNames.length;nesIon++) {                                       

                                        if(propertiesObject[innerObjectNames[ion]].properties[inObjNames[nesIon]].type == 'ezapi_table') {
                                                let selColumns = propertiesObject[innerObjectNames[ion]].properties[inObjNames[nesIon]].selectedColumns;
                                                prompt+="The "+propertiesObject[innerObjectNames[ion]].properties[inObjNames[nesIon]].sourceName;
                                
                                                if(selColumns) {
                                                
                                                    prompt+=" as an object and it contains : "        
                                                    for(let k=0;k<selColumns.length;k++) {
                                                        let name = selColumns[k].name;
                                                        let table = selColumns[k].key;
                                                        prompt+="1."+(k+1)+") "+name+" from "+table+". "; 
                                                    }
                                                }                                                
                                        }else{
                                                let name = propertiesObject[innerObjectNames[ion]].properties[inObjNames[nesIon]].sourceName.name;
                                                let column = propertiesObject[innerObjectNames[ion]].properties[inObjNames[nesIon]].sourceName.sourceName;
                                                let table = propertiesObject[innerObjectNames[ion]].properties[inObjNames[nesIon]].sourceName.key; // schema included here
                                                prompt+=""+(ib+1)+"."+(ion+1)+") ";
                                                prompt+=name+" from "+column+" field of "+table+" table as "+innerObjectNames[ion]+". ";
                                        }
                                        }
                                    } else {
                                        let innerObject = propertiesObject[innerObjectNames[ion]];                                    
                                        let name = innerObject.name;
                                        let column = innerObject.sourceName;
                                        let table = innerObject.key; // schema included here
                                        prompt+=""+(ib+1)+"."+(ion+1)+") ";
                                        prompt+=name+" from "+column+" field of "+table+" table as "+innerObjectNames[ion]+". ";                                    
                                    }
                                }
                            } else if(innerObject.type == 'ezapi_table') {
                                    // get the selected column
                                let sourceName = innerObject.sourceName;
                                // get the selected column
                                selectedColumnsData = findSelectedColumns(innerObject);
                                    
                                prompt+="1) The "+sourceName;
                                    
                                if(selectedColumnsData) {
                                    prompt+=" as an object and it contains : "
                                    for(let k=0;k<selectedColumnsData.length;k++) {
                                        let name = selectedColumnsData[k].name;
                                        let table = selectedColumnsData[k].key;
                                        prompt+="1."+(k+1)+") "+name+" from "+table+". ";
                                    }
                                }  
                            } else {

                                prompt+=""+(ib+1)+") "   // nesting variables
                                let name = innerObject.name;
                                let column = innerObject.sourceName;
                                let table = innerObject.key; // schema included here
                                prompt+=" "+name+" from "+column+" field of "+table+" table.";
                            }
                        }
                    } else {
                        // only one array or object exist

                        let type = docs[i].data.responseData[j].content.type;
                        if(type=='ezapi_table') {    
                            // get the selected column
                            let sourceName = docs[i].data.responseData[j].content.sourceName;
                            // get the selected column
                            selectedColumnsData = findSelectedColumns(docs[i].data.responseData[j].content);
                            
                                
                            prompt+="1) The "+sourceName;
                                
                            if(selectedColumnsData) {
                                prompt+=" as an object and it contains : "
                                for(let k=0;k<selectedColumnsData.length;k++) {
                                    let name = selectedColumnsData[k].name;
                                    let table = selectedColumnsData[k].key;
                                    prompt+="1."+(k+1)+") "+name+" from "+table+". ";
                                }
                            }  
                        } else {

                            let name = docs[i].data.responseData[j].content.name;
                            let column = docs[i].data.responseData[j].content.sourceName;
                            let table = docs[i].data.responseData[j].content.key; // schema included here
                            prompt+="1) ";
                            prompt+=name+" from "+column+" field of "+table+" table. ";
                        }
                    }
                }  // response data ends

                // Setting filtering conditions
            let tablesRelations = await getTableRelations(projectId);
            let filters = tablesRelations.filters;     
            let filterCount = 1;
            if(filters.length>0){
                // For TPOLICY table under the schema dbo HISTORYFLAG should be equal to 0.
                prompt+=" Consider these filtering conditions for querying : ";
                const tables = filters.reduce((acc, obj) => {
                    const { tableName, ...rest } = obj;
                    if (!acc[tableName]) {
                        acc[tableName] = [];
                    }
                    acc[tableName].push(rest);
                    return acc;
                }, {});

                for (const [tableName, attributes] of Object.entries(tables)) {                    
                    let tableSchemaCompleted = false;                    
                    for (const { schemaName, columnName, filterCondition, value } of attributes) {
                        if(attributes.length==1){
                            prompt+=(filterCount)+") "+"For "+tableName+" table "+"under the schema "+schemaName+" "+columnName+" should be "+(filterCondition=="equals"?"equal":filterCondition)+" to "+value+". ";
                            filterCount++;
                        } else {
                            if(!tableSchemaCompleted){
                                prompt+=(filterCount)+") "+"For "+tableName+" table "+"under the schema "+schemaName+" "+columnName+" should be "+(filterCondition=="equals"?"equal":filterCondition)+" to "+value+" ";
                                tableSchemaCompleted = true;
                                filterCount++;
                            }else{
                                prompt+="and "+columnName+" should be "+(filterCondition=="equals"?"equal":filterCondition)+" to "+value+". ";
                            }
                        }                            
                    }
                }
                prompt+=" "+filterCount+") "+"No filter conditions on other tables.";
            }
            
            if(codegenLang.toLowerCase().includes("python")) {
                prompt+="Also Give me a requirements.txt for all the python libraries used."
            }else if(codegenLang.toLowerCase().includes("node")){
                prompt+="Also Give me a package.json file."
            }
        
            // for mssql db
            prompt = prompt.replace(/sql_server_nvarchar/g, 'NVARCHAR');
            prompt = prompt.replace(/sql_server_varchar/g, 'VARCHAR');
            prompt = prompt.replace(/sql_server_char/g, 'CHAR');
            prompt = prompt.replace(/sql_server_nchar/g, 'NCHAR');
            // for postgreSQL db
            prompt = prompt.replace(/postgres_character/g,'character');
            prompt = prompt.replace(/postgres_text/g,'text');
            prompt = prompt.replace(/postgres_USER-DEFINED/g,'USER-DEFINED');
            prompt = prompt.replace(/postgres_timestamp/g,'timestamp');
            prompt = prompt.replace(/postgres_ARRAY/g,'ARRAY');
            prompt = prompt.replace(/postgres_tsvector/g,'tsvector');

            console.log("Operation prompt done");
            //console.log(prompt);

            const {gencode, errODCdPrmpt} = await ODCodeGenerator(projectId,prompt,modelPrompt)
            if (!gencode) throw errODCdPrmpt;
            console.log("Receive code for app")
            //console.log(gencode)


            // After code is generated , clear both modelprompt and opDataPrompt for new ednpoint prompt
            prompt =  "";
            modelPrompt = "";

            // storing the code in mongo db for sp
            ChatGptGenCode.findOne({ projectId: projectId }, function(err, doc) {
                if (err) throw err;
                    if (doc) {     
                        ChatGptGenCode.findOneAndUpdate(
                                  { projectId : projectId }, 
                                  { $push: { generatedCode : { codeResponse : gencode } } },
                                  {useFindAndModify: false},
                                  function (error, success) {
                                          if (error) {
                                              console.log("error while writing generated code to db")
                                          } else {
                                              console.log("Generated code is stored in db");
                                          }
                                  });
                      } else {
                        ChatGptGenCode.create({projectId:projectId, generatedCode : { codeResponse : gencode }});
                      }
                  }
            )
 
        }
        let responseMsg, errAssrtFile;
        // iterate through generated code for each endpoint and merge
        ChatGptGenCode.findOne({ projectId: projectId }, async function(err, doc) {
            if (err) throw err;
                if (doc) {     
                   // get recently pushed code and handle the file logic
                   let count =0;
                   for(let i=doc.generatedCode.length-1;i>=0 && count < noOfOps;i--){
                        count++;
                        let endPointCode = doc.generatedCode[i].codeResponse;
                        let firstLastIndicator;
                        if(count==1){
                            firstLastIndicator = "FIRST_ENDPOINT";
                        }else if(count==noOfOps){
                            firstLastIndicator = "LAST_ENDPOINT";  
                        }else{
                            firstLastIndicator = "INTERMEDIATE_ENDPOINT";
                        }
                        ({responseMsg,errAssrtFile} = await assortIntoFilesV2(projectId,endPointCode,codegenDb,reqData,firstLastIndicator));   
                   }
                   console.log("count is ",count);
                }
            }
        )
        
        if (!responseMsg) throw errAssrtFile;
        return {responseMsg}
    }catch(errCodeGenV2){
        // no relations , continue
        console.log("errCodeGenV2 : ",errCodeGenV2)
		return {errCodeGenV2};
    }
        
} 
 */

// IGNORE
/*
async function assortIntoFilesMongoV2dd(projectId, genCode, codegenDb, reqData,firstLastIndicator) {
    try {
        let directory = process.env.DIRECTORY_LOCATION+"/"+projectId+"/pythoncode";
        // words that are observed when a codegen fails , keep adding more based on chatgpt response
        let codegenFailMsgs = ['i apologize','unfortunately','as a ai model','unclear','sample implemenatation','sorry']
        let failMsgCount = 0;
      
        for(let f=0;f<codegenFailMsgs.length;f++){
            if(String(genCode).toLowerCase().includes(codegenFailMsgs[f])){
                failMsgCount++;
            }
        }
        let CHAT_GPT_ERROR = "UNEXPECTED_CHATGPT_RESPONSE";
        if(failMsgCount>0){
            return { CHAT_GPT_ERROR };
        }

        // get the number of ```

        const delimiterCount = (genCode.match(/```/g) || []).length;

        if(delimiterCount==4){

            // app code includes model code - 1 block
            // requirement - 1 block

            // regex to get the content between the ```
            const regexInsideDelContent = /```(.*?)```/gs;
            const matches = genCode.matchAll(regexInsideDelContent);

            const contentArray = [];

            for (const match of matches) {
                contentArray.push(match[1].trim());
            }
            

            let appCode = "";
            let reqCode = "";

            if(contentArray[0].length>contentArray[1].length){
                appCode = contentArray[0];
                reqCode = contentArray[1];
            }else{
                appCode = contentArray[1];
                reqCode = contentArray[0];
            }

            // if its a first endpoint code - add everything but remove if __name==main : app.run()
            if(firstLastIndicator=="FIRST_ENDPOINT"){

                // adding app.py file

                // removing app.run() variations
                appCode = appCode.replace(/if __name__ == ['"]__main__['"]:\n\s+app.run\(\)\n?/g, '');
                appCode = appCode.replace(/if __name__ == ['"]__main__['"]:\n\s+app\.run\(debug=True\)\n?/g, '');
                appCode = appCode.replace("python\n","");
                const {finalappCode, errReplaceErr} = replaceDBParams(appCode, reqData, directory)
                if (!finalappCode) throw errReplaceErr;

                if(appCode){
                    writeToFilesV2(directory,"app.py",finalappCode+"\n\n");
                }

                // adding requirements.tx file
                if(reqCode){
                    writeToFilesV2(directory,"requirements.txt",reqCode);
                }
                // keep track of all the modelClass used in the code

                // add env file
                
                let envContent = "DB_USER="+reqData.dbUserName+"\n"+"DB_PASSWORD="+reqData.dbPassword+"\n"+"DB_HOST="+reqData.dbHost+"\n"+"DB_PORTNO="+reqData.dbPort+"\n"+"DB_NAME="+reqData.dbName;
                try{
                    writeToFilesV2(directory,".env",envContent);
                }catch(e){
                    console.log(e);
                }
                console.log("encontent",envContent);
                console.log('diretot',directory)
                
                const modelClassNamesregex =/class\s+(\w+)/

                let match;
                while (match = modelClassNamesregex.exec(genCode)) {
                    modelNames.push(match[1]);
                }

                console.log("del 4 , first endpoint models:")
                console.log(modelNames)
            }
            // intermediate endpoint code - add only model and app code but remove all imports , db and app.run()
            if(firstLastIndicator=="INTERMEDIATE_ENDPOINT"){
                
                const modelClassNamesregex = /class\s+(\w+)/;

                let matchIntermediateModel;
                let modelsIntermediate = []
                while (matchIntermediateModel = modelClassNamesregex.exec(genCode)) {

                    if(!modelNames.includes(matchIntermediateModel[1])){

                        // this array will help which models to add to the app.py
                        modelsIntermediate.push(matchIntermediateModel[1]);

                        // this array will help us to keep track of all the models added to app.py till now
                        modelNames.push(matchIntermediateModel[1]);

                    }
                }

                console.log("del 4 , intermediate endpoint models:")
                console.log(modelNames)

                console.log("del 4 , intermediate, modelsIntermediate")
                console.log(modelsIntermediate)

                    // from gencode , get all the model code for "modelsIntermediate" array and place it in app.py
                    
                    // regex to get only the model code that are in "modelsIntermediate"
                    const regex = new RegExp(`class (${modelsIntermediate.join('|')})\\s*:\\s*([\\s\\S]*?)(?=class|$)`, 'g');

                    let result;
                    while (result = regex.exec(genCode)) { 
                        let modelCode = `class ${result[1]}:${result[2].trim()}\n`;
                        writeToFilesV2(directory,"app.py",modelCode+"\n");

                    }

                    // there will be only one route , get that and add to app code
                    
                    // regex to match from "@app.route" to "if __name__"
                    const routePattern = /@app\.route[\s\S]*?(?=if __name__)/
                    //console.log('gencodeee');
                    //console.log(genCode);
                    const matches = genCode.match(routePattern);
                    const routeCode = matches ? matches[0] : "";
                    writeToFilesV2(directory,"app.py",routeCode+"\n\n");

            }
            // final endpoint code - add model , app code , remove imports but add app.run()
            if(firstLastIndicator=="LAST_ENDPOINT"){
                
                const modelClassNamesregex = /class\s+(\w+)/;

                let matchIntermediateModel;
                let modelsIntermediate = []
                while (matchIntermediateModel = modelClassNamesregex.exec(genCode)) {

                    if(!modelNames.includes(matchIntermediateModel[1])){

                        // this array will help which models to add to the app.py
                        modelsIntermediate.push(matchIntermediateModel[1]);

                        // this array will help us to keep track of all the models added to app.py till now
                        modelNames.push(matchIntermediateModel[1]);

                    }
                }
                    console.log("del 4 , last endpoint models :")
                    console.log(modelNames)
                    console.log("del 4 , intermediate endpoint models : ")
                    console.log(modelsIntermediate);

                    // from gencode , get all the model code for "modelsIntermediate" array and place it in app.py
                    
                    // regex to get only the model code that are in "modelsIntermediate"
                    const regex = new RegExp(`class (${modelsIntermediate.join('|')})\\s*:\\s*([\\s\\S]*?)(?=class|$)`, 'g');

                    let result;
                    while (result = regex.exec(genCode)) {
                        let modelCode = `class ${result[1]}:${result[2].trim()}\n\n`;
                        writeToFilesV2(directory,"app.py",modelCode+"\n");

                    }
                    // there will be one route , get it and paste it to the app code
                    //console.log("genncodee")
                    //console.log(genCode)
                    // regex to match from "@app.route" to "if __name__"
                    const routePattern = /@app\.route[\s\S]*?(?=if __name__)/;
                    const matches = genCode.match(routePattern);
                    let routeCode = matches ? matches[0] : "\n";

                    // adding app.run()
                    routeCode = routeCode + '\n' +
                    "if __name__ == '__main__':\n" +
                    '    app.run(debug=True)';
                    //console.log("route coedeee")
                    //console.log(routeCode);
                    writeToFilesV2(directory,"app.py",routeCode+"\n");

            }

        }else if(delimiterCount==6){

            // model code - 1 block
            // app/endpoint code - 1 block
            // requirement - 1 block

            console.log('del count is 6')
            const regexInsideDelContent = /```(.*?)```/gs;
            const matches = genCode.matchAll(regexInsideDelContent);

            const contentArray = [];

            for (const match of matches) {
                contentArray.push(match[1].trim());
            }

            let appCode = "";
            let modelCode = "";
            let reqCode = "";

            //console.log(contentArray);
            for(let k=0;k<contentArray.length;k++){
                if(contentArray[k].includes("app.route") || contentArray[k].includes("app.run")){
                    appCode = contentArray[k];
                }else if(contentArray[k].includes("db.Model") || contentArray[k].includes("db.model")){
                    modelCode = contentArray[k];
                }else{
                    reqCode = contentArray[k];
                }
            }

            // if its a first endpoint code - add everything but remove if __name==main : app.run()
            if(firstLastIndicator=="FIRST_ENDPOINT"){

                // adding app.py file

                // removing app.run() variations
                appCode = appCode.replace(/if __name__ == ['"]__main__['"]:\n\s+app.run\(\)\n?/g, '');
                appCode = appCode.replace(/if __name__ == ['"]__main__['"]:\n\s+app\.run\(debug=True\)\n?/g, '');
                appCode = appCode.replace("python\n","");

                const {finalappCode, errReplaceErr} = replaceDBParams(appCode, reqData, directory)
                if (!finalappCode) throw errReplaceErr;

                if(finalappCode){
                    writeToFilesV2(directory,"app.py",finalappCode+"\n\n");
                }

                
                // env file
                let envContent = "DB_USER="+reqData.dbUserName+"\n"+"DB_PASSWORD="+reqData.dbPassword+"\n"+"DB_HOST="+reqData.dbHost+"\n"+"DB_PORTNO="+reqData.dbPort+"\n"+"DB_NAME="+reqData.dbName;
                writeToFilesV2(directory,".env",envContent);
                
                // adding req file
                if(reqCode){
                    writeToFilesV2(directory,"requirements.txt",reqCode);
                }
                // keep track of all the modelClass used in the code
                

                const modelClassNamesregex = /class\s+(\w+)/

                let match;
                while (match = modelClassNamesregex.exec(genCode)) {
                    modelNames.push(match[1]);
                } 

                console.log("del 6 , models:")
                console.log(modelNames)

            }
            // intermediate endpoint code - add only model and app code but remove all imports , db and app.run()
            if(firstLastIndicator=="INTERMEDIATE_ENDPOINT"){
                
                const modelClassNamesregex = /(?<=class\s)\w+(?=\s*:)/g;

                let matchIntermediateModel;
                let modelsIntermediate = []
                while (matchIntermediateModel = modelClassNamesregex.exec(genCode)) {

                    if(!modelNames.includes(matchIntermediateModel[1])){

                        // this array will help which models to add to the app.py
                        modelsIntermediate.push(matchIntermediateModel[1]);

                        // this array will help us to keep track of all the models added to app.py till now
                        modelNames.push(matchIntermediateModel[1]);

                    }
                }

                console.log("del 6 , intermediate endpoint , models ")
                console.log(modelNames)

                console.log("del 6 , intermediate models")
                console.log(modelsIntermediate)
                    //console.log("models that needs to be pushed to app code ")
                    //console.log(modelsIntermediate);

                    // from gencode , get all the model code for "modelsIntermediate" array and place it in app.py
                    
                    // regex to get only the model code that are in "modelsIntermediate"
                    const regex = new RegExp(`class (${modelsIntermediate.join('|')})\\(db\\.Model\\):([\\s\\S]*?)(?=class|$)`, 'g');

                    let result;
                    while (result = regex.exec(genCode)) {

                        console.log("code that needs to be appended(excludes previous models) :")
                        let modelCode = `class ${result[1]}(db.Model):${result[2].trim()}\n`;
                        writeToFilesV2(directory,"app.py",modelCode+"\n\n");

                    }

            
                    // below regx failing sometimes - need to fix
                    const routePattern = /(@app\.route[^\n]*\n)([\s\S]*)/
                    //console.log('gencodeee');
                    //console.log(genCode);
                    const matches = appCode.match(routePattern);
                    const routeCode = matches ? matches[0]+"\n" : "\n";
                    writeToFilesV2(directory,"app.py",routeCode+"\n\n");

            }
            // final endpoint code - add model , app code , remove imports but add app.run()
            if(firstLastIndicator=="LAST_ENDPOINT"){
                
                const modelClassNamesregex = /(?<=class\s)\w+(?=\s*:)/g;

                let matchIntermediateModel;
                let modelsIntermediate = []
                while (matchIntermediateModel = modelClassNamesregex.exec(genCode)) {

                    if(!modelNames.includes(matchIntermediateModel[1])){

                        // this array will help which models to add to the app.py
                        modelsIntermediate.push(matchIntermediateModel[1]);

                        // this array will help us to keep track of all the models added to app.py till now
                        modelNames.push(matchIntermediateModel[1]);

                    }
                }
                    console.log("del 6 , last endpint model")
                    console.log(modelNames)
                    console.log("del 6 , intermediate models ")
                    console.log(modelsIntermediate);

                    // from gencode , get all the model code for "modelsIntermediate" array and place it in app.py
                    
                    // regex to get only the model code that are in "modelsIntermediate"
                    const regex = new RegExp(`class (${modelsIntermediate.join('|')})\\(db\\.Model\\):([\\s\\S]*?)(?=class|$)`, 'g');

                    let result;
                    while (result = regex.exec(genCode)) {
                        let modelCode = `class ${result[1]}(db.Model):${result[2].trim()}\n\n`;
                        writeToFilesV2(directory,"app.py",modelCode+"\n\n");

                    }


                    // there will be one route , get it and paste it to the app code
                    //console.log("genncodee")
                    //console.log(genCode)
                    // regex to match from "@app.route" to "if __name__"
                    const routePattern = /@app\.route\('(.*)'\)(.*)/s;
                    const matches = appCode.match(routePattern);
                    let routeCode = matches ? matches[0] : "\n\n";

                    // adding app.run()
                    routeCode = routeCode + '\n' +
                    "if __name__ == '__main__':\n" +
                    '    app.run(debug=True)';
                    console.log("route coedeee")
                    console.log(routeCode);
                    writeToFilesV2(directory,"app.py",routeCode+"\n\n");

            }

        }

        let responseMsg = "success"
        return {responseMsg}
    } catch (errAssrtFile) {
        console.log("errAssrtFile : ",errAssrtFile)
		return {errAssrtFile};
	} 

}
*/




module.exports = {findAttribute, assortIntoFilesV2, assortIntoFilesMongoV2}

