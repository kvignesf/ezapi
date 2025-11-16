const mongoose = require('mongoose');

//pre existing collection
const testcasesSchema = new mongoose.Schema({}, { strict: false, minimize: false });
const testcases = mongoose.model('testcases', testcasesSchema, 'testcases');

module.exports = testcases;
