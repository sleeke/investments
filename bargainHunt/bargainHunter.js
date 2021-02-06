// Local modules
const analysis = require('./analysis');
const fileService = require('./storage/fileService');
const networkService = require('./network/networkFacade');

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
  quote(symbol)

  // networkService.timeSeriesDaily(symbol, (symbol, timeSeriesDaily) => {
  //   analysis.analyze(symbol, timeSeriesDaily)
  //   quote(symbol)
  // })
}

function quote(symbol) {
  networkService.quote(symbol, (quotePackage) => {
    analysis.current(symbol, quotePackage)

    // symbolIndex++
    // if (symbolIndex < globalSymbols.length) {
    //   nextSymbol()
    // }
  })
}

function nextSymbol() {
  analyze(globalSymbols[symbolIndex])
}
