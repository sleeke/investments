const fileService = require('./fileService');
const networkService = require('./networkService');

fileService.symbols((symbols) => {
  if (typeof symbols === 'undefined' || symbols.length == 0) {
    console.log("No symbols found...")
  }
  else {
    for (var symbolIndex = 0; symbolIndex < symbols.length; symbolIndex++) {
      networkService.momentumForSymbol(symbols[symbolIndex])
    }
  }
})
