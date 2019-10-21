// /summoner
const express = require('express');
const router = express.Router();

const colors = require('colors');

const common = require('../server/common');
const riotAPI = require('../server/riotAPI');

const summonerModel = require('../model/summoner');
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

  let name = req.params.name;
  console.log("name", name);
    
  summonerModel.findOne({ name: name }, (err, summoner) => {
    console.log(`find result`.cyan, summoner, !!summoner);
        
    if(summoner) {   
      req.summoner = summoner;
     
      res.render("summoner/result", {summonerId:req.summoner.id ,summoner: JSON.stringify(req.summoner)});

      // check matchlist
      /*
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
      }); */

    } else {
      // save summoners
      // save summonser-scores
      riotAPI.getSummonerByName(name)
      .then((resolveData) => {

       let riotSummoner = resolveData;
        riotAPI.getLeagueEntriesBySummonerId(riotSummoner.id)
        .then((resolveData) => {

          // save
          let summoner = new summonerModel({
            profileIconId: riotSummoner.profileIconId,
            name: riotSummoner.name.trim(),
            puuid: riotSummoner.puuid,
            summonerLevel: riotSummoner.summonerLevel,
            accountId: riotSummoner.accountId,
            id: riotSummoner.id,
            revisionDate: riotSummoner.revisionDate,

            leagueEntries: resolveData
          });
  
          summoner.save((err, summoner) => {
            if(err) return console.error(err);
            console.log(summoner);
            
            let resData = {
              summonerId: summoner ? null : req.summoner.id,
              summoner:  summoner ? JSON.stringify(summoner) : "NO SUMMONER"
            }

            res.render("summoner/result", resData);

          });

        })
        .catch((err) => {
          if(err) {
            console.log(colors.red(err));
          }
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

// renew summoner
router.post("/ajax/renew.json/", (req, res) => {
  console.log(colors.bgCyan(JSON.stringify(req.body)));

  // db update
  summonerModel.findOne({ id: req.body.summonerId }, (err, summoner) => {
    console.log(`find result2`.cyan, summoner, !!summoner, summoner.accountId);

    riotAPI.getSummonerByEncryptedAccountId(summoner.accountId)
    .then((resolveData) => {

      // update summoners collection
      console.log(colors.bgCyan(resolveData));

    })
    .catch((err) => {
      if(err) {
        console.log(colors.red(err));
      }
    });

  });

  res.json({result: 1});
});

module.exports = router;

