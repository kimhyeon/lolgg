const colors = require('colors');
const matchlistModel = require('../model/Matchlist');

exports.findOne = (query) => {
  return new Promise((resolve, reject) => {
    matchlistModel.findOne(query, (err, matchlist) => {
      if(err) {
        reject(err);
      }
      resolve(matchlist);
    });
  });
}

exports.save = (accountId, matches) => {
  return new Promise((resolve, reject) => {

    let matchlist = new matchlistModel({
      accountId: accountId,
      matches: matches,
      totalGames: matches.length
    });

    matchlist.save((err, matchlist) => {
      if(err) {
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
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

exports.getMathListOfQueue = (accountId, queue) => {
  return new Promise((resolve, reject) => {
    matchlistModel.aggregate([ 
      { $match: {accountId: accountId} }, 
      { $project: { 
          accountId: 1,
          matches: { 
            $filter: { input: "$matches", as: "match", cond: { $eq: ["$$match.queue", queue] } }
          }
        }
      } 
    ], (err, result) => {
      if(err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}
