const mongoose = require('mongoose');

var Match = new mongoose.Schema({
  seasonId: Number,
  queueId: Number,
  gameId: Number,
  participantIdentities: Array,
  gameVersion: String,
  platformId: String,
  gameMode: String,
  mapId: Number,
  gameType: String,
  teams: Array,
  participants: Array,
  gameDuration: Number,
  gameCreation: Number
});

module.exports = mongoose.model('match', Match);