// Local modules
const analysis = require('./analysis');
const fileService = require('./storage/fileService');
const networkService = require('./network/networkFacade');
const utils = require('./utils');

var symbolIndex = 0
var globalSymbols

fileService.symbols((symbols) => {
  if (typeof symbols === 'undefined' || symbols.length == 0) {
    console.log("No symbols found...")
  }
  else {
    globalSymbols = symbols
    nextSymbol()
  }
})

function analyze(symbol) {
  console.log('\n')
  console.log(utils.info(utils.stringOfChars('=', symbol.length)))
  console.log(utils.info(symbol))
  console.log(utils.info(utils.stringOfChars('=', symbol.length)))

  networkService.daily(symbol)
  .then(function(dailyData) {
    return new Promise(function(resolve, reject) {
      resolve(analysis.analyze(dailyData))
    })
  })
  .then(function() {
    return new Promise(function(resolve, reject) {
      resolve(quote(symbol))
    })
  })
  .then(function(currentPrice) {
    return new Promise(function(resolve, reject) {
      resolve(percent52wHigh(symbol, currentPrice))
    })
  })
  .then(nextSymbol)
}

function quote(symbol) {
  return networkService.quote(symbol)
    .then(analysis.current)
}

function percent52wHigh(symbol, currentPrice) {
  return networkService.high52w(symbol)
    .then(function(high52w) {
      return new Promise(function(resolve, reject) {
        resolve(analysis.percent52wHigh(high52w, currentPrice))
      })
    })    
}

function nextSymbol() {
  if (symbolIndex >= globalSymbols.length) {
    return
  }

  var symbol = globalSymbols[symbolIndex]

  // Timeout is a hacky way of avoiding concurrency issues messing up the results ;) 
  setTimeout(() => {analyze(symbol)}, 200)

  symbolIndex++
}
