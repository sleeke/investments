const yargs = require('yargs');

// Local modules
const flags = require('./flags');
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

function analyze(symbol) {
  printSymbolHeader(symbol);

  // Setup container
  var symbolAnalysisOutput = {}
  symbolAnalysisOutput.symbol = symbol
  addLinks(symbolAnalysisOutput, symbol)

  // Optional data
  if (flags.include.rawSymbolData) {
    global.analysisOutput.symbols.push(symbolAnalysisOutput)
  }
  if (flags.include.fundamentals) {
    promiseChain = addFundamentals(promiseChain, symbolAnalysisOutput)
  }

  var promiseChain = getDailyData(symbol, symbolAnalysisOutput)
  promiseChain = addRatioTo52wHigh(promiseChain, symbol, symbolAnalysisOutput)
  promiseChain = addRsi(promiseChain, symbol, symbolAnalysisOutput)
  promiseChain = categorizeSymbol(promiseChain, symbolAnalysisOutput)
  promiseChain = moveToNextSymbol(promiseChain, symbolAnalysisOutput)

  // Error catching
  promiseChain
  .catch(function(errorText) {
    console.log(`${utils.textColor.FgRed}${errorText}${utils.textColor.Reset}`)
    symbolAnalysisOutput['error'] = errorText
    nextSymbol(symbolAnalysisOutput)
  })
}

function categorizeSymbol(promiseChain, symbolAnalysisOutput) {
  return promiseChain
  .then(_ => analysis.categorize(symbolAnalysisOutput))
}

//=================//
// DATA COLLECTION //
//=================//

function getDailyData(symbol, symbolAnalysisOutput) {
  return networkService.daily(symbol)
    .then(dailyData => analysis.analyze(dailyData, symbolAnalysisOutput))
    .then(symbolAnalysisOutput => networkService.quote(symbol)
    .then(quoteData => analysis.current(quoteData, symbolAnalysisOutput)));
}

function printSymbolHeader(symbol) {
  console.log('\n');
  console.log(utils.info(utils.stringOfChars('=', symbol.length)));
  console.log(utils.info(symbol));
  console.log(utils.info(utils.stringOfChars('=', symbol.length)));
}

function addRatioTo52wHigh(promiseChain, symbol) {
  return promiseChain
  .then(symbolAnalysisOutput => networkService.high52w(symbol)
  .then(high52w => analysis.percent52wHigh(high52w, symbolAnalysisOutput)))
}

function addRsi(promiseChain, symbol) {
  return promiseChain
  .then(symbolAnalysisOutput => networkService.rsi(symbol)
  .then(rsi => analysis.rsi(rsi, symbolAnalysisOutput)))
}

function addFundamentals(promiseChain, symbolAnalysisOutput) {
  return promiseChain
  .then(symbolAnalysisOutput => networkService.fundamentals(symbolAnalysisOutput.symbol))
  .then(fundamentals => analysis.fundamentals(fundamentals, symbolAnalysisOutput))
  .then(symbolAnalysisOutput => networkService.incomeHistory(symbolAnalysisOutput.symbol))
  .then(incomeHistory => analysis.incomeHistory(incomeHistory, symbolAnalysisOutput))
}

function addLinks(symbolAnalysisOutput, symbol) {
  symbolAnalysisOutput.links = {}
  symbolAnalysisOutput.links.yahooChart = "https://finance.yahoo.com/chart/" + symbol
  symbolAnalysisOutput.links.barChart = "https://www.barchart.com/stocks/" + symbol
}

//==============//
// PROGRAM FLOW //
//==============//

function moveToNextSymbol(promiseChain) {
  return promiseChain.then(symbolAnalysisOutput => nextSymbol(symbolAnalysisOutput))
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

//=======//
// UTILS //
//=======//

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

fileService.symbols(filename, (symbols) => {
  if (typeof symbols === 'undefined' || symbols.length == 0) {
    console.log("No symbols found...")
  }
  else {
    globalSymbols = symbols
    analyze(symbols[0])
  }
})

