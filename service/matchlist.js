const colors = require('colors');
const riotAPI = require('../server/riotAPI');
const matchListDAO = require('../persistent/matchlist');

exports.getMatchlist = (accountId, startInfo, limit) => {
  const LIMIT = limit;
  return new Promise((resolve, reject) => {
  
    matchListDAO.findOne({accountId: accountId})
    .then((matchlist) => {

      if(startInfo) {

        // let index = matchlist.matches.findIndex((match) => {
        //   return match.gameId === startInfo; 
        // });

        console.log(colors.magenta(Array.isArray(matchlist.matches)), startInfo);

        let index = null;
        for(let i in matchlist.matches) {
          console.log(matchlist.matches[i].gameId, startInfo, matchlist.matches[i].gameId === parseInt(startInfo), i);
          if(matchlist.matches[i].gameId === parseInt(startInfo)) {
            index = parseInt(i);
            // break;
          }
        }        
        
        if(index) {
          matchlist.matches = matchlist.matches.slice(index + 1, index + 1 + LIMIT); 
          console.log(colors.magenta(index + 1, index + 1 + LIMIT, matchlist.matches.length));
          resolve(matchlist)
        } else {
          console.log(colors.magenta("Save more matches of mathchlist!!!!!!"));
        }

      } else {
        if(matchlist) {
          matchlist.matches = matchlist.matches.slice(0, LIMIT); 
          resolve(matchlist);
        } else {
          resolve(matchlist);
        }
      }

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


exports.renew = (accountId, riotMatchList) => {
  return new Promise((resolve, reject) => {

    matchListDAO.updateOne(accountId, riotMatchList)
    .then((result) => {
      resolve(result);
    })
    .catch((err) => {
      reject(err);
    });
 
  });
}


