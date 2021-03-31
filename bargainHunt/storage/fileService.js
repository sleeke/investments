// npm modules
const { Console } = require("console");
var fs = require("fs");

// Local modules
const utils = require('../utils');

module.exports.symbols = function (filename, callback) {
  getFileData(filename, (data) => {
    symbolsFromFileData (data, callback)
  })
}

function getFileData(filename,  callback) {
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

module.exports.saveAnalysis = function(outputJson) {
  fs.writeFile('output.json', JSON.stringify(outputJson, null, 2), function (err) {
    if (err) return console.log(err)
  })
}
