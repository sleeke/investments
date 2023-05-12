#! /usr/bin/env node

// const yargs = require('yargs');

// Local modules
const settings = require('./settings');
const utils = require('../shared/utils');
const dataCollection = require('../shared/dataCollection');
const analysis = require('../shared/analysis');

init()
analyze(settings.settings.symbol)

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

  var promiseChain = dataCollection.getDailyData(symbol, 5)
    .then(dailyData => analysis.calculatePremarketCorrelation(dailyData, symbolAnalysisOutput))

  promiseChain = saveToGlobalOutput(promiseChain, symbolAnalysisOutput)

  // Error catching
  promiseChain
  .catch(function(errorText) {
    console.log(`${utils.textColor.FgRed}${errorText}${utils.textColor.Reset}`)
    symbolAnalysisOutput['error'] = errorText
  })
}

function saveToGlobalOutput(promiseChain, symbolAnalysisOutput) {
  return promiseChain.then(_ => global.analysisOutput.symbols.push(symbolAnalysisOutput))
}

function onComplete() {
  // no-op
}

//=======//
// UTILS //
//=======//

function processArgs() {
  const argv = utils.setupHelpForSharedCommands(yargs)
  .option('forChart', {
    description: 'Output history data for charting',
    type: 'boolean',
  })
  .help()
  .alias('help', 'h')
  .argv
  
  console.log("\n")

  utils.processSharedCommandLineArgs(argv)

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
