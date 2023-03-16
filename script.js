/*  Author: Sadiq Zaku
    Date Created: 02/03/2023
     */
/**
 * @async drawChart Used to draw the layouts on html page
 *
 * */j
const drawChart = async() => {

    //set various dimensions
    const width = 850;
    const height = 380;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    // Set date parser
    const dateParser = d3.timeParse("%Y-%m-%d");
    const bisectDate = d3.bisector((d) => dateParser(d.date)).left;
    // Variable for country selection
    let selectedCountry = "";

    //Get data

    const geojson = await d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
    const covidData = await d3.csv("https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv");


    // Set data to selected country
    let data =
        selectedCountry === "" ?
        covidData.filter((d) => d.location === "World") :
        covidData.filter((d) => d.location === selectedCountry); // Sets d.location to selected country on map

    const latestDate = data[data.length - 1].date; // set latestDate to last date element in data

    // Filter and sort covidData for top 10 countries column
    const latestDataByDate = covidData
        .filter((d) => d.date === latestDate)
        .sort((a, b) => +b.total_cases - +a.total_cases)
        .slice(0, 9);

    // Filter covidData and map to location
    const groups = covidData
        .filter((d) => d.date === latestDate && d.continent === "")
        .map((d) => d.location);

    const subgroups = [
        "total_deaths_per_million",
        "total_cases_per_million",
        "new_cases_per_million",
    ];

    /* Select latest-data div element and append top 10 countries in the Top Locations column*/
    await d3.select(".latest-data") // select latest data div
        .selectAll("p") // select all paragraph elements
        .data(latestDataByDate)
        .enter()
        .append("p")
        .html(
            (d) => `<span>${d.location}</span>: ${d3.format(",")(d.total_cases)}`
        );

    // Append latest total cases data to total cases column
    await d3.select("#total_cases")
        .append("h2")
        .html((d) => `${d3.format(",")(data[data.length - 1].total_cases)}`);

    // Append latest total deaths data to total deaths column
    await d3.select("#total_deaths")
        .append("h2")
        .html((d) => `${d3.format(",")(data[data.length - 1].total_deaths)}`);

    // Append latest new deaths data to new deaths column
    await d3.select("#new_deaths")
        .append("h2")
        .html((d) => `${d3.format(",")(data[data.length - 1].new_deaths)}`);

    // Append latest new cases data to new cases column
    await d3.select("#new_cases")
        .append("h2")
        .html((d) => `${d3.format(",")(data[data.length - 1].new_cases)}`);

    // Append latest new cases data tototal_vaccinations column
    await d3.select("#total_vaccinations")
        .append("h2")
        .html((d) => `${d3.format(",")(data[data.length - 1].total_vaccinations)}`);

    /**
     * Axes for charts
     * */
    // Scatter plot x-axis
    const xScatter = d3.scaleLinear().domain([0, d3.max(covidData.filter((d) => d.date === latestDate), (d) => +d.total_cases_per_million), ]).range([0, width]);
    // Scatter plot y-axis
    const yScatter = d3.scaleLinear().domain([0, d3.max(covidData.filter((d) => d.date === latestDate), (d) => +d.gdp_per_capita), ]).range([height, 0]);


    // Bar chart x-scale
    const xBarScale = d3.scaleBand().domain(groups).range([0, width]).padding(0.1);
    // Bar chart y-scale
    const yBarScale = d3.scaleLinear().domain([0, d3.max(covidData.filter((d) => d.date === latestDate && d.continent === ""), (d) => +d.total_cases_per_million), ]).range([height, 0]);
    // Colour scale for subgroups
    const colorScale = d3.scaleOrdinal().domain(subgroups).range(["#f09797", "#73a9fa", "#ccc"]);
    // Set Bandwidth of bars in bar chart
    const xBarSubgroup = d3.scaleBand().domain(subgroups).range([0, xBarScale.bandwidth()]).padding([0.05]);

    // Initialise X and Y axes
    const xScale = d3.scaleTime().domain(d3.extent(data, (d) => dateParser(d.date))).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, d3.max(data, (d) => Math.max(+d.total_cases, +d.total_deaths))]).range([height, 0]);

    // Set radius scale for scatter plot circles
    const radiusScale = d3.scaleSqrt().domain([0, d3.max(data, (d) => +d.total_cases_per_million)]).range([0, 5]);
    // Set radius scale for map circles
    const mapRadiusScale = d3.scaleSqrt().domain([0, d3.max(data, (d) => +d.total_cases)]).range([2, 30]);
    // Append SVG to map Div
    const map = d3.select("#map").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom);
    // Map projection to be used
    const projection = d3.geoNaturalEarth1().scale(width / 2 / Math.PI).translate([width / 2, height / 1.5]);
    // Map path to be drawn
    const path = d3.geoPath().projection(projection);

    /**
     * Map Plotting Section
     * */
    // Plot map in map Div element on HTML page
    map
        .append("g")
        .attr("class", "countries")
        .selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("fill", "#ccc")
        .style("stroke", "#fff")
        .style("stroke-width", 0.5)
        .style("cursor", "pointer")
        // On Mouse Over event
        .on("mouseover", function(e, d) {
            // Select tooltip
            let tooltip = d3.select(".tooltip");
            // Match selection to country name
            selectedCountry = d.properties.name;
            // Filter and return data for selected country
            const country = covidData.filter((d) => d.location === selectedCountry);
            // Get the last entry row of the country
            const latestData = country[country.length - 1];
            // Tool tip transition, display and position
            tooltip.transition().duration(200).style("opacity", 1).style("left", e.pageX + 20 + "px").style("top", e.pageY + "px").style("display", "block");
            // Append tooltip to HTML tooltip div
            tooltip.html(
                latestData ?
                `<span>Latest Data</span> <br/> <br/>
        <p><span>Date: </span> ${latestData.date}</p>
        <p><span>Location: </span> ${latestData.location}</p> 
        <p><span>Population: </span> ${latestData.population}</p>
        <p><span>New Cases: </span> ${latestData.new_cases}</p>
        <p><span>Total Cases: </span> ${latestData.total_cases}</p>
        <p><span>Total Deaths: </span> ${latestData.total_deaths}</p>
        <p><span>Total vaccinations: </span> ${latestData.total_vaccinations}</p> ` :
                "No Data"
            );
            // Fill colour of selected country
            d3.select(this).style("fill", "#f00");
        })
        /*On Mouse out event
        Hide tool tip*/
        .on("mouseout", function(d) {
            d3.select(".tooltip")
                .transition()
                .duration(200)
                .style("opacity", 0)
                .style("display", "hidden");
            d3.select(this).style("fill", "#ccc");
        })
        // On Mouse click event
        .on("click", function(e, d) {
            selectedCountry = d.properties.name;
            // Filter selected country data
            const country = covidData.filter((d) => d.location === selectedCountry);
            // Set data variable to country
            data = country;
            // Get latest country row
            const latestData = country[country.length - 1];

            // Select country span div and append selected country's name
            d3.selectAll("#country").html((d) => `${latestData.location}`);
            // Select total cases h2 div and append selected country's total cases
            d3.select("#total_cases h2").html((d) => `${d3.format(",")(latestData.total_cases)}`);
            // Select total deaths h2 div and append selected country's total deaths
            d3.select("#total_deaths h2").html((d) => `${d3.format(",")(latestData.total_deaths)}`);
            // Select new deaths h2 div and append selected country's new deaths
            d3.select("#new_deaths h2").html((d) => `${d3.format(",")(latestData.new_deaths)}`);
            // Select new cases h2 div and append selected country's new cases
            d3.select("#new_cases h2").html((d) => `${d3.format(",")(latestData.new_cases)}`);
            // Select new cases h2 div and append selected country's total vaccinations
            d3.select("#total_vaccinations h2").html((d) => `${d3.format(",")(latestData.total_vaccinations)}`);

            // Set yScale domain for line chart
            yScale.domain([0, d3.max(data, (d) => Math.max(+d.total_cases, +d.total_deaths)), ]);
            xScale.domain(d3.extent(data, (d) => dateParser(d.date)));
            //transition for new y axis for line chart
            d3.select(".line-y-axis").transition().duration(1000).call(d3.axisLeft(yScale).tickFormat(d3.format(".1s")));

            // Plot selected country's total cases
            line.select(".line").transition().duration(500).attr("d", lineGenerator(country));
            // Plot selected country's total deaths
            line.select(".line-2").transition().duration(500).attr("d", lineGenerator2(country));
        });

    /**
     *  Add circles to map for each country
     *  */
    map
        .append("g")
        .attr("class", "circles")
        .selectAll("circle")
        .data(geojson.features)
        .enter()
        .append("circle")
        .attr("pointer-events", "none")
        .attr("transform", function(d) {
            return "translate(" + path.centroid(d) + ")";
        })
        .attr("r", function(d) {
            return mapRadiusScale(d3.max(covidData.filter((c) => c.location === d.properties.name), (d) => +d.total_cases));
        })
        .style("fill", "#f09797");

    /**
     * Zoom and Pan for Map
     * */
    const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);
    map.call(zoom);
    // Transform map lines and circle to scale
    function zoomed(e) {
        const transform = e.transform;
        map.selectAll("path").attr("transform", transform);
        map.selectAll(".circles").attr("transform", transform);
    }

    /**
     * Scatter plot Section
     * */
    // Create SVG element for scatter-plot
    const svg = d3
        .select("#scatter-plot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Draw Scatter plot bottom x-axis
    svg.append("g").attr("class", "x axis").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(xScatter).tickFormat(d3.format(".1s")));

    // Draw scatter-plot left y-axis
    svg.append("g").attr("class", "y axis").call(d3.axisLeft(yScatter).tickFormat(d3.format(".1s")));

    // Draw scatter-plot circles using total cases per million and gdp per capita
    svg
        .append("g")
        .attr("class", "scatter-circles")
        .selectAll("circle")
        .data(covidData.filter((d) => d.date === latestDate))
        .enter()
        .append("circle")
        .attr("cx", (d) => xScatter(+d.total_cases_per_million))
        .attr("cy", (d) => yScatter(+d.gdp_per_capita))
        .attr("transform", (d) => `translate(${margin.left}, ${-radiusScale(+d.total_cases_per_million)})`)
        .attr("r", (d) => radiusScale(+d.total_cases_per_million))
        .style("fill", "#ccc")
        .style("opacity", 0.8)
        .style("cursor", "pointer")
        // On mouse move event
        .on("mousemove", function(e, d) {
            // Select tooltip
            let tooltip = d3.select(".tooltip");
            // Change circle fill colour
            d3.select(this).style("fill", "#5da9f0");

            selectedCountry = d.location;
            // Tool tip transition, display and position
            tooltip
                .transition()
                .duration(200)
                .style("opacity", 1)
                .style("left", e.pageX + 20 + "px")
                .style("top", e.pageY + "px")
                .style("display", "block");

            // Append toottip to HTML tooltip div
            tooltip.html(
                `<span>Latest Data</span> <br/> <br/>
        <p><span>Date: </span> ${d.date}</p>
        <p><span>Location: </span> ${d.location}</p> 
        <p><span>Population: </span> ${d.population}</p>
        <p><span>Per Capita GDP: </span> ${"$ " + d.gdp_per_capita}</p>
        <p><span>New Cases Per Million: </span> ${d.new_cases_per_million}</p>
        <p><span>Total Cases Per Million: </span> ${
                    d.total_cases_per_million
                }</p>`
            );
        })
        /*On Mouse out event
        Hide tool tip*/
        .on("mouseout", function(d) {
            d3.select(this).style("fill", "#ccc");

            d3.select(".tooltip")
                .transition()
                .duration(200)
                .style("opacity", 0)
                .style("display", "hidden");
        })
        // On mouse click event
        .on("click", function(e, d) {
            selectedCountry = d.location;
            // Filter selected country data
            const country = covidData.filter((d) => d.location === selectedCountry);
            // Set data variable to country
            data = country;
            // Get latest country row
            const latestData = country[country.length - 1];
            //
            //yScale.domain([0, d3.max([...new Set(country)], (d) => +d.new_cases)]);


            // Select country span div and append selected country's name
            d3.selectAll("#country").html((d) => `${latestData.location}`);
            // Select total cases h2 div and append selected country's total cases
            d3.select("#total_cases h2").html((d) => `${d3.format(",")(latestData.total_cases)}`);
            // Select total deaths h2 div and append selected country's total deaths
            d3.select("#total_deaths h2").html((d) => `${d3.format(",")(latestData.total_deaths)}`);
            // Select new deaths h2 div and append selected country's new deaths
            d3.select("#new_deaths h2").html((d) => `${d3.format(",")(latestData.new_deaths)}`);
            // Select new cases h2 div and append selected country's new cases
            d3.select("#new_cases h2").html((d) => `${d3.format(",")(latestData.new_cases)}`);

            // Select new cases h2 div and append selected country's total_vaccinations
            d3.select("#total_vaccinations h2").html((d) => `${d3.format(",")(latestData.total_vaccinations)}`);



            // Set yScale domain to either total cases or total death whichever is bigger
            yScale.domain([0, d3.max(data, (d) => Math.max(+d.total_cases, +d.total_deaths)), ]);

            xScale.domain(d3.extent(data, (d) => dateParser(d.date)));
            //transition for new y axis for line chart
            d3.select(".line-y-axis").transition().duration(1000).call(d3.axisLeft(yScale).tickFormat(d3.format(".1s")));

            // Plot selected country's total cases
            line.select(".line").transition().duration(500).attr("d", lineGenerator(country));
            // Plot selected country's total deaths
            line.select(".line-2").transition().duration(500).attr("d", lineGenerator2(country));
        });





    /**
     * Bar Chart Section
     * */
    // Append bar chart svg to bar-chart html div
    const svgBar = d3
        .select("#bar-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Draw bar chart bottom x-axis
    svgBar.append("g").attr("class", "x axis").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(xBarScale));

    // Draw bar chart left y-axis
    svgBar.append("g").attr("class", "y axis").call(d3.axisLeft(yBarScale).tickFormat(d3.format(".1s")));

    // add bars
    svgBar
        .append("g")
        .selectAll("g")
        .data(covidData.filter((d) => d.date === latestDate && d.continent === ""))
        .enter()
        .append("g")
        .attr("transform", (d) => `translate(${xBarScale(d.location)}, 0)`)
        .selectAll("rect")
        .data(function(d) {
            return subgroups.map((name) => ({
                name,
                value: +d[name],
            }));
        })
        .enter()
        .append("rect")
        .attr("width", xBarSubgroup.bandwidth())
        .attr("x", (d) => xBarSubgroup(d.name))
        .attr("y", (d) => yBarScale(d.value))
        .attr("height", (d) => height - yBarScale(d.value))
        .style("fill", (d) => colorScale(d.name))
        .style("opacity", 0.8)
        .style("cursor", "pointer");





    /**
     * Line chart Section
     * */
    // Append line chart svg to multi-chart html div
    const line = d3
        .select("#multi-line")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Dashed line tool tip for line chart
    const tooltipLine = line
        .append("line")
        .attr("class", "tooltip-line")
        .style("opacity", 0)
        .attr("y1", 0)
        .attr("y2", height + margin.top + margin.bottom)
        .attr("stroke", "#ccc")
        .attr("stroke-width", "1px")
        .attr("stroke-dasharray", "5,5");

    // Transition when drawing line
    function transition(path) {
        path.transition().duration(2000).attrTween("stroke-dasharray", tweenDash);
    }

    // tweenDash Transition function
    function tweenDash() {
        var l = this.getTotalLength(),
            i = d3.interpolateString("0," + l, l + "," + l);
        return function(t) {
            return i(t);
        };
    }
    // Line chart x-axis
    const xAxis = line.append("g").attr("class", "line-x-axis").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(xScale)).selectAll("text").attr("font-size", "12px");
    // Line chart y-axis
    const yAxis = line.append("g").attr("class", "line-y-axis").call(d3.axisLeft(yScale).tickFormat(d3.format(".1s"))).selectAll("text").attr("font-size", "12px");
    // Plotter for total cases of selected country
    const lineGenerator = d3.line().x((d) => xScale(dateParser(d.date))).y((d) => yScale(+d.total_cases));
    // Plotter for total deaths of selected country
    const lineGenerator2 = d3.line().x((d) => xScale(dateParser(d.date))).y((d) => yScale(+d.total_deaths));

    // Draw total cases line for selected country
    line
        .append("path")
        .attr("class", "line")
        .attr("d", lineGenerator(data))
        .call(transition)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("fill", "none");

    // Draw total deaths line for selected country
    line
        .append("path")
        .attr("class", "line-2")
        .attr("d", lineGenerator2(data))
        .call(transition)
        .attr("stroke", "#f00")
        .attr("stroke-width", 1)
        .attr("fill", "none");

    // Tool tip text box for dashed line tool tip
    const tooltipBox = line
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("opacity", 0)
        .style("cursor", "pointer")
        // On mouse move event
        .on("mousemove", function(e, d) {
            let tooltip = d3.select(".tooltip");
            tooltipLine.style("opacity", 1);

            const x0 = xScale.invert(d3.pointer(e, this)[0]);
            const i = bisectDate(data, x0);
            const d0 = data[i - 1];
            const d1 = data[i];
            const dx = x0 - dateParser(d0.date) > dateParser(d1.date) - x0 ? d1 : d0;

            tooltipLine
                .attr("x1", xScale(dateParser(dx.date)))
                .attr("x2", xScale(dateParser(dx.date)));

            tooltip
                .style("opacity", 1)
                .style("top", e.pageY + "px")
                .style("left", e.pageX + 10 + "px")
                .style("display", "block");
            // Append tooltip text box
            tooltip.html(`<span>Latest Data</span> <br/> <br/>
        <p><span>Date: </span> ${dx.date}</p>
        <p><span>Location: </span> ${dx.location}</p>
        <p><span>Total Cases: </span> ${dx.total_cases}</p>
        <p><span>Total Deaths: </span> ${dx.total_deaths}</p>`);
        })
        // On Mouse out event
        .on("mouseout", function(e, d) {
            tooltipLine.style("opacity", 0);
            d3.select(".tooltip").style("opacity", 0);
        });



    // Add a clipPath: everything out of this area won't be drawn.
    const clip = svg
        .append("defs")
        .append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);

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
        .on("end", updateChart);

    // Create the line variable: where both the line and the brush take place
    line.append("g").attr("clip-path", "url(#clip)");

    line.append("g").attr("class", "brush").call(brush);

    let idleTimeout;

    function idled() {
        idleTimeout = null;
    }

    // A function that update the chart for given boundaries
    function updateChart(event, d) {
        let extent = event.selection;

        if (!extent) {
            if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350));
            xScale.domain([4, 8]);
        } else {
            xScale.domain([xScale.invert(extent[0]), xScale.invert(extent[1])]);
            line.select(".brush").call(brush.move, null);
        }

        // Update axis and line position
        d3.select(".line-x-axis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(xScale));

        d3.select(".line-y-axis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(yScale).tickFormat(d3.format(".1s")));

        line
            .select(".line")
            .transition()
            .duration(1000)
            .attr("d", lineGenerator(data));

        line
            .select(".line-2")
            .transition()
            .duration(1000)
            .attr("d", lineGenerator2);
    }
};

drawChart();