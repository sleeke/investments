// Local modules
const utils = require('../utils');

// npm modules
const request = require('request')

module.exports.query = function(url, parameters, callback) {
  request({url: url, qs: parameters}, function(err, response, body) {
    if(err) { 
      console.log(err); return; 
    }

    var json = JSON.parse(response.body)
    if (utils.isFunction(callback)) {
      callback(json)
    }
  })
}