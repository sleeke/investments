// ===============
// GLOBAL SETTINGS
// ===============

// Add various debugging modes
module.exports.debug = {

  // Set paid API key enabled/disabled
  sandbox: true,

  // Output compliance debugging data
  compliance: false

}

module.exports.settings = {

  // The default source for symbols if no CLI args are given
  symbolFile: "symbols/symbols.txt",

  // Placeholder for the CLI symbol
  symbol: "IWM",

  // Default output file
  outFile: "output.json",

  // Default value for charting
  forChart: false,

  // The category to use for simple watchlist exports using bargainHunter.js
  categoryForWatchlist: "APPROACHING BUY ZONE"

}

module.exports.filters = {

  movingAverage: {
    reject: [
      "NEGATIVE",
      "PUNY",
      "WEAK"
    ]
  },

  category: {
    required: [],
    desired: [
      "APPROACHING BUY ZONE",
      "ROCKET"
    ]
  }

}

module.exports.include = {
  
  // Use AlphaVantage to include fundamental and historical data for a _limited_ rage of symbols
  fundamentals: false,

  // Include the array of all symbols as well as the categorized list
  rawSymbolData: false,

  // Include RSI value
  rsi: false,

  // Include 52-week high 
  high52w: false

}

module.exports.quantifiers = {

  // Threshold for MA approach (percent)
  percentFromAverage: 5,

  // Moving average period
  maPeriod: 20

}