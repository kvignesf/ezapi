// **********copyright info*****************************************
// This code is copyright of EZAPI LLC. For further info, reach out to rams@ezapi.ai
// *****************************************************************

const dotenv = require('dotenv');
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

const dbConnect = require('./db/mongoose');
const Projects = require('./models/projects');
const AggregateMetadata = require('./models/aggregateMetadata');

const socketServer = require('http').createServer(app);
const io = require('socket.io')(socketServer);

dbConnect();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '200mb' }));

/*  Use JSON parser for all non-webhook routes
 Do not parse request body for '/update-order',
 because we are listening to stripe webhook inside and stripe require raw body
 https://github.com/stripe/stripe-node#webhook-signing */

app.use((req, res, next) => {
	if (req.originalUrl === '/webhook') {
		next();
	} else {
		express.json({ limit: '200mb' })(req, res, next);
	}
});

const projectsRouter = require('./routes/projects');
const resourcesRouter = require('./routes/resources');
const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const schemaRouter = require('./routes/schemas');
const parametersRouter = require('./routes/parameters');
const operationDataRouter = require('./routes/operationData');
const aiServerRouter = require('./routes/aiServerRoutes');
const projectParamsRouter = require('./routes/projectParams');
const recommendationsRouter = require('./routes/recommendations');
const tablesRouter = require('./routes/tablesData');
const userOvrrdMatchRouter = require('./routes/userOvrrdMatch');
const dataTypesRouter = require('./routes/dataTypes');
const downloadRouter = require('./routes/downloadRoute');
const projectValidateRouter = require('./routes/validateProject');
const ordersRouter = require('./routes/orders');
const dbconnect = require('./routes/dbconnect');
const uploadToGCP = require('./routes/uploadToGCP');
const productVideosRouter = require('./routes/productVideos');
const customParametersRouter = require('./routes/customParameter');
const storedProceduresRouter = require('./routes/storedProcedures');
const simulateRouter = require('./routes/simulate');
const githubRouter = require('./routes/githubPush');
const aggregateCardsRouter = require('./routes/aggregateCards');
const aggregateMappingsRouter = require('./routes/aggregateMappings');
const aggregateMetaDataRouter = require('./routes/aggregateMetadata');
const aggregateResponseMappingRouter = require('./routes/aggregateResponseMappings');
const chatGptCodeGenRouter = require('./routes/chatGptCodeGen');
const nodeCodeGenRouter = require('./routes/nodeCodeGen');
const apiSprawl = require('./routes/apiSprawl');
const rawExpressionParseRouter = require('./routes/rawExpressionParse');
const directory = require('./routes/collectionDirectory');
const collectionsRequest = require('./routes/collectionsRequest');
const proxyRouter = require('./routes/tpprxy');
const aggregateCodeGenRouter = require('./routes/aggregateCodeGen');
const settingsRouter = require('./routes/settings');
//router
app.use(projectsRouter);
app.use(userRouter);
app.use(authRouter);
app.use(resourcesRouter);
app.use(schemaRouter);
app.use(parametersRouter);
app.use(operationDataRouter);
app.use(aiServerRouter);
app.use(projectParamsRouter);
app.use(recommendationsRouter);
app.use(tablesRouter);
app.use(userOvrrdMatchRouter);
app.use(dataTypesRouter);
app.use(downloadRouter);
app.use(projectValidateRouter);
app.use(ordersRouter);
app.use(dbconnect);
app.use(uploadToGCP);
app.use(productVideosRouter);
app.use(customParametersRouter);
app.use(storedProceduresRouter);
app.use(simulateRouter);
app.use(githubRouter);
app.use(aggregateCardsRouter);
app.use(aggregateMappingsRouter);
app.use(aggregateMetaDataRouter);
app.use(aggregateResponseMappingRouter);
app.use(chatGptCodeGenRouter);
app.use(nodeCodeGenRouter);
app.use(apiSprawl);
app.use(rawExpressionParseRouter);
app.use(directory);
app.use(collectionsRequest);
app.use(proxyRouter);
app.use(aggregateCodeGenRouter);
app.use(settingsRouter);

