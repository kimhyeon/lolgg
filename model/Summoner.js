const mongoose = require('mongoose');

var Summoner = new mongoose.Schema({
    profileIconId: Number,
    name: String,    
    puuid: String,
    summonerLevel: Number,
    accountId: String,
    id: String,
    revisionDate: Number,

    leagueEntries: Array,
    upperCaseName: String
});

module.exports = mongoose.model('summoner', Summoner);