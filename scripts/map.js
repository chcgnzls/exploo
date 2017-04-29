var mapThis = "perm_res_p25_kr26"
var projScale = 1;
var width = 960 * projScale, 
		height = 600 * projScale,
		centered;

var path = d3.geoPath().projection(scale(projScale));

var svg = d3.select("#mapContainer").append("svg").attr("width", width)
	.attr("height", height); 

svg.append("rect").attr("class", "background").attr("width", width)
	.attr("height", height).on("click", clicked);

var g = svg.append("g");

var tooltip = d3.select("body").append("div").attr("class", "tooltip")
	.style("opacity", 0);

var selectors = document.getElementsByTagName("select");

var keys;
var outcomeKeys;
var yourData;
var mobData = [];

var rhsVars = [];

//  Number format functions
var fd = d3.format(".2f");
var fc = d3.format(",");
var fdp = d3.format(".3p");

function showHide() {
	var x = document.getElementById("inputContainer");
	if (x.style.display === "none") {
		x.style.display = "block";
	} else {
		x.style.display = "none";
	};
};

//  Function to scale map on click
function scale (k) {
	return d3.geoTransform({
		point: function(x,y){
			this.stream.point(x*k, y*k);
		}
	});
};

//  Mouse event functions for map
function mouseover() {
	tooltip.transition().duration(250).style("opacity", 1);
	d3.select(this).style("opacity", .6).style("stroke-opacity", 1);
};

function mousemove(d) {
	if (d.properties.outcomes[mapThis] !== "NA") {
		tooltip.html("<h1>" + d.properties.outcomes.county_name + ", " 
		+ d.properties.outcomes.stateabbrv + '</h1><table><tr><td>' 
		+ mapThis + ': </td>' 
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
		+ '<tr><td>' + mapThis + ': </td><td class="data">No data! :(</td></tr>'
		+ '<tr><td>Population: </td>'
		+ '<td class="data">' + fc(d.properties.outcomes.cty_pop2000) 
		+ '</td></tr>' 
		+ '<tr><td>Unemployment: </td>'
		+ '<td class="data">' + fdp(d.properties.outcomes.unemp_rate) + '</td></tr>'
		+ '</table></center>')
			.style("left", (d3.event.pageX + 20) + "px")
			.style("top", (d3.event.pageY + 5) + "px");
	};
};

function mouseout() {
	tooltip.transition().duration(400).style("opacity", 0);
	d3.select(this).transition().duration(100).style("opacity", 1).style("stroke-opacity", 0);
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
	};

	g.selectAll("path").classed("active", centered && function(d) {
		return d === centered; });
	g.transition().duration(750).attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y +")");
}

//  Functions and listeners to load display data and previews
function showChecked() {
	if(this.checked) {
		d3.select("#previewChecked").append("span").attr("id", this.value)
			.text(this.value + " ");
		rhsVars.push(this.value)
	} else {
		d3.select("span#" + this.value).remove();
		rhsVars.pop(this.value)
	}
};

function loadElements(yourData) {
	var keys = d3.keys(yourData[0]);
	var _yourData = yourData.slice(0,6);

		
	d3.select("#preview").html("").append("tr").attr("class", "fixed")
		.selectAll("th").data(keys).enter().append("th").text(function(d) {
			return d; });

	d3.select("#preview").selectAll("tr")
			.data(_yourData).enter().append("tr")
		.selectAll("td")
			.data(function(d) { return keys.map(function(key) { return d[key] }); })
			.enter().append("td")
			.text(function(d) { return d; });

	d3.selectAll("#load").text("");
	d3.select("#idPreview").html("");

	d3.select("#idSelect").selectAll("option.var").remove();
	d3.select("#idSelect").selectAll("option.var")
		.data(keys).enter().append("option").attr("class","var").text(function(key) { return key; });

	d3.select("#yourOutcome").selectAll("option.var").remove();
	d3.select("#yourOutcome").selectAll("option.var")
		.data(keys).enter().append("option").attr("class", "var")
		.text(function(k) {return k }).on("change", genMap);

	d3.selectAll("optgroup").remove();
	d3.select("#lhsSelect").append("optgroup").attr("id", "lhsMoptgroup")
		.attr("label", "Mobility Data");
	d3.select("#lhsSelect").append("optgroup").attr("id", "lhsYoptgroup")
		.attr("label", "Your Data");
	d3.select("#rhsSelect").append("optgroup").attr("id", "rhsYoptgroup")
		.attr("label", "Your Data");
	d3.select("#rhsSelect").append("optgroup").attr("id", "rhsMoptgroup")
		.attr("label", "Mobility Data");

	d3.select("#lhsMoptgroup").selectAll("option.var").remove();
	d3.select("#lhsMoptgroup").selectAll("option.var")
		.data(outcomeKeys).enter().append("option").attr("class", "var")
		.text(function(k) {return k });

	d3.select("#lhsYoptgroup").selectAll("option.var").remove();
	d3.select("#lhsYoptgroup").selectAll("option.var")
		.data(keys).enter().append("option").attr("class", "var")
		.text(function(k) {return k });

	d3.select("#rhsMoptgroup").selectAll("option.var").remove();
	d3.select("#rhsMoptgroup").selectAll("option.var")
		.data(outcomeKeys).enter().append("option").attr("class", "var")
		.text(function(k) {return k });
	
	d3.select("#rhsYoptgroup").selectAll("option.var").remove();
	d3.select("#rhsYoptgroup").selectAll("option.var")
		.data(keys).enter().append("option").attr("class", "var")
		.text(function(k) {return k });
 
	d3.select("#leftCheckbox").selectAll("div.leftCheckbox").remove();
	d3.select("#rightCheckbox").selectAll("div.rightCheckbox").remove();

	d3.select("#leftCheckbox").selectAll("input.checkbox").data(keys)
		.enter().append("div").attr("class", "leftCheckbox").append("input")
		.attr("class", "checkbox").attr("type", "checkbox")
		.attr("value", function(k) { return k }).on("change", showChecked);
	d3.select("#rightCheckbox").selectAll("input.checkbox").data(outcomeKeys)
		.enter().append("div").attr("class", "rightCheckbox").append("input")
		.attr("class", "checkbox").attr("type", "checkbox")
		.attr("value", function(k) { return k }).on("change", showChecked);

	d3.selectAll("div.leftCheckbox").data(keys).append("span")
		.attr("class", "mono").text(function(k) { return k });
	d3.selectAll("div.rightCheckbox").data(outcomeKeys).append("span")
		.attr("class", "mono").text(function(k) { return k });
	
	d3.select("button").on("click", function() {
		if (rhsVars.length < 1) {
			alert("foo");
		} else {
			console.log(rhsVars);
		}
	});

	selectors[1].addEventListener("change", loadPreview, false);
	function loadPreview() {
		var geoId = this.options[this.selectedIndex].text;
		if(geoId !== ""){
			d3.select("#idPreview").html("").append("span").attr("class", "mono")
				.text(" :[" + _yourData.slice(0,4).map(function(d) {
					return d[geoId]; }) + ", ... ]");	
			var matches = mobData.map(function(d){return d.GEOID;}).map(function(e){
				return yourData.map(function(h){return h[geoId];}).indexOf(e);});
			matches.map(function(i, j){if(yourData[i] !== undefined){
					mobData[j]["CRACK_INDEX"] = yourData[i]["CRACK_INDEX"];
				} else {
					mobData[j]["CRACK_INDEX"] = null;
				};});
		} else {
			d3.select("#idPreview").html("");
		};	
	};
};

