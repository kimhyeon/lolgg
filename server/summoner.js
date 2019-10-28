// summoner service
const colors = require('colors');

exports.getSummonerResponse = (summoner) => {
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
