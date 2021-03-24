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
  serviceUrl = serviceUrlSandbox
  apiKey = secrets.iexApikeySandbox
}
else {
  console.log(`${utils.textColor.FgRed}WARNING: You are using the PAID API key; don't go crazy!${utils.textColor.Reset}`)
  serviceUrl = serviceUrlProd
  apiKey = secrets.iexApikeyProd  
}

// =======
// Methods
// =======

// Quote

module.exports.quote = function(symbol) {
  var quoteUrl = serviceUrl + translateSymbol(symbol) + '/quote'
  var parameters = {
    token: apiKey = apiKey
  
  }

  return network.query(quoteUrl, parameters)
    .then(extractQuoteData)
    .catch(_ => Promise.reject(`${utils.textColor.FgRed}Error getting quote data for '${symbol}', please check symbol is valid${utils.textColor.Reset}`))
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
    .catch(error => Promise.reject(`Error getting daily data for '${symbol}', please check symbol is valid`))
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

// 52w High

module.exports.high52w = function (symbol) {
  var high52wUrl = serviceUrl + translateSymbol(symbol) + '/stats/week52high'

  var parameters = {
    token: apiKey  
  }

  return network.query(high52wUrl, parameters)
    .catch(error => console.log("Error getting 52w high, please check symbol is valid"))
}

// RSI

module.exports.rsi = function (symbol) {
  var url = serviceUrl + translateSymbol(symbol) + '/indicator/rsi'

  var parameters = {
    token: apiKey,
    input1: 14,
    indicatorOnly: true, 
    range: '30d',
    lastIndicator: true
  }

  return network.query(url, parameters)
    .catch(error => console.log("Error getting RSI, please check symbol is valid"))
}

// =====
// UTILS
// =====

// Symbol translation

function translateSymbol(symbol) {
  var newSymbol = symbol. replace('.TO', '-CT')
  var newSymbol = newSymbol. replace('.V', '-CV')
  var newSymbol = newSymbol. replace('.CN', '-CF')
  var newSymbol = newSymbol. replace('-UN', '.UN')
  var newSymbol = newSymbol. replace('-A', '.A')
  var newSymbol = newSymbol. replace('-B', '.B')

  return newSymbol
}