const utils = require('./utils');

//=============//
// DEBUG FLAGS //
//=============//

const debugMomentum = false
const debugGreenDays = false

//=========//
// EXPORTS //
//=========//

module.exports.analyze = function(dailyData, analysisOutput) {
  return new Promise(function(resolve, reject) {
    if (typeof dailyData != 'undefined' && dailyData.length > 0) {
      console.log(`\n${utils.textColor.FgBlue}Momentum Analysis:${utils.textColor.Reset}\n`)
      
      analysisOutput.momentumAnalysis = {}
      
      greenDays(dailyData, analysisOutput.momentumAnalysis)
      momentum(dailyData, analysisOutput.momentumAnalysis)

      volatility(dailyData, analysisOutput)
    }

    resolve(analysisOutput)
  }) 
}

module.exports.current = function(quoteData, analysisOutput) {
  return new Promise(function(resolve, reject) {
    if (typeof quoteData != 'undefined') {
      quoteData = sanitizeDailyStats(quoteData)
  
      outputDailyStats(quoteData, analysisOutput)
  
      resolve(analysisOutput)
    }
    reject('Quote Data is undefined in analysis.current')
  })
}

//==========//
// ANALYSIS //
//==========//

// TODO: Find a way to gauge even rise, e.g. 
//  - Avg. daily range
//  - Num up days

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
    lastClose: utils.roundPrice(previousClose),
    firstLow: utils.roundPrice(array[firstValidIndex]['low'])
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
      momentum.firstLow = utils.roundPrice(array[index]['low'])
      
      momentum.streak = momentum.streak + 1
    }
    else {
      // Contiguous momentum is no more...
      momentum.magnitude = utils.roundPercent((momentum.lastClose / momentum.firstLow - 1) * 100)
      
      // Console
      console.log(utils.colorizeString(1, 2, momentum.streak, `Streak: ${momentum.streak} day(s)`))
      console.log(utils.colorizeString(3, 5, momentum.magnitude, `Magnitude: ${momentum.magnitude}% (${momentum.firstLow} - ${momentum.lastClose})`))
      
      // JSON
      momentumAnalysis.streakDays = momentum.streak
      momentumAnalysis.magnitude = {
        'min' : momentum.firstLow,
        'max' : momentum.lastClose,
        'percentChange' : momentum.magnitude,
      }

      if (momentum.streak > 0) {
        momentumAnalysis.magnitude.dailyPercentChange = utils.roundPercent(momentum.magnitude / momentum.streak)
      }

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

// TODO: Green days seems to under-report (1 day instead of 2)
// Not seen in initial case, more testing needed...

// TODO: Accuracy is an issue for lower-value stocks; days are marked as green because they're rounded, e.g. FLYY.CN
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

  console.log(utils.colorizeString(1, 3, greenStreak, `Green days: ${greenStreak}`))

  momentumAnalysis.greenDays = greenStreak
}

//========//
// OUTPUT //
//========//

function sanitizeDailyStats(quoteData) {
  var sanitizationNecessary = false

  if (quoteData.price == null) {
    sanitizationNecessary = true
    quoteData.price = quoteData.prevClose
  }

  quoteData.sanitized = sanitizationNecessary
  
  return quoteData
}

function outputDailyStats(dayStats, analysisOutput) {
  var dayRange = dayStats.high - dayStats.low
  var dayPosition = (dayStats.price - dayStats.low) / dayRange
  var formattedDayPosition = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 1 }).format(dayPosition * 100)
  var formattedChangePercent = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 1 }).format(dayStats.changePercent)

  var statusText = 'Current status'
  
  if (dayStats.sanitized) {
    statusText += ' [sanitized data]'
  }

  console.log(utils.info(`\n${statusText}:\n`))

  console.log(`Price: ${dayStats.price}`)
  console.log(utils.colorizeString(0.4, 0.6, dayPosition, `Day position: ${formattedDayPosition}%`))
  console.log(utils.colorizeString(0, 0, dayStats.changePercent, `Change: ${formattedChangePercent}%`))

  analysisOutput.currentStatus = {}
  var currentStatus = analysisOutput.currentStatus
  currentStatus.price = dayStats.price
  currentStatus.dayPositionPercent = dayPosition * 100
  currentStatus.changePercent = dayStats.changePercent 
}

