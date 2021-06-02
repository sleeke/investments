const fileService = require('./storage/fileService');

module.exports.globalSymbols = []
var symbolIndex = 0

module.exports.moveToNextSymbol = function(promiseChain, onSuccess) {
  return promiseChain.then(symbolAnalysisOutput => module.exports.nextSymbol(symbolAnalysisOutput, onSuccess))
}

module.exports.nextSymbol = function(symbolAnalysisOutput, onSuccess) {
  return new Promise(function(resolve, reject) {
    // Exit condition for last symbol
    if (symbolIndex >= module.exports.globalSymbols.length - 1) {
      fileService.saveObject(global.analysisOutput, "output.json")
      resolve()
    }

    // Increment the index and get the next symbol
    symbolIndex++
    var symbol = module.exports.globalSymbols[symbolIndex]
    resolve(onSuccess(symbol))  
  })
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