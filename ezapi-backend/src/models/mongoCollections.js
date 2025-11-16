const mongoose = require('mongoose');

//pre existing collection
const mongoCollSchema = new mongoose.Schema({}, { strict: false });
const mongoCollections = mongoose.model('mongo_collections', mongoCollSchema, 'mongo_collections');

module.exports = mongoCollections;
