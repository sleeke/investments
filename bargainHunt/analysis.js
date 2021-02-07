// Local modules

const { quote } = require('./network/networkService');
const utils = require('./utils');

// Debug flags

const debugMomentum = false
const debugGreenDays = false

// Exports

module.exports.analyze = function(dailyData) {
  if (typeof dailyData != 'undefined' && dailyData.length > 0) {
    console.log(`\n${utils.textColor.FgBlue}Momentum Analysis:${utils.textColor.Reset}\n`)
    greenDays(dailyData)
    momentum(dailyData)
  }
}

// Analysis

function momentum(array) {

  var previousClose = array[0]['close']
  var momentum = {
    streak: 0,
    magnitude: -1,
    lastClose: previousClose,
    firstLow: array[0]['low']
  }

  for (index = 1; index < array.length; index++) {
    if (debugMomentum) {
      console.log(`Today - ${index}`)
      console.log(array[index])
    }

    var newClose = array[index]['close']

    if (newClose < previousClose) {
      // Contiguous momentum found
      previousClose = newClose
      momentum.firstLow = array[index]['low']
      
      momentum.streak = momentum.streak + 1
    }
    else {
      // Contiguous momentum is no more...
      momentum.magnitude = (momentum.lastClose / momentum.firstLow - 1) * 100
      var formattedMin = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 3 }).format(momentum.firstLow)
      var formattedMax = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 3 }).format(momentum.lastClose)
      var formattedMag = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 3 }).format(momentum.magnitude)
      
      console.log(colorizeString(0, 0, momentum.streak, `Streak: ${momentum.streak} day(s)`))
      console.log(colorizeString(3, 5, momentum.magnitude, `Magnitude: ${formattedMag}% (${formattedMin} - ${formattedMax})`))
      
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
    if (debugGreenDays) {
      console.log(`Today - ${index}`)
      console.log(array[index])
    }

    if (array[index]['close'] > array[index]['open']) {
      greenStreak++
    }
    else {
      break
    }
  }

  console.log(colorizeString(0, 0, greenStreak, `Green days: ${greenStreak}`))
}

module.exports.current = function(quoteData) {
  if (typeof quoteData != 'undefined') {
    outputDailyStats(quoteData)
  }
}

function outputDailyStats(dayStats) {
  var dayRange = dayStats['high'] - dayStats['low']
  var dayPosition = (dayStats['price'] - dayStats['low']) / dayRange
  var formattedDayPosition = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 1 }).format(dayPosition * 100)
  var formattedChangePercent = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 1 }).format(dayStats['changePercent'])

  console.log(utils.info('\nCurrent status:\n'))
  console.log(`Price: ${dayStats['price']}`)
  console.log(colorizeString(0.4, 0.6, dayPosition, `Day position: ${formattedDayPosition}%`))
  console.log(colorizeString(0, 0, dayStats['changePercent'], `Change: ${formattedChangePercent}%`))
}

function colorizeString(badValue, goodValue, value, string) {
  if (value >= goodValue) {
    string = utils.textColor.FgGreen + string + utils.textColor.Reset
  }
  else if (value <= badValue) {
    string = utils.textColor.FgRed + string + utils.textColor.Reset
  }

  return string
}

