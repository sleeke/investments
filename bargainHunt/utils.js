module.exports.isFunction = function(suspectVariable) {
  return (suspectVariable && {}.toString.call(suspectVariable) === '[object Function]')
}

module.exports.stringOfChars = function(char, numChars) {
  return new Array(numChars + 1).join( char );
}

module.exports.dictionaryToArray = function(inputDictionary) {
  var array = Object.keys(inputDictionary).map(function(k) {
    return inputDictionary[k];
  });

  return array
}