const linkedinMiddleware = require('./authentication/validateLinkedinToken');
const authorizationMiddleware = require('./authentication/authentication');
//app.use(linkedinMiddleware)
//app.use(authorizationMiddleware)

app.use(require('./routes/uploadfile'));
app.use(require('./routes/sankeydata'));
app.use(require('./routes/testdata'));
app.use(require('./routes/uploadHistory'));
app.use(require('./routes/virtualdata'));
app.use(require('./routes/downloadFile'));
app.use(require('./routes/testResult'));

app.use((err, req, res, next) => {
	if (res.headersSent) {
		return next(err);
	}
	res.status(500).json({ error: err.toString() });
});

socketServer.setTimeout(8 * 60 * 1000); // 10 * 60 seconds * 1000 msecs

socketServer.listen(7744, function () {
	console.log('Listening on port ' + socketServer.address().port);
});

function getKeyByValue(object, value) {
	return Object.keys(object).find((key) => object[key] === value);
}
//Socket related logic for event based handling

async function EmitEventsfromMongo() {
	try {
		Projects.watch({ fullDocument: 'updateLookup' }).on('change', (change) => {
			//console.log("change..", change)

			// This is to keep track of events emitted based on the timestamp
			if (
				change &&
				(change.operationType === 'update' || change.operationType === 'replace')
			) {
				//n = n+1;
				//console.log('change operation...:', change.operationType);
				//console.log("change...",change)
				let updatedProjId = change.fullDocument.projectId;
				let updatedAuthor = change.fullDocument.author;

				//if updatedAuthor === usr.user
				if (change.updateDescription && change.updateDescription.updatedFields) {
					if (typeof change.updateDescription.updatedFields.githubCommit != 'undefined') {
						// github status changed
						//console.log("githubTimestamps1...",githubTimestamps)
						if (!githubTimestamps.includes(change.clusterTime.high_)) {
							// second one is just a param to access from react
							if (updatedProjId && updatedAuthor) {
								nsp.to(listOfClients[updatedAuthor]).emit(
									'githubEvent',
									'githubEvent'
								);
							} // when event is emitted, mark it as emitted by pushing into array to avoid duplication of events
							githubTimestamps.push(change.clusterTime.high_);
							//console.log("githubTimestamps2...",githubTimestamps)
						}
					}
					if (typeof change.updateDescription.updatedFields.status != 'undefined') {
						// project status changed
						//console.log("statusTimestamps1...",statusTimestamps)
						if (!statusTimestamps.includes(change.clusterTime.high_)) {
							if (updatedProjId && updatedAuthor) {
								nsp.to(listOfClients[updatedAuthor]).emit(
									'projectStatusEvent',
									'projectStatusEvent'
								);
							}
							statusTimestamps.push(change.clusterTime.high_);
							//console.log("statusTimestamps2...",statusTimestamps)
						}
					}

					if (typeof change.updateDescription.updatedFields.codegen != 'undefined') {
						// codegen status changed
						//console.log("javaTimestamps1...",javaTimestamps)
						if (!javaTimestamps.includes(change.clusterTime.high_)) {
							if (updatedProjId && updatedAuthor) {
								nsp.to(listOfClients[updatedAuthor]).emit(
									'codegenEvent',
									'codegenEvent'
								);
							}
							javaTimestamps.push(change.clusterTime.high_);
							//console.log("javaTimestamps2...",javaTimestamps)
						}
					}

					if (
						typeof change.updateDescription.updatedFields.dotnetcodegen != 'undefined'
					) {
						// dotnetcodegen status changed
						if (!dotnetTimestamps.includes(change.clusterTime.high_)) {
							if (updatedProjId && updatedAuthor) {
								nsp.to(listOfClients[updatedAuthor]).emit(
									'dotnetcodegenEvent',
									'dotnetcodegenEvent'
								);
							}
							dotnetTimestamps.push(change.clusterTime.high_);
						}
					}

					if (
						typeof change.updateDescription.updatedFields.pythoncodegen != 'undefined'
					) {
						// pythoncodegen status changed
						if (!pythonTimestamps.includes(change.clusterTime.high_)) {
							if (updatedProjId && updatedAuthor) {
								nsp.to(listOfClients[updatedAuthor]).emit(
									'pythoncodegenEvent',
									'pythoncodegenEvent'
								);
							}
							pythonTimestamps.push(change.clusterTime.high_);
						}
					}

					if (typeof change.updateDescription.updatedFields.nodecodegen != 'undefined') {
						// nodecodegen status changed
						if (!nodeTimestamps.includes(change.clusterTime.high_)) {
							if (updatedProjId && updatedAuthor) {
								nsp.to(listOfClients[updatedAuthor]).emit(
									'nodecodegenEvent',
									'nodecodegenEvent'
								);
							}
							nodeTimestamps.push(change.clusterTime.high_);
						}
					}

					if (githubTimestamps.length >= 100) {
						githubTimestamps = [];
					}
					if (statusTimestamps.length >= 100) {
						statusTimestamps = [];
					}
					if (dotnetTimestamps.length >= 100) {
						dotnetTimestamps = [];
					}
					if (javaTimestamps.length >= 100) {
						javaTimestamps = [];
					}
					if (pythonTimestamps.length >= 100) {
						pythonTimestamps = [];
					}
				}
			}
		});
	} catch (error) {
		console.log('SOCKET ERR :' + error);
	}
}
let listOfClients = {};
// to handle CORS
io.use((socket, next) => {
	socket.request.headers['Access-Control-Allow-Origin'] = '*';
	next();
});
var nsp = io.of('/socket.io/');

