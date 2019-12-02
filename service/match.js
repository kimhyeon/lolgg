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
        lolggSummoner = await staticDAO.findOne({type: "summoner"}),
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
        // console.log(colors.cyan(`${accountId} ${version} ${matches.length} ${matchlist.length}`))
        resolve(getHTMLText(req, accountId, version, matches, lolggChampion.data, lolggSummoner.data));

      } catch(err) {
        reject(err);
      } 
    })();

  });

}

let getChampionImgUrl = (version, championId) => {
  return `http://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`;
}

let getSpellImgUrl = (version, spellId) => {
  return `http://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spellId}.png`;
}

let getItemImgUrl = (version, item) => {
  if(item !== 0) {
    return `http://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item}.png`;
  } else {
    return "noItem"
  }
}

let getItemTag = (item, itemUrl) => {
  if(item != 0) {
    return tag("div", {class: "item"}, false) + tag("img", {src: itemUrl, class: "image"}) + "</div>";
  } else {
    return tag("div", {class: "item"}, false) + tag("div", {class: "image noitem"}) + "</div>";
  }
}

let calc = {
  getKillRate: (participant, teamParticipant) => {
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
  },
  getKDARatio: (kills, deaths, assists) => {
    if(deaths === 0) {
      if(kills ===0 && assists === 0 ) {
        return "0.00:1";
      } else {
        return "Perfect";
      }
    } else {
      return ((kills + assists) / deaths).toFixed(2) + ":1";
    }
  },
  getMinionKilledPerMinute: (duration, minionTotal) => {
    let min = parseInt(duration / 60);

    return (minionTotal / min).toFixed(1);
  }
}

