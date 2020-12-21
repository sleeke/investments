// Mining BarChart.com for values
// To imput into google sheets

// Formatters

function getValuesFormattedForSheet() {
  var output = "";

  output += getFundamentalAnalysisFormula();
  output += "\t--\t--\t";
  output += getCurrentValue() + "\t";
  output += getPriceEarnings() + "\t";
  output += getPriceSalesFormula() + "\t";
  output += getPriceBook() + "\t";
  output += getPriceCashFlow() + "\t";

  output += getHighsAndLows() + "\t";
  output += percentAnalystValuation() + "\t";
  output += percent52wMax() + "\t";
  output += volatility3m();
  
  console.log(output);

  copy("" + output);
}

function getFundamentalAnalysisFormula() {
  // Based on S&P averages
  var targetPriceEarnings = 15.81;
  var targetPriceSales = 1.56;
  var targetPriceBook = 2.82;
  var targetPriceCashflow = 20;

  if (!isStock()) {
    return "--";
  }

  var output = "=";

  output +=  `if(${getOffsetFormula(4)} = "-", -10,   -(${getOffsetFormula(4)}/${targetPriceEarnings}-1))`;
  output += `+if(${getOffsetFormula(5)} = "-", -20, -2*(${getOffsetFormula(5)}/${targetPriceSales}-1))`;
  output += `+if(${getOffsetFormula(6)} = "-",   0,   -(${getOffsetFormula(6)}/${targetPriceBook}-1))`;
  output += `+if(${getOffsetFormula(7)} = "-",   0,   -(${getOffsetFormula(7)}/${targetPriceCashflow}-1))`;
  
  return output;
}

function getHighsAndLows() {
  return `${get52wHigh()}\t${get3mLow()}\t${get3mHigh()}`;
}

function percentAnalystValuation() {
  return `=${getOffsetFormula(-8)}/${getOffsetFormula(-9)}`
}

function percent52wMax() {
  return `=${getOffsetFormula(-9)}/${getOffsetFormula(-4)}`
}

function volatility3m() {
  return `=${getOffsetFormula(-3)}/${getOffsetFormula(-4)}-1`
}

function getOffsetFormula(columns) {
  return 'OFFSET(INDIRECT("RC", FALSE),0,'+columns+')'; 
}

function getPriceSalesFormula() {
  if (!isStock()) {
    return "--";
  }
  
  return "=" + getCurrentValue() + "/(" + getSales() + "/" + getShares() + ")";
}

// Value finders

function getCurrentValue() {
  var unsanitized = document.getElementsByClassName("last-change")[0].innerHTML;  
  return sanitize(unsanitized);
}

function getShares() {
  if (!isStock()) {
    return "--";
  }

  var unsanitized = getTopHalfRows().childNodes[3].childNodes[3].innerText;
  unsanitized += "000";
  return sanitize(unsanitized);
}

function getSales() {
  if (!isStock()) {
    return "--";
  }

  var unsanitized = getTopHalfRows().childNodes[5].childNodes[3].innerText;
  return sanitize(unsanitized);
}

function getPriceCashFlow() {
  if (!isStock()) {
    return "--";
  }

  var unsanitized = getTopHalfRows().childNodes[13].childNodes[3].innerText;
  return sanitize(unsanitized);
}

function getPriceBook() {
  if (!isStock()) {
    return "--";
  }

  var unsanitized = getTopHalfRows().childNodes[15].childNodes[3].innerText;
  return sanitize(unsanitized);
}

function getPriceEarnings() {
  if (!isStock()) {
    return "--";
  }

  var unsanitized = getBottomHalfRows().childNodes[1].childNodes[3].innerText;
  return sanitize(unsanitized);
}

function get52wHigh() {
  var high = getHighValue(2);
  if (high == null) {
    return sanitize(get3mHigh());
  }

  return sanitize(high);
}

function get3mHigh() {
  var high = getHighValue(1);
  if (high == null) {
    return sanitize(getHighValue(0));
  }

  return sanitize(getHighValue(1));
}

function get3mLow() {
  var low = getLowValue(1);
  if (low == null) {
    return sanitize(getLowValue(0));
  }
  return sanitize(getLowValue(1));
}

// Block finders

function getBarchartContentBlock() {
  return document.getElementsByClassName("barchart-content-block");
}

function getFundamentals() {
  var barchartContentBlock = getBarchartContentBlock();
  var blockContent = barchartContentBlock[0].getElementsByClassName("block-content");

  return blockContent;
}

function getTopHalfRows() {
  return getFundamentals()[0].childNodes[1].childNodes[1].childNodes[1];
}

function getBottomHalfRows() {
  return getFundamentals()[0].childNodes[1].childNodes[3].childNodes[1];
}

function getPerformanceTable() {
  return document.getElementsByClassName("symbol-price-performance")[0].getElementsByClassName("bc-table-scrollable-inner")[0];
}

function getLowValue(period) {
  var element = getPerformanceTable().getElementsByClassName("cell-period-low")[period+1];  // Since the first instance is the header
  if (typeof element == 'undefined') {
    return null;
  }
  return element.getElementsByClassName("price")[0].childNodes[1].innerText;
}

function getHighValue(period) {
  var element = getPerformanceTable().getElementsByClassName("cell-period-high")[period+1];  // Since the first instance is the header
  if (typeof element == 'undefined') {
    return null;
  }
  return element.getElementsByClassName("price")[0].childNodes[1].innerText;
}

// Utils

function sanitize(unsanitized) {
  var sanitized = unsanitized;

  if (unsanitized == "N/A") {
    return "-";
  }

  if (unsanitized.endsWith(" K")) {
    sanitized = sanitized.substring(0, unsanitized.length - 2) + "000";
  }

  if (unsanitized.endsWith(" M")) {
    sanitized = sanitized.substring(0, unsanitized.length - 2) + "000000";
  }

  sanitized = sanitized.replace(/,/g, "");
  return sanitized;
}

function isStock() {
  var barchartContentBlock = getBarchartContentBlock();
  return barchartContentBlock[0].innerText.startsWith("Fundamentals")
}
