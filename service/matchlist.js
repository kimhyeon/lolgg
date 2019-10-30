const colors = require('colors');
const riotAPI = require('../server/riotAPI');
const matchListDAO = require('../persistent/matchlist');

exports.getMatchlist = (accountId) => {
  return new Promise((resolve, reject) => {
  
    matchListDAO.findOne({accountId: accountId})
    .then((matchlist) => {
      console.log(colors.magenta(matchlist));
      resolve(matchlist);
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
      matchListDAO.save(accountId, matchList)
      .then((matchList) => {
        console.log(colors.green("mongodb : matchList SAVE-OK"));
        resolve(matchList);
      })
      .catch((err) => {
        console.log(colors.red("mongodb : matchList SAVE-FAIL"));
        reject(err);
      });
    })
    .catch((err) => {
      reject(err);
    });
    
  });
}