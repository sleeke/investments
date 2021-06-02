// npm modules
var fs = require("fs");
var settings = require("../settings")

// Local modules
const utils = require('../utils');

module.exports.symbols = function (filename, callback) {
  this.getFileData(filename, (data) => {
    symbolsFromFileData (data, callback)
  })
}

module.exports.getFileData = function(filename,  callback) {
  fs.readFile(filename, "utf-8", (err, data) => {
    if (err) { console.log(err) }
  
    if (utils.isFunction(callback)) {
      callback(data)
    }
  })  
}

function symbolsFromFileData(data, callback) {
  if (utils.isFunction(callback)) {
    callback(data.split('\n'))
  }
}

function outputSymbols(symbols) {
  console.log(`Found ${symbols.length} tickers:`)

  for (var index = 0; index < symbols.length; index++) {
    console.log(`${index + 1}: ${symbols[index]}`)
  }
}

module.exports.saveObject = function(outputJson, filename) {
  console.log("Saving object to file: " + filename)
  if (typeof(filename) == 'undefined') {
    filename = settings.settings.outFile
  }
  fs.writeFile(filename, JSON.stringify(outputJson, null, 2), function (err) {
    if (err) return console.log(err)
  })
}
