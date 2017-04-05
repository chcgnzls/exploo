var projScale = .8
var width = 960 * projScale, 
		height = 600 * projScale,
		centered;

var path = d3.geoPath().projection(scale(projScale));

var svg = d3.select("body").append("svg").attr("width", width)
				.attr("height", height); 

svg.append("rect").attr("class", "background").attr("width", width)
	.attr("height", height).on("click", clicked);

var g = svg.append("g");

var tooltip = d3.select("body").append("div").attr("class", "tooltip")
	.style("opacity", 0);

var fd = d3.format(".2f");
var fc = d3.format(",");
var fdp = d3.format(".3p");

function scale (k) {
	return d3.geoTransform({
		point: function(x,y){
			this.stream.point(x*k, y*k);
		}
	});
}

function mouseover() {
	tooltip.transition().duration(250).style("opacity", 1);
}

function mousemove(d) {
	if (d.properties.outcome !== null) {
		tooltip.html("<h1>" + d.properties.county + ", " + d.properties.state 
		+ '</h1><table><tr><td>Outcome: </td>' 
		+ '<td class="data">' + fd(d.properties.outcome) + '</td></tr>' 
		+ '<tr><td>Population: </td>'
		+ '<td class="data">' + fc(d.properties.pop) + '</td></tr>' 
		+ '<tr><td>Unemployment: </td>'
		+ '<td class="data">' + fdp(d.properties.unemp_rate) + '</td></tr>'
		+ '</table>')
			.style("left", (d3.event.pageX + 20) + "px")
			.style("top", (d3.event.pageY + 5) + "px");
	} else {
		tooltip.html("<h1>" + d.properties.county + ", " + d.properties.state 
		+ "</h1><center><table>"
		+ '<tr><td>Outcome: </td><td class="data">No data :(</td></tr>'
		+ '<tr><td>Population: </td>'
		+ '<td class="data">' + fc(d.properties.pop) + '</td></tr>' 
		+ '<tr><td>Unemployment: </td>'
		+ '<td class="data">' + fdp(d.properties.unemp_rate) + '</td></tr>'
		+ '</table></center>')
			.style("left", (d3.event.pageX + 20) + "px")
			.style("top", (d3.event.pageY + 5) + "px");
	}
}

function mouseout() {
	tooltip.transition().duration(400).style("opacity", 0);
}

function clicked(d) {
	var x, y, k;
	var dmain = [26.6551287850771, 23.1854857038872, 21.5521369057763, 21.3090409386006, 21.1096755218102, 20.8929580815745, 20.6098067440972, 15.4539201100024]
	var s = d3.scaleQuantile().domain(dmain).range([5, 4.5, 4, 3.5, 3, 2.5, 2]);
	if (d && centered !== d) {
		var centroid = path.centroid(d);
		x = centroid[0];
		y = centroid[1];
		k = s(Math.log(d.properties.area));
		centered = d;
	} else {
		x = width / 2;
		y = height / 2;		
		k = 1;
		centered = null;
	}

	g.selectAll("path").classed("active", centered && function(d) {
		return d === centered; });
	g.transition().duration(750).attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y +")");
}

d3.json("/usa-sm-q.json", function(error, usa) {
	if (error) throw console.log(error);
	
	cty = topojson.feature(usa, usa.objects.cty).features;

	var max_outcome = d3.max(cty, function(d) { 
		return d.properties.outcome });	
	var min_outcome = d3.min(cty, function(d) { 
		return d.properties.outcome });		
	var color = d3.scaleLinear().domain([min_outcome,max_outcome])
		.range(["#cc0000", "#618acc"]);

	//var min_area = d3.min(cty, function(d) {return d.properties.area });
	//var max_area = d3.max(cty, function(d) {return d.properties.area });
	//var s = d3.scaleLinear().domain([max_area, min_area]).range([2,5]);

	g.append("g").attr("class", "land").selectAll("path")
		.data(cty).enter().append("path")
		 .filter(function(d) { return d.properties.outcome !== null ;})
			.attr("fill", function(d) { return color(d.properties.outcome); })
		.attr("d", path)
			.on("mouseover", mouseover)
			.on("mousemove", mousemove)
			.on("mouseout", mouseout)
			.on("click", clicked);
	
	g.append("g").attr("class","land").selectAll("path")
		.data(cty).enter().append("path")
		.filter(function(d) { return d.properties.outcome === null ;})
		.attr("d", path).on("mouseover", mouseover).on("mousemove", mousemove)
		.on("mouseout", mouseout).on("click", clicked);
});
