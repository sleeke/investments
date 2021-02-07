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
  networkService.daily(symbol)
  // .then(console.log)
  .then(analysis.analyze)
  .then(quote(symbol))
    // .then(nextSymbol)
}

function quote(symbol) {
  networkService.quote(symbol, (quotePackage) => {
    analysis.current(symbol, quotePackage)

    symbolIndex++
    if (symbolIndex < globalSymbols.length) {
      nextSymbol()
    }
  }, () => {
    symbolIndex++
    if (symbolIndex < globalSymbols.length) {
      nextSymbol()
    }
  })
}

function nextSymbol() {

  var symbol = globalSymbols[symbolIndex]
  console.log('\n')
  console.log(utils.info(utils.stringOfChars('=', symbol.length)))
  console.log(utils.info(symbol))
  console.log(utils.info(utils.stringOfChars('=', symbol.length)))

  analyze(symbol)
}
