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

exports.getMore20Matchlist = (accountId, startInfo) => {
  return new Promise((resolve, reject) => {
    
    (async() => {
      let dbMatchlist = await getAllMatchlist(accountId);

      let matches = dbMatchlist.matches,
        startIndex = null;
      
      for(let i = 0; i < matches.length; i++) {
        if(matches[i].gameId == startInfo) {
          startIndex = i + 1;
          break;
        }  
      }

      console.log(colors.magenta(`${startInfo} ${startIndex}`), matches.slice(startIndex, startIndex + 20));

      resolve(matches.slice(startIndex, startIndex + 20));

    })();

  });
}

exports.saveFirstRiotMatchlist = (accountId) => {
  return new Promise((resolve, reject) => {

    (async() => {
      let current = new Date().getTime(),
        fiveMonthMillisecond = 5 * 2592000000,
        diff = current - fiveMonthMillisecond,
        beginIndex = 0,
        needToGet = true,
        matchList = [];

        while(needToGet) {
          try {

            let paramString = `&beginIndex=${beginIndex}`;
            let riotMatchList = await riotAPI.getMathList(accountId, paramString);

            if(riotMatchList) {
              let matches = riotMatchList.matches;
              
              for(let i = 0; i < matches.length; i++) {
                if (matches[i].timestamp < diff) {
                  matches = matches.slice(0, i);
                  needToGet = false;
                }
              }

              if(needToGet) {
                beginIndex += 100;
              }
              matchList = matchList.concat(matches);
            } else {
              needToGet = false;
            }
          } catch(error) {
            console.log("ERROR");
            needToGet = false;
          }

        }

        if(!!matchList.length) {
          try {
            let list = await matchListDAO.save(accountId, matchList);
            list.matches = list.matches.slice(0, 20);
            resolve(list);
          } catch(error) {
            console.log(colors.red("mongodb : matchList SAVE-FAIL"));
            reject(error);
          }
        }

    })();
    
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
            pastMatchlist = pastMatchlist.concat(riotMatchlist.matches);
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
        console.log("error");
      }

    })();
  });
}

exports.renew = (accountId) => {

  return new Promise((resolve, reject) => {

    (async() => {

      let dbMatchlist = await matchListDAO.findOne({accountId: accountId})
        current = dbMatchlist.matches[0].timestamp,
        beginIndex = 0,
        needToGet = true,
        matchList = [];

      while(needToGet) {

        try {

          let paramString = `&beginIndex=${beginIndex}`;
          let riotMatchList = await riotAPI.getMathList(accountId, paramString);

          if(riotMatchList) {
            let matches = riotMatchList.matches;
            
            for(let i = 0; i < matches.length; i++) {
              if (matches[i].timestamp === current) {
                matches = matches.slice(0, i);
                needToGet = false;
              }
            }

            if(needToGet) {
              beginIndex += 100;
            }
            matchList = matchList.concat(matches);
          } else {
            needToGet = false;
          }
        } catch(error) {
          console.log("ERROR");
          needToGet = false;
        }
      
      }
      
      dbMatchlist.matches = matchList.concat(dbMatchlist.matches);
      dbMatchlist.totalGames = dbMatchlist.matches.length;

      matchListDAO.updateOne(accountId, dbMatchlist)
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
    
    })();
 
  });

}


