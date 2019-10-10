// /summoner
const express = require('express');
const router = express.Router();

const colors = require('colors');

const common = require('../server/common');
const riotAPI = require('../server/riotAPI');

const summonerModel = require('../model/summoner');

router.get('/', (req, res) => {
  // summoner page
  res.redirect('/');

});

router.get('/userName=:name', (req, res) => { 
//router.get(/userName=*/, (req, res) => { 
  console.log("path", req.path);
  console.log("params", req.params);
  console.log("query", req.query);
  // console.log("apiKey", common.apiKey);

  //const url = "https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/",
  let name = req.params.name;
  console.log("name", name);
    
  summonerModel.findOne({ name: name }, (err, summoner) => {
    console.log(`find result`.cyan, summoner, !!summoner);
        
    if(summoner) {   
      // check match
      
      // new Promise 사용해서 처리할것....
      var test = riotAPI.getMatchlistsByAccount(req, summoner.accountId);

      // console.log("[result]".yellow, Object.keys(result));

      console.log(req.test)

    } else {
      // save summoner
      let api_summoner = riotAPI.getSummonerByName(name);
      if(api_summoner) {
        let summoner = new summonerModel({
            profileIconId: info.profileIconId,
            name: info.name.trim(),
            puuid: info.puuid,
            summonerLevel: info.summonerLevel,
            accountId: info.accountId,
            id: info.id,
            revisionDate: info.revisionDate
        });
        summoner.save(function(err, summoner){
            
        if(err) return console.error(err);
            console.log(summoner);
        });
      }

    }
    
  })

});

module.exports = router;

