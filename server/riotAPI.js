const request = require('request');
const colors = require('colors');
const API_KEY = "RGAPI-0ce95819-930f-49dd-9e20-06635bc69870";

let apiRequest;
apiRequest = (sendURL, resolve, reject) => {
  console.log(colors.bgMagenta("REQUEST"), colors.cyan(`${sendURL}`));

  request({ 
      uri: sendURL, 
      method: "GET", 
      timeout: 10000, 
      followRedirect: true, 
      maxRedirects: 10 
  }, (error, response, body) => { 

    if(response.statusCode === 200) {
      console.log(colors.green(JSON.parse(body)));
    } else {
      console.log(colors.bgRed.white("REJECT!!!"));
      console.log(colors.red(JSON.parse(body)));    
      reject(response);
    }

    if(error) {
      console.log(colors.bgRed(`API ${response.statusCode} ERROR`));
      reject(error);
    }

    resolve(JSON.parse(body));

  });

};

exports.getSummonerByName = (name) => {
    let url = "https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/",
        sendURL = `${url}${encodeURI(name)}?api_key=${API_KEY}`;
    
    console.log(`getSummonerByName(name=${name})`.blue);
    
    return new Promise((resolve, reject) => {
      apiRequest(sendURL, resolve, reject);
    });
}

exports.getSummonerByEncryptedAccountId = (accountId) => {
  let url = "https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-account/",
  sendURL = `${url}${encodeURI(accountId)}?api_key=${API_KEY}`;

  console.log(`getSummonerByEncryptedAccountId(accountId=${accountId})`.blue);

  return new Promise((resolve, reject) => {
    apiRequest(sendURL, resolve, reject);
  });
}

exports.getLeagueEntriesBySummonerId = (summonerId) => {
  const url = "https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/",
    sendURL = `${url}${summonerId}?api_key=${API_KEY}`;

    console.log(`getLeagueEntriesBySummonerId(summonerId=${summonerId})`.blue);

    return new Promise((resolve, reject) => {
      apiRequest(sendURL, resolve, reject);
    });


  }

exports.getMatchlistsByAccount = (accountId, endTime) => {
  const url = "https://kr.api.riotgames.com/lol/match/v4/matchlists/by-account/",
    oneWeekMillisecond = 604800000,
    beginTime = endTime - oneWeekMillisecond;
    // sixMonthMillisecond = 2628000000;
  
  let sendURL = `${url}${accountId}`;
  sendURL += `?api_key=${API_KEY}`;
  sendURL = endTime ? sendURL + `&endTime=${endTime}&beginTime=${beginTime}` : sendURL;
  
  console.log(`getMatchlistsByAccount(accountId=${accountId})`.blue);

  return new Promise((resolve, reject) => {
    apiRequest(sendURL, resolve, reject);
  });
}

exports.getMatchByMatchId = (matchId) => {
  const url = "https://kr.api.riotgames.com/lol/match/v4/matches/",
    sendURL = `${url}${matchId}?api_key=${API_KEY}`;

  console.log(`getMatchByMatchId(matchId=${matchId})`.blue);

  return new Promise((resolve, reject) => {
    apiRequest(sendURL, resolve, reject);
  });
  
}
