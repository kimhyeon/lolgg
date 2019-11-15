const colors = require('colors');
const tag = require('html-tag');
const riotAPI = require('../server/riotAPI');
const matchDAO = require('../persistent/match');
const staticDAO = require('../persistent/static');

// test sync await,
exports.getMatchesHTMLText = (accountId, version, matchlist) => {
  return new Promise((resolve, reject) => {

    (async () => {

      let lolggChampion = await staticDAO.findOne({type: "champion"}),
        matches = [];
      try {
        for(let i in matchlist) {
          let temp = matchlist[i];
          let match = await matchDAO.findOne({gameId: temp.gameId});
          if(match) {
            matches.push(match);
          } else {
            let riotMatch = await riotAPI.getMatchByMatchId(temp.gameId); 
            matches.push(riotMatch);
          }
        }
        // working here !!!!

        console.log(colors.cyan(`${accountId} ${version} ${matches.length} ${matchlist.length}`))
        resolve(getHTMLText(accountId, version, matches, lolggChampion.data));

      } catch(err) {
        reject(err);
      } 
    })();

  });

}

let getHTMLText = (accountId, version, matches, lolggChampion) => {
 
  let gamesData = getGamesData(accountId, version, matches, lolggChampion);
  
  let gameItemHTMLText = (game) => {
    
    let gameItem = null;
    if(game.win === "승리") {
      gameItem = tag("div", {class: "gameItem win"}, false);
    } else {
      gameItem = tag("div", {class: "gameItem lose"}, false);
    }
    // game stats
    let gameStats = tag("div", {class: "gameStats"}, false);
    gameStats += tag("div", {class: "gameType"}, game.queueName);
    gameStats += tag("div", {class: "timeStamp"}, game.gameCreation);
    gameStats += tag("div", {class: "bar"});
    gameStats += tag("div", {class: "gameResult"}, game.win);
    gameStats += tag("div", {class: "gameDuration"}, game.gameDuration);
    gameStats += "</div>";
    gameItem += gameStats;
    // game stats

    // game setting info
    let gameSettingInfo = tag("div", {class: "gameSettingInfo"}, false);

    let championImage = tag("div", {class: "championImage"}, false);
    championImage += tag("a", {href: "#"}, false);
    championImage += tag("img", {src: game.championId_imgUrl, class: "image"});
    championImage += "</a>";
    championImage += "</div>";
    gameSettingInfo += championImage;

    // ** summoner json 처리 DB 필요!!!!!
    // let summonerSpell = tag("div", {class: "summonerSpell"}, false);
    // summonerSpell += tag("div", {class: "spell"}, false);
    // summonerSpell += tag("img", {src: game.championId_imgUrl, class: "image"});
    // summonerSpell += "</div>";
    // summonerSpell += tag("div", {class: "spell"}, false);
    // summonerSpell += tag("img", {src: game.championId_imgUrl, class: "image"});
    // summonerSpell += "</div>";
    // summonerSpell += "</div>";
    
    // let runes = tag("div", {class: "runes"}, false);
    // runes += tag("div", {class: "rune"}, false);
    // runes += tag("img", {src: game.championId_imgUrl, class: "image"});
    // runes += "</div>";
    // runes += tag("div", {class: "runes"}, false);
    // runes += tag("img", {src: game.championId_imgUrl, class: "image"});
    // runes += "</div>";
    // runes += "</div>";
    // ** summoner json 처리 DB 필요!!!!!

    let championName = tag("div", {class: "championName"}, false);
    championName += tag("a", {href: "#"}, game.championName);
    championName += "</div>";
    gameSettingInfo += championName;
    gameSettingInfo += "</div>"

    gameItem += gameSettingInfo;
    // game setting info

    // score
    let score = tag("div", {class: "score"}, false);

    let KDA = tag("div", {class: "KDA"}, false);
    KDA += tag("span", {class: "kills"}, String(game.kills));
    KDA += " / ";
    KDA += tag("span", {class: "deaths"}, String(game.deaths));
    KDA += " / ";
    KDA += tag("span", {class: "assists"}, String(game.assists));
    KDA += "</div>";
    score += KDA;

    let KDARatio = tag("div", {class: "KDARatio"}, false); 
    KDARatio += tag("span", {class: "KDARatio"}, game.KDARatio) + " 평점";
    KDARatio += "</div>";
    score += KDARatio;

    score += "</div>";
    gameItem += score;
    // score
  

    // stats
    let stats = tag("div", {class: "stats"}, false);

    stats += tag("div", {class: "level"}, "레벨"+game.champLevel);
    stats += tag("div", {class: "cs"}, game.totalMinionsKilled);
    stats += tag("div", {class: "killRate"}, "킬관여 " + game.killRate);

    stats += "</div>";
    gameItem += stats;
    // stats


    // items
    let items = tag("div", {class: "items"}, false);

    let itemList = tag("div", {class: "itemList"}, false)
    
    let getItemTag = (item, itemUrl) => {
      if(item != 0) {
        return tag("div", {class: "item"}, false) + tag("img", {src: itemUrl, class: "image"}) + "</div>";
      } else {
        return tag("div", {class: "item"}, false) + tag("div", {class: "image noitem"}) + "</div>";
      }
    }

    itemList += getItemTag(game.item0, game.item0_imgUrl);
    itemList += getItemTag(game.item1, game.item1_imgUrl);
    itemList += getItemTag(game.item2, game.item2_imgUrl);
    itemList += getItemTag(game.item6, game.item6_imgUrl);
    itemList += getItemTag(game.item3, game.item3_imgUrl);
    itemList += getItemTag(game.item4, game.item4_imgUrl);
    itemList += getItemTag(game.item5, game.item5_imgUrl);

    itemList += "</div>";
    items += itemList;

    let pickWard = tag("div", {class: "pickWard"}, false);

    if(game.win === "승리") {
      pickWard += tag("img", {src: "/images/icon-ward-blue.png"});
    } else {
      pickWard += tag("img", {src: "/images/icon-ward-red.png"});
    }


    pickWard += "제어 와드 " + tag("span", {class: "pickWardCount"}, String(game.visionWardsBoughtInGame));
    pickWard += "</div>";
    items += pickWard;

    items += "</div>";
    gameItem += items;
    // items

    // players
    let players = tag("div", {class: "players"}, false);

    let team = tag("div", {class: "team"}, false);
    game.team.forEach((participant) => {

      let summoner = (participant.accountId === accountId) ? tag("div", {class: "summoner request"}, false) : tag("div", {class: "summoner"}, false);

      summoner += tag("div", {class: "championImage"}, false);
      summoner += tag("img", {src: participant.championId_imgUrl, class: "image"});
      summoner += "</div>";
      summoner += tag("div", {class: "summonerName"}, false);
      summoner += tag("a", {href: `/summoner/userName=${encodeURI(participant.summonerName)}`}, participant.summonerName);
      summoner += "</div>";

      summoner += "</div>";
      team += summoner;
    });
    team += "</div>";
    players += team;

    let anemy = tag("div", {class: "team"}, false);
    game.anemy.forEach((participant) => {
      let summoner = tag("div", {class: "summoner"}, false);

      summoner += tag("div", {class: "championImage"}, false);
      summoner += tag("img", {src: participant.championId_imgUrl, class: "image"});
      summoner += "</div>";
      summoner += tag("div", {class: "summonerName"}, false);
      summoner += tag("a", {href: `/summoner/userName=${encodeURI(participant.summonerName)}`}, participant.summonerName);
      summoner += "</div>";

      summoner += "</div>";
      anemy += summoner;
    });
    anemy += "</div>";
    players += anemy;

    players += "</div>";
    gameItem += players;
    // players

    return gameItem += "</div>";

  }

  let lastGameId = gamesData[gamesData.length - 1].gameId, 
    gameItemList = tag("div", {"class": "gameItemList", "data-last-gameid": String(lastGameId)}, false);
  
  gamesData.forEach((game) => {
    gameItemList += gameItemHTMLText(game);

  });

  gameItemList += "</div>";

  // console.log(tag('a', {href: 'https://sellside.com'}, accountId));
  console.log(colors.cyan(gameItemList));
  return gameItemList;
    
}

