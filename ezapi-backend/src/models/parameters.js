const mongoose = require('mongoose');

//pre existing collection
const parametersSchema = new mongoose.Schema({}, { strict: false });
const Parameters = mongoose.model('Parameters', parametersSchema, 'parameters');

// parameters;
module.exports = Parameters;
