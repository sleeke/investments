#! /usr/bin/env node

const yargs = require('yargs');

// Local modules
const settings = require('./settings');
const utils = require('./utils');
const symbolIteration = require('./symbolIteration');
const defaults = require('./defaults');
const dataCollection = require('./dataCollection');

// Command line arguments
var filename = defaults.inputFile
var testing = false

global.analysisOutput = {
  'symbols' : [],
  'categories' : {}
}

processArgs()

function init() {
  dataCollection.init()
}

function analyze(symbol) {
  console.log(`Analyzing ${symbol}...`)

  // Setup container
  var symbolAnalysisOutput = {}
  symbolAnalysisOutput.symbol = symbol
  utils.addLinks(symbolAnalysisOutput, symbol)

  if (settings.include.rawSymbolData) {
    global.analysisOutput.symbols.push(symbolAnalysisOutput)
  }

  // Defaults
  // TODO: allow date-range searches
  var promiseChain = dataCollection.getMovingAverageCompliance(symbol, symbolAnalysisOutput)
  promiseChain = symbolIteration.moveToNextSymbol(promiseChain, analyze)

  // Error catching
  promiseChain
  .catch(function(errorText) {
    console.log(`${utils.textColor.FgRed}${errorText}${utils.textColor.Reset}`)
    symbolAnalysisOutput['error'] = errorText
    symbolIteration.nextSymbol(symbolAnalysisOutput, analyze)
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
  .option('forChart', {
    description: 'Output history data for charting',
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
    }
    else if (argv.realData) {
      console.log(`${utils.textColor.FgBlue}NOT using sandbox...\n${utils.textColor.Reset}`)
    }

    // Output

    if (typeof(argv.forChart) != 'undefined') {
      if (typeof(argv.symbol) == `undefined`) {
        console.log(`\n${utils.textColor.FgRed}Charting should only be used with a single symbol...\n${utils.textColor.Reset}`)
        process.exit(1)
      }
      settings.settings.forChart = true
      settings.settings.outFile = `History-${settings.settings.symbol}.json`
    }
  }  

  begin()
}

function begin() {
  init()

  if (argv.sandbox) {
    console.log(`\n${utils.textColor.FgBlue}Using sandbox...\n${utils.textColor.Reset}`)
    settings.debug.sandbox = true
  }
  else if (argv.realData) {
    console.log(`\n${utils.textColor.FgBlue}NOT using sandbox...\n${utils.textColor.Reset}`)
    settings.debug.sandbox = false
  }
}
