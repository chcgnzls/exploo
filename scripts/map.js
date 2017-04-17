function showHide() {
	var x = document.getElementById("inputContainer");
	if (x.style.display === "none") {
		x.style.display = "block";
	} else {
		x.style.display = "none";
	}
}

var mapThis = "perm_res_p25_kr30"
var projScale = 1;
var width = 960 * projScale, 
		height = 600 * projScale,
		centered;

var path = d3.geoPath().projection(scale(projScale));

var svg = d3.select(".mapContainer").append("svg").attr("width", width)
	.attr("height", height); 

svg.append("rect").attr("class", "background").attr("width", width)
	.attr("height", height).on("click", clicked);

var g = svg.append("g");

var tooltip = d3.select("body").append("div").attr("class", "tooltip")
	.style("opacity", 0);

var fd = d3.format(".2f");
var fc = d3.format(",");
var fdp = d3.format(".3p");

//  Function to Scale mapsize on click
function scale (k) {
	return d3.geoTransform({
		point: function(x,y){
			this.stream.point(x*k, y*k);
		}
	});
}

//  Mouseover Tooltip function
function mouseover() {
	tooltip.transition().duration(250).style("opacity", 1);
}

function mousemove(d) {
	if (d.properties.outcome !== null) {
		tooltip.html("<h1>" + d.properties.outcomes.county_name + ", " 
		+ d.properties.outcomes.stateabbrv + '</h1><table><tr><td>Outcome: </td>' 
		+ '<td class="data">' + fd(Number(d.properties.outcomes[mapThis])) 
		+ '</td></tr>' + '<tr><td>Population: </td>'
		+ '<td class="data">' + fc(Number(d.properties.outcomes.cty_pop2000)) 
		+ '</td></tr>' 
		+ '<tr><td>Unemployment: </td>'
		+ '<td class="data">' + fdp(Number(d.properties.outcomes.unemp_rate)) + '</td></tr>'
		+ '</table>')
			.style("left", (d3.event.pageX + 20) + "px")
			.style("top", (d3.event.pageY + 5) + "px");
	} else {
		tooltip.html("<h1>" + d.properties.outcomes.county_name + ", " 
		+ d.properties.outcomes.stateabbrv  
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

//  Function to zoom to flciked
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

//  Functions and listeners to load display data and redraw maps
function loadCSV(csv) {
	var data = d3.csvParse(csv);
	loadElements(data);
}

function loadElements(data) {
	var keys = d3.keys(data[0]);
	var _keys = keys.slice(0,5);
	var _data = data.slice(0,6);

	if (keys.length >= 5) {
		_keys.push("...")
	}

	d3.select("#preview").html("").append("tr").attr("class", "fixed")
		.selectAll("th").data(_keys).enter().append("th").text(function(d) {
			return d; });

	d3.select("#preview").selectAll("tr")
			.data(_data).enter().append("tr")
		.selectAll("td")
			.data(function(d) { return _keys.map(function(key) { return d[key] }); })
			.enter().append("td")
			.text(function(d) { return d; });

	d3.selectAll("#load").text("");
	d3.select("#idPreview").html("");

	d3.select("#idSelect").selectAll("option.vars").remove();
	d3.select("#idSelect").selectAll("option.vars")
		.data(keys).enter().append("option").attr("class","vars").text(function(key) { return key; });

	var selectors = document.getElementsByTagName("select");
	selectors[0].addEventListener("change", loadPreview, false);
	function loadPreview() {
		var key = this.options[this.selectedIndex].text;
		if(key !== ""){
			d3.select("#idPreview").html("").append("span").attr("class", "mono")
				.text(" :[" + _data.slice(0,4).map(function(d) {
					return d[key]; }) + ", ... ]");	
		} else {
			d3.select("#idPreview").html("");
		};	
	};
};

function uploadBttn(el, callback) {
	var uploader = document.getElementById(el);
	var reader = new FileReader();

	reader.onload = function(d) {
		var contents = d.target.result;
		callback(contents);
	};
	
	uploader.addEventListener("change", handleFiles, false);

	function handleFiles() {
		
		var file = this.files[0];
		if(typeof file !== "undefined") {
			d3.select("#previewContainer").html("");
			d3.select("#previewContainer").attr("class", "container")
				.append("h4").text("Preview:")
				.append("div").attr("class", "preview-box")
					.append("table").attr("id", "preview");
			d3.select("#preview").text("loading...");
			d3.select("#load").html("").text("loading...");	
			reader.readAsText(file);
		} else {
			d3.select("#previewContainer").html("");
		};
	};
};

//  Fucntion to draw map
function drawMap(error, usa) {
	if (error) throw console.log(error);
	d3.select("#mapLoader0").remove();
	var showMe = document.getElementById("inputContainer");
	if( showMe.style.display === "none" || showMe.style.display === "") {
		showMe.style.display = "block" ;
	}
	
	cty = topojson.feature(usa, usa.objects.cty).features;

	var max_outcome = d3.max(cty, function(d) { 
		return Number(d.properties.outcomes[mapThis]) });	
	var min_outcome = d3.min(cty, function(d) { 
		return Number(d.properties.outcomes[mapThis]) });		
	var color = d3.scaleLinear().domain([min_outcome,max_outcome])
		.range(["#cc0000", "#618acc"]);

	g.append("g").attr("class", "land").selectAll("path")
		.data(cty).enter().append("path")
		 .filter(function(d) { return d.properties.outcomes[mapThis] !== null ;})
			.attr("fill", function(d) { return color(Number(d.properties.outcomes[mapThis])); })
		.attr("d", path)
			.on("mouseover", mouseover)
			.on("mousemove", mousemove)
			.on("mouseout", mouseout)
			.on("click", clicked);
	
	g.append("g").attr("class","land").selectAll("path")
		.data(cty).enter().append("path")
		.filter(function(d) { return d.properties.outcomes[mapThis] === "NA" ;})
		.attr("d", path).on("mouseover", mouseover).on("mousemove", mousemove)
		.on("mouseout", mouseout).on("click", clicked);
};

uploadBttn("input", loadCSV);
d3.json("/usa-sm-q.json", drawMap);
