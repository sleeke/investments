const networkImp = require('./iexService');
const networkImp_fundamentals = require('./alphaService');

module.exports.quote = function(symbol, callback, onError) {
  return networkImp.quote(symbol)
}

module.exports.daily = function(symbol) {
  return networkImp.daily(symbol)
}

module.exports.high52w = function(symbol) {
  return networkImp.high52w(symbol)
}

module.exports.rsi = function(symbol) {
  return networkImp.rsi(symbol)
}

module.exports.fundamentals = function(symbol) {
  return networkImp_fundamentals.fundamentals(symbol)
}

module.exports.incomeHistory = function(symbol) {
  return networkImp_fundamentals.incomeHistory(symbol)
}

