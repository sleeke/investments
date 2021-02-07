// Local modules

const utils = require('../utils');
const secrets = require('../secrets');
const network = require('./networkService')

// Constants

var serviceUrlSandbox = 'https://sandbox.iexapis.com/stable/stock/'
var serviceUrl = 'https://cloud.iexapis.com/stable/stock/'

// =======
// Methods
// =======

// Quote

module.exports.quote = function(symbol, callback, onError) {
  var quoteUrl = serviceUrl + translateSymbol(symbol) + '/quote'
  var parameters = {
    token: secrets.iexApikey  
  }

  network.query(quoteUrl, parameters, (quoteJson) => {
    var quotePackage = {
      symbol:         quoteJson["symbol"],
      open:           quoteJson["open"] || quoteJson['previousClose'],  // For Canadian stocks with no PM
      high:           quoteJson["high"],
      low:            quoteJson["low"],
      price:          quoteJson["latestPrice"],
      volume:         quoteJson["volume"],
      prevClose:      quoteJson["previousClose"],
      change:         quoteJson["change"],
      changePercent:  quoteJson["changePercent"] * 100,
    }

    if (utils.isFunction(callback)) {
      callback(quotePackage)
    }
  }, onError)
}

// Daily

module.exports.daily = function (symbol) {
  var dailyUrl = serviceUrl + translateSymbol(symbol) + '/chart'

  var parameters = {
    token: secrets.iexApikey  
  }

  return network.query(dailyUrl, parameters)
    .then(extractdailyData)
 }

function extractdailyData(json) {
  var dailyArray = utils.dictionaryToArray(json)

  if (dailyArray.length == 0) {
    onError(`Daily data is empty in response from ${dailyUrl}`)
  }
  else {
    var dailyPackage = []
    for (dayIndex = dailyArray.length - 1; dayIndex >= 0 ; dayIndex--) {
      var day = dailyArray[dayIndex]
      dailyPackage[dailyArray.length - 1 - dayIndex] = {
        open: day['open'],
        high: day['high'],
        low: day['low'],
        close: day['close'],
        volume: day['volume']        
      }
    }

    return dailyPackage
  }
}

function translateSymbol(symbol) {
  var newSymbol = symbol. replace('.TO', '-CT')
  var newSymbol = newSymbol. replace('.V', '-CV')

  return newSymbol
}