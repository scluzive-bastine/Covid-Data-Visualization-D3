const chloroplethMap = () => {
  const WORLD_GEOJSON_URL =
    'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'

  const LATEST_COVID_CSV_URL =
    'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/latest/owid-covid-latest.csv'

  let covidData = [], // setting variable for covid Data
    countriesData, // map data
    circleData = [], // circle
    geojson = [],
    g,
    showBubbles = false

  const svgWidth = 800
  const svgHeight = 600

  let showSpread = false

  const toggleShowSpread = () => {
    showSpread = !showSpread
  }

  // The svg
  let svg = d3.select('svg').attr('width', svgWidth).attr('height', svgHeight)

  svg.selectAll('*').remove()

  // radius for bubbles
  radius = d3.scaleSqrt().domain([0, 1000]).range([0, 8])

  // Map and projection
  const path = d3.geoPath()
  const projection = d3
    .geoMercator()
    .scale(100)
    .center([0, 50])
    .translate([svgWidth / 2, svgHeight / 2])

  // zoom

  let zoom = d3.zoom().on('zoom', handleZoom)

  function handleZoom(e) {
    d3.select('svg g').attr('transform', e.transform)
  }

  function initZoom() {
    d3.select('svg').call(zoom)
  }

  initZoom()

  // Data and color scale
  let data = new Map()
  const colorScale = d3
    .scaleThreshold()
    .domain([
      10000, 100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000, 500000000, 1500000000,
    ])
    .range(d3.schemeBlues[9])

  // Create Legend

  const legend = d3.select('#legend').append('svg').attr('width', 200).attr('height', 50)

  const legendScale = d3.scaleLinear().domain([0, 9]).rangeRound([20, 180])

  // const legendAxis = d3
  //   .axisBottom(legendScale)
  //   .tickSize(13)
  //   .tickValues(d3.range(10))
  //   .tickFormat(function (d) {
  //     return d3.format('.2s')(colorScale.domain()[d])
  //   })

  const legendGroup = legend.append('g').attr('transform', 'translate(0, 20)')

  legendGroup
    .selectAll('rect')
    .data(colorScale.range())
    .join('rect')
    .attr('x', (d, i) => legendScale(i))
    .attr('y', 0)
    .attr('width', 200 / 9 - 2)
    .attr('height', 13)
    .attr('fill', (d) => d)

  // legendGroup.call(legendAxis).select('.domain').remove()

  // Popup to show details about each country
  const tooltip = d3
    .select('.map-container')
    .append('div')
    .style('opacity', 0)
    .attr('class', 'd3-tip')

  // Three function that change the tooltip when user hover / move / leave a cell
  const mouseover = function (event, d) {
    tooltip.style('opacity', 1)
  }
  const mousemove = function (event, d) {
    tooltip
      .html(
        `<div class="fw">Country: ${d.total.location}</div>` +
          `<div class="fw">Total Cases: ${formatNumber(d.total.total_cases)}</div>` +
          `<div class="fw">Total Deaths: ${formatNumber(d.total.total_deaths)}</div>` +
          `<div class="fw">GDP per Capita: ${Math.round(d.total.gdp_per_capita)}</div>`
      )
      .style('left', event.x + -70 + 'px')
      .style('top', event.y + -70 + 'px')
    d3.select(this).style('opacity', 0.4).style('stroke', 'white').style('stroke-width', 1)
    d3.select(this).style('cursor', 'pointer')
  }
  const mouseleave = function (d) {
    tooltip.style('opacity', 0)
    d3.select(this).transition().duration('50').attr('opacity', '1')
    d3.select(this).style('opacity', 1).style('stroke', 'white').style('stroke-width', 0.1)
  }

  // Load external data and boot
  Promise.all([
    d3.json(
      WORLD_GEOJSON_URL // Loads world Data
    ),
    d3.csv(LATEST_COVID_CSV_URL, function (d) {
      data.set(d.iso_code, d)
      covidData.push(d)
    }),
    d3.csv('gps.csv'),
  ]).then(function (loadData) {
    geojson.push(loadData[0]) // world json

    countriesData = loadData[0]
    circleData.push(loadData[2])

    ready(countriesData)
  })

  const ready = (countriesData) => {
    drawMap(countriesData)
    drawCircles()
  }

  const drawMap = (countriesData) => {
    // Draw the map

    svg
      .append('g')
      .selectAll('path')
      .data(countriesData.features)
      .join('path')
      // draw each country
      .attr('d', d3.geoPath().projection(projection))
      // set the color of each country based on the total Number of Deaths.
      .attr('fill', '#c1c9c9')
      .attr('fill', function (d) {
        // console.log(d)
        d.total = data.get(d.id)
        return colorScale(d.total ? d.total.total_cases * 100 : 0)
      })
      .on('mouseover', mouseover)
      .on('mousemove', mousemove)
      .on('mouseleave', mouseleave)
      .on('click', function (d) {
        lineChart(d.srcElement.__data__.total.location)
      })
  }

  const drawCircles = () => {
    countriesData.features.forEach(function (county) {
      county.covid_cases = 0
    })

    countriesData.features.forEach((item) => {
      covidData.forEach((data) => {
        if (item.properties.name === data.location) {
          item.covid_cases = data.total_cases
        }
      })
    })

    const nMinAndMax = d3.extent(countriesData.features, function (a) {
      return ++a.covid_cases
    })

    const nToRadius = d3.scaleSqrt().domain(nMinAndMax).range([1, 50])

    svg
      .select('g')
      .append('g')
      .attr('class', 'bubble')
      .selectAll('circle')
      .data(
        countriesData.features.sort(function (a, b) {
          // console.log(a.covid_cases)
          return b.covid_cases - a.covid_cases
        })
      )
      .enter()
      .append('circle')
      .attr('transform', function (d) {
        var p = projection(path.centroid(d.geometry))
        return `translate(${p})`
        // return 'translate(' + path.centroid(d.geometry) + ')'
      })
      .attr('r', function (d) {
        return nToRadius(d.covid_cases || 0)
      })
      .on('mouseover', mouseover)
      .on('mousemove', mousemove)
    // .on('mouseleave', mouseleave)
  }

  const toggleBubbles = () => {
    if (showBubbles === true) {
      showBubbles = false
    } else {
      showBubbles = true
    }
  }

  // document.querySelector('#toggleBubbles').addEventListener('click', toggleBubbles) // show bubbles on map
}
