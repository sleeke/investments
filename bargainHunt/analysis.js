const { daily } = require('./network/iexService');
const utils = require('./utils');
const settings = require('./settings')

//=============//
// DEBUG FLAGS //
//=============//

const debugMomentum = false
const debugGreenDays = false

//=========//
// EXPORTS //
//=========//

// TODO: Can we categorize based on the MA trend over the last X sessions?

module.exports.analyze = function(dailyData, analysisOutput) {
  return new Promise(function(resolve, reject) {
    if (typeof dailyData != 'undefined' && dailyData.length > 0) {
      
      if (typeof(analysisOutput.summary) == 'undefined') {
        analysisOutput.summary = {}
      }

      momentumAnalysis = {}
      greenDays(dailyData, momentumAnalysis)
      momentum(dailyData, momentumAnalysis)

      momentumAnalysis.maTrend = getMaAnalysis(dailyData, analysisOutput)
      analysisOutput.momentumAnalysis = momentumAnalysis

      buyZoneApproach = {}
      analyzeBuyZone(dailyData, buyZoneApproach)
      analysisOutput.buyZoneApproach = buyZoneApproach

      volatility(dailyData, analysisOutput)
    }

    resolve(analysisOutput)
  }) 
}

function getMaAnalysis(dailyData, analysisOutput) {
  var maTrend = {}
  maTrend.version = "MA-Ap-0.2.3"
  maTrend.ma20 = getMaAnalysisForMaPeriod(dailyData, 20)
  maTrend.ma50 = getMaAnalysisForMaPeriod(dailyData, 50)

  analysisOutput.summary.ma20Trend = maTrendSummary(maTrend.ma20.value)
  analysisOutput.summary.ma50Trend = maTrendSummary(maTrend.ma50.value)
}

function maTrendSummary(trendValue) {
  var sufficientTrend = Math.pow(1.08, (1.0 / 20)) - 1

  if (trendValue < 0) {
    return "NEGATIVE"
  }
  else if (trendValue < sufficientTrend / 2) {
    return "PUNY"
  }
  else if (trendValue < sufficientTrend) {
    return "WEAK"
  }
  else if (trendValue >= sufficientTrend) {
    return "STRONG"
  }

}

function getMaAnalysisForMaPeriod(dailyData, movingAveragePeriod) {
  maTrend = {}

  maTrend.value = utils.roundTrend(movingAverageTrend(dailyData, movingAveragePeriod))
  maTrend.gainAt20Sessions = Math.pow((1 + maTrend.value), 20) 

  return maTrend
}

function separateTheWheatFromTheChaff(analysisOutput) {
  var pass = true
  var ma20Rejected = false
  var ma50Rejected = false

  settings.filters.movingAverage.reject.forEach(rejectedMaTrend => {
    if (analysisOutput.summary.ma20Trend == rejectedMaTrend) {
      ma20Rejected = rejectedMaTrend
    }

    if (analysisOutput.summary.ma50Trend == rejectedMaTrend) {
      ma50Rejected = rejectedMaTrend
    }
  })

  if (ma20Rejected != false && ma50Rejected != false) {
    pass = {
      rejectionReason: `MA20 is ${ma20Rejected} and MA50 is ${ma50Rejected}`
    }
  }

  if (pass == true) {
    settings.filters.category.required.forEach(requiredCategory => {
      if (!analysisOutput.summary.categories.includes(requiredCategory)) {
        pass = {
          rejectionReason: `Does not fulfill ${requiredCategory}`
        }
      }
    })
  }

  if (pass == true) {
    var tempBool = false
    settings.filters.category.desired.forEach(desiredCategory => {
      if (analysisOutput.summary.categories.includes(desiredCategory)) {
        tempBool = true
      }
    })

    if (tempBool != true) {
      pass = {
        rejectionReason: `Does not fulfill any of the desired categories: ${settings.filters.category.desired}`
      }
    }
  }

  return pass
}

module.exports.current = function(quoteData, analysisOutput) {
  return new Promise(function(resolve, reject) {
    if (typeof quoteData != 'undefined') {
      quoteData = sanitizeDailyStats(quoteData)
  
  
      resolve(analysisOutput)
    }
    reject('Quote Data is undefined in analysis.current')
  })
}

module.exports.fundamentals = function(fundamentals, symbolAnalysisOutput) {
  return new Promise(function(resolve, reject) {
    symbolAnalysisOutput.fundamentals = fundamentals


    resolve(symbolAnalysisOutput)
  })
}

