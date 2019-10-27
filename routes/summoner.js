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

  let name = req.params.name,
    upperCaseName = name.trim().toUpperCase();

  console.log("upperCaseName", upperCaseName);
  
  summonerModel.findOne({ upperCaseName: upperCaseName }, (err, summoner) => {
    console.log(`find result`.cyan, summoner, !!summoner);
        
    if(summoner) {   
      req.summoner = summoner;
      
      let romanKey = {
        "I": 1,
        "II": 2,
        "III": 3,
        "IV": 4
      };

      let resData = {
        searchForm: true,
        summoner: req.summoner,
        summonerString: req.summoner,
        RANKED_SOLO: null,
        RANKED_FLEX: null,
      }
      
      

      summoner.leagueEntries.forEach((el) => {
        console.log(colors.yellow(el));
        if(el.queueType === "RANKED_SOLO_5x5" || el.queueType === "RANKED_FLEX_SR") {
          let KEY = (el.queueType === "RANKED_SOLO_5x5") ? "RANKED_SOLO" : "RANKED_FLEX",
            tierText = el.tier.toLocaleLowerCase();
            
          tierText = tierText.replace(/^./, tierText[0].toUpperCase())+" "+romanKey[el.rank];

          resData[KEY] = {};
          resData[KEY]["emblem"] = el.tier.toLocaleLowerCase()+"_"+romanKey[el.rank];
          resData[KEY]["tier"] = tierText;
          resData[KEY]["leaguePoints"] = el.leaguePoints;
          resData[KEY]["wins"] = el.wins;
          resData[KEY]["losses"] = el.losses;
          resData[KEY]["winRate"] = Math.round(el.wins / (el.wins + el.losses) * 100);
        } 

      });

      res.render("summoner/result", resData);

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
      .then((riotSummoner) => {
        riotAPI.getLeagueEntriesBySummonerId(riotSummoner.id)

        .then((resolveData) => {
          // save
          let newSummoner = new summonerModel({
            profileIconId: riotSummoner.profileIconId,
            name: riotSummoner.name.trim(),
            puuid: riotSummoner.puuid,
            summonerLevel: riotSummoner.summonerLevel,
            accountId: riotSummoner.accountId,
            id: riotSummoner.id,
            revisionDate: riotSummoner.revisionDate,

            leagueEntries: resolveData,
            upperCaseName: riotSummoner.name.trim().toUpperCase()
          });
  
          newSummoner.save((err, summoner) => {
            if(err) return console.error(err);
            console.log(colors.blue(summoner));
            
            let resData = {
              searchForm: true,
              summoner: summoner,
              summonerString: summoner ? JSON.stringify(summoner) : "NO SUMMONER"
            }

            console.log(colors.yellow(resData));

            res.render("summoner/result", resData);

          });

        })
        .catch((err) => {
          if(err) {
            console.log(colors.red(err));
          }
        });

      })
      .catch((response) => {
        if(response) {
          // handle error pages!!!
          console.log(colors.red(err));

          let resData = {
            searchForm: true,
            responseString: JSON.stringify(response.body)
          }


          res.render("summoner/noSummoner", resData)
        }
      });

    }
    
  })

});

// renew summoner
router.post("/ajax/renew.json/", (req, res) => {
  console.log(colors.cyan(JSON.stringify(req.body)));

  // db update
  summonerModel.findOne({ id: req.body.summonerId }, (err, dbSummoner) => {
    console.log(`find result2`.cyan, dbSummoner, !!dbSummoner, dbSummoner.accountId);

    riotAPI.getSummonerByEncryptedAccountId(dbSummoner.accountId)
    .then((riotSummoner) => {

      // update summoners collection
      console.log(colors.cyan(riotSummoner));


      riotAPI.getLeagueEntriesBySummonerId(riotSummoner.id)
      .then((leagueEntries) => {
        
        // db update
        dbSummoner.profileIconId = riotSummoner.profileIconId;
        dbSummoner.name = riotSummoner.name;
        dbSummoner.puuid = riotSummoner.puuid;
        dbSummoner.summonerLevel = riotSummoner.summonerLevel;
        accountId = riotSummoner.accountId;
        dbSummoner.id = riotSummoner.id;
        dbSummoner.revisionDate = riotSummoner.revisionDate;
        
        dbSummoner.leagueEntries = leagueEntries;
        dbSummoner.upperCaseName = riotSummoner.name.trim().toUpperCase();

        dbSummoner.save(function(err) {
          if(err) res.status(500).json({error: 'failed to update'});
          
          // dummy result, will be html tag result!!!
          res.json({result: 1});
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

  });

});

module.exports = router;

