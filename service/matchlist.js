const colors = require('colors');
const riotAPI = require('../server/riotAPI');
const matchListDAO = require('../persistent/matchlist');

let getAllMatchlist = (accountId) => {
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

exports.get20Matchlist = (accountId, startInfo, type) => {
  
  let queue = {
    solorank: 420,
    normal: 430,
    flexrank: 440,
    aram: 450,
    event: 900 // URF
  }
  
  return new Promise((resolve, reject) => {
    
    (async() => {
      //let dbMatchlist = await getAllMatchlist(accountId);
      let dbMatchlist = null,
        matches = null;
      
      if(type === "total") {
        dbMatchlist = await getAllMatchlist(accountId);
        matches = dbMatchlist.matches;
      } else {
        dbMatchlist = await matchListDAO.getMathListOfQueue(accountId, queue[type]);
        matches = dbMatchlist[0].matches;
        console.warn(colors.cyan(`${queue[type]} ${dbMatchlist.length} ${dbMatchlist[0].matches.length}`));
      }
      
      if(parseInt(startInfo) !== 0) {
        let startIndex = null;
        for(let i = 0; i < matches.length; i++) {
          if(matches[i].gameId == startInfo) {
            startIndex = i + 1;
            break;
          }  
        }
        console.log(colors.magenta(`${startInfo} ${startIndex}`), matches.slice(startIndex, startIndex + 20));
        resolve(matches.slice(startIndex, startIndex + 20));
      } else {
        resolve(matches.slice(0, 20));
      }

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


