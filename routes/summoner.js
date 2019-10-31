const express = require('express');
const router = express.Router();

const colors = require('colors');

const common = require('../server/common');
const riotAPI = require('../server/riotAPI');

const summonerService = require('../service/summoner');
const matchlistService = require('../service/matchlist')
const matchService = require('../service/match')

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
  
  summonerService.getSummoner(upperCaseName)
  .then((summoner) => {
    console.log(`find result`.cyan, summoner, !!summoner);

    if(summoner) {
      // let resData = summonerService.getSummonerResponse(summoner);
      // res.render("summoner/result", resData);
      
      // data 내려주기 matches!!!
      matchlistService.getMatchlist(summoner.accountId)
      .then((matchlist) => {
        console.log(Array.isArray(matchlist), matchlist.length);

        // async IFFE function!! 
        (async () => {
          try {
            let matches = matchlist.matches,
            matchesHTMLText = await matchService.getMatch(summoner.accountId, matches.slice(0, 6));
            console.log(Array.isArray(matches), matches.length);
  
            let resData = summonerService.getSummonerResponse(summoner, matchesHTMLText);
            res.render("summoner/result", resData);
          } catch(err) {
            console.log(colors.red(err));
          }

        })();      

      })
      .catch((err) => {
        console.log(colors.bgRed(err));
      });

    } else {
      // save new summoner data

      summonerService.saveRiotSummoner(upperCaseName)
      .then((summoner) => {
        matchlistService.saveRiotMatchlist(summoner.accountId)
        .then((matchlist) => {
          console.log(colors.bgCyan(!!matchlist, matchlist.length));
          let resData = summonerService.getSummonerResponse(summoner);
          res.render("summoner/result", resData);
        })
        .catch((err) => {
          console.log(colors.red(err));
        });
      })
      .catch((err) => {

        if(err.title === "noSummoner") {
          let resData = {
            searchForm: true,
            responseString: "MAKE 404 PAGE : "+JSON.stringify(err.body)
          }
          res.render("summoner/noSummoner", resData)
        } else {
          console.log(colors.bgRed("REJECT"), colors.red(err));
          let resData = {
            searchForm: true,
            responseString: "$$need to make 404 summoner page$$"+JSON.stringify(err.body)
          }
          res.render("summoner/noSummoner", resData)
        }

      });

    
    }

  })
  .catch((err) => {

  });

});

// renew summoner
router.post("/ajax/renew.json/", (req, res) => {
  console.log(colors.cyan(JSON.stringify(req.body)));

  // db update
  summonerDAO.findOne({ id: req.body.summonerId })
  .then((summoner) => {

    riotAPI.getSummonerByEncryptedAccountId(summoner.accountId)
    .then((riotSummoner) => {

      // update summoners collection
      console.log(colors.cyan(riotSummoner));

      riotAPI.getLeagueEntriesBySummonerId(riotSummoner.id)
      .then((leagueEntries) => {
        
        riotSummoner["leagueEntries"] = leagueEntries;
        riotSummoner["upperCaseName"] = riotSummoner.name.trim().toUpperCase();

        summonerDAO.updateOne(summoner.accountId, riotSummoner)
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
  })
  .catch((err) => {
    if(err) {
      console.log(colors.red(err));
    }
  });

});

module.exports = router;

