const colors = require('colors');
const tag = require('html-tag');
const riotAPI = require('../server/riotAPI');
const matchDAO = require('../persistent/match');
const staticDAO = require('../persistent/static');

// test sync await,
exports.getMatchesHTMLText = (req, accountId, version, matchlist) => {
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

            matchDAO.save(riotMatch)
            .then((match) => {
              console.log(colors.green("match save ok"));
            })
            .catch((err) => {
              console.log(colors.red("match save fail"));
            });            
          }
        }
        
        // working here !!!!

        console.log(colors.cyan(`${accountId} ${version} ${matches.length} ${matchlist.length}`))
        resolve(getHTMLText(req, accountId, version, matches, lolggChampion.data));

      } catch(err) {
        reject(err);
      } 
    })();

  });

}

let getHTMLText = (req, accountId, version, matches, lolggChampion) => {
 
  let gamesData = getGamesData(accountId, version, matches, lolggChampion);
  
  let gameItemHTMLText = (game) => {
    
    let gameItem = null;
    
    if(game.duration < 300) {
      gameItem = tag("div", {class: "gameItem regame", "data-game-id": String(game.gameId)}, false);
    } else if(game.win === "승리") {
      gameItem = tag("div", {class: "gameItem win", "data-game-id": String(game.gameId)}, false);
    } else {
      gameItem = tag("div", {class: "gameItem lose", "data-game-id": String(game.gameId)}, false);
    }

    // content start
    gameItem += tag("div", {class: "content"}, false);

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
    // players

    gameItem += players;
    
    // game detail button
    let detailButton = `
      <div class="statsButton">
        <div class="content">
          <a class="button matchDetail" onclick="lolgg.matchDetailButton(this, '${game.gameId}');">
            <i class="icon open fas fa-chevron-down"></i>
            <i class="icon close fas fa-chevron-up"></i>
          </a>
        </div>
      </div>
    `;
    // game detail button
    gameItem += detailButton;

    gameItem += "</div>";
     // content end

    // empty detail
    gameItem += tag("div", {class: "gameDetail"});

    return gameItem += "</div>";

  }

  let lastGameId = gamesData[gamesData.length - 1].gameId, 
    gameItemList = tag("div", {"class": "gameItemList", "data-last-gameid": String(lastGameId)}, false);
  
  
  // get total game infos 
  let totalInfo = {
    wins: 0,
    losses: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    teamTotalKills: 0,
  }

  gamesData.forEach((game) => {
    gameItemList += gameItemHTMLText(game);

    // set total game Info for top data
    if(game.win !== "다시하기") {
      totalInfo.wins = (game.win === "승리") ? totalInfo.wins + 1 : totalInfo.wins;
      totalInfo.losses = (game.win === "패배") ? totalInfo.losses + 1 : totalInfo.losses;

      totalInfo.kills += game.kills;
      totalInfo.deaths += game.deaths;
      totalInfo.assists += game.assists;
      totalInfo.teamTotalKills += game.teamTotalKills;
    }
    
  });

  gameItemList += "</div>";

  // add data - script
  gameItemList += `<script>
    (() => {
    lolgg.initMatchGraph({wins: ${totalInfo.wins},losses: ${totalInfo.losses},kills: ${totalInfo.kills},
    deaths: ${totalInfo.deaths},assists: ${totalInfo.assists},teamTotalKills: ${totalInfo.teamTotalKills}});
    console.log("###"); 
    })();
  </script>`;

  req.totalInfo = totalInfo;

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
  
  let getTeamTotalKills = (teamParticipant) => {
    let killSums = 0;
    for(let i in teamParticipant) {
      let participant = teamParticipant[i];
      killSums += participant.stats.kills;
    }
    return killSums;
  }
  
  let getKillRate = (participant, teamParticipant) => {
    let killSums = 0;
    for(let i in teamParticipant) {
      let participant = teamParticipant[i];
      killSums += participant.stats.kills;
    }
    if(killSums === 0) {
      return "0";
    } else {
      return (((participant.stats.kills + participant.stats.assists) / killSums) * 100).toFixed(0); 
    }
  }

  let getKDARatio = (kills, deaths, assists) => {
    if(deaths === 0) {
      if(kills ===0 && assists === 0 ) {
        return "0.00:1";
      } else {
        return "Perfect";
      }
    } else {
      return ((kills + assists) / deaths).toFixed(2) + ":1";
    }
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
    
    obj["win"] = getGameResult(participant.stats.win, match.gameDuration);
    obj["duration"] = match.gameDuration;

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


    // obj["KDARatio"] = ((obj["kills"] + obj["assists"]) / obj["deaths"]).toFixed(2) + ":1";
    obj["KDARatio"] = getKDARatio(obj["kills"], obj["deaths"], obj["assists"]);
      
    obj["champLevel"] = participant.stats.champLevel;
    obj["totalMinionsKilled"] = participant.stats.totalMinionsKilled + participant.stats.neutralMinionsKilled + " CS";
    obj["killRate"] = getKillRate(participant, teamParticipant) + "%";

    obj["teamTotalKills"] = getTeamTotalKills(teamParticipant);
    
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

  // game list
  // console.log(list);

  return list

};

exports.getMoreMatchBtnHTMLText = (accountId) => {
  return `
    <div id="matchMoreButton" class="matchMoreButton box" data-account-id="${accountId}" onclick="lolgg.matchMoreButton('${accountId}'); return false;">
      <a href="javascript:void(0)" class="button">더 보기</a>
    </div>
  `
}

exports.getAverageStatHTMLText = (total) => {

  let totalGames = total.wins + total.losses,
    winRate = (total.wins / totalGames * 100).toFixed(0),
    killRate = ((total.kills + total.assists) / total.teamTotalKills * 100).toFixed(0);

  let getKDARatio = (kills, deaths, assists) => {
    if(deaths === 0) {
      if(kills ===0 && assists === 0 ) {
        return "0.00:1";
      } else {
        return "Perfect";
      }
    } else {
      return ((kills + assists) / deaths).toFixed(2) + ":1";
    }
  }

  let KDARatio = getKDARatio(total.kills, total.deaths, total.assists);

  console.log(total);

  return `<div class="average-stats">
    <div class="match">
      <div class="match__stats">${total.wins + total.losses}전 ${total.wins}승 ${total.losses}패</div>
      <div class="match__graph">
        <div class="canvas">
          <div class="winRate">${winRate}%</div>
          <canvas id="matchGraph" style="width:90px;height:90px;"></canvas>
        </div>
      </div>
      <div class="match__KDA">
        <div class="KDA">
          <span class="kill">${(total.kills / totalGames).toFixed(1)}</span> / 
          <span class="death">${(total.deaths / totalGames).toFixed(1)}</span> / 
          <span class="assist">${(total.assists / totalGames).toFixed(1)}</span>
        </div>
        <div class="KDARatioAndKillRate">
          <span class="KDARatio">${KDARatio}</span> 
          <span class="killRate">(${killRate}%)</span>
        </div>
      </div>
    </div>
  </div>`
}