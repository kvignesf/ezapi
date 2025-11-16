const mongoose = require('mongoose');

//pre existing collection
const genspecSchema = new mongoose.Schema({}, { strict: false });
const genspec = mongoose.model('genspec', genspecSchema, 'genspec');

module.exports = genspec;
