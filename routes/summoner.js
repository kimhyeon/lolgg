// /summoner
const express = require('express');
const router = express.Router();

const colors = require('colors');

const common = require('../server/common');
const riotAPI = require('../server/riotAPI');

const summonerModel = require('../model/Summoner');
const matchlistModel = require('../model/Matchlist');

router.get(['/', '/userName', '/userName='], (req, res) => {
  // summoner page
  let temp = req.query;
  
  console.log(colors.magenta("summoner handler"));
  console.log(colors.magenta(temp));
  
  if(temp.userName) {
    res.redirect(`/summoner/userName=${temp.userName}`);
  } else {
    res.redirect('/');
  }

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
      req.summoner = summoner;
     
      res.render("summoner/result", {name: 'Tobi', summoner: JSON.stringify(req.summoner)});

      // check matchlist
      matchlistModel.find({accountId: summoner.accountId} , (err, matchlist) => {
        console.log("matchlist".red, !!matchlist.length, matchlist);

        if(matchlist.length) {

        } else {
          // save matchlist
          riotAPI.getMatchlistsByAccount(summoner.accountId)
          .then((resolveData) => {
            console.log("[result]".yellow, Object.keys(resolveData));
            console.log(resolveData.totalGames);

            let matchlist = new matchlistModel({
              accountId: summoner.accountId,
              matches: resolveData.matches,
              totalGames: resolveData.totalGames,
              startIndex: resolveData.startIndex,
              endIndex: resolveData.endIndex
            });

            //TypeError: matchlistModel.save is not a function!!
            matchlist.save((err, matchlist) => {
              if(err) return console.error(err);
              console.log(matchlist);
            });

          })
          .catch((err) => {
            if(err) {
              console.log(colors.red(err));
            }
          });

        }
      });

    } else {
      // save summoner
      riotAPI.getSummonerByName(name)
      .then((resolveData) => {

        let summoner = new summonerModel({
          profileIconId: resolveData.profileIconId,
          name: resolveData.name.trim(),
          puuid: resolveData.puuid,
          summonerLevel: resolveData.summonerLevel,
          accountId: resolveData.accountId,
          id: resolveData.id,
          revisionDate: resolveData.revisionDate
        });
        summoner.save((err, summoner) => {
          if(err) return console.error(err);
          console.log(summoner);
          
          res.render("summoner/result", {summoner: summoner ? JSON.stringify(summoner) : "NO SUMMONER"});

        });

      })
      .catch((err) => {
        if(err) {
          console.log(colors.red(err));
        }
      });

    }
    
  })

});

module.exports = router;

