const mongoose = require('mongoose');

//pre existing collection
const schSchema = new mongoose.Schema({}, { strict: false });
const SchemaData = mongoose.model('Schema', schSchema, 'schemas');

module.exports = SchemaData;
