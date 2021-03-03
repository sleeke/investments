// Local modules
const analysis = require('./analysis');
const fileService = require('./storage/fileService');
const networkService = require('./network/networkFacade');
const utils = require('./utils');

var symbolIndex = 0
var globalSymbols
global.analysisOutput = {}

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

  var symbolAnalysisOutput = {}
  global.analysisOutput[`${symbol}`] = symbolAnalysisOutput

  networkService.daily(symbol)
  .then(function(dailyData) {
    return new Promise(function(resolve, reject) {
      resolve(analysis.analyze(dailyData, symbolAnalysisOutput))
    })
  })
  .then(function(symbolAnalysisOutput) {
    return new Promise(function(resolve, reject) {
      resolve(quote(symbol, symbolAnalysisOutput))
    })
  })
  .then(function(symbolAnalysisOutput) {
    return new Promise(function(resolve, reject) {
      resolve(percent52wHigh(symbol, symbolAnalysisOutput))
    })
  })
  .then(function(symbolAnalysisOutput) {
    return new Promise(function(resolve, reject) {
      resolve(nextSymbol())
    })
  }).catch(function(error) {
    console.log(`Error getting data for URL: ${error.options.uri}`)
    nextSymbol(symbolAnalysisOutput)
  })
}

function quote(symbol, symbolAnalysisOutput) {
  return networkService.quote(symbol)
    .then(function(quoteData) {
      return new Promise(function(resolve, reject) {
        resolve(analysis.current(quoteData, symbolAnalysisOutput))
      })
    })
}

function percent52wHigh(symbol, symbolAnalysisOutput) {
  return networkService.high52w(symbol)
    .then(function(high52w) {
      return new Promise(function(resolve, reject) {
        resolve(analysis.percent52wHigh(high52w, symbolAnalysisOutput))
      })
    })    
}

function nextSymbol() {
  if (symbolIndex >= globalSymbols.length) {
    fileService.saveAnalysis(global.analysisOutput)
    return
  }

  var symbol = globalSymbols[symbolIndex]

  // Timeout is a hacky way of avoiding concurrency issues messing up the results ;) 
  setTimeout(() => {analyze(symbol)}, 200)

  symbolIndex++
}

