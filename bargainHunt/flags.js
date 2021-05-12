// =====
// FLAGS
// =====

// Set paid API key enabled/disabled
module.exports.sandbox = false 

// Add various debugging modes
module.exports.debug = {

  // Output compliance debugging data
  compliance: false

}

module.exports.include = {
  
  // Use AlphaVantage to include fundamental and historical data for a _limited_ rage of symbols
  fundamentals: false,

  // Include the array of all symbols as well as the categorized list
  rawSymbolData: true,

  // Include RSI value
  rsi: false,

  // Include 52-week high 
  high52w: false

}

