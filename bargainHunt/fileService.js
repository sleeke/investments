// npm modules
const { Console } = require("console");
var fs = require("fs");

// Local modules
const utils = require('./utils');

module.exports.symbols = function (callback) {
  getFileData("symbols.txt", (data) => {
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