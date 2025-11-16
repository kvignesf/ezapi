require('dotenv').config();
const express = require('express');

//routes
const PROJECTNAME = require('./routes/PROJECTNAME');

const app = express();
app.use(express.json());

app.use(PROJECTNAME);

//PORT

const PORT = process.env.PORT || 4000;
app.listen(PORT, console.log(`Server is running on port ${PORT}`));
