const secrets = require('./secrets');

const request = require('request')

var myArgs = process.argv.slice(2);

// var commandLineSymbol = myArgs[0];
// if (typeof commandLineSymbol === 'undefined') {
//   this.momentumForSymbol(commandLineSymbol)
// }

var myUrl = 'https://www.alphavantage.co/query'

module.exports.momentumForSymbol = function(symbol) {
  var parameters = {
    function:'TIME_SERIES_DAILY', 
    symbol:symbol,
    apikey: secrets.apikey  
  }

  request({url: myUrl, qs: parameters}, function(err, response, body) {
    if(err) { 
    console.log(err); return; 
  }

  var json = JSON.parse(response.body)
  getMomentum(symbol, json["Time Series (Daily)"])
});
}

function getMomentum(symbol, dailyTimeSeries) {
  var array = Object.keys(dailyTimeSeries).map(function(k) {
    return dailyTimeSeries[k];
  });

  const openKey = '1. open'
  const highKey = '2. high'
  const lowKey = '3. low'
  const closeKey = '4. close'

  var previousClose = array[0][closeKey]
  var momentum = {
    symbol: symbol,
    streak: 0,
    magnitude: -1,
    lastClose: previousClose,
    firstLow: array[0][lowKey]
  }

  for (index = 1; index < array.length; index++) {
    var newClose = array[index][closeKey]

    if (newClose < previousClose) {
      // Contiguous momentum found
      previousClose = newClose
      momentum.firstLow = array[index][lowKey]
      
      momentum.streak = momentum.streak + 1
    }
    else {
      // Contiguous momentum is no more...
      momentum.magnitude = (momentum.lastClose / momentum.firstLow - 1) * 100
      var formattedMin = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 3 }).format(momentum.firstLow)
      var formattedMax = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 3 }).format(momentum.lastClose)
      var formattedMag = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 3 }).format(momentum.magnitude)
      
      console.log(`${symbol} streak: ${momentum.streak}, ${formattedMag}% (${formattedMin} - ${formattedMax})`)
      
      break
    }
  }
}