//========//
// RATIOS //
//========//

module.exports.percent52wHigh = function(high52w, analysisOutput) {
  return new Promise(function (resolve, reject) {
    var currentPrice = analysisOutput.currentStatus.price
    var percent52wHigh = currentPrice / high52w
    var formattedPercent = utils.roundPercent(percent52wHigh * 100)
  
    console.log(utils.info('\nRatio to current highs\n'))
    console.log(utils.colorizeString(0.8, 0.95, percent52wHigh, `52w: ${formattedPercent}%`))
  
    var ratios = analysisOutput.ratios = {}
    ratios.percent52w = formattedPercent
  
    resolve(analysisOutput)
  })
}

//============//
// INDICATORS //
//============//

module.exports.rsi = function(rsiData, analysisOutput) {
  return new Promise(function (resolve, reject) {

    var rsi = rsiData.indicator[0][0]

    console.log(utils.info('\nRSI\n'))
    console.log(utils.colorizeStringInBand(66, 80, rsi, rsi))

    var indicators = analysisOutput.indicators = {}
    indicators.rsi = rsi

    resolve(analysisOutput)
  })
}

//================//
// CATEGORIZATION //
//================//

// TODO: Allow more than one categry, e.g. EVEN, RISER, BREAKOUT
module.exports.categorize = function(symbolAnalysisOutput) {
  return new Promise(function (resolve, reject) {
    var momentumAnalysis = symbolAnalysisOutput.momentumAnalysis
    
    symbolAnalysisOutput.categories = []
    if (strongRecentMomentum(momentumAnalysis)) {
      if (highDailyChange(momentumAnalysis)) {
        symbolAnalysisOutput.categories.push('ROCKET')
      }
      else {
        symbolAnalysisOutput.categories.push('RISER')
      }
    }
    if (closeTo52wHigh(symbolAnalysisOutput)) {
      symbolAnalysisOutput.categories.push('BREAKOUT')
    }
    if (nonVolatile(symbolAnalysisOutput)) {
      symbolAnalysisOutput.categories.push('STEADY')
    }

    resolve(symbolAnalysisOutput)
  })
}

function nonVolatile(symbolAnalysisOutput) {
  return symbolAnalysisOutput.volatility['5day'] < 10
}

function strongRecentMomentum(momentumAnalysis) {
  return momentumAnalysis.greenDays >= 2 
      && momentumAnalysis.streakDays >= 2
}

function highDailyChange(momentumAnalysis) {
  return momentumAnalysis.magnitude.dailyPercentChange > 10
}

function closeTo52wHigh(symbolAnalysis) {
  return symbolAnalysis.ratios.percent52w > 95
}

function volatility(dailyData, symbolAnalysis) {
  symbolAnalysis.volatility = {}
  console.log(utils.info('\nVolatility\n'))

  var numDays = 5
  var first = dailyData[numDays - 1].close
  var last = dailyData[0].close
  var dailyAveragePercent = (last / first - 1) * 100 / numDays

  var sum = 0
  for (index = 0; index < numDays; index++) {
    var percentChangeSinceStart = (dailyData[index].close / first - 1) * 100
    var reverseIndex = numDays - index
    sum += Math.abs(percentChangeSinceStart - reverseIndex * dailyAveragePercent)
  }

  var normalizedVolatility = sum / dailyAveragePercent
  symbolAnalysis.volatility['5day'] = normalizedVolatility
  console.log(utils.colorizeStringInBand(0, 5, normalizedVolatility, `5-day:: ${normalizedVolatility}`))
}
