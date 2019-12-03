const express = require('express');
const router = express.Router();

const colors = require('colors');

const common = require('../server/common');
const riotAPI = require('../server/riotAPI');

const staticService = require('../service/static')

const summonerService = require('../service/summoner');
const matchlistService = require('../service/matchlist');
const matchService = require('../service/match');

const htmlService = require('../service/html');

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

router.get('/userName=:name', (req, res, next) => { 
//router.get(/userName=*/, (req, res) => { 
  console.log("path", req.path);
  console.log("params", req.params);
  console.log("query", req.query);
  // console.log("apiKey", common.apiKey);

  let name = req.params.name,
    upperCaseName = name.trim().toUpperCase();

  console.log("upperCaseName", upperCaseName);
  
  try {

    (async () => {

      let dbSummoner = await summonerService.getSummoner(upperCaseName);
      if (dbSummoner) {
       
        let matches = await matchlistService.get20Matchlist(dbSummoner.accountId, 0, "total"),
         version = await staticService.getVersion();
        
         if(matches) {
          let mainContentHTMLText = await htmlService.getMainContentHtml(req, dbSummoner.accountId, version, matches, 0),
            tierBoxes = await summonerService.getTierBoxesHTMLText(dbSummoner);

          let resData = summonerService.getSummonerResponse(dbSummoner, tierBoxes, mainContentHTMLText);
          
          res.render("summoner/result", resData);

        } else {
          // save matchlist
          let matchlist = await matchlistService.saveFirstRiotMatchlist(dbSummoner.accountId);
          let matches = matchlist.matches,
            mainContentHTMLText = await htmlService.getMainContentHtml(req, dbSummoner.accountId, version, matches, 0),
            tierBoxes = await summonerService.getTierBoxesHTMLText(dbSummoner);

          let resData = summonerService.getSummonerResponse(dbSummoner, tierBoxes, mainContentHTMLText);
          res.render("summoner/result", resData);
        }
        
      } else {

        try {
          let summoner = await summonerService.saveRiotSummoner(upperCaseName);

          try {
            let matchlist = await matchlistService.saveFirstRiotMatchlist(summoner.accountId),
              version = await staticService.getVersion();
  
            let matches = matchlist.matches,
              mainContentHTMLText = await htmlService.getMainContentHtml(req, summoner.accountId, version, matches, 0),
              tierBoxes = await summonerService.getTierBoxesHTMLText(summoner);

            let resData = summonerService.getSummonerResponse(summoner, tierBoxes, mainContentHTMLText);
            res.render("summoner/result", resData);

          } catch(err) {
            console.log(colors.red(err));
          }

        } catch(err) {
          console.log(colors.red(err.title), err.status);
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
        }
          
      }

    })();

  } catch(err) {
    console.log(colors.red(err));
    next(err);
  }

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
            // more ...????

            summonerDAO.updateOne(dbSummoner.accountId, riotSummoner);
          }

          await matchlistService.renew(riotSummoner.accountId);
          let dbMatchList = await matchlistService.getAllMatchlist(riotSummoner.accountId),
            version = await staticService.getVersion(),
            mainContentHTMLText = await htmlService.getMainContentHtml(req, dbSummoner.accountId, version, dbMatchList.matches.slice(0, 20), 0);

          let tierBoxes = summonerService.getTierBoxesHTMLText(riotSummoner);

          res.json({result: 1, data:true, tierBoxes: tierBoxes, mainContentHTMLText: mainContentHTMLText, totalInfo: req.totalInfo});

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

router.get("/ajax/averageAndList/startInfo=:startInfo&accountId=:accountId&type=:type", (req, res) => {
  let startInfo = req.params.startInfo,
    accountId = req.params.accountId,
    type = req.params.type;

  console.log(colors.cyan("startInfo"), startInfo);
  (async() => {
    let version = await staticService.getVersion(),
      matches = await matchlistService.get20Matchlist(accountId, startInfo, type);

      if(!!matches.length) {
  
        let mainContentHTMLText = await htmlService.getMainContentHtml(req, accountId, version, matches, startInfo);
        
        res.json({result: 1, data:true, html: mainContentHTMLText, totalInfo: req.totalInfo});
      } else {
        res.json({result: 1, data:false, html: htmlService.getNoMatchlistHTML()});
      }

  })();
});

router.get("/ajax/detail/gameId=:gameId&accountId=:accountId", (req, res) => {

  (async() => {
    let gameId = req.params.gameId,
      accountId = req.params.accountId,
      version = await staticService.getVersion();

    console.log(colors.magenta(gameId, accountId, version));

    let html = await matchService.getMatchDetailHtml(version, gameId, accountId);
    res.json({result: 1, html: html});
  })();
  
});

router.get("/ajax/autocomplete/name=:name", (req, res) => {

  (async() => {
    let name = req.params.name;
    console.log(colors.cyan(name));
    let datas = await summonerService.getAutocompleteDatas(name.toUpperCase());

    if(datas.length === 0) {
      res.status(404);
    } else {
      res.status(200);
    }

    res.json({result:1, data:datas});

  })();

});


module.exports = router;