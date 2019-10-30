const colors = require('colors');
const riotAPI = require('../server/riotAPI');
const matchListDAO = require('../persistent/matchlist');

exports.getMatchlist = (accountId) => {
  return new Promise((reesolve, reject) => {
  
    matchListDAO.findOne({accountId: accountId})
    .then((matchlist) => {
      console.log(colors.bgMagenta(matchlist));
      reesolve(matchlist);
    })
    .catch((err) => {
      reject(err);
    });
  
  });
}

exports.saveRiotMatchlist = (accountId) => {
  return new Promise((resolve, reject) => {

    riotAPI.getMatchlistsByAccount(accountId)
    .then((matchList) => {
      matchListDAO.save(matchList)
      .then((matchList) => {
        console.log(colors.green("matchList SAVE-OK"));
        resolve(matchList);
      })
      .catch((err) => {
        reject(err);
      });
    })
    .catch((err) => {
      reject(err);
    });
    
  });
}