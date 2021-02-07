const networkImp = require('./iexService');

module.exports.quote = function(symbol, callback, onError) {
  networkImp.quote(symbol, callback, onError)
}

module.exports.daily = function(symbol, callback, onError) {
  networkImp.daily(symbol, callback, onError)
}