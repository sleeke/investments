#! /usr/bin/env node

const yargs = require('yargs');

// Local modules
const settings = require('./settings');
const utils = require('./utils');
const symbolIteration = require('./symbolIteration');
const defaults = require('./defaults');
const dataCollection = require('./dataCollection');

init()
processArgs()

function init() {
  dataCollection.init()

  if (settings.settings.forChart == false) {
    global.analysisOutput = {
      'symbols' : [],
      'categories' : {}
    }
  }
}

function analyze(symbol) {
  if (typeof(symbol) == 'undefined') {
    return
  }

  console.log(`Analyzing ${symbol}...`)

  // Setup container
  var symbolAnalysisOutput = {}
  symbolAnalysisOutput.symbol = symbol

  if (settings.settings.forChart == false) {
    utils.addLinks(symbolAnalysisOutput, symbol)
  }

  // Defaults
  // TODO: allow date-range searches
  var promiseChain = dataCollection.getMovingAverageCompliance(symbol, symbolAnalysisOutput)

  promiseChain = saveToGlobalOutput(promiseChain, symbolAnalysisOutput)
  
  if (settings.settings.forChart == false) {
    promiseChain = symbolIteration.moveToNextSymbol(promiseChain, analyze)
  }
  
  // Error catching
  promiseChain
  .catch(function(errorText) {
    console.log(`${utils.textColor.FgRed}${errorText}${utils.textColor.Reset}`)
    symbolAnalysisOutput['error'] = errorText
    symbolIteration.nextSymbol(symbolAnalysisOutput, analyze)
  })
}

function saveToGlobalOutput(promiseChain, symbolAnalysisOutput) {
  return promiseChain.then(_ => global.analysisOutput.symbols.push(symbolAnalysisOutput))
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
  .option('forChart', {
    description: 'Output history data for charting',
    type: 'boolean',
  })
  .help()
  .alias('help', 'h')
  .argv
  
  console.log("\n")

  // Symbol loading
  
  if (typeof(argv.inFile) != 'undefined') {
    delete settings.settings.symbol
    settings.settings.symbolFile = argv.inFile
    console.log(`${utils.textColor.FgBlue}Loading symbols from '${settings.settings.symbolFile}'${utils.textColor.Reset}\n`)
  }
  else if (typeof(argv.symbol) != 'undefined') {
    settings.settings.symbol = argv.symbol
    console.log(`${utils.textColor.FgBlue}Analysing symbol:${settings.settings.symbol}...\n${utils.textColor.Reset}`)
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

  // Output

  if (typeof(argv.forChart) != 'undefined') {
    if (typeof(argv.symbol) == `undefined`) {
      console.log(`\n${utils.textColor.FgRed}Charting should only be used with a single symbol...\n${utils.textColor.Reset}`)
      process.exit(1)
    }
    settings.settings.forChart = true
    settings.settings.outFile = "./display/chartData.json"
  }

  begin()
}

function begin() {
  init()

  if (typeof(settings.settings.symbol) != 'undefined' && settings.settings.symbol.length != 0) {
    console.log(settings.settings.symbol)

    analyze(settings.settings.symbol)
  }
  else {
    symbolIteration.loadSymbolsFromFileAndThen(settings.settings.symbolFile, analyze)
  }
}
