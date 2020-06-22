const colors = require('colors');
const summonerModel = require('../model/Summoner');

exports.findOne = query => {
  return new Promise((resolve, reject) => {
    summonerModel.findOne(query, (err, summoner) => {
      if (err) {
        reject(err);
      } else {
        resolve(summoner);
      }
    });
  });
};

exports.save = (summoner, leagueEntries) => {
  let tier = '';
  leagueEntries.forEach(leagueEntrie => {
    if (leagueEntrie.queueType === 'RANKED_SOLO_5x5') {
      tier = leagueEntrie.tier.toLocaleLowerCase();
    }
  });

  let newSummoner = new summonerModel({
    profileIconId: summoner.profileIconId,
    name: summoner.name.trim(),
    puuid: summoner.puuid,
    summonerLevel: summoner.summonerLevel,
    accountId: summoner.accountId,
    id: summoner.id,
    revisionDate: summoner.revisionDate,

    tier: tier,
    leagueEntries: leagueEntries,
    upperCaseName: summoner.name.trim().toUpperCase()
  });

  return new Promise((resolve, reject) => {
    newSummoner.save((err, summoner) => {
      if (err) return console.error(err);
      console.log(colors.blue(summoner));

      if (err) {
        console.log(colors.red(err));
        reject(err);
      } else {
        resolve(summoner);
      }
    });
  });
};

exports.updateOne = (accountId, summoner) => {
  let tier = '';
  summoner.leagueEntries.forEach(leagueEntrie => {
    if (leagueEntrie.queueType === 'RANKED_SOLO_5x5') {
      tier = leagueEntrie.tier.toLocaleLowerCase();
    }
  });
  summoner['tier'] = tier;

  return new Promise((resolve, reject) => {
    summonerModel.updateOne({ accountId: accountId }, summoner, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

exports.find = (query, projection) => {
  return new Promise((resolve, reject) => {
    summonerModel.find(query, null, projection, (err, summoner) => {
      if (err) {
        reject(err);
      } else {
        resolve(summoner);
      }
    });
  });
};
