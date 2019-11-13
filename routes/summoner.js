const express = require('express');
const router = express.Router();

const colors = require('colors');

const common = require('../server/common');
const riotAPI = require('../server/riotAPI');

const staticService = require('../service/static')

const summonerService = require('../service/summoner');
const matchlistService = require('../service/matchlist');
const matchService = require('../service/match');

const summonerDAO = require('../persistent/summoner');

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

    (async () => { 

      if(summoner) {
            
        // data 내려주기 matches!!!
        matchlistService.getMatchlist(summoner.accountId)
        .then((matchlist) => {
          console.log(Array.isArray(matchlist.matches), matchlist.matches.length);

          (async () => {
            try {

              let version = await staticService.getVersion();

              let matches = matchlist.matches,
              matchesHTMLText = await matchService.getMatch(summoner.accountId, version, matches);
              
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

            console.log(Array.isArray(matchlist), matchlist.length);

            (async () => {
              try {
  
                let version = await staticService.getVersion();
  
                let matches = matchlist.matches,
                matchesHTMLText = await matchService.getMatch(summoner.accountId, version, matches.slice(0, 6));
                
                let resData = summonerService.getSummonerResponse(summoner, matchesHTMLText);
                
                res.render("summoner/result", resData);
              } catch(err) {
                console.log(colors.red(err));
              }
  
            })();    

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

    })();

  })
  .catch((err) => {

  });

});

// renew summoner
router.post("/ajax/renew.json/", (req, res) => {
  console.log(colors.cyan(JSON.stringify(req.body)));

  (async() => {
    try {
      let dbSummoner = await summonerDAO.findOne({ id: req.body.summonerId });
      if(dbSummoner) {
       
        let riotSummoner = await riotAPI.getSummonerByEncryptedAccountId(dbSummoner.accountId);
        if(riotSummoner) {

          let riotLeagueEntries = await riotAPI.getLeagueEntriesBySummonerId(riotSummoner.id);
          if(riotLeagueEntries) {
            riotSummoner["leagueEntries"] = riotLeagueEntries;
            riotSummoner["upperCaseName"] = riotSummoner.name.trim().toUpperCase();
          }

          summonerDAO.updateOne(dbSummoner.accountId, riotSummoner)
          .then((result) => {
            // dummy result, will be html tag result!!!
            res.json({result: 1, detail: result});
          })
          .catch((err) => {
            res.json({result: -1, detail: err});
          });

        }
        
      } else {
        console.log(colors.cyan("no summoner in db"));
        res.json({result: -1, detail: "no summoner in db"});
      }

    } catch (error) {
      console.log(colors.red(error));
      res.json({result: -1, detail: error});
    }
  
  })();

});


router.get("/ajax/averageAndList.json/startInfo=:startInfo&accountId=:accountId", (req, res) => {
  let startInfo = req.params.startInfo,
    accountId = req.params.accountId;

  // nal build
  matchlistService.getMatchlist(accountId, startInfo)
  .then((matchlist) => {
    console.log(Array.isArray(matchlist.matches), matchlist.matches.length);

    (async () => {
      try {

        let version = await staticService.checkVersion();

        let matches = matchlist.matches,
          matchesHTMLText = await matchService.getMatch(accountId, version, matches);

        res.json({result: 1, html: matchesHTMLText});

      } catch(err) {
        console.log(colors.red(err));
      }

    })();

  })
  .catch((err) => {
    console.log(colors.bgRed(err));
  });

});

module.exports = router;

