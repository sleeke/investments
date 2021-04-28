// =====
// FLAGS
// =====

// Set paid API key enabled/disabled
module.exports.debugMode = false 

module.exports.include = {
  
  // Use AlphaVantage to include fundamental and historical data for a _limited_ rage of symbols
  fundamentals: false,

  // Include the array of all symbols as well as the categorized list
  rawSymbolData: false 

  // TODO: Add flags for more stuff, in order to be most efficient on credits, e.g.
  // - RSI
  // - 52w High

}

