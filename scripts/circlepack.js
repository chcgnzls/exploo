var width = 1000,
		height = 1000;

var svg = d3.select("body").append("svg").attr("width", width)
    .attr("height", height);

svg.append("g").attr("transform", "translate(" + width/2+ "," + height/2 + ")");

var color = d3.scaleLinear().domain([0,height]).range(["#53565a","#db0631"]);

var circles = d3.packSiblings(d3.range(4000)
//		.map(d3.randomExponential(1/24))
		.map(d3.randomUniform(4,24))
    .map(function(r) { return {r: r}; }));

svg.select("g").selectAll("circle").data(circles).enter()
	.append("circle")
		.style("fill", function(d) { return color(d.y); })
		.attr("r", function(d) { return d.r - 0.25; })
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });
