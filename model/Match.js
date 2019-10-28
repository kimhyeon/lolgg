const mongoose = require('mongoose');

var Matchlist = new mongoose.Schema({
  seasonId: Number,
  queueId: Number,
  participantIdentities: Array

  // accountId: String,
  // matches: Array,
  // totalGames: Number,
  // startIndex: Number,
  // endIndex: Number
});

module.exports = mongoose.model('matchlist', Matchlist);