const networkImp = require('./alphaService');

module.exports.quote = function(symbol, callback) {
  networkImp.quote(symbol, callback)
}

module.exports.daily = function(symbol, callback) {
  networkImp.daily(symbol, callback)
}