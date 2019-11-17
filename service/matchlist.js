const colors = require('colors');
const riotAPI = require('../server/riotAPI');
const matchListDAO = require('../persistent/matchlist');

getAllMatchlist = (accountId) => {
  return new Promise((resolve, reject) => {
    matchListDAO.findOne({accountId: accountId})
    .then((matchlist) => {
      resolve(matchlist);
    })
    .catch((err) => {
      reject(err);
    });
  });
}
exports.getAllMatchlist = getAllMatchlist;

exports.getMatchlist = (accountId, startInfo, limit) => {
  let LIMIT = limit;
    LIMIT = (!LIMIT) ? 10 : limit;

  return new Promise((resolve, reject) => {
  
    matchListDAO.findOne({accountId: accountId})
    .then((matchlist) => {

      if(startInfo) {

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
          
          if(index + 1 > matchlist.matches.length) {
            console.log("need to get past matchlists!!");
            resolve(null);
          }
          
          resolve(matchlist);

        } else {
          console.log(colors.error("INDEX CAN'NOT BE NULL!!"));
          reject("INDEX CAN'NOT BE NULL!!");
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

exports.saveRiotMatchlistOfPast20weeks = (accountId, startTimestampInfo) => {
  return new Promise((resolve, reject) => {
    
    (async() => {

      try {
        let timestampInfo = startTimestampInfo,
          oneWeekMillisecond = 604800000,
          pastMatchlist = [];
  
        for(let i = 0; i < 20; i++) {
          let riotMatchlist = await riotAPI.getMatchlistsByAccount(accountId, timestampInfo);
          if(riotMatchlist) {
            pastMatchlist =  pastMatchlist.concat(riotMatchlist.matches);
            console.log(pastMatchlist.length, riotMatchlist.matches.length, Array.isArray(riotMatchlist.matches));
          } 
          timestampInfo = timestampInfo - oneWeekMillisecond;
        }
      
        
        let dbMatchlist = await getAllMatchlist(accountId);
        dbMatchlist.matches = dbMatchlist.matches.concat(pastMatchlist);
        console.log(dbMatchlist.matches.length);
        
        // update matchlist matches...
        matchListDAO.updateOne(accountId, dbMatchlist);
          
      } catch (error) {
        
      }

    })();
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


