const fileService = require('./storage/fileService');
const settings = require('./settings');

module.exports.globalSymbols = []
var symbolIndex = 0

module.exports.moveToNextSymbol = function(promiseChain, onSuccess, onComplete) {
  return promiseChain.then(symbolAnalysisOutput => module.exports.nextSymbol(symbolAnalysisOutput, onSuccess, onComplete))
}

module.exports.nextSymbol = function(symbolAnalysisOutput, onSuccess, onComplete) {
  return new Promise(function(resolve, reject) {
    // Exit condition for last symbol
    if (symbolIndex >= module.exports.globalSymbols.length - 1) {
      sumUp()
      resolve(onComplete())
    }

    // Increment the index and get the next symbol
    symbolIndex++
    var symbol = module.exports.globalSymbols[symbolIndex]
    resolve(onSuccess(symbol))  
  })  
}

function sumUp() {
  sortResults()

  fileService.saveObject(global.analysisOutput, settings.settings.outFile)
}

function sortResults() {
  for (var category in global.analysisOutput.categories) {
    global.analysisOutput.categories[category].sort((first, second) => {
      return first.buyZoneApproach.percentFromAverage - second.buyZoneApproach.percentFromAverage
    })
  }
}

module.exports.loadSymbolsFromFileAndThen = function(filename, onSuccess) {
  fileService.symbols(filename, (symbols) => {
    if (typeof symbols === 'undefined' || symbols.length == 0) {
      console.log("No symbols found...")
    }
    else {
      module.exports.globalSymbols = symbols
      onSuccess(symbols[0])
    }
  })
}

module.exports.loadJsonFileAndThen = function(filename, onSuccess) {
  fileService.getFileData(filename, (fileData) => {
    if (typeof(fileData) === 'undefined' || fileData.length == 0) {
      console.log("No symbols found")
    }
    else {
      onSuccess(JSON.parse(fileData), 0)
    }
  })
}