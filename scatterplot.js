const margin = { top: 20, right: 20, bottom: 50, left: 60 };
const width = 500 - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;



const svg = d3.select("#scatterplot-container")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Color scale for continents
const colorScale = d3.scaleOrdinal()
  .domain(["Asia", "Europe", "Africa", "North America", "South America", "Oceania"])
  .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b"]);

// Load the data
d3.csv("scatterplot.csv").then(data => {
  // Parse and preprocess the data
  
data = data.filter(d => d.continent === "North America" || d.continent === "Africa") 
.map(d => {
  d.gdp_per_capita = +d.gdp_per_capita;
  d.total_cases_per_million = +d.total_cases_per_million;
  return d;
});


  // Create x and y scales
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.gdp_per_capita)])
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.total_cases_per_million)])
    .range([height, 0]);

  // Add x and y axes
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale));

  svg.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(yScale));

  // Bind the data to SVG circle elements
  svg.selectAll("circle")
  .data(data)
  .join("circle")
  .attr("cx", d => xScale(d.gdp_per_capita))
  .attr("cy", d => yScale(d.total_cases_per_million))
  .attr("r", 5)
  .attr("fill", d => colorScale(d.continent))
  .on("mouseover", (event, d) => onMouseOver(event, d))
  .on("mouseout", (event, d) => onMouseOut(event, d)); // Add data parameter 'd' here


  // Add x and y axis labels
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .style("text-anchor", "middle")
    .text("GDP per Capita");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "middle")
    .text("Total Cases per Million");
    
    // Add a legend
    // ...
// Add a legend
// Add a legend
const legend = svg.append("g")
  .attr("class", "legend")
  .selectAll("g")
  .data(colorScale.domain())
  .join("g")
  .attr("transform", (d, i) => `translate(0, ${i * 15})`); // Reduce space between legend items

legend.append("rect")
  .attr("x", width - 12)
  .attr("width", 12) // Reduce rectangle width
  .attr("height", 12) // Reduce rectangle height
  .attr("fill", colorScale);

legend.append("text")
  .attr("x", width - 16) // Adjust text position
  .attr("y", 6) // Adjust text position
  .attr("dy", ".35em")
  .style("text-anchor", "end")
  .style("font-size", "10px") // Reduce font size
  .text(d => d);


// Define mouseover and mouseout event handlers
// ...

    
    // Define mouseover and mouseout event handlers
    // Define mouseover and mouseout event handlers
    function onMouseOver(event, d) {
        const tooltip = d3.select("body") // Change this line
          .append("div")
          .attr("class", "tooltip")
          .style("opacity", 0);
      
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
      
        tooltip.html(`Country: ${d.location}<br>GDP per Capita: ${d.gdp_per_capita}<br>Total Cases per Million: ${d.total_cases_per_million}`);
      
        // Check if the tooltip goes off the screen
        const pageX = event.pageX + 10;
        const pageY = event.pageY - 28;
        const tooltipWidth = tooltip.node().offsetWidth;
        const windowWidth = window.innerWidth;
      
        if (pageX + tooltipWidth > windowWidth) {
          tooltip.style("left", (pageX - tooltipWidth - 20) + "px");
        } else {
          tooltip.style("left", pageX + "px");
        }
      
        tooltip.style("top", pageY + "px");
      
        d3.select(event.currentTarget).transition()
          .duration(100)
          .attr("r", 8);
      }
      
  
      function onMouseOut(event) { // Add event parameter
        d3.select("body .tooltip").remove();
        d3.select(event.currentTarget).transition() 
          .duration(100)
          .attr("r", 5);  
      }
      

});