const mongoose = require('mongoose');

//pre existing collection
const masterSchema = new mongoose.Schema({}, { strict: false });
const Master = mongoose.model('master', masterSchema, 'master');

module.exports = Master;
