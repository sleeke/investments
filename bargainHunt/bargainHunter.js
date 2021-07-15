#! /usr/bin/env node

const yargs = require('yargs');

// Local modules
const settings = require('./settings');
const analysis = require('./analysis');
const utils = require('./utils');
const symbolIteration = require('./symbolIteration');
const dataCollection = require('./dataCollection');

global.analysisOutput = {
  'symbols' : [],
  'categories' : {}
}

processArgs()

// TODO: Standardise section for categories, e.g. WEAK, RISER in a similar place
// TODO: Separate WFBZ into up, down, on point 
// TODO: Output CSV list of symbols in each class

function analyze(symbol) {
  console.log(`Analyzing ${symbol}...`)

  // Setup container
  var symbolAnalysisOutput = {}
  symbolAnalysisOutput.symbol = symbol
  utils.addLinks(symbolAnalysisOutput, symbol)

  // Defaults
  var promiseChain = dataCollection.getDailySummary(symbol, symbolAnalysisOutput)
  promiseChain = categorizeSymbol(promiseChain, symbolAnalysisOutput)
  
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
  
  promiseChain = filterSymbol(promiseChain, symbolAnalysisOutput)
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

function filterSymbol(promiseChain, symbolAnalysisOutput) {
  return promiseChain
  .then(_ => analysis.filter(symbolAnalysisOutput))
}

function applyCategories(promiseChain, symbolAnalysisOutput) {
  return promiseChain
  .then(symbolAnalysisOutput => {
    for (symbolCategoryIndex in symbolAnalysisOutput.summary.categories) {
      var categoryName = symbolAnalysisOutput.summary.categories[symbolCategoryIndex]
      
      var categoryInOutput = global.analysisOutput.categories[`${categoryName}`]
      if (typeof categoryInOutput == `undefined`) {
        // No symbols have been added for this category
        categoryInOutput = global.analysisOutput.categories[`${categoryName}`] = []
      }
  
      if (typeof(symbolAnalysisOutput.error) == 'undefined') {
        categoryInOutput.push(symbolAnalysisOutput)
      }
    }
  })
}

//=======//
// UTILS //
//=======//

function processArgs() {
  const argv = utils.setupHelpForSharedCommands(yargs)
  .option('sandbox', {
    description: 'Run using sandbox data',
    type: 'boolean',
  })
  .option('realData', {
    description: 'Run using real data',
    type: 'boolean',
  })
  .option('percentFromAverage', {
    description: 'Maximum distance allowed from moving average to be categorized as APPROACHING BUY ZONE',
    type: 'number',
  })
  .help()
  .alias('help', 'h')
  .argv
  
  if (typeof argv._ != 'undefined') {

    console.log("\n")
    
    utils.processSharedCommandLineArgs(argv)

    // Quantifiers

    if (typeof(argv.percentFromAverage) != 'undefined') {
      settings.quantifiers.percentFromAverage = argv.percentFromAverage
      console.log(`${utils.textColor.FgBlue}Setting MA Approach to ${settings.quantifiers.percentFromAverage}\n${utils.textColor.Reset}`)
    }
  }

  begin()
}

function begin() {
  dataCollection.init()

  if (typeof(settings.settings.symbol) != 'undefined' && settings.settings.symbol.length != 0) {
    analyze(settings.settings.symbol)
  }
  else {
    symbolIteration.loadSymbolsFromFileAndThen(settings.settings.symbolFile, analyze)
  }
}
