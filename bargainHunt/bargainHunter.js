#! /usr/bin/env node

const yargs = require('yargs');

// Local modules
const settings = require('./settings');
const analysis = require('./analysis');
const utils = require('./utils');
const symbolIteration = require('./symbolIteration');
const defaults = require('./defaults');
const dataCollection = require('./dataCollection');

var filename = defaults.inputFile
global.analysisOutput = {
  'symbols' : [],
  'categories' : {}
}

processArgs()

// TODO: Add command line arguments to restrict to certain categories and MA strengths (add settings module?)
// TODO: Standardise section for categories, e.g. WEAK, RISER in a similar place

function analyze(symbol) {
  console.log(`Analyzing ${symbol}...`)

  // Setup container
  var symbolAnalysisOutput = {}
  symbolAnalysisOutput.symbol = symbol
  utils.addLinks(symbolAnalysisOutput, symbol)

  // Optional data
  if (settings.include.rawSymbolData) {
    global.analysisOutput.symbols.push(symbolAnalysisOutput)
  }
  if (settings.include.fundamentals) {
    promiseChain = dataCollection.addFundamentals(promiseChain, symbolAnalysisOutput)
  }
  if (settings.include.high52w) {
    promiseChain = dataCollection.addRatioTo52wHigh(promiseChain, symbol, symbolAnalysisOutput)
  }
  if (settings.include.rsi) {
    promiseChain = dataCollection.addRsi(promiseChain, symbol, symbolAnalysisOutput)
  }

  // Defaults
  var promiseChain = dataCollection.getDailyData(symbol, symbolAnalysisOutput)
  promiseChain = categorizeSymbol(promiseChain, symbolAnalysisOutput)
  promiseChain = applyCategories(promiseChain, symbolAnalysisOutput)
  promiseChain = symbolIteration.moveToNextSymbol(promiseChain, analyze)

  // Error catching
  promiseChain
  .catch(function(errorText) {
    console.log(`${utils.textColor.FgRed}${errorText}${utils.textColor.Reset}`)
    symbolAnalysisOutput['error'] = errorText
    symbolIteration.nextSymbol(symbolAnalysisOutput, analyze)
  })
}

function categorizeSymbol(promiseChain, symbolAnalysisOutput) {
  return promiseChain
  .then(_ => analysis.categorize(symbolAnalysisOutput))
}

function applyCategories(promiseChain, symbolAnalysisOutput) {
  return promiseChain
  .then(symbolAnalysisOutput => {
    for (symbolCategoryIndex in symbolAnalysisOutput.categories) {
      var categoryName = symbolAnalysisOutput.categories[symbolCategoryIndex]
      
      var categoryInOutput = global.analysisOutput.categories[`${categoryName}`]
      if (typeof categoryInOutput == `undefined`) {
        // No symbols have been added for this category
        categoryInOutput = global.analysisOutput.categories[`${categoryName}`] = []
      }
  
      categoryInOutput.push(symbolAnalysisOutput)
    }

  })
}

//=======//
// UTILS //
//=======//

function processArgs() {
  const argv = yargs
  .option('symbolFile', {
    description: 'A file with symbols to analyse',
    type: 'string',
  })
  .option('symbol', {
    description: 'Which symbol to analyse. Overrides inFile',
    type: 'string',
  })
  .option('sandbox', {
    description: 'Run using sandbox data',
    type: 'boolean',
  })
  .option('realData', {
    description: 'Run using real data',
    type: 'boolean',
  })
  .help()
  .alias('help', 'h')
  .argv
  
  if (typeof argv._ != 'undefined') {

    console.log("\n")

    // Symbol loading
    
    if (typeof(argv.symbol) != 'undefined') {
      settings.settings.symbol = argv.symbol
      console.log(`${utils.textColor.FgBlue}Analysing symbol:${settings.settings.symbol}...\n${utils.textColor.Reset}`)
    }
    else if (typeof(argv.inFile) != 'undefined') {
      settings.settings.symbolFile = argv.inFile
      console.log(`${utils.textColor.FgBlue}Loading symbols from '${settings.settings.symbolFile}'${utils.textColor.Reset}\n`)
    }

    // Data validity

    if (argv.sandbox) {
      console.log(`${utils.textColor.FgBlue}Using sandbox...\n${utils.textColor.Reset}`)
      settings.debug.sandbox = true
    }
    else if (argv.realData) {
      console.log(`${utils.textColor.FgBlue}NOT using sandbox...\n${utils.textColor.Reset}`)
      settings.debug.sandbox = false
    }
  }

  begin()
}

function begin() {
  dataCollection.init()
  symbolIteration.loadSymbolsFromFileAndThen(filename, analyze)
}
