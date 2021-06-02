var labels = []
var closeValues = []
var volumeValues = []
var maValues = []
var maPostiveDeltaValues = []
var maNegativeDeltaValues = []
var maDeviationValues = []
var maCompliance = []

// TODO: Name the symbol on the chart
// TODO: Allow both MA20 and MA50 to be displayed on the same chart and toggled

Chart.defaults.scale.grid.display = false
Chart.defaults.scale.display = false

readJson()
  .then(_ => {
    var ctx = document.getElementById('myChart').getContext('2d');
    var myChart = new Chart(ctx, {
    data: {
      labels: labels,
      datasets: [{
          type: 'bar',
          label: '+ve Delta',
          data: maPostiveDeltaValues,
          backgroundColor: [
            'rgba(0, 128, 0, 0.1)'
          ],
          borderColor: [
            'rgba(0, 128, 0, 0.1)'
          ],
          barPercentage: 1,
          barWidth: 'flex',
          yAxisID: 'delta',
          radius: 0
      },
      {
          type: 'bar',
          label: '-ve Delta',
          data: maNegativeDeltaValues,
          borderWidth:0,
          backgroundColor: [
            'rgba(252, 0, 0, 0.1)'
          ],
          borderColor: [
            'rgba(252, 0, 0, 0.1)'
          ],
          barPercentage: 1,
          barWidth: 'flex',
          borderSkipped: false,
          yAxisID: 'delta',
          radius: 0
      },
      {
          type: 'line',
          label: 'Close',
          data: closeValues,
          backgroundColor: [
            'rgba(0, 0, 0, 0.3)'
          ],
          borderColor: [
            'rgba(0, 0, 0, 0.3)'
          ],
          borderWidth: 1,
          yAxisID: 'close',
          radius: 0
      },
      {
          type: 'line',
          label: 'MA',
          data: maValues,
          backgroundColor: [
            'rgba(50, 128, 235, 1)'
          ],
          borderColor: [
            'rgba(50, 128, 235, 1)'
          ],
          borderWidth: 2,
          yAxisID: 'close',
          radius: 0
      },
      {
          type: 'line',
          label: 'Deviation',
          data: maDeviationValues,
          backgroundColor: [
            'rgba(229, 99, 42, 0.8)'
          ],
          borderColor: [
            'rgba(229, 99, 42, 0.8)'
          ],
          borderWidth: 2,
          yAxisID: 'delta',
          radius: 0
      },
      {
          type: 'line',
          label: 'Compliance',
          data: maCompliance,
          backgroundColor: [
            'rgba(114, 211, 255, 0.8)'
          ],
          borderColor: [
            'rgba(114, 211, 255, 0.8)'
          ],
          borderWidth: 2,
          yAxisID: 'delta',
          radius: 0
      }],
    }
  })
})

function readJson() {
  return fetch('chartData.json')
  .then(response => {
    if (!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    return response.json();
  })
  .then(json => {
    processData(json);
  })
  .catch(function () {
    this.dataError = true;
  })
}


function processData(data) {
  
  // Daily data
  var dailyData = data.dailyData
  dailyData.forEach(element => {
    labels.push(element.date)
    closeValues.push(element.close)
    volumeValues.push(element.volume)
  });

  // MA data
  var maData = getMaData(data)
  maData.ma.forEach(element => {
    maValues.push(element)
  })
  maData.delta.forEach(element => {
    if (element > deltaThreshold) {
      maPostiveDeltaValues.push(1)
      maNegativeDeltaValues.push(0)
    }
    else if (element < -deltaThreshold) {
      maPostiveDeltaValues.push(0)
      maNegativeDeltaValues.push(1)
    }
    else {
      maPostiveDeltaValues.push(0)
      maNegativeDeltaValues.push(0)
    }
  })
  // TODO: Tidy up data here so it's easier to calculate all values without relying iteratively on others, e.g. compliance
  for (var index = 0; index < maData.deviation.length; index++) {
    element = maData.deviation[index]
    if (element >= 0) {
      maDeviationValues.push(0.1)
      if (maNegativeDeltaValues[index] == 0) {
        maCompliance.push(1)
      }
      else {
        maCompliance.push(0.9)
      }
    }
    else {
      maDeviationValues.push(0)
      if (maPostiveDeltaValues[index] == 0) {
        maCompliance.push(1)
      }
      else {
        maCompliance.push(0.9)
      }
    }
  }
}