let getGamesData = (accountId, version, matches, lolggChampion) => {
  
  let list = [],
    queueName = {
      420: "솔랭",
      430: "일반",
      440: "자유 5:5 랭크",
      450: "무작위 총력전",
      840: "초급 봇",
      850: "중급 봇",
      900: "우르프"
    };

  // inner functions
  let getDaysAgoText = (gameCreation, duration) => {

    let gameEndTime = gameCreation + duration * 1000,
      diff = new Date().getTime() - gameEndTime;

    let m = (diff / (60*1000)).toFixed(),
      h = (m / 60).toFixed(),
      d = (h / 24).toFixed(),
      month = (d / 30).toFixed();

    if(month > 0) {
      return `${month}달 전`;
    } else if(d > 0) {
      return `${d}일 전`;
    } else if(h > 0) {
      return `${h}시간 전`;
    } else {
      return `${m}분 전`;
    }

  }

  let getDurationText = (duration) => {
    let min = parseInt(duration / 60);
    let sec = parseInt(duration % 60);
    return `${min}분 ${sec}초`;
  }
  
  let getKillRate = (participant, teamParticipant) => {
    let killSums = 0;
    for(let i in teamParticipant) {
      let participant = teamParticipant[i];
      killSums += participant.stats.kills;
    }
    return (((participant.stats.kills + participant.stats.assists) / killSums) * 100).toFixed(0); 
  }

  let getChampionImgUrl = (championId) => {
    return `http://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`;
  }

  let getItemImgUrl = (item) => {
    return `http://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item}.png`;
  }

  // let getSummonerSpellImgUrl = (spell) => {
  //   return `https://opgg-static.akamaized.net/images/lol/spell/SummonerFlash.png?image=w_22&v=15354684000`;
  // }

  let getParticipantsInfo = (match, participants) => {
    let participantsInfo = [];

    participants.forEach((participant) => {
      let obj = {};
      obj["championId"] = participant.championId;
      obj["championId_imgUrl"] = getChampionImgUrl(lolggChampion[participant.championId].id);

      let participantIdentity = match.participantIdentities.find((data) => {
        return participant.participantId === data.participantId;
      });
      obj["summonerName"] = participantIdentity.player.summonerName;
      obj["accountId"] = participantIdentity.player.accountId;
      participantsInfo.push(obj);
    });

    return participantsInfo;

  }

  let getGameResult = (win, duration) => {
      if(duration < 300) {
        return "다시하기";
      } else {
        if(win) {
          return "승리";
        } else {
          return "패배";
        }
    }
  }

  matches.forEach((match) => {
    let obj = {},
      participantIdentity = null,
      participant = null,
      teamId = null
      teamParticipant = null,
      anemyParticipant = null;

    participantIdentity = match.participantIdentities.find((data) => {
      return accountId === data.player.accountId;
    });

    participant = match.participants.find((data) => {
      return participantIdentity.participantId === data.participantId;
    });

    teamId = participant.teamId;

    teamParticipant = match.participants.filter((data) => {
      return teamId === data.teamId;
    });

    anemyParticipant = match.participants.filter((data) => {
      return teamId !== data.teamId;
    });

    obj["summonerName"] = participantIdentity.player.summonerName;
    obj["gameId"] = match.gameId;

    obj["queueName"] = queueName[match.queueId];
    obj["gameCreation"] = getDaysAgoText(match.gameCreation, match.gameDuration);
    
    //obj["win"] = participant.stats.win ? "승리" : "패배";
    obj["win"] = getGameResult(participant.stats.win, match.gameDuration);

    obj["gameDuration"] = getDurationText(match.gameDuration);

    obj["championName"] = lolggChampion[participant.championId].name;
    obj["championId"] = lolggChampion[participant.championId].id;
    obj["championId_imgUrl"] = getChampionImgUrl(lolggChampion[participant.championId].id);
    
    obj["spell1Id"] = participant.spell1Id;
    obj["spell2Id"] = participant.spell2Id;
    obj["perk0"] = participant.stats.perk0;
    obj["perkSubStyle"] = participant.stats.perkSubStyle;
    
    obj["kills"] = participant.stats.kills;
    obj["deaths"] = participant.stats.deaths;
    obj["assists"] = participant.stats.assists;
    obj["KDARatio"] = ((obj["kills"] + obj["assists"]) / obj["deaths"]).toFixed(2) + ":1";
      
    obj["champLevel"] = participant.stats.champLevel;
    obj["totalMinionsKilled"] = participant.stats.totalMinionsKilled + participant.stats.neutralMinionsKilled + " CS";
    obj["killRate"] = getKillRate(participant, teamParticipant) + "%";

    obj["item0"] = participant.stats.item0;
    obj["item0_imgUrl"] = getItemImgUrl(participant.stats.item0);
    obj["item1"] = participant.stats.item1;
    obj["item1_imgUrl"] = getItemImgUrl(participant.stats.item1);
    obj["item2"] = participant.stats.item2;
    obj["item2_imgUrl"] = getItemImgUrl(participant.stats.item2);
    obj["item3"] = participant.stats.item3;
    obj["item3_imgUrl"] = getItemImgUrl(participant.stats.item3);
    obj["item4"] = participant.stats.item4;
    obj["item4_imgUrl"] = getItemImgUrl(participant.stats.item4);
    obj["item5"] = participant.stats.item5;
    obj["item5_imgUrl"] = getItemImgUrl(participant.stats.item5);
    obj["item6"] = participant.stats.item6; // lenze
    obj["item6_imgUrl"] = getItemImgUrl(participant.stats.item6);
    obj["visionWardsBoughtInGame"] = participant.stats.visionWardsBoughtInGame;
    
    obj["team"] = getParticipantsInfo(match, teamParticipant);
    obj["anemy"] = getParticipantsInfo(match, anemyParticipant);

    list.push(obj);

  });

  console.log(list);

  return list

};
