function draw_page(val) {
	var w = 1024;
	var h = 800;
	var dbgOn = 0;

	if (val == "index") {
		console.log("index");
		var svg = d3.select("#maparea")
					.append("svg")
					.attr("width", w)
					.attr("height", h);
			  
		var tooltip = d3.select("#tooltip");
		// gz_2010_us_040_00_500k.json from https://eric.clst.org/tech/usgeojson/
		Promise.all(
				[
					d3.json("gz_2010_us_040_00_500k.json"),
					d3.csv("1_county_level_confirmed_cases.csv"),
					d3.csv("3_cases_and_deaths_by_state_timeseries.csv"),
					d3.csv("2_cases_and_deaths_by_county_timeseries_00.csv"),
					d3.csv("2_cases_and_deaths_by_county_timeseries_01.csv"),
					d3.csv("2_cases_and_deaths_by_county_timeseries_02.csv"),
					d3.csv("us_state_abbreviations.csv"),
				]
			).then(showUsMap);
		//console.log("showUsMap");
		function showUsMap(dataSet) {
			let us = dataSet[0];
			let us_cases = dataSet[1];
			let us_deaths = dataSet[2];
			let us_abbr = dataSet[6];
			
			function lookup_abbr(val) {
				for (var i = 0; i < us_abbr.length; i++) {
					if (us_abbr[i].State == val) {
						return us_abbr[i].Code;
					}
				}
			}
			
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
				let deaths = state_deaths[state];
				d.properties.confirmed = cases;
				d.properties.deaths = deaths;
				return d
			})
			if (dbgOn) {
				console.log(state_cases);
				console.log(state_deaths);
				console.log(us_cases);
				console.log(us);
				console.log(us_deaths);
				console.log("in");
			}
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

			svg.append("g")
			  .attr("class", "state")
			  .selectAll("path")
              .data(us.features)
              .enter()
              .append("path") 
              .attr("d", path)
              .attr("stroke", "black")
			  .attr("stroke-width", "0.5")
              .attr("fill", d => d.properties.confirmed ?
								 colScale(d.properties.confirmed) :
								 "white")
			  .attr("transform", "translate(0,0)")
			  .on("mousemove", function(d,i) {
					this.style.opacity = 0.7;
					tooltip.transition().duration(200).style("opacity", 1);
					tooltip.style("hidden", false)
						   .style("left", (d3.event.pageX)+ "px")
						   .style("top",  (d3.event.pageY)+ "px")
						   .html("<b>" + "<br/>" + "<font color=blue>" + d.properties.NAME + "</font>" + "<br/>" + "Confirmed cases:  " + d.properties.confirmed + "<br/>" + "Deaths: " + "<font color=red>" + d.properties.deaths + "</font>" + "</b>");
			  })
			  .on("mouseover", function(d,i) {
					this.style.opacity = 0.7;
					//console.log("processMouseOver we go", d.properties.NAME, d.properties.confirmed, d.properties.deaths);
					tooltip.transition().duration(200).style("opacity", 1);
					tooltip.text("Sudhir");
					tooltip.style("hidden", false)
						   .style("left", (d3.event.pageX)+"px")
						   .style("top",  (d3.event.pageY)+"px")
						   .html("<b>" + "<br/>" + "<font color=blue>" + d.properties.NAME + "<br/>" + "Confirmed Cases: " + d.properties.confirmed + "<br/>" + "Deaths: " + "<font color=red>" + d.properties.deaths + "</font>" + "</b>");
			  })
			  .on("mouseout", function (d,i) {
					this.style.opacity = 1;
					this.style.fill = d.properties.confirmed ?
								colScale(d.properties.confirmed) : "white";
					tooltip.transition().duration(1200).style("opacity", 0);
					tooltip.style("hidden", true).html('');		
			  });

			svg.selectAll(".labels")
					.data(us.features)
					.enter()
					.append("text")
					.attr("class", "labels")
					.text((d, i) => lookup_abbr(d.properties.NAME))
					.attr("font-color", "black")
					.attr("x", (d, i) => path.centroid(d)[0]- 5)
					.attr("y", (d, i) => path.centroid(d)[1]-10);
					
			svg.append("text")
                .attr("x",0)
                .attr("y",500)
                .attr("font-family","verdana")
                .attr("font-size",10)
				.attr("font-style", "italic")
				.style("text-decoration-line", "underline")
                .style("text-decoration-style", "wavy")
				.style("font-weight", "bold")
				.style("fill", "red")
                .text("Move the mouse over the map for details.")
					
				// add the choropleth legend
				let width = 100, height = 700;
			  
				var announce = d3.select("#maparea")
								.append("svg")
								.attr("width", width)
								.attr("height", height)
								.attr("class", "legend")
								.attr("transform", "translate(950, 0)");
			
				var legend = announce.append("defs")
							.append("svg:linearGradient")
							.attr("id", "gradient")
							.attr("x1", "100%")
							.attr("y1", "0%")
							.attr("x2", "100%")
							.attr("y2", "100%")
							.attr("spreadMethod", "pad");
			
				legend.append("stop")
					  .attr("offset", "0%")
					  .attr("stop-color", "red")
					  .attr("stop-opacity", 1);
			
				legend.append("stop")
					.attr("offset", "100%")
					.attr("stop-color", "white")
					.attr("stop-opacity", 1);

				announce.append("rect")
				   .attr("width", width/4)
				   .attr("height", height)
				   .style("fill", "url(#gradient)")
			       .attr("transform", "translate(0,-50)");
				   

				svg.append("text")
					.attr("x",800)
					.attr("y",680)
					.attr("font-family","verdana")
					.attr("font-size", 9)
					.attr("font-style", "normal")
					.style("text-decoration-line", "underline")
					.style("font-weight", "bold")
					.style("fill", "red")
					.text("Map color gradiation by confirmed cases")


				var y = d3.scaleLinear()
						  .range([height, 0])
						  .domain([0, maxCases]);

				var yAxis = d3.axisRight(y);

				announce.append("g")
				   .attr("class", "y axis")
				   .attr("transform", "translate(0,-50)")
				   .call(yAxis)
				
        };
	
		console.log("done");
	} else if (val == "second") {

		let dd_selection  = 0;
		let dd_state = "";
		Promise.all(
				[
					d3.json("gz_2010_us_040_00_500k.json"),
					d3.csv("1_county_level_confirmed_cases.csv"),
					d3.csv("3_cases_and_deaths_by_state_timeseries.csv"),
					d3.csv("2_cases_and_deaths_by_county_timeseries_00.csv"),
					d3.csv("2_cases_and_deaths_by_county_timeseries_01.csv"),
					d3.csv("2_cases_and_deaths_by_county_timeseries_02.csv"),
					d3.json("us_state_abbreviations.json"),
				]
			).then(plotChart);

		//console.log("showUsMap");
		function plotChart(dataSet) {
				
			let us_states = dataSet[6];
			
			console.log(us_states);
			// create the drop down menu of states
			let selector = d3.select("#slide2_dd")
							  .append(svg)
							 .append("select")
							 .attr("id", "stateopt")
							 .selectAll("option")
							 .data(us_states)
							 .enter().append("option")
							 .text(function(d) { return d.State; })
							 .attr("value", function (d, i) {
								return i;
							  });

			// start with index 0
			d3.select("#stateopt").property("selectedIndex", dd_selection);

			d3.select("#stateopt")
			.on("change", function(d, i) { 
				dd_selection = i;
				console.log(d, i);
			})
		}	
	} else if (val == "third") {
	}
}