let githubTimestamps = [];
let statusTimestamps = [];
let dotnetTimestamps = [];
let javaTimestamps = [];
let pythonTimestamps = [];
let nodeTimestamps = [];

app.locals = {
	io: nsp,
	listOfClients
};
nsp.on('connection', (socket) => {
	socket.on('userConnected', (usr) => {
		//socket.setTimeout(1000 * 60 * 20);
		console.log('user connected is ..' + usr.user, socket.id);
		listOfClients[usr.user] = socket.id;
		console.log('listOfClients..', listOfClients);
	});

	socket.on('disconnect', function () {
		socket.disconnect();
		let usrid = getKeyByValue(listOfClients, socket.id);
		//console.log("usrid...",usrid)
		delete listOfClients[usrid];
		console.log('listOfClients after disonnct..', listOfClients);
		githubTimestamps = [];
		statusTimestamps = [];
		dotnetTimestamps = [];
		javaTimestamps = [];
		pythonTimestamps = [];
	});

	socket.on('aggregateMetadata', async (data) => {
		const { operationId, projectId, nodes, edges } = data;
		await AggregateMetadata.findOneAndUpdate(
			{
				operationId,
				projectId
			},
			{
				$set: {
					nodes,
					edges
				}
			},
			{ upsert: true, new: true, returnDocument: 'after' }
		);
	});

	socket.on('forceDisconnect', function (usr) {
		socket.disconnect();
		delete listOfClients[usr.user];
		console.log('listOfClients after disonnct..', listOfClients);
		githubTimestamps = [];
		statusTimestamps = [];
		dotnetTimestamps = [];
		javaTimestamps = [];
		pythonTimestamps = [];
	});
});

EmitEventsfromMongo();
//experimental
// server.keepAliveTimeout = 71 * 1000;
// server.headersTimeout = 75 * 1000; // This should be bigger than `keepAliveTimeout + your server's expected response time`
