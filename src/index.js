/*
 * A histogram of a normally distributed data.
 */

const lcjs = require('@arction/lcjs')

const {
    lightningChart,
    AxisTickStrategies, 
    BarChartTypes,
    BarChartSorting,
    Themes
} = lcjs

const numberOfBins = 100
const numberOfDataPoints = 50000

// Function for generating normally distributed data
const generateGaussianRandom = (length) => {
  const samples = []
  for (let i = 0; i < length; i++) {
    let u = 0, v = 0, s = 0
    while (s === 0 || s >= 1) {
      u = Math.random() * 2 - 1
      v = Math.random() * 2 - 1
      s = u * u + v * v
    }
    const temp = Math.sqrt(-2 * Math.log(s) / s)
    const sample = u * temp
    samples.push(sample)
  }
  return samples
}

// Function for calculating the histogram bins from 1D numerical array
const calculateHistogramBins = (data, numberOfBins) => {
  const minValue = Math.min(...data)
  const maxValue = Math.max(...data)
  const binSize = (maxValue - minValue) / numberOfBins

  // Calculate bin intervals
  const bins = []
  for (let i = 0; i < numberOfBins; i++) {
    const binStart = minValue + i * binSize
    const binEnd = minValue + (i + 1) * binSize
    bins.push({
      binStart: Math.round(binStart * 100) / 100,
      binEnd: Math.round(binEnd * 100) / 100,
      values: Array(),
    })
  }
  bins[numberOfBins - 1].binEnd = maxValue

  // Map data to bins
  data.forEach(value => {
    const binIndex = Math.floor((value - minValue) / binSize);
    if (binIndex >= 0 && binIndex < numberOfBins) {
      bins[binIndex].values.push(value);
    }
  })

  // Create input data for bar chart
  const barChartData = []
  bins.forEach(interval => {
    barChartData.push({
      category: `${
        (interval.binStart + (interval.binStart === minValue ? 0 : 0.01)).toFixed(2)}—${
          interval.binEnd < 0 ? `(${interval.binEnd.toFixed(2)})` : interval.binEnd.toFixed(2)}`,
      value: interval.values.length
    })
  })
  return barChartData
}

// Generate the data
const values = generateGaussianRandom(numberOfDataPoints)
const histogramData = calculateHistogramBins(values, numberOfBins)

const barChart = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        }).BarChart({ 
  theme: Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined,
  type: BarChartTypes.Vertical
})
  .setTitle('Histogram')
  .setSorting(BarChartSorting.Disabled)
  .setValueLabels(undefined)
  .setData(histogramData)
  .setCursorResultTableFormatter((builder, category, value, bar) => builder
     .addRow('Range:', '', category)
     .addRow('Amount of values:', '', bar.chart.valueAxis.formatValue(value))
  )

const barDiv = barChart.engine.container

const inputDiv = document.createElement('div')
barDiv.append(inputDiv)
inputDiv.style.position = "absolute"
inputDiv.style.top = "0"


const label = document.createElement('label')
inputDiv.append(label)
label.innerHTML = "Number of bins:"
label.style.position = "relative"

const binInput = document.createElement('input')
inputDiv.append(binInput)
barChart.setTitleMargin({top: 25, bottom: -10})
binInput.type = "number"
binInput.min = "1"
binInput.max = "1000"
binInput.value = "100"
binInput.style.position = "relative"
binInput.style.height = "30px"

binInput.addEventListener('input', () => {
  const inputValue = parseInt(binInput.value)
  if (Number.isInteger(inputValue) && inputValue > 0 && inputValue <= 1000) {
    barChart.setData([])
    const histogramData = calculateHistogramBins(values, inputValue)
    barChart.setData(histogramData).setSorting(BarChartSorting.Disabled)
  }
})

// Enable grid lines
barChart.valueAxis.setTickStrategy(AxisTickStrategies.Numeric, ticks =>
  ticks.setMajorTickStyle(major =>
    major.setGridStrokeStyle(
      barChart.getTheme().xAxisNumericTicks.majorTickStyle.gridStrokeStyle
    )
  ).setMinorTickStyle(( tickStyle ) => 
    tickStyle.setGridStrokeStyle(
      barChart.getTheme().yAxisNumericTicks.minorTickStyle.gridStrokeStyle
      )
  )
)

// Set same color for all bars
const bars = barChart.getBars()
const fillSTyle = bars[0].getFillStyle()
bars.forEach(bar => { bar.setFillStyle(fillSTyle) })
