const mongoose = require('mongoose');

var Matchlist = new mongoose.Schema({
  accountId: String,
  matches: Array,
  totalGames: Number,
  startIndex: Number,
  endIndex: Number
}, {
  collection: 'matchlist'
});

module.exports = mongoose.model('matchlist', Matchlist);