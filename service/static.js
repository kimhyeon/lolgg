const colors = require('colors');
const staticDAO = require('../persistent/static');

exports.getVersion = () => {

  return new Promise((resolve, reject) => {
    (async() => {
      let lolggVersion = await staticDAO.findOne({type: "version"});
      currentVersion = lolggVersion.data;
      resolve(currentVersion);
    })();
  });

}