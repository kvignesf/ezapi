const mongoose = require('mongoose');

//pre existing collection
const virtualSimSchema = new mongoose.Schema({}, { strict: false, minimize: false });
const VirtualSim = mongoose.model('virtual_sim', virtualSimSchema, 'virtual_sim');

module.exports = VirtualSim;
