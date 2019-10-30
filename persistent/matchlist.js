const colors = require('colors');
const matchlistModel = require('../model/Matchlist');

exports.findOne = (query) => {
  return new Promise((resolve, reject) => {
    matchlistModel.findOne(query, (err, matchlist) => {
      if(err) {
        console.log(color.red(err));
        reject(err);
      }
      resolve(matchlist);
    });
  });
}

exports.save = (riotMatchlist) => {
  return new Promise((resolve, reject) => {

    let matchlist = new matchlistModel({
      accountId: summoner.accountId,
      matches: riotMatchlist.matches,
      totalGames: riotMatchlist.matches.length
    });

    matchlist.save((err, matchlist) => {
      if(err) {
        console.log(color.red(err));
        reject(err);
      }
      resolve(matchlist);
    });

  });
}

exports.updateOne = (accountId, newMatchlist) => {
  return new Promise((resolve, reject) => {
    matchlistModel.updateOne({accountId: accountId}, newMatchlist, (err, result) => {
      if(err) {
        console.log(color.red(err));
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}