// Local modules

const utils = require('../utils');
const secrets = require('../secrets');
const network = require('./networkService')

// Constants

var serviceUrl = 'https://www.alphavantage.co/query'

// =======
// Methods
// =======

// Quote

module.exports.quote = function(symbol, callback) {
  var parameters = {
    function:'GLOBAL_QUOTE', 
    symbol:symbol,
    apikey: secrets.alphaApikey  
  }

  network.query(serviceUrl, parameters, (json) => {

    if (isDeniedMessage(json)) {
      return
    }

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

// Daily

module.exports.daily = function (symbol, callback) {
  var parameters = {
    function:'TIME_SERIES_DAILY', 
    symbol:symbol,
    apikey: secrets.apikey  
  }

  network.query(serviceUrl, parameters, (json) => {
    var dailyJson = json["Time Series (Daily)"]

    if (isDeniedMessage(json)) { 
      return
    }

    var dailyArray = utils.dictionaryToArray(dailyJson)

    var dailyPackage = []
    for (dayIndex = 0; dayIndex < dailyArray.length; dayIndex++) {
      var day = dailyArray[dayIndex]
      dailyPackage[dayIndex] = {
        open: day['1. open'],
        high: day['2. high'],
        low: day['3. low'],
        close: day['4. close'],
        volume: day['5. volume']        
      }
    }

    callback(symbol, dailyPackage)
  })
}

function isDeniedMessage(json) {
  if (typeof json.Note != 'undefined') {
    console.log('\n')
    console.log('=============')
    console.log('Limit reached')
    console.log('=============')
    console.log('\n')
    return true
  }

  return false
}