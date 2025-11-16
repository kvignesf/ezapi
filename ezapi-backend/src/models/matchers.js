const mongoose = require('mongoose');

//pre existing collection
const matcherSchema = new mongoose.Schema({}, { strict: false });
const Matcher = mongoose.model('Matcher', matcherSchema, 'matcher');

module.exports = Matcher;
