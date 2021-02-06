// Local modules
const utils = require('../utils');

// npm modules
const request = require('request')

// var myArgs = process.argv.slice(2);

// var commandLineSymbol = myArgs[0];
// if (typeof commandLineSymbol === 'undefined') {
//   this.momentumForSymbol(commandLineSymbol)
// }

// module.exports.timeSeriesDaily = function(symbol, callback) {
//   var parameters = {
//     function:'TIME_SERIES_DAILY', 
//     symbol:symbol,
//     apikey: secrets.apikey  
//   }

//   query(parameters, (json) => {
//     callback(symbol, json["Time Series (Daily)"])
//   })
// }

// module.exports.quote = function(symbol, callback) {
//   var parameters = {
//     function:'GLOBAL_QUOTE', 
//     symbol:symbol,
//     apikey: networkImp.secrets.apikey  
//   }

//   query(parameters, (json) => {
//     callback(json["Global Quote"])
//   })
// }

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