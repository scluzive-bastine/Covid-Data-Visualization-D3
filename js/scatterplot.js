const scatterPlot = () => {
  const margin = { top: 20, right: 20, bottom: 50, left: 60 }
  const width = 600 - margin.left - margin.right
  const height = 600 - margin.top - margin.bottom

  const svg = d3
    .select('#scatterplot-container')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  let countriesToAnalyze = [
    'United States',
    'India',
    'United Kingdom',
    'Germany',
    'China',
    'Nigeria',
  ]

  let countries = []

  const selectBox = document.getElementById('countryList')

  // populate the select element with options
  for (let i = 0; i < countries.length; i++) {
    const option = document.createElement('option')
    option.value = countries[i]
    option.innerHTML = countries[i]
    selectBox.appendChild(option)
  }

  let selectedCountries = []
  let c

  const addSelectedCountry = () => {
    const selectedValue = selectBox.value
    if (selectedValue !== '' && !countriesToAnalyze.includes(selectedValue)) {
      countriesToAnalyze.push(selectedValue)
      selectedCountries.push(selectedValue)
      console.log('Selected countries:', countriesToAnalyze)
      showClustter()
    } else {
      console.log('Please select a country.')
    }
  }

  // Popup to show details about each country
  const tooltip = d3
    .select('.clustter-chart')
    .append('div')
    .style('opacity', 0)
    .attr('class', 'sc-tip')

  // Three function that change the tooltip when user hover / move / leave a cell
  const mouseover = function (event, d) {
    tooltip.style('opacity', 1)
  }
  const mousemove = function (event, d) {
    tooltip
      .html(
        `<div class="fw">Country: ${d.location}</div>` +
          `<div class="fw">Total Cases: ${formatNumber(d.total_cases_per_million)}</div>` +
          `<div class="fw">Total Deaths: ${formatNumber(d.total_deaths_per_million)}</div>` +
          `<div class="fw">GDP per Capita: ${Math.round(d.gdp_per_capita)}</div>`
      )
      .style('left', event.x + 0 + 'px')
      .style('top', event.y + -170 + 'px')
    d3.select(this).style('opacity', 0.4).style('stroke', 'white').style('stroke-width', 1)
    d3.select(this).style('cursor', 'pointer')
  }
  const mouseleave = function (d) {
    tooltip.style('opacity', 0)
    d3.select(this).transition().duration('50').attr('opacity', '1')
    d3.select(this).style('opacity', 1).style('stroke', 'white').style('stroke-width', 0.1)
  }

  document.querySelector('#select-btn').addEventListener('click', addSelectedCountry)

  const showClustter = () => {
    d3.csv(
      'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/latest/owid-covid-latest.csv'
    ).then((data) => {
      // Filter the data for specific countries
      c = countriesToAnalyze.concat(selectedCountries)
      data.forEach((c) => {
        countries.push(c.location)
      })

      for (let i = 0; i < countries.length; i++) {
        const option = document.createElement('option')
        option.value = countries[i]
        option.innerHTML = countries[i]
        selectBox.appendChild(option)
      }

      data = data
        .filter((d) => c.includes(d.location))
        .map((d) => {
          d.gdp_per_capita = +d.gdp_per_capita
          d.total_cases_per_million = +d.total_cases_per_million
          return d
        })

      // K-means clustering
      const numClusters = countriesToAnalyze.length
      const kmeans = kMeans(data, numClusters)
      const colorScale = d3.scaleOrdinal().domain(d3.range(numClusters)).range(d3.schemeCategory10)

      // Create x and y scales
      const xScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.gdp_per_capita)])
        .range([0, width])

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.total_cases_per_million)])
        .range([height, 0])

      // Add x and y axes
      svg
        .append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale))

      svg.append('g').attr('class', 'axis').call(d3.axisLeft(yScale))

      // Bind the data to SVG circle elements
      svg
        .selectAll('circle')
        .data(data)
        .join('circle')
        .attr('cx', (d) => xScale(d.gdp_per_capita))
        .attr('cy', (d) => yScale(d.total_cases_per_million))
        .attr('r', 5)
        .attr('fill', (d) => colorScale(d.cluster))
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseleave)

      // Add x and y axis labels
      svg
        .append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .style('text-anchor', 'middle')
        .text('GDP per Capita')

      svg
        .append('text')
        .attr('class', 'axis-label')
        .attr('x', -height / 2)
        .attr('y', -40)
        .attr('transform', 'rotate(-90)')
        .style('text-anchor', 'middle')
        .text('Total Cases per Million')

      //k means code

      function kMeans(data, numClusters) {
        // Initialize centroids randomly
        let centroids = data.slice(0, numClusters)

        let change = true
        while (change) {
          change = false

          // Assign each data point to the nearest centroid
          data.forEach((d) => {
            let minDistance = Infinity
            let newCluster = null
            centroids.forEach((c, i) => {
              const distance = Math.sqrt(
                Math.pow(d.gdp_per_capita - c.gdp_per_capita, 2) +
                  Math.pow(d.total_cases_per_million - c.total_cases_per_million, 2)
              )
              if (distance < minDistance) {
                minDistance = distance
                newCluster = i
              }
            })

            if (d.cluster !== newCluster) {
              d.cluster = newCluster
              change = true
            }
          })

          // Update centroids
          centroids = centroids.map((_, i) => {
            const clusterData = data.filter((d) => d.cluster === i)
            const gdpSum = d3.sum(clusterData, (d) => d.gdp_per_capita)
            const casesSum = d3.sum(clusterData, (d) => d.total_cases_per_million)
            return {
              gdp_per_capita: gdpSum / clusterData.length,
              total_cases_per_million: casesSum / clusterData.length,
            }
          })
        }

        return centroids
      }
    })
  }

  showClustter()
}
