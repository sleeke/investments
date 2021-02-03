const secrets = require('./secrets');

const request = require('request')

var symbol = 'ASML'

var myUrl = 'https://www.alphavantage.co/query'
var parameters = {
  function:'TIME_SERIES_DAILY', 
  symbol:symbol,
  apikey: secrets.apikey  
}

request({url: myUrl, qs: parameters}, function(err, response, body) {
    if(err) { 
    console.log(err); return; 
  }

  console.log("Get response: " + response.statusCode);
  console.log(response.body.children);

  var json = JSON.parse(response.body)
  getMomentum(json["Time Series (Daily)"])
});

function getMomentum(dailyTimeSeries) {
  var array = Object.keys(dailyTimeSeries).map(function(k) {
    return dailyTimeSeries[k];
  });

  const lowKey = '3. low'
  const highKey = '2. high'

  var previousHigh = array[0][highKey]
  var momentum = {
    symbol: symbol,
    streak: 0,
    magnitude: -1,
    lastHigh: previousHigh,
    firstLow: array[0][lowKey]
  }

  for (index = 1; index < array.length; index++) {
    var newHigh = array[index][highKey]

    if (newHigh < previousHigh) {
      // Contiguous momentum found
      previousHigh = newHigh
      momentum.firstLow = array[index][lowKey]
      
      momentum.streak = momentum.streak + 1
    }
    else {
      // COntiguous momentum is no more...
      momentum.magnitude = (momentum.lastHigh / momentum.firstLow - 1) * 100
      var formattedMin = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 3 }).format(momentum.firstLow)
      var formattedMax = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 3 }).format(momentum.lastHigh)
      var formattedMag = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 3 }).format(momentum.magnitude)
      
      console.log(`${symbol} streak: ${momentum.streak}, ${formattedMag}% (${formattedMin} - ${formattedMax})`)
      
      break
    }
  }
}