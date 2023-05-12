const settings = require('../bargainHunt/settings'); // required for processing command line args

// ========
// VALIDITY
// ========

module.exports.isFunction = function(suspectVariable) {
  return (suspectVariable && {}.toString.call(suspectVariable) === '[object Function]')
}

module.exports.isInvalidDay = function(dayData) {
  return dayData['open'] == 0 && dayData['close'] == 0
}

// ===============
// DATA CONVERSION
// ===============

module.exports.stringOfChars = function(char, numChars) {
  return new Array(numChars + 1).join( char );
}

module.exports.dictionaryToArray = function(inputDictionary) {
  var array = Object.keys(inputDictionary).map(function(k) {
    return inputDictionary[k];
  });

  return array
}

// ===================
// STRING MANIPULATION
// ===================

module.exports.textColor = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",
  
  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",
  
  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m"
}

module.exports.info = function(string) {
  return (this.textColor.FgBlue + string + this.textColor.Reset)
}

module.exports.error = function(string) {
  return (this.textColor.FgRed + string + this.textColor.Reset)
}

module.exports.warn = function(string) {
  return (this.textColor.FgYellow + string + this.textColor.Reset)
}

//===========
// FORMATTING
//===========

module.exports.roundTrend = function(number) {
  return parseFloat(number.toFixed(3))
}

module.exports.roundPrice = function(number) {
  return parseFloat(number.toFixed(2))
}

module.exports.roundStop = function(number) {
  return Math.floor(number * 100) / 100   // 2 decimal places
}

module.exports.roundPercent = function(number) {
  return parseFloat(number.toFixed(2))
}

module.exports.colorizeString = function(badValue, goodValue, value, string) {
  if (value >= goodValue) {
    string = this.textColor.FgGreen + string + this.textColor.Reset
  }
  else if (value <= badValue) {
    string = this.textColor.FgRed + string + this.textColor.Reset
  }

  return string
}

module.exports.colorizeStringInBand = function(lowEnd, highEnd, value, string) {
  if (value >= lowEnd && value <= highEnd) {
    string = this.textColor.FgGreen + string + this.textColor.Reset
  }
  else {
    string = this.textColor.FgRed + string + this.textColor.Reset
  }

  return string
}

//===========
// EXTRA INFO
//===========

module.exports.addLinks = function(baseObject, symbol) {
  baseObject.links = {}
  baseObject.links.yahooChart = "https://finance.yahoo.com/chart/" + symbol
  baseObject.links.barChart = "https://www.barchart.com/stocks/" + symbol
}

module.exports.isCanadian = function(symbol) {
  return (symbol.includes(".TO") || symbol.includes(".CN") || symbol.includes(".V"))
}

//============
// CALCULATION
//============

module.exports.stdDeviation = function(inputArray){
  var i,j,total = 0, mean = 0, diffSqredArr = [];
  
  for(i = 0; i < inputArray.length; i += 1) {
      total += inputArray[i];
  }

  mean = total / inputArray.length;
  
  for(j=0;j<inputArray.length;j+=1){
      diffSqredArr.push(Math.pow((inputArray[j] - mean), 2));
  }
  
  return (Math.sqrt(diffSqredArr.reduce(function(firstEl, nextEl){
           return firstEl + nextEl;
         })/inputArray.length));
};

//=============
// COMMAND LINE
//=============

module.exports.processSharedCommandLineArgs = function(argv) {
    
    // Symbol loading
    
    if (typeof(argv.inFile) != 'undefined') {
      delete settings.settings.symbol
      settings.settings.symbolFile = argv.inFile
      console.log(`${this.textColor.FgBlue}Loading symbols from '${settings.settings.symbolFile}'${this.textColor.Reset}\n`)
    }
    else if (typeof(argv.symbol) != 'undefined') {
      settings.settings.symbol = argv.symbol
      console.log(`${this.textColor.FgBlue}Analysing symbol:${settings.settings.symbol}...\n${this.textColor.Reset}`)
    }

    // Output

    if (typeof(argv.outFile) != 'undefined') {
      settings.settings.outFile = argv.outFile
      console.log(`${this.textColor.FgBlue}Setting output file to '${settings.settings.outFile}'${this.textColor.Reset}\n`)
    }

    // Data validity

    if (typeof(argv.sandbox) != 'undefined') {
      console.log(`${this.textColor.FgBlue}Using sandbox...\n${this.textColor.Reset}`)
      settings.debug.sandbox = true
    }
    else if (typeof(argv.realData) != 'undefined') {
      console.log(`${this.textColor.FgBlue}NOT using sandbox...\n${this.textColor.Reset}`)
      settings.debug.sandbox = false
    }

    // Quantifiers

    if (typeof(argv.maPeriod) != 'undefined') {
      settings.quantifiers.maPeriod = argv.maPeriod
      console.log(`${this.textColor.FgBlue}Setting MA period to ${settings.quantifiers.maPeriod}${this.textColor.Reset}`)
    }

    // Filters

    if (typeof(argv.ignoreMa20) != 'undefined') {
      settings.filters.ignoreMa20 = true
      console.log(`${this.textColor.FgBlue}Ignoring MA20${this.textColor.Reset}`)
    }

}

module.exports.setupHelpForSharedCommands = function(argv) {
  return argv.option('inFile', {
    description: 'A file with symbols to analyse',
    type: 'string',
  })
  .option('outFile', {
    description: 'Where to save the results',
    type: 'string',
  })
  .option('symbol', {
    description: 'Which symbol to analyse. Overrides inFile',
    type: 'string',
  })
  .option('maPeriod', {
    description: 'The number of sessions for the moving average',
    type: 'number'
  })
  .option('ignoreMa20', {
    description: 'Set to ignore the MA20'
  })

}