const mongoose = require('mongoose');

//pre existing collection
const dbDataSchema = new mongoose.Schema({}, { strict: false, minimize: false });
const dbdata = mongoose.model('dbdata', dbDataSchema, 'dbdata');

module.exports = dbdata;
