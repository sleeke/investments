const networkService = require('../bargainHunt/network/networkFacade');
const analysis = require('./analysis');
const fileService = require('../bargainHunt/storage/fileService')
const settings = require('../bargainHunt/settings')
const utils = require('./utils');

module.exports.init = function() {
  networkService.init()
}

//================
// BUILDING BLOCKS
//================

// These methods should return promises which resolve dailyData and accept
// a symbol structure to modify, making them easier to chain together

/**
 * Return the daily array, beginning with the most recent day stats
 */
module.exports.getDailyData = function(symbol) {
  return networkService.daily(symbol)
}

module.exports.getDailyRanges = function(dailyData, symbolAnalysisOutput) {
  return new Promise(function(resolve, reject) {
    var rangeData = analysis.rangeData(dailyData)
    symbolAnalysisOutput.goodDayPercent = rangeData.goodDay
    resolve(dailyData)
  })
}

module.exports.getMovingAverage = function(dailyData, period, symbolAnalysisOutput) {
  return new Promise(function(resolve, reject) {
    var fullMaData = analysis.getMovingAverage(dailyData, period)
    symbolAnalysisOutput.ma = utils.roundPrice(fullMaData.ma)
    symbolAnalysisOutput.maTrend = utils.roundPercent(fullMaData.delta * 100)
    symbolAnalysisOutput.maPeriod = period
    resolve(dailyData)
  })
}

//=================
// CHAINED REQUESTS
//=================

// These are pre-packaged requests which contain a string of promises and do not obey
// the rules outlined for Building Blocks

module.exports.getDailySummary = function(symbol, symbolAnalysisOutput, period) {
  return networkService.daily(symbol)
    .then(dailyData => analysis.analyze(dailyData, symbolAnalysisOutput, period))
    .then(symbolAnalysisOutput => networkService.quote(symbol)
    .then(quoteData => analysis.current(quoteData, symbolAnalysisOutput)));
}

module.exports.getMovingAverageCompliance = function(symbol, symbolAnalysisOutput) {
  if (settings.settings.forChart == true) {
    return networkService.history(symbol)
    .then(dailyData => analysis.getAllMovingAverageData(dailyData, symbolAnalysisOutput))
    .then(symbolAnalysisOutput => outputDataToFile(symbolAnalysisOutput, settings.settings.outFile))
  }
  else {
    return networkService.history(symbol)
    .then(dailyData => analysis.getMovingAverageCompliance(dailyData, symbolAnalysisOutput))
  }
}

//===============
// PROMISE CHAINS
//===============

// These methods create chains of promises by adding to existing chains, and  
// returning/resolving the symbol structures
 
module.exports.addRatioTo52wHigh = function(promiseChain, symbol) {
  return promiseChain
  .then(symbolAnalysisOutput => networkService.high52w(symbol)
  .then(high52w => analysis.percent52wHigh(high52w, symbolAnalysisOutput)))
}

module.exports.addRsi = function(promiseChain, symbol) {
  return promiseChain
  .then(symbolAnalysisOutput => networkService.rsi(symbol)
  .then(rsi => analysis.rsi(rsi, symbolAnalysisOutput)))
}

module.exports.addFundamentals = function(promiseChain, symbolAnalysisOutput) {
  return promiseChain
  .then(symbolAnalysisOutput => networkService.fundamentals(symbolAnalysisOutput.symbol))
  .then(fundamentals => analysis.fundamentals(fundamentals, symbolAnalysisOutput))
  .then(symbolAnalysisOutput => networkService.incomeHistory(symbolAnalysisOutput.symbol))
  .then(incomeHistory => analysis.incomeHistory(incomeHistory, symbolAnalysisOutput))
}

//======
// UTILS
//======

function outputDataToFile(jsonData, filename) {
  fileService.saveObject(jsonData, filename)
}