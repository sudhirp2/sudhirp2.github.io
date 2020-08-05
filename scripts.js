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
					d3.csv("us_state_abbreviations.csv"),
					//d3.csv("3_cases_and_deaths_by_state_timeseries.csv"),
					//d3.csv("2_cases_and_deaths_by_county_timeseries_00.csv"),
					//d3.csv("2_cases_and_deaths_by_county_timeseries_01.csv"),
					//d3.csv("2_cases_and_deaths_by_county_timeseries_02.csv"),

				]
			).then(showUsMap);
		//console.log("showUsMap");
		function showUsMap(dataSet) {
			let us = dataSet[0];
			let us_cases = dataSet[1];
			let us_abbr = dataSet[2];
			//let us_deaths = dataSet[2];

			
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
					.attr("font-style", "italic")
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

		var tooltip = d3.select("#charttooltip");
		Promise.all(
				[
					d3.json("us_state_abbreviations.json"),
					d3.csv("3_cases_and_deaths_by_state_timeseries.csv")
				]
			).then(setupDropDownAndPlotDefault);

		//console.log("showUsMap");
		function setupDropDownAndPlotDefault(dataSet) {
				
			let us_states = dataSet[0];
			
			dd_state = us_states[dd_selection].State;
			console.log(us_states);

			// create the drop down menu of states
			let selector = d3.select("#dropdown")
							 .append("g")
							 .append("select")
							 .attr("id", "stateopt")
							 .selectAll("option")
							 .data(us_states)
							 .enter().append("option")
							 .text(function(d) { return d.State; })
							 .attr("value", function (d, i) {
								return i;
							  });
			console.log("247");
			// start with index 0
			d3.select("#stateopt").property("selectedIndex", dd_selection);

			d3.select("#stateopt")
			.on("change", function(d) {
				dd_selection = +this.value;
				dd_state = us_states[dd_selection].State;
				console.log("Use selected state" , dd_selection, us_states[dd_selection].State);
				plotChart(dataSet, dd_state, dd_selection);
			})
			
			console.log("Default selection" , dd_selection, dd_state);
			plotChart(dataSet, dd_state, dd_selection);
		}
		
		function getStdDate(ds) {
			var mm = ds.getMonth() + 1;
			var dd = ds .getDate();
			var yy = ds .getFullYear();
			return mm + "/" + dd + "/" + yy;
		}
		function showChartToolTip(d, s, coords) {
						console.log(d, s, coords);
			d3.select("#charttooltip")
				.style("top", coords[1]+"px")
				.style("left", coords[0]+"px")
				.style("display", "block")
				.html("<b>" + "<br/>" + "<font color=blue>" + s + "<br/>" + "Confirmed Cases: " + d.cases + "<br/>" + "Deaths: " + "<font color=red>" + d.deaths + "</font>" + "<br/>" + "Date: " + getStdDate(d.date)  + "</b>");
		}
		function plotChart(dataSet, state, index) {
				let us_states = dataSet[0];
				let case_deaths = dataSet[1];

				let parseDate = d3.timeFormat("%m/%e/%Y").parse;
				let	bisectDate = d3.bisector(function(d) { return d.date; }).left;
				let formatValue = d3.format(",");
				let dateFormatter = d3.timeFormat("%m/%d/%y");
		
				// Clear the svg before we redraw
				d3.selectAll("svg > *").remove();
				var svg = d3.select("#chartarea")
						.append("svg")
						.attr("width", w)
						.attr("height", h);				
				console.log(case_deaths);
				let info = new Array();
				var i = 0;
				for (let c of case_deaths) {
					if (c.state == state) {
						let state_val = new Object();
						state_val["date"] = new Date(c.date);
						state_val["cases"] = +c.cumulative_cases;
						state_val["deaths"] = +c.cumulative_deaths;
						info.push(state_val);
					}
					i += 1; 
				}
				console.log(info);

				let maxValue = d3.max(info,  d => d.cases);
				let y_margin = 80;
				let yScale = d3.scaleLinear()
								.range([h-200, 180])
								.domain([0,maxValue]);

				svg.append("g")
					.call(d3.axisLeft(yScale))
					.attr("transform", "translate(80, 0)")
					
				let xScale = d3.scaleTime()
								.domain(d3.extent(info, d => d.date))
								.range([80, w-280]);
				svg.append("g")
					.call(d3.axisBottom(xScale)
						  .tickFormat(d3.timeFormat("%b")))
					.attr("transform", "translate(0, 600)")
					
				valueline = d3.line()
							.x(d => xScale(d.date))
							.y(d => yScale(d.cases));
				deathline = d3.line()
							.x(d => xScale(d.date))
							.y(d => yScale(d.deaths));
							
				svg.append("path")
					.datum(info)
					.attr("fill", "none")
					.attr("stroke", "blue")
					.attr("d", valueline)
					.attr("transform", "translate(0, 0)")
					.on("mousemove", function(d) {
						let x0 = xScale.invert(d3.mouse(this)[0]);
						let i = bisectDate(d, x0, 1),
						d0 = d[i - 1];
						d1 = d[i];
						v = x0 - d0.date > d1.date - x0 ? d1 : d0;
						showChartToolTip(v, state, [d3.event.clientX, d3.event.clientY]);	
					})
					.on("mouseover", function(d) {
						let x0 = xScale.invert(d3.mouse(this)[0]);
						let i = bisectDate(d, x0, 1),
						d0 = d[i - 1];
						d1 = d[i];
						v = x0 - d0.date > d1.date - x0 ? d1 : d0;
						showChartToolTip(v, state, [d3.event.clientX, d3.event.clientY]);	
					})
					.on("click", function(d) {
						let x0 = xScale.invert(d3.mouse(this)[0]);
						let i = bisectDate(d, x0, 1),
						d0 = d[i - 1];
						d1 = d[i];
						v = x0 - d0.date > d1.date - x0 ? d1 : d0;
						showChartToolTip(v, state, [d3.event.clientX, d3.event.clientY]);	
					})
					.on("mouseout", function (d) {
						d3.select("#charttooltip").style("display", "none");
					});
					
				
				svg.append("path")
					.datum(info)
					.attr("fill", "none")
					.attr("stroke", "red")
					.attr("d", deathline)
					.attr("transform", "translate(0, 0)")
					.on("mousemove", function(d) {
						let x0 = xScale.invert(d3.mouse(this)[0]);
						let i = bisectDate(d, x0, 1),
						d0 = d[i - 1];
						d1 = d[i];
						v = x0 - d0.date > d1.date - x0 ? d1 : d0;
						showChartToolTip(v, state, [d3.event.clientX, d3.event.clientY]);	
					})
					.on("mouseover", function(d) {
						let x0 = xScale.invert(d3.mouse(this)[0]);
						let i = bisectDate(d, x0, 1),
						d0 = d[i - 1];
						d1 = d[i];
						v = x0 - d0.date > d1.date - x0 ? d1 : d0;
						showChartToolTip(v, state, [d3.event.clientX, d3.event.clientY]);	
					})
					.on("click", function(d) {
						let x0 = xScale.invert(d3.mouse(this)[0]);
						let i = bisectDate(d, x0, 1),
						d0 = d[i - 1];
						d1 = d[i];
						v = x0 - d0.date > d1.date - x0 ? d1 : d0;
						showChartToolTip(v, state, [d3.event.clientX, d3.event.clientY]);	
					})
					.on("mouseout", function (d,i) {
						d3.select("#charttooltip").style("display", "none");
					});				

				svg.append("text")
					.attr("class", ".labels")
					.attr("text-anchor", "end")
					.attr("stroke", "black")
					.attr("x", w/2-100)
					.attr("y", 650)
					.attr("font-size", 14)
					.text("Timeline");
					console.log(w/2);
					
				svg.append("text")
					.attr("class", ".labels")
					.attr("text-anchor", "start")
					.attr("stroke", "black")
					.attr("x", -480)		
					.attr("y", 6)			
					.attr("dy", ".75em")
					.attr("transform", "rotate(-90)")
					.attr("font-size", 14)
					.text(state + " " + "Confirmed Cases / Deaths")
					.append;
					
			svg.append("text")
                .attr("x", w/2-50)
                .attr("y", 680)
                .attr("font-family","verdana")
                .attr("font-size",12)
				.attr("font-style", "italic")
				.style("font-weight", "bold")
				.style("fill", "red")
                .text("Move the mouse over the line for details.")	
		}
		
	} else if (val == "third") {
		let dd_selection  = 0;
		let dd_state = "";

		var tooltip = d3.select("#bgtooltip");

		Promise.all(
				[
					d3.json("us_state_abbreviations.json"),
					d3.csv("1_county_level_confirmed_cases.csv"),
				]
			).then(plotBarGraph);
		

		function plotBarGraph(dataSet) {
				let us_states = dataSet[0];
				let us_cases = dataSet[1];
				let margin = 80;
			if (dbgOn) {
				console.log(us_cases);
				console.log(us_states);
			}
			function lookup_abbr(val) {
				for (var i = 0; i < us_states.length; i++) {
					if (us_states[i].State == val) {
						return us_states[i].Code;
					}
				}	
			}
			function lookup_name(abbr) {
				for (var i = 0; i < us_states.length; i++) {
					if (us_states[i].Code == abbr) {
						return us_states[i].State;
					}	
				}	
			}
			function showBarGraphTooltip(d, coords) {
				let s = lookup_name(d.state);
				d3.select("#bgtooltip")
					.style("top", coords[1]+"px")
					.style("left", coords[0]+"px")
					.style("display", "block")
					.html("<b>" + "<br/>" + "<font color=blue>" + s + "<br/>" + "Confirmed Cases: " + d.cases + "<br/>" + "Deaths: " + "<font color=red>" + d.deaths + "</font>" + "<br/>" + "</b>");
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
			let trends = new Array()
			for (let c of us_states) {
				let state_val = new Object()
				state_val["state"] = lookup_abbr(c.State);
				state_val["cases"] = state_cases[c.State];
				state_val["deaths"] = state_deaths[c.State];
				trends.push(state_val);
			}

			if (dbgOn) {
				console.log(trends, trends);
				console.log(state_cases);
			}
			// Clear the svg before we redraw
			d3.selectAll("svg > *").remove();
			var svg = d3.select("#bargrapharea")
						.append("svg")
						.attr("width", w)
						.attr("height", h);
							
			// ##
			let chart = svg.append("g")
						   .attr("transform", "translate(0, "+0+")");
								
			yScale = d3.scaleLinear()
					   .domain([0, d3.max(trends, d => d.cases)])
					   .range([h - 200, 180]);
			svg.append("g")
			   .call(d3.axisLeft(yScale))
			   .attr("transform", "translate(80, 0)")
					 
			xScale = d3.scaleBand()
			    		.domain(trends.map(d => d.state))
						.range([80, w-280]);
			// Sort the state by value
			trends.sort(function(a, b) {
				return d3.ascending(a.cases, b.cases)
			})
			xScale.domain(trends.map(function(d) {
				return d.state;
			}));
			
			svg.append("g")
				.call(d3.axisBottom(xScale))
				.attr("transform", "translate(2,600)")
				.selectAll("text")
				.attr("y", 0)
				.attr("x", 9)
				.attr("dy", ".30em")
				.attr("transform", "rotate(90)")
				.style("text-anchor", "start")
				.attr("font-family","verdana")
				.attr("font-size", 10)
				.attr("fill", "black")
				.style("font-weight", "italic");

				let maxCases  = d3.max(trends, d => d.cases);
				let median = d3.median(trends, d => d.cases);
				let colScale = d3.scaleLinear()
							 .domain([0, median, maxCases])
							 .range(["white", "orange", "red"]);

				chart.selectAll()
					.attr("class", "bars")				
					.data(trends)
					.enter()
					.append("rect")
					.attr("x", (d) => xScale(d.state))
					.attr("y", (d) => yScale(d.cases))
					.attr("width", (xScale.bandwidth() * 4)/5)
					.attr("fill", "yellow")
					.attr("fill", d => d.cases ? colScale(d.cases) : "white")
					.attr("height", (d) => h - 200 - yScale(d.cases))
					.attr("transform", "translate(2, 0)")
					.on("mousemove", function(d) {
						showBarGraphTooltip(d, [d3.event.clientX, d3.event.clientY]);
					})
					.on("mouseover", function(d) {
						showBarGraphTooltip(d, [d3.event.clientX, d3.event.clientY]);
					})
					.on("mouseout", function(d) {
						d3.select("#bgtooltip").style("display", "none");
					})
					  
				svg.append("text")
					.attr("class", ".labels")
					.attr("text-anchor", "end")
					.attr("stroke", "black")
					.attr("x", w/2-100)
					.attr("y", 650)
					.attr("font-size", 14)
					.text("States");
					console.log(w/2);
					
				svg.append("text")
					.attr("class", ".labels")
					.attr("text-anchor", "start")
					.attr("stroke", "black")
					.attr("x", -480)		
					.attr("y", 6)			
					.attr("dy", ".75em")
					.attr("transform", "rotate(-90)")
					.attr("font-size", 14)
					.text("Confirmed Cases")
					.append;
					
				svg.append("text")
					.attr("x", w/2-50)
					.attr("y", 680)
					.attr("font-family","verdana")
					.attr("font-size",12)
					.attr("font-style", "italic")
					.style("font-weight", "bold")
					.style("fill", "red")
					.text("Move the mouse over the bar graphs for details.")	
		}
		
	}
}
