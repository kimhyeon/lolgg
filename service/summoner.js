const colors = require('colors');
const tag = require('html-tag');
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

exports.getSummonerResponse = (summoner, tierBoxes, matchesHTMLText) => {
  
  let resData = {
    searchForm: true,
    summoner: summoner,
    border: (summoner.tier === "grandmaster") ? "master" : summoner.tier,
    tierBoxes: tierBoxes,
    matchItemList: matchesHTMLText
  };

  console.log(colors.yellow(resData));

  return resData;

}

exports.getTierBoxesHTMLText = (summoner) => {

  let leagueEntries = summoner.leagueEntries,
    tierBoxHTMLText = null;
    tierBoxesHTMLText = null;

  let romanKey = {
    "I": 1,
    "II": 2,
    "III": 3,
    "IV": 4
  };
  
  tierBoxHTMLText = (leagueEntrie, title) => {
    
    let winRate = Math.round(leagueEntrie.wins / (leagueEntrie.wins + leagueEntrie.losses) * 100),
      emblem = leagueEntrie.tier.toLocaleLowerCase()+"_"+romanKey[leagueEntrie.rank],
      tierText = leagueEntrie.tier.toLocaleLowerCase();

    tierText = tierText.replace(/^./, tierText[0].toUpperCase())+" "+romanKey[leagueEntrie.rank];
    
    
    let tierBox = null;
    tierBox = tag("div", {class: "side-content__tier box"}, false);
  
    // emblem
    tierBox += tag("div", {class: "emblem"}, false);
    tierBox += tag("img", {class: "emblem-box__img", src: `/images/emblems/${emblem}.png`});
    tierBox += "</div>";

    // tier info
    tierBox += tag("div", {class: "tier-rank-info"}, false);
    tierBox += tag("div", {class: "tier-rank-info__rank-type"}, title);
    tierBox += tag("div", {class: "tier-rank-info__tier-rank"}, tierText);
    tierBox += tag("div", {class: "tier-rank-info__tier-info"}, false);
    tierBox += tag("span", {class: "lp"}, `${leagueEntrie.leaguePoints} LP`);
    tierBox += ` / ${leagueEntrie.wins}승 ${leagueEntrie.losses}패`;
    tierBox += "</div>";
    tierBox += tag("div", {class: "tier-rank-info__win-rate"}, `승률 ${winRate}%`);
    tierBox += "</div>";

    tierBox += "</div>";
    return tierBox;
  }

  let unrankBoxHtmlText = (title) => {
    
    let unrankBox = null;
    unrankBox = tag("div", {class: "side-content__tier box"}, false);
  
    // emblem
    unrankBox += tag("div", {class: "emblem"}, false);
    unrankBox += tag("img", {class: "emblem-box__img", src: `/images/emblems/default.png`});
    unrankBox += "</div>";
    
    // tier info
    unrankBox += tag("div", {class: "tier-rank-info"}, false);
    unrankBox += tag("div", {class: "tier-rank-info__rank-type"}, title);
    unrankBox += tag("div", "Unranked");
    unrankBox += "</div>";
    
    unrankBox += "</div>";

    return unrankBox;
  }

  let solo = "",
    flex = "";

  // tierBoxesHTMLText = "";
  leagueEntries.forEach((leagueEntrie) => {
    if(leagueEntrie.queueType === "RANKED_SOLO_5x5") {
      solo = tierBoxHTMLText(leagueEntrie, "솔로랭크");
    } else if(leagueEntrie.queueType === "RANKED_FLEX_SR") {
      flex = tierBoxHTMLText(leagueEntrie, "자유 5:5 랭크");
    }
  });

  (solo === "") && (solo = unrankBoxHtmlText("솔로랭크"));
  (flex === "") && (flex = unrankBoxHtmlText("자유 5:5 랭크"));

  return solo + flex;

}


