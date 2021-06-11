const networkImp = require('./iexService');
const alternateNetworkImp = require('./alphaService');

module.exports.init = function() {
  networkImp.init()
}

module.exports.quote = function(symbol, callback, onError) {
  return networkImp.quote(symbol)
}

module.exports.daily = function(symbol) {
  return networkImp.daily(symbol).then({}, function() {
    console.log(`Getting a second opinion for ${symbol}...`)
    return alternateNetworkImp.daily(symbol)
  })
}

module.exports.history = function(symbol) {
    return networkImp.history(symbol).then({}, alternateNetworkImp.history)
}

module.exports.high52w = function(symbol) {
  return networkImp.high52w(symbol)
}

module.exports.rsi = function(symbol) {
  return networkImp.rsi(symbol)
}

module.exports.fundamentals = function(symbol) {
  return alternateNetworkImp.fundamentals(symbol)
}

module.exports.incomeHistory = function(symbol) {
  return alternateNetworkImp.incomeHistory(symbol)
}

