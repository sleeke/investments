const yargs = require('yargs');

// Local modules
const analysis = require('./analysis');
const fileService = require('./storage/fileService');
const networkService = require('./network/networkFacade');
const utils = require('./utils');

var filename = "storage/symbols.txt"
var symbolIndex = 0
var globalSymbols
global.analysisOutput = {
  'symbols' : [],
  'categories' : {}
}

processArgs()

fileService.symbols(filename, (symbols) => {
  if (typeof symbols === 'undefined' || symbols.length == 0) {
    console.log("No symbols found...")
  }
  else {
    globalSymbols = symbols
    analyze(symbols[0])
  }
})

function analyze(symbol) {
  console.log('\n')
  console.log(utils.info(utils.stringOfChars('=', symbol.length)))
  console.log(utils.info(symbol))
  console.log(utils.info(utils.stringOfChars('=', symbol.length)))

  var symbolAnalysisOutput = {}
  symbolAnalysisOutput.symbol = symbol
  global.analysisOutput.symbols.push(symbolAnalysisOutput)

  networkService.daily(symbol)
  .then(dailyData => analysis.analyze(dailyData, symbolAnalysisOutput))
  .then(symbolAnalysisOutput => networkService.quote(symbol)
  .then(quoteData => analysis.current(quoteData, symbolAnalysisOutput)))
  .then(symbolAnalysisOutput => networkService.high52w(symbol)
  .then(high52w => analysis.percent52wHigh(high52w, symbolAnalysisOutput)))
  .then(symbolAnalysisOutput => networkService.rsi(symbol)
  .then(rsi => analysis.rsi(rsi, symbolAnalysisOutput)))
  .then(symbolAnalysisOutput => analysis.categorize(symbolAnalysisOutput))
  .then(symbolAnalysisOutput => networkService.fundamentals(symbolAnalysisOutput.symbol))
  .then(fundamentals => analysis.fundamentals(fundamentals, symbolAnalysisOutput))
  .then(symbolAnalysisOutput => networkService.incomeHistory(symbolAnalysisOutput.symbol))
  .then(incomeHistory => analysis.incomeHistory(incomeHistory, symbolAnalysisOutput))
  .then(symbolAnalysisOutput => nextSymbol(symbolAnalysisOutput))
  .catch(function(errorText) {
    console.log(`${utils.textColor.FgRed}${errorText}${utils.textColor.Reset}`)
    symbolAnalysisOutput['error'] = errorText
    nextSymbol(symbolAnalysisOutput)
  })
}

function nextSymbol(symbolAnalysisOutput) {
  return new Promise(function(resolve, reject) {
    for (symbolCategoryIndex in symbolAnalysisOutput.categories) {
      var categoryName = symbolAnalysisOutput.categories[symbolCategoryIndex]
      
      var categoryInOutput = global.analysisOutput.categories[`${categoryName}`]
      if (typeof categoryInOutput == `undefined`) {
        // No symbols have been added for this category
        categoryInOutput = global.analysisOutput.categories[`${categoryName}`] = []
      }
  
      categoryInOutput.push(symbolAnalysisOutput)
    }

    // Exit condition for last symbol
    if (symbolIndex >= globalSymbols.length - 1) {
      fileService.saveAnalysis(global.analysisOutput)
      resolve()
    }

    // Increment the index and get the next symbol
    symbolIndex++
    var symbol = globalSymbols[symbolIndex]
    resolve(analyze(symbol))  
  })
}

function processArgs() {
  const argv = yargs
  .command('inFile', 'Specifies a file containing symbols', {
    filename: {
      description: 'The file to use',
      alias: 'f', 
      type: 'string',
    }
  })
  .help()
  .alias('help', 'h')
  .argv
  
  if (typeof argv._ != 'undefined' && argv._.includes('inFile')) {
    filename = argv.filename

    console.log(`\n${utils.textColor.FgBlue}Loading symbols from '${filename}'${utils.textColor.Reset}\n`)
  }
}
