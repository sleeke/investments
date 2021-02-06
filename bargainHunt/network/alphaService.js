// Local modules

const utils = require('../utils');
const secrets = require('../secrets');
const network = require('./networkService')

// Constants

var serviceUrl = 'https://www.alphavantage.co/query'

// Methods

module.exports.quote = function(symbol, callback) {
  var parameters = {
    function:'GLOBAL_QUOTE', 
    symbol:symbol,
    apikey: secrets.apikey  
  }

  network.query(serviceUrl, parameters, (json) => {
    var quoteJson = json["Global Quote"]
    var quotePackage = {
      symbol:         quoteJson["01. symbol"],
      open:           quoteJson["02. open"],
      high:           quoteJson["03. high"],
      low:            quoteJson["04. low"],
      price:          quoteJson["05. price"],
      volume:         quoteJson["06. volume"],
      prevClose:      quoteJson["08. previous close"],
      change:         quoteJson["09. change"],
      changePercent:  quoteJson["10. change percent"],
    }

    if (utils.isFunction(callback)) {
      callback(quotePackage)
    }
  })
}