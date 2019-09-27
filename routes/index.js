var express = require('express');
var router = express.Router();

var request = require('request');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET home page. */
router.get('/test', function(req, res, next) {

  var url = "https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/",
    api_key = "RGAPI-e8b1a80a-2604-44e6-9e8f-05524187cfb6"
    user_name = encodeURI(req.query.user_name);

    var sendURL = `${url}${user_name}?api_key=${api_key}`;

  console.log(sendURL);

  request({ 
      uri: sendURL, 
      method: "GET", 
      timeout: 10000, 
      followRedirect: true, 
      maxRedirects: 10 
   },
    function(error, response, body) { 
      console.log(error, response, body); 
      res.json(JSON.parse(body));
    });
    
});

module.exports = router;
