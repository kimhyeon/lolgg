const colors = require('colors');
const riotAPI = require('../server/riotAPI');
const summonerDAO = require('../persistent/summoner');
const matchListDAO = require('../persistent/matchlist');

exports.getSummoner = (userName) => {

  return new Promise((reesolve, reject) => {

    summonerDAO.findOne({ upperCaseName: upperCaseName })
    .then((summoner) => {
      console.log(`find result`.cyan, summoner, !!summoner);  
  
      if(summoner) {
  
        matchlistModel.find({accountId: summoner.accountId} , (err, matchlist) => {
          console.log("matchlist".red, !!matchlist, matchlist);
  
          if(matchlist.length) {
            let gameId = matchlist[0].matches[0].gameId;
            console.log("YES", gameId);
            console.log(colors.green(gameId));
  
            // riotAPI.getMatchByMatchId()
  
            let resData = summonerService.getSummonerResponse(summoner);
            res.render("summoner/result", resData);
          } else {
            console.log("NO", summoner.accountId, new Date().getTime());
  
            riotAPI.getMatchlistsByAccount(summoner.accountId)
            .then((resolveData) => {
              console.log("[result]".yellow, Object.keys(resolveData));
              console.log(resolveData.totalGames);
  
              let matchlist = new matchlistModel({
                accountId: summoner.accountId,
                matches: resolveData.matches,
                totalGames: resolveData.totalGames,
                startIndex: resolveData.startIndex,
                endIndex: resolveData.endIndex
              });
  
              //TypeError: matchlistModel.save is not a function!!
              matchlist.save((err, matchlist) => {
                if(err) return console.error(err);
                console.log(matchlist);
              });
  
              let resData = summonerService.getSummonerResponse(summoner);
              res.render("summoner/result", resData);
  
            })
            .catch((err) => {
              if(err) {
                console.log(colors.red("ERROR"), Date.now());
              }
            });
  
            // let resData = summonerService.getSummonerResponse(summoner);
            // res.render("summoner/result", resData);
  
          }
          
        });
  
      } else {
        // save summoners
        // save summonser-scores
        riotAPI.getSummonerByName(name)
        .then((riotSummoner) => {
          riotAPI.getLeagueEntriesBySummonerId(riotSummoner.id)
  
          .then((leagueEntries) => {
           
            summonerDAO.save(riotSummoner, leagueEntries)
            .then((summoner, ) => {
              let resData = summonerService.getSummonerResponse(summoner);
              res.render("summoner/result", resData);
            })
            .catch((err) => {
              
            })
  
          })
          .catch((err) => {
            if(err) {
              console.log(colors.red(err));
            }
          });
  
        })
        .catch((err) => {
          if(err) {
            // err error pages!!!
            // console.log(colors.red(err));
  
            let resData = {
              searchForm: true,
              responseString: JSON.stringify(err.body)
            }
  
            res.render("summoner/noSummoner", resData)
          }
        });
  
      }
    })
    .catch((err) => {
      // summoner find error
  
    });
    
  });

}

exports.getMatchs = (accountId, matches) => {
  
  return new Promise((resolve, reject) => {

  });

}

let = getSummonerResponse = (summoner) => {
  let romanKey = {
    "I": 1,
    "II": 2,
    "III": 3,
    "IV": 4
  };

  let resData = {
    searchForm: true,
    summoner: summoner,
    summonerString: summoner,
    border: null,
    RANKED_SOLO: null,
    RANKED_FLEX: null,
  }   

  summoner.leagueEntries.forEach((el) => {
    console.log(colors.yellow(el));
    if(el.queueType === "RANKED_SOLO_5x5" || el.queueType === "RANKED_FLEX_SR") {
      let KEY = (el.queueType === "RANKED_SOLO_5x5") ? "RANKED_SOLO" : "RANKED_FLEX",
        tierText = el.tier.toLocaleLowerCase();
        
      tierText = tierText.replace(/^./, tierText[0].toUpperCase())+" "+romanKey[el.rank];
      
      resData[KEY] = {};
      resData[KEY]["emblem"] = el.tier.toLocaleLowerCase()+"_"+romanKey[el.rank];
      resData[KEY]["tier"] = tierText;
      resData[KEY]["leaguePoints"] = el.leaguePoints;
      resData[KEY]["wins"] = el.wins;
      resData[KEY]["losses"] = el.losses;
      resData[KEY]["winRate"] = Math.round(el.wins / (el.wins + el.losses) * 100);
      
      if(KEY === "RANKED_SOLO") {
        resData["border"] = el.tier.toLocaleLowerCase();
        resData["border"] = resData["border"] === "grandmaster" ? "master" : resData["border"];
      }

    } 
  });

  console.log(colors.yellow(resData));

  return resData;

}
exports.getSummonerResponse = getSummonerResponse;