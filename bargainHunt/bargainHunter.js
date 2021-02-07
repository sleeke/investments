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
  .then(analysis.analyze)
  .then(quote(symbol))
  .then(nextSymbol)
}

function quote(symbol) {
  return networkService.quote(symbol)
    .then(analysis.current)
}

function nextSymbol() {
  if (symbolIndex >= globalSymbols.length) {
    return
  }

  var symbol = globalSymbols[symbolIndex]
  analyze(symbol)

  symbolIndex++
}
