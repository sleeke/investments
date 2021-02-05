// Local modules
const utils = require('./utils');
const secrets = require('./secrets');

// npm modules
const request = require('request')

var myArgs = process.argv.slice(2);

// var commandLineSymbol = myArgs[0];
// if (typeof commandLineSymbol === 'undefined') {
//   this.momentumForSymbol(commandLineSymbol)
// }

var myUrl = 'https://www.alphavantage.co/query'

module.exports.timeSeriesDaily = function(symbol, callback) {
  var parameters = {
    function:'TIME_SERIES_DAILY', 
    symbol:symbol,
    apikey: secrets.apikey  
  }

  request({url: myUrl, qs: parameters}, function(err, response, body) {
    if(err) { 
    console.log(err); return; 
  }

  var json = JSON.parse(response.body)
  callback(symbol, json["Time Series (Daily)"])
});
}