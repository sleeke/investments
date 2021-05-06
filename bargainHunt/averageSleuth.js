#! /usr/bin/env node

const yargs = require('yargs');

// Local modules
const flags = require('./flags');
const analysis = require('./analysis');
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

function analyze(symbol) {
  console.log(`Analyzing ${symbol}...`)

  // Setup container
  var symbolAnalysisOutput = {}
  symbolAnalysisOutput.symbol = symbol
  utils.addLinks(symbolAnalysisOutput, symbol)

  if (flags.include.rawSymbolData) {
    global.analysisOutput.symbols.push(symbolAnalysisOutput)
  }

  // Defaults
  // TODO: allow date-range searches
  var promiseChain = dataCollection.getMovingAverageCompliance(symbol, symbolAnalysisOutput, testing)
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
  .command('inFile', 'Specifies a file containing symbols', {
    filename: {
      description: 'The file to use',
      alias: 'f', 
      type: 'string',
    }
  })
  .command('test', 'Outputs test data', {
    filename: {
      description: 'Whether to output test data',
      alias: 't', 
      type: 'boolean',
    }
  })
  .help()
  .alias('help', 'h')
  .argv
  
  if (typeof argv._ != 'undefined') {
    if (argv._.includes('inFile')) {
      filename = argv.filename

      console.log(`\n${utils.textColor.FgBlue}Loading symbols from '${filename}'${utils.textColor.Reset}\n`)
    }
    if (argv._.includes('test')) {
      testing = true
  
      console.log(`\n${utils.textColor.FgBlue}Entering test mode...\n${utils.textColor.Reset}`)
    }
  }  
}

symbolIteration.loadSymbolsFromFileAndThen(filename, analyze)