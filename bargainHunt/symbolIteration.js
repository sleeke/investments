const fileService = require('./storage/fileService');

module.exports.globalSymbols
var symbolIndex = 0

module.exports.moveToNextSymbol = function(promiseChain, onSuccess) {
  return promiseChain.then(symbolAnalysisOutput => module.exports.nextSymbol(symbolAnalysisOutput, onSuccess))
}

module.exports.nextSymbol = function(symbolAnalysisOutput, onSuccess) {
  return new Promise(function(resolve, reject) {
    for (symbolCategoryIndex in symbolAnalysisOutput.categories) {
      var categoryName = symbolAnalysisOutput.categories[symbolCategoryIndex]
      
      var categoryInOutput = global.analysisOutput.categories[`${categoryName}`]
      if (typeof categoryInOutput == `undefined`) {
        // No symbols have been added for this category
        categoryInOutput = global.analysisOutput.categories[`${categoryName}`] = []
      }
  
      categoryInOutput.push(symbolAnalysisOutput)
    }

    // Exit condition for last symbol
    if (symbolIndex >= module.exports.globalSymbols.length - 1) {
      fileService.saveAnalysis(global.analysisOutput)
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