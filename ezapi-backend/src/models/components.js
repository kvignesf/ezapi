const mongoose = require('mongoose');

//pre existing collection
const componentsSchema = new mongoose.Schema({}, { strict: false });
const Components = mongoose.model('Components', componentsSchema, 'components');

module.exports = Components;
