// /summoner
const express = require('express');
const router = express.Router();

const colors = require('colors');

const common = require('../server/common');
const riotAPI = require('../server/riotAPI');
const summonerService = require('../server/summoner');

const summonerModel = require('../model/summoner');
const matchlistModel = require('../model/Matchlist');

const summonerDAO = require('../persistent/summoner')

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
  
  summonerDAO.findOne({ upperCaseName: upperCaseName })
  .then((summoner) => {
    console.log(`find result`.cyan, summoner, !!summoner);  

    if(summoner) {

      matchlistModel.find({accountId: summoner.accountId} , (err, matchlist) => {
        console.log("matchlist".red, !!matchlist, matchlist);

        if(matchlist.length) {
          let gameId = matchlist[0].matches[0].gameId;
          console.log("YES", gameId);
          console.log(colors.green(gameId));

          // riotAPI.getMatchByMatchId()

          let resData = summonerService.getSummonerResponse(summoner);
          res.render("summoner/result", resData);
        } else {
          console.log("NO", summoner.accountId, new Date().getTime());

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

            let resData = summonerService.getSummonerResponse(summoner);
            res.render("summoner/result", resData);

          })
          .catch((err) => {
            if(err) {
              console.log(colors.red("ERROR"), Date.now());
            }
          });

          // let resData = summonerService.getSummonerResponse(summoner);
          // res.render("summoner/result", resData);

        }
        
      });

    } else {
      // save summoners
      // save summonser-scores
      riotAPI.getSummonerByName(name)
      .then((riotSummoner) => {
        riotAPI.getLeagueEntriesBySummonerId(riotSummoner.id)

        .then((leagueEntries) => {
         
          summonerDAO.save(riotSummoner, leagueEntries)
          .then((summoner, ) => {
            let resData = summonerService.getSummonerResponse(summoner);
            res.render("summoner/result", resData);
          })
          .catch((err) => {
            
          })

        })
        .catch((err) => {
          if(err) {
            console.log(colors.red(err));
          }
        });

      })
      .catch((err) => {
        if(err) {
          // err error pages!!!
          // console.log(colors.red(err));

          let resData = {
            searchForm: true,
            responseString: JSON.stringify(err.body)
          }

          res.render("summoner/noSummoner", resData)
        }
      });

    }
  })
  .catch((err) => {
    // summoner find error

  });

});

// renew summoner
router.post("/ajax/renew.json/", (req, res) => {
  console.log(colors.cyan(JSON.stringify(req.body)));

  // db update

  summonerDAO.findOne({ upperCaseName: upperCaseName })
  .then((summoner) => {
  
  })
  .catch(error)


  summonerModel.findOne({ id: req.body.summonerId }, (err, dbSummoner) => {
    console.log(`find result2`.cyan, dbSummoner, !!dbSummoner, dbSummoner.accountId);

    riotAPI.getSummonerByEncryptedAccountId(dbSummoner.accountId)
    .then((riotSummoner) => {

      // update summoners collection
      console.log(colors.cyan(riotSummoner));


      riotAPI.getLeagueEntriesBySummonerId(riotSummoner.id)
      .then((leagueEntries) => {
        
        riotSummoner["leagueEntries"] = leagueEntries;
        riotSummoner["upperCaseName"] = riotSummoner.name.trim().toUpperCase();

        summonerDAO.updateOne(dbSummoner.accountId, tt)
        .then((result) => {
          // dummy result, will be html tag result!!!
          res.json({result: 1, detail: result});
        })
        .catch((err) => {
          res.json({result: -1, detail: err});
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

