const mongoose = require('mongoose');

var Matchlist = new mongoose.Schema({
  accountId: String,
  matches: Array,
  totalGames: Number
});

module.exports = mongoose.model('matchlist', Matchlist);