module.exports.incomeHistory = function(incomeHistory, symbolAnalysisOutput) {
  return new Promise(function(resolve, reject) {
    symbolAnalysisOutput.incomeHistory = incomeHistory


    resolve(symbolAnalysisOutput)
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

function analyzeBuyZone(dailyStats, buyZoneApproach) {
  var ma20 = calculateMovingAverage(dailyStats, 20)
  var prevMa20 = calculateMovingAverage(dailyStats.slice(1, dailyStats.length), 21)

  var lastPrice = dailyStats[0].close
  var prevClose = dailyStats[1].close

  buyZoneApproach.percentFromAverage = utils.roundPercent((lastPrice / ma20 - 1) * 100)
  buyZoneApproach.aboveMa20 = buyZoneApproach.percentFromAverage > 0
  buyZoneApproach.approachingMa20 = lastPrice < prevClose
  buyZoneApproach.closeToMa20 = isCloseToPrice(lastPrice, ma20, settings.quantifiers.percentFromAverage)
  if (prevMa20 >= 0) {
    buyZoneApproach.positiveMa20Trend = ma20 > prevMa20
  }
}

function approachingBuyZone(symbolAnalysis) {
  var buyZoneApproach = symbolAnalysis.buyZoneApproach

  return buyZoneApproach.aboveMa20
    && (buyZoneApproach.approachingMa20 || buyZoneApproach.closeToMa20)
}

function calculateMovingAverage(dailyStats, movingAverageLength) {
  if (dailyStats.length < movingAverageLength) return -1

  var movingAverage = 0
  for (var dayIndex = 0; dayIndex < movingAverageLength; dayIndex++) {

    movingAverage += dailyStats[dayIndex].close

    if (dailyStats[dayIndex].close == 0) {
      // Special case for zero trades in a day (seems like a bug in the data)
      movingAverage += dailyStats[dayIndex + 1].close
    }
  }

  return movingAverage / movingAverageLength
}

function isCloseToPrice(price, target, rangePercent) {
  return (price / target < (1 + rangePercent / 100))
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


  momentumAnalysis.greenDays = greenStreak
}

// MOVING AVERAGES

function maxMovingAverageTrend(dailyStats, period) {
  var maxMa20Trend = -1000
  for (offset = 0; offset < period; offset++) {
    var ma20 = calculateMovingAverage(dailyStats.slice(offset, dailyStats.length), 20)
    var prevMa20 = calculateMovingAverage(dailyStats.slice(offset + 1, dailyStats.length), 20)
    if (prevMa20 > 0) {
      maxMa20Trend = Math.max(maxMa20Trend, ma20 / prevMa20 - 1)
    }
  }

  return maxMa20Trend
}

function movingAverageTrend(dailyStats, movingAveragePeriod) {
  // TODO: This is perhaps a little inefficient, since this is also calculated elsewhere
  var ma = calculateMovingAverage(dailyStats, movingAveragePeriod)
  var prevMa = calculateMovingAverage(dailyStats.slice(1, dailyStats.length), movingAveragePeriod)

  return ma / prevMa - 1
}

module.exports.getMovingAverageCompliance = function(dailyData, baseObject) {
  baseObject.movingAverageCompliance = {
    version: "0.3",
    ma20: getMovingAverageComplianceForPeriod(dailyData, 20),
    ma50: getMovingAverageComplianceForPeriod(dailyData, 50)
  }
}

module.exports.getMovingAverage = function(dailyData, period) {
  return getMovingAverageDataForSingleDay(dailyData, period - 1, period)
}

module.exports.holdingPattern = function(dailyData, period) {
  return getMovingAverageDataForSingleDay(dailyData, period - 1, period)
}

// TODO: Calculate the percentage of days which are not flat
function getMovingAverageComplianceForPeriod(dailyData, period) {
  var compliance = 0
  var significantMovingAverageDelta = 0.0015  // Admittedly, guesswork from a few charts

  var numValidSessions = 0
  for(var dayIndex = period; dayIndex < dailyData.length; dayIndex++) {
    var movingAverageData = getMovingAverageDataForSingleDay(dailyData, dayIndex, period, 1)

    if (Math.abs(movingAverageData.delta) > significantMovingAverageDelta) {
      compliance += movingAverageData.deviation * movingAverageData.delta >= 0 ? 1 : -1
      numValidSessions++
    }
  }

  return compliance / numValidSessions
}

function movingAverageForOffset(dailyData, endIndex, period) {
  var startIndex = endIndex - period + 1
  var movingAverageArray = dailyData.slice(startIndex, startIndex + period)
  return calculateMovingAverage(movingAverageArray, period)
}

/**
 * 
 * @param {array} dailyData - A list of price data for each day that is required to calculate the moving average  
 * @param {integer} dayIndex - The day for which to get moving average data
 * @param {integer} period - The period of the moving average
 * @param {integer} direction - The direction of the data; -1 if newest first, +1 if oldest first
 * @returns 
 */
function getMovingAverageDataForSingleDay(dailyData, dayIndex, period, direction) {
  // TODO: Standardize array direction and remove this requirement
  if (typeof direction == 'undefined') {
    direction = -1  // Assume newest first, since that is used in most cases
  }

  var close = dailyData[dayIndex].close

  var movingAverage = movingAverageForOffset(dailyData, dayIndex, period)
  var prevMovingAverage = movingAverageForOffset(dailyData, dayIndex - direction, period)

  return {
    ma: movingAverage,
    delta: movingAverage / prevMovingAverage - 1,
    deviation: close / movingAverage - 1
  }
}

module.exports.getAllMovingAverageData = function(dailyData, baseObject) {
  var periods = [20, 50]
  var movingAverageData = {}
  var maxPeriod = Math.max(...periods)

  periods.forEach (period => {
    var maPeriod = {}
    maPeriod.ma = []
    maPeriod.delta = []
    maPeriod.deviation = []
    for(var dayIndex = maxPeriod; dayIndex < dailyData.length; dayIndex++) {
      var movingAverageDataForDay = getMovingAverageDataForSingleDay(dailyData, dayIndex, period)
  
      maPeriod.delta.push(movingAverageDataForDay.delta)
      maPeriod.ma.push(movingAverageDataForDay.ma)
      maPeriod.deviation.push(movingAverageDataForDay.deviation)
    }

    movingAverageData[`ma${period}`] = maPeriod
  })

  // Adjust the ranges to all match
  baseObject.dailyData = dailyData.slice(maxPeriod, dailyData.length)
  baseObject.movingAverageData = movingAverageData

  return baseObject
}

// RANGES

module.exports.rangeData = function(dailyData) {
  var rangeData = {
    min: 0,
    max: 0,
    avg: 0
  }

  var dayRanges = []

  for (var dayIndex = 0; dayIndex < dailyData.length; dayIndex++) {
    var singleDay = dailyData[dayIndex]
    var singleDayRange = (singleDay.close / singleDay.open - 1) * 100

    dayRanges.push(singleDayRange)

    rangeData.max = Math.max(rangeData.max, singleDayRange)
    rangeData.min = Math.min(rangeData.min, singleDayRange)
    rangeData.avg += singleDayRange
  }

  rangeData.avg = utils.roundPercent(rangeData.avg / dailyData.length)
  rangeData.min = utils.roundPercent(rangeData.min)
  rangeData.max = utils.roundPercent(rangeData.max)
  rangeData.stdDev = utils.roundPercent(utils.stdDeviation(dayRanges))
  rangeData.goodDay = utils.roundPercent(rangeData.avg + rangeData.stdDev)

  return rangeData
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


    var indicators = analysisOutput.indicators = {}
    indicators.rsi = rsi

    resolve(analysisOutput)
  })
}

//================//
// CATEGORIZATION //
//================//

module.exports.categorize = function(symbolAnalysisOutput) {
  return new Promise(function (resolve, reject) {
    var momentumAnalysis = symbolAnalysisOutput.momentumAnalysis
    
    if (typeof(symbolAnalysisOutput.summary) == 'undefined') {
      symbolAnalysisOutput.summary = {}
    }
    symbolAnalysisOutput.summary.categories = []

    symbolAnalysisOutput.categories = []
    if (strongRecentMomentum(momentumAnalysis)) {
      if (highDailyChange(momentumAnalysis)) {
        symbolAnalysisOutput.summary.categories.push('ROCKET')
      }
      else {
        symbolAnalysisOutput.summary.categories.push('RISER')
      }
    }
    if (closeTo52wHigh(symbolAnalysisOutput)) {
      symbolAnalysisOutput.summary.categories.push('BREAKOUT')
    }
    if (nonVolatile(symbolAnalysisOutput)) {
      symbolAnalysisOutput.summary.categories.push('STEADY')
    }
    if (approachingBuyZone(symbolAnalysisOutput)) {
      symbolAnalysisOutput.summary.categories.push('APPROACHING BUY ZONE')
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
  if (typeof symbolAnalysis.ratios == `undefined`) return false

  return symbolAnalysis.ratios.percent52w > 95
}

function volatility(dailyData, symbolAnalysis) {
  symbolAnalysis.volatility = {}

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
}

module.exports.filter = function(symbolAnalysisOutput) {
  return new Promise(function(resolve, reject) {
    var passFail = separateTheWheatFromTheChaff(symbolAnalysisOutput)
    if (passFail != true) {
      reject(passFail.rejectionReason)
    }

    resolve(symbolAnalysisOutput)
  })
}