const networkImp = require('./iexService');
const alternateNetworkImp = require('./alphaService');

module.exports.init = function() {
  networkImp.init()
}

module.exports.quote = function(symbol, callback, onError) {
  return networkImp.quote(symbol).then({}, async function() {
    console.log(`Getting a second opinion for ${symbol} [quote]...`)
    await new Promise(resolve => setTimeout(resolve, alternateNetworkImp.timeNeededToAvoidLimits))
    return alternateNetworkImp.quote(symbol)
  })
}

module.exports.daily = function(symbol) {
  return networkImp.daily(symbol).then({}, async function() {
    console.log(`Getting a second opinion for ${symbol} [daily]...`)
    await new Promise(resolve => setTimeout(resolve, alternateNetworkImp.timeNeededToAvoidLimits))
    return alternateNetworkImp.daily(symbol)
  })
}

/**
 * Return the price history of the symbol as an array, beginning with the oldest data
 * 
 * @param {string} symbol 
 * @returns 
 */
module.exports.history = function(symbol) {
  return networkImp.history(symbol).then({}, async function() {
    console.log(`Getting a second opinion for ${symbol} [history]...`)
    await new Promise(resolve => setTimeout(resolve, alternateNetworkImp.timeNeededToAvoidLimits))
    return alternateNetworkImp.history(symbol)
  })
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

