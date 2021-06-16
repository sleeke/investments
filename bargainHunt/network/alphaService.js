// Local modules

const utils = require('../utils');
const secrets = require('../secrets');
const network = require('./networkService')

// Constants

var serviceUrl = 'https://www.alphavantage.co/query'
module.exports.timeNeededToAvoidLimits = 12000

// =======
// Methods
// =======

// Income history

module.exports.incomeHistory = function(symbol) {
  var parameters = {
    apikey: secrets.alphaApikey,
    symbol: translateSymbol(symbol),
    function: 'INCOME_STATEMENT'
  }

  return network.query(serviceUrl, parameters)
    .then(extractIncomeHistory)
    .catch(_ => Promise.reject(`${utils.textColor.FgRed}Error getting income history for '${symbol}', please check symbol is valid${utils.textColor.Reset}`))
}

function extractIncomeHistory(json) {
  // get history (last 4 years/quarters)

  incomeHistory = {
    annual: [],
    quarterly: []
  }

  for (index = 0; index < 4; index++) {
    if (json.quarterlyReports.length > index) {
      var historyItem = getHistoryItem(json.quarterlyReports[index])
      incomeHistory.quarterly.push(historyItem)
    }
    if (json.annualReports.length > index) {
      var historyItem = getHistoryItem(json.annualReports[index])
      incomeHistory.annual.push(historyItem)
    }
  }

  return incomeHistory  
}

function getHistoryItem(report) {
  return {
    profit: report.grossProfit,
    revenue: report.totalRevenue,
    expenses: report.operatingExpenses
  }
}

// Fundamentals

module.exports.fundamentals = function(symbol) {
  var parameters = {
    apikey: secrets.alphaApikey,
    symbol: translateSymbol(symbol),
    function: 'BALANCE_SHEET'
  }

  return network.query(serviceUrl, parameters)
    .then(extractFundamentalData)
    .catch(_ => Promise.reject(`${utils.textColor.FgRed}Error getting fundamentals data for '${symbol}', please check symbol is valid${utils.textColor.Reset}`))
}

function extractFundamentalData(json) {
  var fundamentals = {}
  var lastQuarterlyReport = json.quarterlyReports[0]
  var lastQuarter = {}

  lastQuarter.debtToCash = lastQuarterlyReport.totalCurrentLiabilities / lastQuarterlyReport.cashAndCashEquivalentsAtCarryingValue
  lastQuarter.currentRatio = lastQuarterlyReport.totalCurrentAssets / lastQuarterlyReport.totalCurrentLiabilities
  lastQuarter.asOfDate = lastQuarterlyReport.fiscalDateEnding

  fundamentals.lastQuarter = lastQuarter

  return fundamentals
}

module.exports.history = function(symbol) {
  var parameters = {
    apikey: secrets.alphaApikey,
    symbol:translateSymbol(symbol),
    function:'TIME_SERIES_DAILY',
    outputsize: 'full' 
  }

  return dailyData(parameters)
}

module.exports.daily = function(symbol) {
  var parameters = {
    apikey: secrets.alphaApikey,
    symbol:translateSymbol(symbol),
    function:'TIME_SERIES_DAILY',
    outputsize: 'compact' 
  }

  return dailyData(parameters)
}

function dailyData(parameters) {
  return network.query(serviceUrl, parameters)
    .then(json => {
      var dailyJson = json["Time Series (Daily)"]

      if (isDeniedMessage(json)) { 
        return
      }

      // TODO: Sometimes this fails (when running many queries, or perhaps just for VEGN.CN)
      var dailyArray = utils.dictionaryToArray(dailyJson)

      var dailyPackage = []
      for (dayIndex = 0; dayIndex < dailyArray.length; dayIndex++) {
        var day = dailyArray[dayIndex]
        dailyPackage[dayIndex] = {
          open: parseFloat(day['1. open']),
          high: parseFloat(day['2. high']),
          low: parseFloat(day['3. low']),
          close: parseFloat(day['4. close']),
          volume: parseFloat(day['5. volume'])        
        }
      }

      return dailyPackage
    })
}


// =====
// UTILS
// =====

// Symbol translation

function translateSymbol(symbol) {
  var newSymbol = symbol.replace(/\.TRT$/, '.TO')
  var newSymbol = newSymbol.replace(/\.TRV$/, '.V')
  var newSymbol = newSymbol.replace(/\.VN$/, '.V')
  var newSymbol = newSymbol.replace(/-CF$/, '.CN')

  return newSymbol
}

// Everything below here doesn't use promises and will not be compatible with the newer version 0.0.2 of the facade

// Quote

module.exports.quote = function(symbol, callback) {
  var parameters = {
    function:'GLOBAL_QUOTE', 
    symbol:symbol,
    apikey: secrets.alphaApikey  
  }

  return network.query(serviceUrl, parameters, (json) => {

    if (isDeniedMessage(json)) {
      reject("Denied")
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

    resolve(quotePackage)
  })
}

// Daily


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

