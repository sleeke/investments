// =====
// FLAGS
// =====

// Set paid API key enabled/disabled
module.exports.debugMode = false 

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

