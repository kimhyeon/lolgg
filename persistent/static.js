const colors = require('colors');
const staticModel = require('../model/Static');

exports.findOne = (query) => {
  return new Promise((resolve, reject) => {

    staticModel.findOne(query, (err, static) => {
      if(err) {
        reject(err);
      } else {
        resolve(static);
      }
    });

  });
}

exports.save = (newStatic) => {
  return new Promise((resolve, reject) => {

    let static = new staticModel({
      type: newStatic.type,
      version: newStatic.version,
      data: newStatic.data
    });

    static.save((err, static) => {
      if(err) {
        reject(err);
      }
      resolve(static);
    });

  });
}

exports.updateOne = (type, static) => {
  return new Promise((resolve, reject) => {
    staticModel.updateOne({type: type}, static, (err, result) => {
      if(err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}