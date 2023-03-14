const chloroplethMap = () => {
  const WORLD_GEOJSON_URL =
    'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'

  const LATEST_COVID_CSV_URL =
    'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/latest/owid-covid-latest.csv'

  let covidData = [], // setting variable for covid Data
    countriesData, // map data
    legend,
    g

  // The svg
  const svg = d3.select('svg'),
    width = +svg.attr('width'),
    height = +svg.attr('height')

  g = svg.append('g')
  // radius for bubbles
  radius = d3.scaleSqrt().domain([0, 1000]).range([0, 8])

  // Map and projection
  const path = d3.geoPath()
  const projection = d3
    .geoMercator()
    .scale(70)
    .center([0, 20])
    .translate([width / 2, height / 2])

  // Data and color scale
  let data = new Map()
  const colorScale = d3
    .scaleThreshold()
    .domain([
      10000, 100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000, 500000000, 1500000000,
    ])
    .range(d3.schemeReds[9])

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
      .style('left', event.x + 18 + 'px')
      .style('top', event.y + 18 + 'px')
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
  ]).then(function (loadData) {
    countriesData = loadData[0]
    drawMap(countriesData)
  })

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
  }
}