let getHTMLText = (req, accountId, version, matches, lolggChampion, lolggSummoner) => {

  let gamesData = getGamesData(accountId, version, matches, lolggChampion, lolggSummoner, lolggSummoner);
  
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
    let summonerSpell = tag("div", {class: "summonerSpell"}, false);
    summonerSpell += tag("div", {class: "spell"}, false);
    summonerSpell += tag("img", {src: game.spell1Id_imgUrl, class: "image"});
    summonerSpell += "</div>";
    summonerSpell += tag("div", {class: "spell"}, false);
    summonerSpell += tag("img", {src: game.spell2Id_imgUrl, class: "image"});
    summonerSpell += "</div>";
    summonerSpell += "</div>";
    gameSettingInfo += summonerSpell;
    
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

let getGamesData = (accountId, version, matches, lolggChampion, lolggSummoner) => {
  
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
  


  // let getSummonerSpellImgUrl = (spell) => {
  //   return `https://opgg-static.akamaized.net/images/lol/spell/SummonerFlash.png?image=w_22&v=15354684000`;
  // }

  let getParticipantsInfo = (match, participants) => {
    let participantsInfo = [];

    participants.forEach((participant) => {
      let obj = {};
      obj["championId"] = participant.championId;
      obj["championId_imgUrl"] = getChampionImgUrl(version, lolggChampion[participant.championId].id);

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
    obj["championId_imgUrl"] = getChampionImgUrl(version, lolggChampion[participant.championId].id);

    obj["spell1Id"] = participant.spell1Id;
    obj["spell1Id_imgUrl"] = getSpellImgUrl(version, lolggSummoner[participant.spell1Id].id);
    obj["spell2Id"] = participant.spell2Id;
    obj["spell2Id_imgUrl"] = getSpellImgUrl(version, lolggSummoner[participant.spell2Id].id);

    obj["perk0"] = participant.stats.perk0;
    obj["perkSubStyle"] = participant.stats.perkSubStyle;
    
    obj["kills"] = participant.stats.kills;
    obj["deaths"] = participant.stats.deaths;
    obj["assists"] = participant.stats.assists;

    obj["KDARatio"] = calc.getKDARatio(obj["kills"], obj["deaths"], obj["assists"]);
      
    obj["champLevel"] = participant.stats.champLevel;
    obj["totalMinionsKilled"] = participant.stats.totalMinionsKilled + participant.stats.neutralMinionsKilled + " CS";
    obj["killRate"] = calc.getKillRate(participant, teamParticipant) + "%";

    obj["teamTotalKills"] = getTeamTotalKills(teamParticipant);
    
    obj["item0"] = participant.stats.item0;
    obj["item0_imgUrl"] = getItemImgUrl(version, participant.stats.item0);
    obj["item1"] = participant.stats.item1;
    obj["item1_imgUrl"] = getItemImgUrl(version, participant.stats.item1);
    obj["item2"] = participant.stats.item2;
    obj["item2_imgUrl"] = getItemImgUrl(version, participant.stats.item2);
    obj["item3"] = participant.stats.item3;
    obj["item3_imgUrl"] = getItemImgUrl(version, participant.stats.item3);
    obj["item4"] = participant.stats.item4;
    obj["item4_imgUrl"] = getItemImgUrl(version, participant.stats.item4);
    obj["item5"] = participant.stats.item5;
    obj["item5_imgUrl"] = getItemImgUrl(version, participant.stats.item5);
    obj["item6"] = participant.stats.item6; // lenze
    obj["item6_imgUrl"] = getItemImgUrl(version, participant.stats.item6);

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
 
  let KDARatio = calc.getKDARatio(total.kills, total.deaths, total.assists);

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

exports.getMatchDetailHtml = (version, gameId, accountId) => {

  let getTeamParticipantsData = (match, lolggChampion, lolggSummoner, teamId, topTotalDamageDealtToChampions) => {
    // teamId : 100:blue , 200:red

    let participants = match.participants.filter((participant) => {
      return participant.teamId === teamId;
    });
    
    let datas = [];

    participants.forEach(participant => {

      let participantIdentity = match.participantIdentities.find((data) => {
        return participant.participantId === data.participantId;
      });

      let obj = {};
      
      obj["championId"] = participant.championId;
      obj["championId_imgUrl"] = getChampionImgUrl(version, lolggChampion[participant.championId].id);

      obj["champLevel"] = participant.stats.champLevel;

      obj["spell1Id"] = participant.spell1Id;
      obj["spell1Id_imgUrl"] = getSpellImgUrl(version, lolggSummoner[participant.spell1Id].id);
      obj["spell2Id"] = participant.spell2Id;
      obj["spell2Id_imgUrl"] = getSpellImgUrl(version, lolggSummoner[participant.spell2Id].id);

      obj["perk0"] = participant.stats.perk0;
      obj["perkSubStyle"] = participant.stats.perkSubStyle;

      obj["summonerName"] = participantIdentity.player.summonerName;

      obj["kills"] = participant.stats.kills;
      obj["deaths"] = participant.stats.deaths;
      obj["assists"] = participant.stats.assists;

      obj["killRate"] = calc.getKillRate(participant, participants);
      obj["KDARatio"] = calc.getKDARatio(obj["kills"], obj["deaths"], obj["assists"]);

      obj["totalDamageDealt"] = participant.stats.totalDamageDealt;
      obj["totalDamageDealtToChampions"] = participant.stats.totalDamageDealtToChampions;
      obj["totalDamageDealtToChampionsFill"] = (participant.stats.totalDamageDealtToChampions / topTotalDamageDealtToChampions * 100).toFixed(0);

      obj["wardsKilled"] = participant.stats.wardsKilled ? participant.stats.wardsKilled : 0;
      obj["wardsPlaced"] = participant.stats.wardsPlaced ? participant.stats.wardsPlaced : 0;
      obj["visionWardsBoughtInGame"] = participant.stats.visionWardsBoughtInGame ? participant.stats.visionWardsBoughtInGame : 0;

      obj["totalMinionsKilled"] = participant.stats.totalMinionsKilled + participant.stats.neutralMinionsKilled;
      obj["totalMinionsKilledPerMinute"] = calc.getMinionKilledPerMinute(match.gameDuration, obj["totalMinionsKilled"]);
      
      obj["item0"] = participant.stats.item0;
      obj["item0_imgUrl"] = getItemImgUrl(version, participant.stats.item0);
      obj["item1"] = participant.stats.item1;
      obj["item1_imgUrl"] = getItemImgUrl(version, participant.stats.item1);
      obj["item2"] = participant.stats.item2;
      obj["item2_imgUrl"] = getItemImgUrl(version, participant.stats.item2);
      obj["item3"] = participant.stats.item3;
      obj["item3_imgUrl"] = getItemImgUrl(version, participant.stats.item3);
      obj["item4"] = participant.stats.item4;
      obj["item4_imgUrl"] = getItemImgUrl(version, participant.stats.item4);
      obj["item5"] = participant.stats.item5;
      obj["item5_imgUrl"] = getItemImgUrl(version, participant.stats.item5);
      obj["item6"] = participant.stats.item6; // lenze
      obj["item6_imgUrl"] = getItemImgUrl(version, participant.stats.item6);

      obj["win"] = participant.stats.win;
      obj["teamId"] = participant.teamId;

      datas.push(obj);
    });

    return datas;

  }

  let getMyTeamId = (riotMatch, accountId) => {
    let participantIdentities = riotMatch.participantIdentities;
    let participantIdentity = participantIdentities.find((participantIdentity) =>  {
      return participantIdentity.player.accountId === accountId;
    });

    let participants = riotMatch.participants;
    let participant = participants.find((participant) => {
      return participantIdentity.participantId === participant.participantId;
    });
    console.log(colors.magenta(participantIdentity.participantId, participant.teamId));
    return participant.teamId;
  }

  let getTeamData = (riotMatch, teamId) => {
    let team = riotMatch.teams.find((team) => {
      return team.teamId === teamId;
    });

    let obj = {};
    obj["teamId"] = team.teamId;
    obj["win"] = team.win;
    obj["baronKills"] = team.baronKills;
    obj["dragonKills"] = team.dragonKills;
    obj["towerKills"] = team.towerKills;
    
    let teamKills = 0,
      teamgGoldEarned = 0,
      participants = riotMatch.participants;

    participants.forEach((participant) => {
      if(participant.teamId === teamId) {
        let stats = participant.stats;
        teamKills += stats.kills;
        teamgGoldEarned += stats.goldEarned;
      }
    });

    obj["teamKills"] = teamKills;
    obj["teamgGoldEarned"] = teamgGoldEarned;

    return obj;
  }

  let getTopTotalDamageDealtToChampions = (riotMatch) => {
    let participants = riotMatch.participants.slice();
    return Math.max.apply(Math, participants.map(function(participant) { return participant.stats.totalDamageDealtToChampions; }));
  }

  let getTeamTableTag = (teamParticipantsData) => {

    let win = teamParticipantsData[0].win,
      winText = win ? "승리" : "패배",
      teamId = teamParticipantsData[0].teamId,
      teamText = (teamId === 100) ? "블루팀" : "레드팀";
    
    let colgroup = `
      <colgroup>
        <col class="championImage">
        <col class="summonerSpell">
        <col class="keystoneMastery">
        <col class="summonerName">
        <col class="tier">
        <col class="KDA">
        <col class="damage">
        <col class="ward">
        <col class="cs">
        <col class="items">
      </colgroup>
    `;

    let thead = `
      <thead class="header">
        <tr class="row">
          <th class="headerCell" colspan="4">
            <span class="gameResult">${winText}</span>
            (${teamText})
          </th>
          <th class="headerCell">티어</th>
          <th class="headerCell">KDA</th>
          <th class="headerCell">피해량</th>
          <th class="headerCell">와드</th>
          <th class="headerCell">CS</th>
          <th class="headerCell">아이템</th>
        </tr>
      </thead>
    `;

    let trs = "";
    teamParticipantsData.forEach((participantData) => {
      
      let temp = `
        <tr class="row">
          <td class="championImage cell">
            <img class="image" src="${participantData.championId_imgUrl}">
            <div class="level">${participantData.champLevel}</div>
          </td>
          <td class="summonerSpell cell">
            <img src="${participantData.spell1Id_imgUrl}">
            <img src="${participantData.spell2Id_imgUrl}">
          </td>
          <td class="rune cell">
          
          </td>
          <td class="summonerName cell">
            <a href="/summoner/userName=${encodeURI(participantData.summonerName)}">${participantData.summonerName}</a>
          </td>
          <td class="tier cell">
          
          </td>
          <td class="KDA cell">
            <span class="KDARatio normal">${participantData.KDARatio}</span>
            <div class="KDA">
              <span class="kill">${participantData.kills}</span>
              /
              <span class="deaths">${participantData.deaths}</span>
              /
              <span class="assists">${participantData.assists}</span>
            </div>
          </td>
          <td class="damage cell">
            <div class="championDamage">${participantData.totalDamageDealtToChampions}</div>
            <div class="progress">
              <div class="fill" style="width: ${participantData.totalDamageDealtToChampionsFill}%"></div>
            </div>
          </td>
          <td class="ward cell">
            <div>${participantData.visionWardsBoughtInGame}</div>
            <div>${participantData.wardsPlaced} / ${participantData.wardsKilled}</div>
          </td>
          <td class="cs cell">
            <div class="cs">${participantData.totalMinionsKilled}</div>
            <div class="CSPerMinute">분당 ${participantData.totalMinionsKilledPerMinute}</div>
          </td>
          <td class="items cell">
            ${getItemTag(participantData.item0, participantData.item0_imgUrl)}
            ${getItemTag(participantData.item1, participantData.item1_imgUrl)}
            ${getItemTag(participantData.item2, participantData.item2_imgUrl)}
            ${getItemTag(participantData.item3, participantData.item3_imgUrl)}
            ${getItemTag(participantData.item4, participantData.item4_imgUrl)}
            ${getItemTag(participantData.item5, participantData.item5_imgUrl)}
            ${getItemTag(participantData.item6, participantData.item6_imgUrl)}
          </td>
        </tr>
      `;

      trs += temp;

    });

    let table = `
      <table class="gameDetailTable result-${win ? 'win' : 'lose'}">
        ${colgroup}
        ${thead}
        <tbody class="content">
          ${trs}
        </tbody>
      </table>
    `;

    return table;

  }

  let getSummaryTag = (myTeam, enemyTeam) => {
    
    let getTeamResultTag = (team) => {
      let winOrLose = (team.win === "Win") ? "win" : "lose";
      return `
        <div class="team result-${winOrLose}">
          <div class="objectScore">
            <img src="/images/icon/icon-baron-${winOrLose}.png">
            ${team.baronKills}
          </div>
          <div class="objectScore">
            <img src="/images/icon/icon-dragon-${winOrLose}.png">
            ${team.dragonKills}
          </div>
          <div class="objectScore">
            <img src="/images/icon/icon-tower-${winOrLose}.png">
            ${team.towerKills}
          </div>
        </div>
      `;
    }

    let myTeamResult = getTeamResultTag(myTeam);
    let enemyTeamResult = getTeamResultTag(enemyTeam);

    let totalKillTag = `
      <div class="total-container">
        <div class="text graph-title">Total Kill</div>
        <div class="text graph-data left">${myTeam.teamKills}</div>
        <div class="graph-container">
          <div class="graph team-${(myTeam.win === "Win")?"win":"lose"}" style="flex:${myTeam.teamKills}"></div>
          <div class="graph team-${(enemyTeam.win === "Win")?"win":"lose"}" style="flex:${enemyTeam.teamKills}"></div>
        </div>
        <div class="text graph-data right">${enemyTeam.teamKills}</div>
      </div>
    `;

    let totalGoldTag = `
      <div class="total-container">
        <div class="text graph-title">Total Gold</div>
        <div class="text graph-data left">${myTeam.teamgGoldEarned}</div>
        <div class="graph-container">
          <div class="graph team-${(myTeam.win === "Win")?"win":"lose"}" style="flex:${myTeam.teamgGoldEarned}"></div>
          <div class="graph team-${(enemyTeam.win === "Win")?"win":"lose"}" style="flex:${enemyTeam.teamgGoldEarned}"></div>
        </div>
        <div class="text graph-data right">${enemyTeam.teamgGoldEarned}</div>
      </div>
    `;

    return `
      <div class="summary">
        ${myTeamResult}
        <div class="summary-graph">
          ${totalKillTag}
          ${totalGoldTag}
        </div>
        ${enemyTeamResult}
      </div>
    `;

  };

  return new Promise((resolve, reject) => {
    (async() => {

      let riotMatch = await riotAPI.getMatchByMatchId(gameId),
        lolggChampion = await staticDAO.findOne({type: "champion"}),
        lolggSummoner = await staticDAO.findOne({type: "summoner"});

      let myTeamId = getMyTeamId(riotMatch, accountId),
        enemyTeamId = (myTeamId === 100) ? 200 : 100,
        topTotalDamageDealtToChampions = getTopTotalDamageDealtToChampions(riotMatch);

      // 100 for blue side. 200 for red side.
      let myTeamParticipants = getTeamParticipantsData(riotMatch, lolggChampion.data, lolggSummoner.data, myTeamId, topTotalDamageDealtToChampions),
        myTeam = getTeamData(riotMatch, myTeamId),
        myTeamTable = getTeamTableTag(myTeamParticipants);

      let enemyTeamParticipants = getTeamParticipantsData(riotMatch, lolggChampion.data, lolggSummoner.data, enemyTeamId, topTotalDamageDealtToChampions),
        enemyTeam = getTeamData(riotMatch, enemyTeamId),
        enemyTeamTable = getTeamTableTag(enemyTeamParticipants);

      let summary = getSummaryTag(myTeam, enemyTeam);
      
      resolve(myTeamTable+summary+enemyTeamTable);

    })();
  });
}