function uploadData(element, callback) {
	var uploader = document.getElementById(element);
	var reader = new FileReader();

	reader.onload = function(d) {
		var contents = d.target.result;
		callback(contents);
		document.getElementById("mergeContainer").style.display = "block";
		document.getElementById("modelHeading").style.display = "block";
		document.getElementById("lhsContainer").style.display = "block";
		document.getElementById("rhsContainer").style.display = "block";
	};
	
	uploader.addEventListener("change", loadingPreview, false);

	function loadingPreview() {
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
			d3.select("#previewContainer").html("").attr("class", null);
			document.getElementById("mergeContainer").style.display = "none";
			document.getElementById("lhsContainer").style.display = "none";
			document.getElementById("rhsContainer").style.display = "none";

		};
	};
};

function loadCSV(csv) {
	yourData = d3.csvParse(csv);
	loadElements(yourData);
};

//  Fucntion to draw map
function genMap() {
	if (typeof this.options !== "undefined") {
		mapThis = this.options[this.selectedIndex].text;	
		d3.selectAll("g.land").remove();
	}

	var max_outcome = d3.max(cty, function(d) { 
		return Number(d.properties.outcomes[mapThis]) });	
	var min_outcome = d3.min(cty, function(d) { 
		return Number(d.properties.outcomes[mapThis]) });		
	var color = d3.scaleLinear().domain([min_outcome,max_outcome])
		.range(["#cc0000", "#618acc"]);

	g.append("g").attr("class", "land").selectAll("path")
		.data(cty).enter().append("path")
		 .filter(function(d) { return d.properties.outcomes[mapThis] !== "NA" ;})
			.attr("fill", function(d) 
				{ return color(Number(d.properties.outcomes[mapThis])); })
		.attr("d", path)
			.on("mouseover", mouseover)
			.on("mousemove", mousemove)
			.on("mouseout", mouseout)
			.on("click", clicked);
	
	g.append("g").attr("class","land").selectAll("path")
		.data(cty).enter().append("path")
		.filter(function(d) { return d.properties.outcomes[mapThis] === "NA" ;})
		.attr("d", path)
			.on("mouseover", mouseover)
			.on("mousemove", mousemove)
			.on("mouseout", mouseout)
			.on("click", clicked);
};

function drawMap(error, usa) {
	if (error) throw console.log(error);
	d3.select("#mapLoader0").transition().duration(250).style("opacity", "0")
		.remove();
	var showMe = document.getElementById("inputContainer");
	if( showMe.style.display === "none" || showMe.style.display === "") {
		showMe.style.display = "block" ;
	};
	
	cty = topojson.feature(usa, usa.objects.cty).features;
	for(var i = 0; i < cty.length; i++){
		mobData.push(cty[i].properties.outcomes);
	};

	genMap()

	d3.selectAll(".mainContent").transition().duration(1750).style("opacity", 1);

	outcomeKeys = d3.keys(cty[0].properties.outcomes);
	d3.select("#outcomeSelector").selectAll("option").data(outcomeKeys)
		.enter().append("option").text(function(k) { return k });

	selectors[0].addEventListener("change", genMap, false);
};


//  Run
uploadData("input", loadCSV);
d3.json("/usa-sm-q.json", drawMap);
