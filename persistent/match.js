const colors = require('colors');
const matchModel = require('../model/Match');

exports.findOne = (query) => {
  return new Promise((resolve, reject) => {
    matchModel.findOne(query, (err, match) => {
      if(err) {
        console.log(colors.red(err));
        reject(err);
      } else {
        resolve(match);
      }
    });
  });
}

exports.save = (riotMatch) => {
  return new Promise((resolve, reject) => {

    let newMatch = new matchModel(riotMatch);

    newMatch.save((err, match) => {
      if(err) {
        console.log(colors.red(err));
        reject(err);
      }
      resolve(match);
    });

  });
}
