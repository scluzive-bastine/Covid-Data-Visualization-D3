const lineChart = (country) => {
  const COVID_URL =
    'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv'

  const LINE_CHART_URL =
    'https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/3_TwoNumOrdered_comma.csv'
  // set the dimensions and margins of the graph
  const margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom
  let svg = d3.selectAll('#my_dataviz')
  //   // append the svg object to the body of the page

  //   svg.selectAll('*').remove()

  //   svg = d3
  //     .selectAll('#my_dataviz')
  //     .append('svg')
  //     .attr('width', width + margin.left + margin.right)
  //     .attr('height', height + margin.top + margin.bottom)
  //     .append('g')
  //     .attr('transform', `translate(${margin.left}, ${margin.top})`)

  let covidData = []
  //Read the data

  Promise.all([
    d3.csv(COVID_URL, function (c) {
      return {
        date: c.date,
        total_cases: +c.new_cases,
        total_vaccinations: +c.new_vaccinations,
        total_deaths: +c.new_deaths,
        location: c.location,
      }
    }),
    d3.csv(LINE_CHART_URL),
  ]).then(
    // Now I can use this dataset
    function (data) {
      document.querySelector('.country-container').style.opacity = 1
      covidData.push(data[0])

      document.querySelector('#country').innerHTML = country // show name of country on the container
      const n = covidData[0].filter((c) => c.location === country)

      //   Get first and last Date from the data
      const xx = d3.extent(n, (a) => {
        return a.date
      })

      const dateParser = d3.timeParse('%Y-%m-%d')
      const bisectDate = d3.bisector((d) => dateParser(d.date)).left

      // Initialise X and Y axes
      const xScale = d3
        .scaleTime()
        .domain(d3.extent(n, (d) => dateParser(d.date)))
        .range([0, width])
      const yScale = d3
        .scaleLinear()
        .domain([
          0,
          d3.max(n, (d) => Math.max(+d.total_cases, +d.total_deaths, +d.total_vaccinations)),
        ])
        .range([height, 0])

      /**
       * Line chart Section
       * */
      // Append line chart svg to multi-chart html div

      svg.selectAll('*').remove()

      const line = d3
        .select('#my_dataviz')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

      // Dashed line tool tip for line chart
      const tooltipLine = line
        .append('line')
        .attr('class', 'tooltip-line')
        .style('opacity', 0)
        .attr('y1', 0)
        .attr('y2', height + margin.top + margin.bottom)
        .attr('stroke', '#ccc')
        .attr('stroke-width', '1px')
        .attr('stroke-dasharray', '5,5')

      // Transition when drawing line
      function transition(path) {
        path.transition().duration(2000).attrTween('stroke-dasharray', tweenDash)
      }

      // tweenDash Transition function
      function tweenDash() {
        var l = this.getTotalLength(),
          i = d3.interpolateString('0,' + l, l + ',' + l)
        return function (t) {
          return i(t)
        }
      }
      // Line chart x-axis
      const xAxis = line
        .append('g')
        .attr('class', 'line-x-axis')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('font-size', '12px')
      // Line chart y-axis
      const yAxis = line
        .append('g')
        .attr('class', 'line-y-axis')
        .call(d3.axisLeft(yScale).tickFormat(d3.format('.1s')))
        .selectAll('text')
        .attr('font-size', '12px')
      // Plotter for total cases of selected country
      const lineGenerator = d3
        .line()
        .x((d) => xScale(dateParser(d.date)))
        .y((d) => yScale(+d.total_cases))
      // Plotter for total deaths of selected country
      const lineGenerator2 = d3
        .line()
        .x((d) => xScale(dateParser(d.date)))
        .y((d) => yScale(+d.total_deaths))
      const lineGenerator3 = d3
        .line()
        .x((d) => xScale(dateParser(d.date)))
        .y((d) => yScale(+d.total_vaccinations))

      // Draw total cases line for selected country
      line
        .append('path')
        .attr('class', 'line')
        .attr('d', lineGenerator(n))
        .call(transition)
        .attr('stroke', '#333')
        .attr('stroke-width', 1)
        .attr('fill', 'none')

      // Draw total deaths line for selected country
      line
        .append('path')
        .attr('class', 'line-2')
        .attr('d', lineGenerator2(n))
        .call(transition)
        .attr('stroke', '#f00')
        .attr('stroke-width', 1)
        .attr('fill', 'none')

      //   Draw total vaccination for selected country
      line
        .append('path')
        .attr('class', 'line-3')
        .attr('d', lineGenerator3(n))
        .call(transition)
        .attr('stroke', '#A78282')
        .attr('stroke-width', 1)
        .attr('fill', 'none')

      // Tool tip text box for dashed line tool tip
      const tooltipBox = line
        .append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('opacity', 0)
        .style('cursor', 'pointer')
        // On mouse move event
        .on('mousemove', function (e, d) {
          let tooltip = d3.select('.tooltip')
          tooltipLine.style('opacity', 1)

          const x0 = xScale.invert(d3.pointer(e, this)[0])
          const i = bisectDate(n, x0)
          const d0 = n[i - 1]
          const d1 = n[i]
          const dx = x0 - dateParser(d0.date) > dateParser(d1.date) - x0 ? d1 : d0

          tooltipLine
            .attr('x1', xScale(dateParser(dx.date)))
            .attr('x2', xScale(dateParser(dx.date)))

          tooltip
            .style('opacity', 1)
            .style('top', e.pageY + 'px')
            .style('left', e.pageX + 10 + 'px')
            .style('display', 'block')
          // Append tooltip text box
          tooltip.html(`<span>Latest Data</span> <br/> <br/>
        <p><span>Date: </span> ${dx.date}</p>
        <p><span>Location: </span> ${dx.location}</p>
        <p><span>Total Cases: </span> ${dx.total_cases}</p>
        <p><span>Total Deaths: </span> ${dx.total_deaths}</p>`)
        })
        // On Mouse out event
        .on('mouseout', function (e, d) {
          tooltipLine.style('opacity', 0)
          d3.select('.tooltip').style('opacity', 0)
        })

      // Add a clipPath: everything out of this area won't be drawn.
      const clip = svg
        .append('defs')
        .append('svg:clipPath')
        .attr('id', 'clip')
        .append('svg:rect')
        .attr('width', width)
        .attr('height', height)
        .attr('x', 0)
        .attr('y', 0)

      /**
       * Brushing Attempt
       * */
      // Add brushing
      const brush = d3
        // Add the brush feature using the d3.brush function
        .brushX()
        // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
        .extent([
          [0, 0],
          [width, height],
        ])
        // Each time the brush selection changes, trigger the 'updateChart' function
        .on('end', updateChart)

      // Create the line variable: where both the line and the brush take place
      line.append('g').attr('clip-path', 'url(#clip)')

      line.append('g').attr('class', 'brush').call(brush)

      let idleTimeout

      function idled() {
        idleTimeout = null
      }

      // A function that update the chart for given boundaries
      function updateChart(event, d) {
        let extent = event.selection

        if (!extent) {
          if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350))
          xScale.domain([4, 8])
        } else {
          xScale.domain([xScale.invert(extent[0]), xScale.invert(extent[1])])
          line.select('.brush').call(brush.move, null)
        }

        // Update axis and line position
        d3.select('.line-x-axis').transition().duration(1000).call(d3.axisBottom(xScale))

        d3.select('.line-y-axis')
          .transition()
          .duration(1000)
          .call(d3.axisLeft(yScale).tickFormat(d3.format('.1s')))

        line.select('.line').transition().duration(1000).attr('d', lineGenerator(n))

        line.select('.line-2').transition().duration(1000).attr('d', lineGenerator2(n))
        line.select('.line-3').transition().duration(1000).attr('d', lineGenerator3(n))
      }
    }
  )
}
