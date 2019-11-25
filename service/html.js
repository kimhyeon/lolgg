const summonerService = require('../service/summoner');
const matchlistService = require('../service/matchlist');
const matchService = require('../service/match');

let getNoMatchlistHTML = () => {

  return `
    <div class="box errorBox">
     <img class="errorIcon" src="/images/bg-noData.png">
      <div class="errorMessage">
        <div>기록된 전적이 없습니다.</div>
      </div>
    </div>`;

}
exports.getNoMatchlistHTML = getNoMatchlistHTML;

exports.getMainContentHtml = (req, accountId, version, matches, startInfo) => {

  return new Promise((resolve, reject) => {
    (async() => {

      let matchesHTMLText = await matchService.getMatchesHTMLText(req, accountId, version, matches),
        averageStatHTMLText = matchService.getAverageStatHTMLText(req.totalInfo),
        matchMoreBtn = matchService.getMoreMatchBtnHTMLText(accountId);

      if(startInfo == 0) {
        resolve(averageStatHTMLText + matchesHTMLText + matchMoreBtn);
      } else {
        resolve(matchesHTMLText);
      }

    })();
  });

}

