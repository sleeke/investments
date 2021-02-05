module.exports.isFunction = function(suspectVariable) {
  return (suspectVariable && {}.toString.call(suspectVariable) === '[object Function]')
}

module.exports.stringOfChars = function(char, numChars) {
  return new Array(numChars + 1).join( char );
}