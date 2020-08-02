function draw_page(val) {
	var w = 960;
	var h = 600;

		
	if (val == "index") {
		console.log("index");
		var svg = d3.select("#overview")
					.append("svg")
					.attr("width", w)
					.attr("height", h);

		console.log("read");
		Promise.all(
				[
					d3.json("gz_2010_us_040_00_500k.json"),
					d3.csv("1_county_level_confirmed_cases.csv"),
					d3.csv("3_cases_and_deaths_by_state_timeseries.csv"),
					d3.csv("2_cases_and_deaths_by_county_timeseries_00.csv"),
					d3.csv("2_cases_and_deaths_by_county_timeseries_01.csv"),
					d3.csv("2_cases_and_deaths_by_county_timeseries_02.csv")
				]
			).then(showUsMap);
		console.log("showUsMap");
		function showUsMap(dataSet) {
			let us = dataSet[0];
			let us_cases = dataSet[1];
			let us_deaths = dataSet[2];
			
			let state_cases = {};
			let state_deaths = {};
			for (let c of us_cases) {
				var state = c.state;
				var confirmed = parseInt(c.confirmed,10);
				var temp = 0;
				if (!isNaN(parseInt(state_cases[state], 10))) {
					temp = parseInt(state_cases[state], 10) + confirmed;
				}
				state_cases[state] = temp;
				var deaths = parseInt(c.deaths,10);
				if (!isNaN(parseInt(state_deaths[state], 10))) {
					temp = parseInt(state_deaths[state], 10) + deaths;
				}
				state_deaths[state] = temp;;
			}
			
			us.features = us.features.map(d => {
				let state = d.properties.NAME;
				let cases = state_cases[state];
				d.properties.confirmed = cases;
				return d
			})
			console.log(state_cases);
			console.log(state_deaths);
			console.log(us_cases);
			console.log(us);
			console.log(us_deaths);
			console.log("in");
			var projection = d3.geoAlbersUsa()
						 .scale(960)
						 .translate([w/2, h/2])

			var path = d3.geoPath()
						 .projection(projection);
			let maxCases  = d3.max(us.features,
								   d => d.properties.confirmed);
			let median = d3.median(us.features,
								   d => d.properties.confirmed);
			let colScale = d3.scaleLinear()
							 .domain([0, median, maxCases])
							 .range(["white", "orange", "red"]);
			
							 
			svg.selectAll("path")
              .data(us.features)
              .enter()
              .append("path") 
              .attr("d", path)
              .attr("stroke", "black")
			  .attr("stroke-width", "1.2")
              .attr("fill", d => d.properties.confirmed ?
								 colScale(d.properties.confirmed) :
								 "white")
			  .attr("transform", "translate(50,50)");

			svg.selectAll("circle")
				.data(us)
				.enter()
				.append("circle")
				.attr("r", 10)
				.attr("cx", d => projection([+d.Longitude, +d.Latitude])[0])
				.attr("cy", d => projection([+d.Longitude, +d.Latitude])[1]);				
        };
		console.log("done");
	} else if (val == "second") {
		
	} else if (val == "third") {
	}
}
