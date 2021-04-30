#! /usr/bin/env node

const yargs = require('yargs');

// Local modules
const flags = require('./flags');
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

function analyze(symbol) {
  printSymbolHeader(symbol);

  // Setup container
  var symbolAnalysisOutput = {}
  symbolAnalysisOutput.symbol = symbol
  utils.addLinks(symbolAnalysisOutput, symbol)

  // Optional data
  if (flags.include.rawSymbolData) {
    global.analysisOutput.symbols.push(symbolAnalysisOutput)
  }
  if (flags.include.fundamentals) {
    promiseChain = dataCollection.addFundamentals(promiseChain, symbolAnalysisOutput)
  }
  if (flags.include.high52w) {
    promiseChain = dataCollection.addRatioTo52wHigh(promiseChain, symbol, symbolAnalysisOutput)
  }
  if (flags.include.rsi) {
    promiseChain = dataCollection.addRsi(promiseChain, symbol, symbolAnalysisOutput)
  }

  // Defaults
  var promiseChain = dataCollection.getDailyData(symbol, symbolAnalysisOutput)
  promiseChain = categorizeSymbol(promiseChain, symbolAnalysisOutput)
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

//=======//
// UTILS //
//=======//

function printSymbolHeader(symbol) {
  console.log('\n');
  console.log(utils.info(utils.stringOfChars('=', symbol.length)));
  console.log(utils.info(symbol));
  console.log(utils.info(utils.stringOfChars('=', symbol.length)));
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

symbolIteration.loadSymbolsFromFileAndThen(filename, analyze)