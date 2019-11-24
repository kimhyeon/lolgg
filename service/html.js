const summonerService = require('../service/summoner');
const matchlistService = require('../service/matchlist');
const matchService = require('../service/match');

exports.getMainContentHtml = (req, accountId, version, matches, startInfo) => {

  return new Promise((resolve, reject) => {
    (async() => {

      let averageStatHTMLText = matchService.getAverageStatHTMLText(),
        matchesHTMLText = await matchService.getMatchesHTMLText(req, accountId, version, matches),
        matchMoreBtn = matchService.getMoreMatchBtnHTMLText(accountId);

      if(startInfo == 0) {
        resolve(averageStatHTMLText + matchesHTMLText + matchMoreBtn);
      } else {
        resolve(matchesHTMLText);
      }

    })();
  });

}