const networkService = require('./network/networkFacade');
const analysis = require('./analysis');


module.exports.getDailyData = function(symbol, symbolAnalysisOutput) {
  return networkService.daily(symbol)
    .then(dailyData => analysis.analyze(dailyData, symbolAnalysisOutput))
    .then(symbolAnalysisOutput => networkService.quote(symbol)
    .then(quoteData => analysis.current(quoteData, symbolAnalysisOutput)));
}

module.exports.getMovingAverageCompliance = function(symbol, symbolAnalysisOutput) {
  return networkService.history(symbol)
    .then(dailyData => analysis.getMovingAverageCompliance(dailyData, symbolAnalysisOutput))
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
