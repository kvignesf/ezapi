const mongoose = require('mongoose');

//pre existing collection
const test_resultSchema = new mongoose.Schema({}, { strict: false, minimize: false });
const test_result = mongoose.model('test_result', test_resultSchema, 'test_result');

module.exports = test_result;