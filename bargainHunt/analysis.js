// Local modules

const utils = require('./utils');

// Debug flags

const debugMomentum = false
const debugGreenDays = false

// Exports

module.exports.analyze = function(dailyData, analysisOutput) {
  if (typeof dailyData != 'undefined' && dailyData.length > 0) {
    console.log(`\n${utils.textColor.FgBlue}Momentum Analysis:${utils.textColor.Reset}\n`)
    
    analysisOutput['Momentum Analysis'] = {}
    
    greenDays(dailyData, analysisOutput['Momentum Analysis'])
    momentum(dailyData, analysisOutput['Momentum Analysis'])

  }

  return analysisOutput
}

// Analysis

function momentum(array, momentumAnalysis) {
  var firstValidIndex = 0

  for (index = 0; index < array.length; index++) {
    if (utils.isInvalidDay(array[index])) {
      firstValidIndex++
    }
  }

  var previousClose = array[firstValidIndex]['close']
  var momentum = {
    streak: 0,
    magnitude: -1,
    lastClose: previousClose,
    firstLow: array[firstValidIndex]['low']
  }

  for (index = firstValidIndex + 1; index < array.length; index++) {
    if (utils.isInvalidDay(array[index])) {
      index++
      continue
    }

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
      
      console.log(colorizeString(1, 2, momentum.streak, `Streak: ${momentum.streak} day(s)`))
      console.log(colorizeString(3, 5, momentum.magnitude, `Magnitude: ${formattedMag}% (${formattedMin} - ${formattedMax})`))
      
      momentumAnalysis['Streak'] = `${momentum.streak} day(s)`
      momentumAnalysis['Magnitude'] = `${formattedMag}% (${formattedMin} - ${formattedMax})`

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

function greenDays(dailyStats, momentumAnalysis) {
  var array = dailyTimeSeriesToArray(dailyStats)

  var greenStreak = 0
  for (index = 0; index < array.length; index++) {
    if (utils.isInvalidDay(array[index])) {
      index++
      continue
    }

    if (debugGreenDays) {
      console.log(`Today - ${index}`)
      console.log(array[index])
    }

    if (array[index]['close'] >= array[index]['open']) {
      greenStreak++
    }
    else {
      break
    }
  }

  console.log(colorizeString(1, 3, greenStreak, `Green days: ${greenStreak}`))

  momentumAnalysis['Green days'] = greenStreak
}

module.exports.current = function(quoteData, analysisOutput) {
  if (typeof quoteData != 'undefined') {
    quoteData = sanitizeDailyStats(quoteData)

    outputDailyStats(quoteData, analysisOutput)

    return analysisOutput
  }
}

function sanitizeDailyStats(quoteData) {
  var sanitizationNecessary = false

  if (quoteData['price'] == null) {
    sanitizationNecessary = true
    quoteData['price'] = quoteData['prevClose']
  }

  quoteData['sanitized'] = sanitizationNecessary
  
  return quoteData
}

function outputDailyStats(dayStats, analysisOutput) {
  var dayRange = dayStats['high'] - dayStats['low']
  var dayPosition = (dayStats['price'] - dayStats['low']) / dayRange
  var formattedDayPosition = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 1 }).format(dayPosition * 100)
  var formattedChangePercent = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 1 }).format(dayStats['changePercent'])

  var statusText = 'Current status'
  
  if (dayStats['sanitized']) {
    statusText += ' [sanitized data]'
  }

  console.log(utils.info(`\n${statusText}:\n`))

  console.log(`Price: ${dayStats['price']}`)
  console.log(colorizeString(0.4, 0.6, dayPosition, `Day position: ${formattedDayPosition}%`))
  console.log(colorizeString(0, 0, dayStats['changePercent'], `Change: ${formattedChangePercent}%`))

  analysisOutput['Current status'] = {}
  var currentStatus = analysisOutput['Current status']
  currentStatus['price'] = dayStats['price']
  currentStatus['day position %'] = formattedDayPosition
  currentStatus['change %'] = formattedChangePercent 
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

module.exports.percent52wHigh = function(high52w, analysisOutput) {
  var currentPrice = analysisOutput['Current status']['price']
  var percent52wHigh = currentPrice / high52w
  var formattedPercent = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 1 }).format(percent52wHigh * 100)

  console.log(utils.info('\nRatio to current highs\n'))
  console.log(colorizeString(0.8, 0.95, percent52wHigh, `52w: ${formattedPercent}%`))

  var ratios = analysisOutput['Ratio to current highs'] = {}
  ratios['52w %'] = formattedPercent

  return analysisOutput
}
