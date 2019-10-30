const colors = require('colors');
const riotAPI = require('../server/riotAPI');
const matchDAO = require('../persistent/match');

exports.getMatchesHTMLText = (matchlist) => {
  return new Promise((resolve, reject) => {
    let dummy = [];
    matchlist.forEach((matchItem) => {
      
      matchDAO.findOne({gameId: matchItem.gameId})
      .then((match) => {
        if(match) {
          dummy.push(match);
        } else {
          riotAPI.getMatchByMatchId(matchItem.gameId)
          .then((match) => {
            dummy.push(match);
          })
          .catch((err) => {
            console.log(colors.red("riotAPI.getMatchByMatchId", err));
          });
        }
        
      })
      .catch((err) => {
        console.log(colors.red("matchDAO.findOne", err));
      });
      
    });
    resolve(dummy);
  });
 
}

exports.getMatches = () => {

}

exports.saveRiotMatch = () => {

}