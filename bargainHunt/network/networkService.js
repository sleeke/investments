// Local modules
const utils = require('../utils');

// npm modules
const request = require('request-promise')

module.exports.query = function(url, parameters) {
  return request({
    "method":"GET", 
    "uri": url, 
    "json": true,
    "qs": parameters
  })
}