// /summoner

var express = require('express');
var router = express.Router();

var request = require('request');

var common = require('../server/common');

router.get('/', (req, res) => {
  // summoner page
  res.redirect('/');
});

router.get(/userName=*/, (req, res) => { 
  console.log("path", req.path);
  console.log("apiKey", common.apiKey);

  var url = "https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/",
    name = req.path.substr(10);

  console.log("name", name);

  var sendURL = `${url}${name}?api_key=${common.apiKey}`;
  console.log("sendURL", sendURL);

  request({ 
    uri: sendURL, 
    method: "GET", 
    timeout: 10000, 
    followRedirect: true, 
    maxRedirects: 10 
  },
    function(error, response, body) { 
      // console.log(error, response, body); 
      
      var url = "https://kr.api.riotgames.com/lol/match/v4/matchlists/by-account/",
        bodyObj = JSON.parse(body),
        accountId = bodyObj.accountId;

      var sendURL = `${url}${accountId}?api_key=${common.apiKey}`;

      request({
        uri: sendURL, 
        method: "GET", 
        timeout: 10000, 
        followRedirect: true, 
        maxRedirects: 10 
      },
      function(error, response, body) { 
        res.json(JSON.parse(body));
      });

    });

  });

module.exports = router;

