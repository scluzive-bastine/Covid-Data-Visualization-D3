const scatterPlot = () => {
  const margin = { top: 20, right: 20, bottom: 50, left: 60 }
  const width = 500 - margin.left - margin.right
  const height = 300 - margin.top - margin.bottom

  const svg = d3
    .select('#scatterplot-container')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  // Load the data
  d3.csv(
    'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/latest/owid-covid-latest.csv'
  ).then((data) => {
    // Filter the data for specific countries
    const countriesToAnalyze = [
      'United States',
      'India',
      'United Kingdom',
      'Germany',
      'China',
      'Nigeria',
    ]
    data = data
      .filter((d) => countriesToAnalyze.includes(d.location))
      .map((d) => {
        d.gdp_per_capita = +d.gdp_per_capita
        d.total_cases_per_million = +d.total_cases_per_million
        return d
      })

    // K-means clustering
    const numClusters = 3
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
      .on('mouseover', (event, d) => onMouseOver(event, d))
      .on('mouseout', (event, d) => onMouseOut(event, d))

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

    // Define mouseover and mouse

    // Define mouseover and mouseout event handlers
    function onMouseOver(event, d) {
      const tooltip = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0)

      tooltip.transition().duration(200).style('opacity', 0.9)

      tooltip
        .html(
          `Country: ${d.location}<br>GDP per Capita: ${d.gdp_per_capita}<br>Total Cases per Million: ${d.total_cases_per_million}`
        )
        .style('left', event.pageX + 10 + 'px')
        .style('top', event.pageY - 28 + 'px')
      d3.select(event.target).transition().duration(100).attr('r', 8)
    }

    function onMouseOut(event, d) {
      d3.select('.tooltip').remove()

      d3.select(event.target).transition().duration(100).attr('r', 5)
    }
  })
}
