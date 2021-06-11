#! /usr/bin/env node

const yargs = require('yargs');

// Local modules
const settings = require('./holdingPatternSettings');
const global = require('./settings');
const utils = require('./utils');
const symbolIteration = require('./symbolIteration');
const dataCollection = require('./dataCollection');
const fileService = require('./storage/fileService');

var symbolInfo = []

processArgs()

function process(symbols, symbolIndex) {
  
  // Exit condition
  if (symbolIndex >= symbols.length) {
    fileService.saveObject(symbols, settings.settings.outFile)
    return
  }

  var symbol = symbols[symbolIndex]
  console.log(`Processing ${symbol.ticker}`)

  utils.addLinks(symbol, symbol.ticker)

  // Process sequence
  var promiseChain = dataCollection.getMovingAverage(symbol.ticker, 20)
  promiseChain = updateData(promiseChain, symbol)
  promiseChain = nextSymbol(promiseChain, symbols, symbolIndex)

  // Error catching
  promiseChain
  .catch(function(errorText) {
    console.log(`${utils.textColor.FgRed}${errorText}${utils.textColor.Reset}`)
    symbol['error'] = errorText
    nextSymbol(promiseChain, symbols, symbolIndex)
  }) 
}

function updateData(promiseChain, symbol) {
  return promiseChain
  .then(symbolOutput => {
    symbol.ma = symbolOutput.ma
    var newStop = utils.roundStop(symbol.ma * (100 + symbol.offsetPercent) / 100)
    if (utils.isCanadian(symbol.ticker)) {
      symbol.newLimit = utils.roundStop(symbol.newStop * 0.99) // Limit is 1% below stop by default for canadian stocks  
    }
    symbol.newStop = newStop
  })
}

function nextSymbol(promiseChain, symbols, symbolIndex) {
  return promiseChain
  .then(_ => {
    process(symbols, symbolIndex + 1)
  }) 
}

//=======//
// UTILS //
//=======//

function processArgs() {
  const argv = yargs
  .option('inFile', {
    description: 'A file with symbols to analyse',
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
    
    if (typeof(argv.inFile) != 'undefined') {
      settings.settings.symbolFile = argv.inFile
      console.log(`${utils.textColor.FgBlue}Loading symbols from '${settings.settings.symbolFile}'${utils.textColor.Reset}\n`)
    }

    // Data validity

    if (argv.sandbox) {
      console.log(`${utils.textColor.FgBlue}Using sandbox...\n${utils.textColor.Reset}`)
      global.debug.sandbox = true
    }
    else if (argv.realData) {
      console.log(`${utils.textColor.FgBlue}NOT using sandbox...\n${utils.textColor.Reset}`)
      global.debug.sandbox = false
    }
  }

  begin()
}

function begin() {
  dataCollection.init()

  symbolInfo = symbolIteration.loadJsonFileAndThen(settings.settings.symbolFile, process)
}


