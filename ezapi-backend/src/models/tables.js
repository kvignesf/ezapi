const mongoose = require('mongoose');

//pre existing collection
const tablesSchema = new mongoose.Schema({}, { strict: false });
const tablesData = mongoose.model('Tables', tablesSchema, 'tables');

module.exports = tablesData;
