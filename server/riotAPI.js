const request = require('request');
const colors = require('colors');
const API_KEY = "RGAPI-0ce95819-930f-49dd-9e20-06635bc69870";



exports.getSummonerByName = (name) => {
    let url = "https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/",
        sendURL = `${url}${encodeURI(name)}?api_key=${API_KEY}`;
    
    console.log(`getSummonerByName(name=${name})`.blue);
    console.log(sendURL.cyan);
    
    request({ 
        uri: sendURL, 
        method: "GET", 
        timeout: 10000, 
        followRedirect: true, 
        maxRedirects: 10 
    }, function(error, response, body) { 
        console.log(response.statusCode);

        if(response.statusCode === 404) {
            console.log("show summoner find 404 error page.");
            // res
        }

        if(response.statusCode === 200) {
            let info = JSON.parse(body);
            console.log(body.green);
            return info;
        }

    });

}

exports.getMatchlistsByAccount = (accountId) => {
  const url = "https://kr.api.riotgames.com/lol/match/v4/matchlists/by-account/",
    sendURL = `${url}${accountId}?api_key=${API_KEY}`;
  
  console.log(`getMatchlistsByAccount(accountId=${accountId})`.blue);
  console.log(sendURL.cyan);

  return new Promise((resolve, reject) => {
    request({
      uri: sendURL, 
      method: "GET", 
      timeout: 10000, 
      followRedirect: true, 
      maxRedirects: 10 
    },
    (error, response, body) => {
      let test = JSON.parse(body);
      console.log(test.totalGames, Object.keys(test));
      
      if(error) {
        reject(error);
        return;
      }
      resolve(JSON.parse(body));

    });

  });

}
