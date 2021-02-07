const networkImp = require('./iexService');

module.exports.quote = function(symbol, callback, onError) {
  return networkImp.quote(symbol)
}

module.exports.daily = function(symbol) {
  return networkImp.daily(symbol)
}