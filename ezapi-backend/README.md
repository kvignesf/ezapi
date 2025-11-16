# EZAPI Designer Backend

EZAPI Designer Backend is a Node.js application which communicates with UI and APIOPS Model (Python). The APIs are frontend facing and are used for any communication with the frontend. The application also communicates with stripe to initiate payments.

## Prerequisites

1. Nodejs (v12.16.3)
2. MongoDB
3. Mongo Tools (mongodump)
4. NPM or Yarn

## Initial Setup

You may need to open multiple bash/command line/terminal windows to run all the commands listed below.

1.  Install the dependency

        npm install, or
        yarn install

2.  MongoDB if running locally

3.  Start the server

        npm start, or
        yarn start

Open your browser and browse to [http://127.0.0.1:7744](http://127.0.0.1:7744). You will see a default homepage

## Environment Variables

1. FILE_UPLOAD_PATH : Path for folder where project related files are uploaded.
2. DUMP_PATH : Path where temporary files are created.
3. REDIRECT_URI : URL where the app should navigate after LinkedIn sign in.
4. CLIENT_ID : LinkedIn clientId can be obtained from dashboard, required for LinkedIn OAuth.
5. CLIENT_SECRET : LinkedIn client secret, required for LinkedIn OAuth.
6. MONGO_CONNECTION : Mongo URL for connecting to DB.
7. STRIPE_LIVE_SECRET_KEY : Stripe secret key required for stripe to authenticate stripe API requests.
8. STRIPE_PAYMENT_WEBHOOK : Stripe webhook secret which is required to listen to stripe payment events (such as payment success or failure) triggered from stripe webhhook.
9. MAILGUN_DOMAIN : Domain that is registered and verified in Mailgun dashboard.
10. MAILGUN_API_KEY : This API key is required for Mailgun to verify that the app trying to talk to Mailgun servers is truly your application.
11. AI_SERVER_URL : URL for ML server (Python) where the parsing and generator process is carried out.
12. FREEPROJECTS_LIMIT : no of free projects limit provided to each user. Default:999 for all lower env and 3 for prod
13. MEMBERS_LIMIT : no of members limit for each project. Default: 6
14. PUBLISH_LIMIT : no of publish actions allowed for a user across projects. Default: 11

## Design Principal

The EZAPI Designer Backend application uses express application framework and route mechanism, it also uses mongoose ODM which allows to define models schema structure.

1. models - All schema definitions.
2. routes - All the routes are defined.
3. controllers - All the controller functions are defined. Each route file has it's own controller file.
4. middlewares - Middleware function to run before running the controller.

## APIs

`GET` **/project** - This returns list of all projects belonging to the user.

`GET` **/project/:projectId** - This returns project data for a particular project based on projectId passed as parameter.

`POST` **/project** - This is used to create a new project with basic details like project name and list of emails to be invited.

`POST` **/projects/:projectId/uploads** - This is used to upload and parse Spec and DB file for a project.

`POST` **/aiMatcher** : This is used to call matcher API in python server, which creats match data after parsing of spec and DB file.

`PATCH` **/project/:projectId/update** : This is used to update project name, or invite/remove collaborators.

`DELETE` **/project/:projectId** : This is used to soft delete a project.

`POST` **/invite_collabrator** : This is used to invite new members to the project.

`POST` **/projectValidate** : This is used to validates and check if project data is ready to be published.

`POST` **/publish** : This is used to publish a project.

> Publishing a project involves following steps:
>
> -   Checks if user can carry out publishing based on if project is paid or freemium.
> -   If user has free publish trials left project plan becomes free
> -   Once project is publishable it internally calling the generator APIs.

`GET` **/resources/:resourceId** : This is used to retrieve resource and data like path and operations defined in that resource.

`POST` **/resources** : This is used to add a new resource to the project.

`PATCH` **/resources/:resourceId/rename** : This is used to rename a resource.

`POST` **/project/:projectId/resources/:resourceId** : This is used to delete a resource and related paths, operations and operations data.

`PATCH` **/path/add** : This is used to add a new path to the resource.

`PATCH` **/path/delete** : This is used to delete a path, related operations and operations data.

`PATCH` **/operation/add** : This is used to add a new operation in a path.

`PATCH` **/operation/edit/:id** : This is used to edit operation details like name, method or description.

`PATCH` **/operation/delete/:id** : This is used to delete an operation and related operation data.

`POST` **/operationData/sinkRequest/:operationId** : This is used to sync up current state of request data for an operation in DB to frontend.

`POST` **/operationData/sinkResponse/:operationId** : This is used to sync up current state of response data for an operation in DB to frontend.

`POST` **/operationData/request/:operationId** : This is used to retrieve request data got an operation.

`POST` **/operationData/response/:operationId** : This is used to retrieve response data got an operation.

`GET` **/projectParams/get/:projectId** : This is used to retrieved all custom parameters for a project.

`POST` **/projectParams/add** : This is used to add a custom parameter to a project.

`PATCH` **/projectParams/delete** : This is used to remove a custom parameter from a project.

`PATCH` **/projectParams/edit** : This is used to edit a custom parameter in a project.

`POST` **/schemasList** : This is used to retrieve list of the all schema belonging to a project.

`POST` **/subSchemaData** : This is used to retrieve data for particular sub schema belonging to a project.

`POST` **/tablesData** : This is used to retrieve tables-column data for all the tables in a DB only project.

`POST` **/tablesLookup** : This is used to retrieve all tables-column data required for lookup.

`POST` **/recommendations** : This is used to retrieve all matching tables-column data for a particular attribute in a schema.

`POST` **/schemaRecommendations** : This is used to retrieve all matching tables-column data for each attributes in a schema.

`POST` **/overrideAttrMatch** : This is used to override the tables-column match for a attribute.

`POST` **/overrideSchemaMatch** : This is used to override tables-column match multiple attributes in a schema.

`POST` **/download_spec** : This is used to download the generated spec file after project publish is completed.

`POST` **/download_apiops** : This is used to download the generated artifacts file after project publish is completed.

`POST` **/download_codegen** :

`GET` **/products** : This is used to retrieve all the active purchasable plans/products data.

`GET` **/product/basic** : This is used to retrieve active basic plan/product data that a user can purchase to publish a project.

`GET` **/orders** : This is used to retrieve all project purchase orders made by a user.

`POST` **/initiate-order** : This is used to initiate an order and create a Stripe payment intent, using which user can make a purchase.

`POST` **/billing-details** : This is used to retrieve the billing details for that was provided by the user while making payment for an order.

`POST` **/update-order** : This is used to listen to event like payment success or failure for any order. This API will be triggered from Stripe's web hook.

Note: Stage now points to demo-1
