const networkImp = require('./alphaService');

module.exports.quote = function(symbol, callback) {
  networkImp.quote(symbol, callback)
}