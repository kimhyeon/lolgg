const mongoose = require('mongoose');

var Static = new mongoose.Schema({
  type: String,
  version: String,
  data: Object
});

module.exports = mongoose.model('static', Static);