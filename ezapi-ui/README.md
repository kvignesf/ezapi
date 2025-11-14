# EzAPI Designer FrontEnd

This repository contains code for frontend of the EzAPI designer. It's built using ReactJs, TailwindCSS, RecoilJs.

## Prerequisites

1. Node Package Manager (NPM)

## Project Setup

Note: These instructions are for macOS and Linux.

1. Install all the dependencies if not installed:

```bash
npm install
```

2. Populate the .env file having following variables:

   - REACT_APP_API_URL
   - REACT_APP_LINKEDIN_CLIENT_ID
   - REACT_APP_STRIPE_KEY : stripe publish key.

3. Run the application locally

```bash
npm run start
```

Open the browser and go to [http://127.0.0.1:3000/](http://127.0.0.1:3000/). You'll be redirected to default homepage

## Application Components

The entire EzAPI Designer Webapp consists of the following core libraries -

1. [ReactJs](https://reactjs.org)
2. [TailwindCSS](https://tailwindcss.com)
3. [RecoilJs](https://recoiljs.org)
4. [ReactQuery](https://react-query.tanstack.com)
5. [ReactRouter](https://reactrouter.com)

### Folder Structure -

_The whole application is structured as features._

##### Files and folders

```
- /App.jsx - Contains the core component which acts as an entry point of the
application
- /index.jsx - Contains the root component of the application
- /index.css - Contains the common styles used in the application
- /tailwind.config.js - Contains the configuration data required by the
tailwindcss
- /craco.config.js - Contains the configuration data required by the craco.
Craco (https://www.npmjs.com/package/@craco/)
modifies the webpack on the fly without us having to eject the react
application.

- /static/ - This module contains all the assets such as images
- /shared/atom - Contains all the common atoms (https://recoiljs.org/docs/basic-tutorial/atoms)
shared by the features
- /shared/components - Contains all the components shared by the features
- /shared/network/client - Base network client used in the application
- /shared/network/queryClient - Base react-query client used in the
application
- /shared/query - Contains all the queries shared by the features
- /shared/schemas - Contains all the schemas shared by the features
- /shared/colors - Contains all the colors. Note that any change here has to be
updated in /tailwind.config.js
- /shared/constants - Contains all the contants.
- /shared/routes - Contains all the navigatable routes used in the project.
- /shared/routes - Contains all the navigatable routes used in the project.
- /shared/storage - Helper file which contains all the utilities to store and
retreive the key/value pairs.
- /shared/utils - Contains the common utility functions.
- /shared/messages - Contains all the messages used in the application and the
helper functions to generate the appropriate message.

- /AddProject/ - Contains all the related components, queries and atoms required while adding a project.
- /Dashboard/ - Contains all the components related to the common dashboard template used.
- /Landing/ - Contains backup code for the previously used landing page.
- /Login/ - Contains all the related components, queries and atoms required while logging in.
- /ModifyCollaborators/ - Contains all the related components, queries and atoms required while inviting the users to a particular project.
- /ModifyCollaborators/ - Contains all the related components, queries and atoms required while inviting the users to a particular project.
- /Orders/ - Contains all the components, queries and atoms related orders of a particular user.
- /Projects/ - Contains all the related components, queries and atoms required while listing the projects of a particular user.
- /Project/ - Contains all the components, queries and atoms related to a particular project.
- /Project/AttributeDetails - Contains all the related components, queries and atoms required while displaying the details of particular attribute. Shows up when you click a particular attribute in the schema listing.
- /Project/Match - Contains all the related components, queries and atoms required while displaying the Schema/Database/Parameter section.
- /Project/Match - Contains all the related components, queries and atoms required while displaying the Schema/Database/Parameter section.
- /Project/OperationDetails - Contains all the related components, queries and atoms required while displaying the details of a particular operation section.
- /Project/Resources - Contains all the related components, queries and atoms required while displaying the details of a resources section of particular project.
- /Project/SchemaDetails - Contains all the related components, queries and atoms required while displaying the details of a particular schema section.
- /ProjectPayment/ - Contains all the components, queries and atoms related to payment for a particular project.
```
