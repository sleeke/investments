// Local modules

const utils = require('../utils');
const secrets = require('../secrets');
const network = require('./networkService');
const { quote } = require('./networkFacade');

// Constants

var serviceUrlSandbox = 'https://sandbox.iexapis.com/stable/stock/'
var serviceUrlProd = 'https://cloud.iexapis.com/stable/stock/'

var serviceUrl
var apiKey

if (utils.debugMode) {
  console.log(`${utils.textColor.FgGreen}INFO: You are using the SANDBOX API key; values will not be accurate${utils.textColor.Reset}`)
  var serviceUrl = serviceUrlSandbox
  var apiKey = secrets.iexApikeySandbox
}
else {
  console.log(`${utils.textColor.FgRed}WARNING: You are using the PAID API key; don't go crazy!${utils.textColor.Reset}`)
  var serviceUrl = serviceUrlProd
  var apiKey = secrets.iexApikeyProd  
}

// =======
// Methods
// =======

// Quote

module.exports.quote = function(symbol) {
  var quoteUrl = serviceUrl + translateSymbol(symbol) + '/quote'
  var parameters = {
    token: apiKey = secrets.iexApikeySandbox
  
  }

  return network.query(quoteUrl, parameters)
    .then(extractQuoteData)
}

function extractQuoteData(quoteJson) {
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

  return quotePackage
}

// Daily

module.exports.daily = function (symbol) {
  var dailyUrl = serviceUrl + translateSymbol(symbol) + '/chart'

  var parameters = {
    token: apiKey  
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