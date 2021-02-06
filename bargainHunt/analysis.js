// Local modules

const { quote } = require('./network/networkService');
const utils = require('./utils');

// Debug flags

const debugMomentum = false

// Exports

module.exports.analyze = function(symbol, dailyTimeSeries) {
  console.log(symbol)
  console.log(utils.stringOfChars('=', symbol.length))

  if (typeof dailyTimeSeries === 'undefined') {
    console.log(`Error getting DailyTimeSeries for ${symbol}`)
  }
  else {
    var dailyData = dailyTimeSeriesToArray(dailyTimeSeries)
    greenDays(dailyData)
    momentum(dailyData)
  }
}

// Analysis

function momentum(array) {

  var previousClose = array[0][closeKey]
  var momentum = {
    streak: 0,
    magnitude: -1,
    lastClose: previousClose,
    firstLow: array[0][lowKey]
  }

  for (index = 1; index < array.length; index++) {
    if (debugMomentum) {
      outputDailyStats(array[index])
    }

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
      
      console.log(`Streak: ${momentum.streak} day(s)`)
      console.log(`Magnitude: ${formattedMag}% (${formattedMin} - ${formattedMax})`)
      
      break
    }
  }
}

function dailyTimeSeriesToArray(dailyTimeSeries) {
  var array = Object.keys(dailyTimeSeries).map(function(k) {
    return dailyTimeSeries[k];
  });

  return array
}

function greenDays(dailyStats) {
  var array = dailyTimeSeriesToArray(dailyStats)

  var greenStreak = 0
  for (index = 0; index < array.length; index++) {
    if (array[index][closeKey] > array[index][openKey]) {
      greenStreak++
    }
    else {
      break
    }
  }

  console.log(`Green days: ${greenStreak}`)
}

module.exports.current = function(symbol, quoteData) {
  if (typeof quoteData === 'undefined') {
    console.log(`Error getting quoteData for ${symbol}`)
  }
  else {
    outputDailyStats(quoteData)
  }
}

// Utils

function outputDailyStats(dayStats) {
  var dayRange = dayStats['high'] - dayStats['low']
  var dayPosition = (dayStats['price'] - dayStats['low']) / dayRange
  var formattedDayPosition = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 1 }).format(dayPosition)

  console.log('Current status:')
  console.log(`Price: ${dayStats['price']}`)
  console.log(`Day position: ${formattedDayPosition}%`)
  console.log(`Change: ${dayStats['changePercent']}`)
}