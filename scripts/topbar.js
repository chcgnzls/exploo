//  Set width and height
var width = 1000,
	height = 80;

//  Generate Random Radi
var rads = []
var maxRad = 10
var minRad = 3

for (var i = 0; i < 400; i++) {
	rads.push({
		idx: i, 
		radius: Math.floor(Math.random() * (maxRad - minRad)) + minRad
	});
}

var circles = {
	name: "root",
	children : rads
}

var topbar = d3.select("#topbar").append("svg:svg").attr("width", width)
		.attr("height", height);

var nodes = d3.layout.pack().value(function(d) {return d.radius})
		.size([width, height]).nodes(circles);

nodes.shift();

topbar.selectAll("circles").data(nodes).enter().append("svg:circle")
	.attr("cx", function(d) {return d.x; })
	.attr("cy", function(d) {return d.y; })
	.attr("r", function(d) {return d.r; })
	.attr("fill", "white")
	.attr("stroke", "grey");
