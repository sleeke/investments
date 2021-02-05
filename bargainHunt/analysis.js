// Local modules

const utils = require('./utils');

// Model 

const openKey = '1. open'
const highKey = '2. high'
const lowKey = '3. low'
const closeKey = '4. close'

// Debug flags

const debugMomentum = false

// Exports

module.exports.analyze = function(symbol, dailyTimeSeries) {
  console.log(symbol)
  console.log(utils.stringOfChars('=', symbol.length))

  var dailyData = dailyTimeSeriesToArray(dailyTimeSeries)
  greenDays(dailyData)
  momentum(dailyData)
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

function outputDailyStats(dayStats) {
  console.log(dayStats)
}