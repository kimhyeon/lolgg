const colors = require('colors');
const riotAPI = require('../server/riotAPI');
const matchDAO = require('../persistent/match');

// test sync await,
exports.getMatch = (accountId, matchlist) => {
  return new Promise((resolve, reject) => {

    (async () => {
      let matches = [];
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
        resolve(getMatchesHTMLText(accountId, matches));

      } catch(err) {
        reject(err);
      } 
    })();

  });

}

let getMatchesHTMLText = (accountId, matches) => {

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

  matches.forEach((match) => {
    let obj = {},
      participantIdentity = null,
      participant = null;

    participantIdentity = match.participantIdentities.find((data) => {
      return accountId === data.player.accountId;
    });

    participant = match.participants.find((data) => {
      return participantIdentity.participantId === data.participantId;
    });

    obj["summonerName"] = participantIdentity.player.summonerName;

    obj["queueName"] = queueName[match.queueId];
    obj["gameCreation"] =  match.gameCreation; // 몇시간 전 인지... -> 함수!!
    obj["gameDuration"] =  match.gameDuration; // 걸린시간 분 초... -> 함수!!

    obj["championId"] = participant.championId;
    // championName --> 어디선가 구해와야됨

    obj["spell1Id"] = participant.spell1Id;
    obj["spell2Id"] = participant.spell2Id;
    obj["perk0"] = participant.stats.perk0;
    obj["perkSubStyle"] = participant.stats.perkSubStyle;
 
    list.push(obj);
  });

  return list;

}

exports.getMatches = () => {

}

exports.saveRiotMatch = () => {

}