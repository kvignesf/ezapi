const mongoose = require('mongoose');

//pre existing collection
const sankeySchema = new mongoose.Schema({}, { strict: false, minimize: false });
const sankey = mongoose.model('sankey', sankeySchema, 'sankey');

module.exports = sankey;
