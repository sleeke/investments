const networkService = require('./network/networkFacade');
const analysis = require('./analysis');
const fileService = require('./storage/fileService')
const settings = require('./settings')

module.exports.init = function() {
  networkService.init()
}

module.exports.getDailyData = function(symbol, symbolAnalysisOutput) {
  return networkService.daily(symbol)
    .then(dailyData => analysis.analyze(dailyData, symbolAnalysisOutput))
    .then(symbolAnalysisOutput => networkService.quote(symbol)
    .then(quoteData => analysis.current(quoteData, symbolAnalysisOutput)));
}

module.exports.getMovingAverageCompliance = function(symbol, symbolAnalysisOutput) {
  if (settings.settings.forChart == true) {
    return networkService.history(symbol)
    .then(dailyData => analysis.getAllMovingAverageData(dailyData, symbolAnalysisOutput))
    .then(symbolAnalysisOutput => outputDataToFile(symbolAnalysisOutput, "testing.json"))
  }
  else {
    return networkService.history(symbol)
    .then(dailyData => analysis.getMovingAverageCompliance(dailyData, symbolAnalysisOutput))
  }
}

function outputDataToFile(jsonData, filename) {
  fileService.saveObject(jsonData, filename)
}

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
