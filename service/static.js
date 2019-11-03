const colors = require('colors');
const riotAPI = require('../server/riotAPI');
const staticDAO = require('../persistent/static');

exports.checkVersion = () => {

  return new Promise((resolve, reject) => {
    (async() => {

      try {
        let versions = await riotAPI.getVersions(),
          currentVersion = versions[0];
  
        let lolggVersion = await staticDAO.findOne({type: "version"}),
          lolggChampion = await staticDAO.findOne({type: "champion"});
                  
        if(lolggVersion) {
          console.log(colors.yellow(lolggVersion.data, currentVersion));
          if(lolggVersion.data != currentVersion) {
            staticDAO.updateOne("version", {data: currentVersion});
          }
        } else {
          staticDAO.save({type: "version", data: currentVersion});
        }

        if(lolggChampion) {
          // update
          if(lolggVersion.data != currentVersion) {
            let riotChampions = await riotAPI.getChampions(currentVersion),
              newChampions = getChampionsObj(riotChampions);
            console.log(colors.yellow(newChampions));
            staticDAO.updateOne("champion", {data: newChampions});
          }
        } else {
          // save
          let riotChampions = await riotAPI.getChampions(currentVersion),
            newChampions = getChampionsObj(riotChampions);
          console.log(colors.yellow(newChampions));
          staticDAO.save({type: "champion", data: newChampions})
        }

        resolve(currentVersion);

      } catch(err) {
        console.log(colors.red(err));
        reject(err);
      }
   
    })(); 

  });

}

let getChampionsObj = (riotChampions) => {
  
  let champions = riotChampions.data,
  keys = Object.keys(champions),
  newChampions = {};

  for(let i in keys) {
    let temp = champions[keys[i]];

    let newChampion = {
      id: temp.id,
      name: temp.name,
    }
    newChampions[temp.key] = newChampion;
  }

  return newChampions;

}