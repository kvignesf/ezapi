const mongoose = require('mongoose');

//pre existing collection
const virtualSchema = new mongoose.Schema({}, { strict: false, minimize: false });
const virtual = mongoose.model('virtual', virtualSchema, 'virtual');

module.exports = virtual;
