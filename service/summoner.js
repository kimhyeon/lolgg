const colors = require('colors');
const riotAPI = require('../server/riotAPI');
const summonerDAO = require('../persistent/summoner');
const matchListDAO = require('../persistent/matchlist');

exports.getSummoner = (upperCaseName) => {

  return new Promise((resolve, reject) => {

    summonerDAO.findOne({ upperCaseName: upperCaseName })
    .then((summoner) => {
      resolve(summoner);  
    })
    .catch((err) => {
      reject(err);
    });
    
  });

}

exports.saveRiotSummoner = async (name) => {
  // save summonser-scores
  return new Promise((resolve, reject) => {
  
    riotAPI.getSummonerByName(name)
    .then((riotSummoner) => {
      
      riotAPI.getLeagueEntriesBySummonerId(riotSummoner.id)
      .then((leagueEntries) => {          
        
        summonerDAO.save(riotSummoner, leagueEntries)
        .then((summoner) => {        
          console.log(colors.green("summoner SAVE-OK"));
          resolve(summoner);
        })
        .catch((err) => {
          reject(err);
        })

      })
      .catch((err) => {
        reject(err);
      });

    })
    .catch((err) => {
      err["title"] = "noSummoner";
      reject(err);
    });

  });

}

let = getSummonerResponse = (summoner, matchHtml) => {
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
    matchItemList: matchHtml
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