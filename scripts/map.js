var nm = numeric;

var mapThis = "perm_res_p25_kr26"
var projScale = 1;
var width = 960 * projScale, 
		height = 520 * projScale,
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
var mobKeys;
var yourData;
var mobData = [];
var rhsVars = [];
var results;

//  Number format functions
var fd = d3.format(".2f");
var fc = d3.format(",");
var fdp = d3.format(".3p");

function showHide(id) {
	var x = document.getElementById(id);
	if (x.className === "") {
		x.className = "closed";
	} else {
		x.className = "";
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
	if (d.properties.outcomes[mapThis] !== "NA" && !isNaN(d.properties.outcomes[mapThis])) {
		var outcome = fd(Number(d.properties.outcomes[mapThis]));
	} else {
		var outcome = "No data";
	}
	var el = document.getElementsByClassName("ttOpt");
	el = Array.prototype.filter.call(el, function(d){return d.checked;});
	var summVar = el.map(function(d){return [d.name, d.value];});
	var table = summVar.map(function(e){
		var r = Number(d.properties.outcomes[e[1]]);
		if(!isNaN(r)){
			if(r > 1){
				r = fc(r);
			} else {
				r = fdp(r);
			}
		} else {
			r = "No data";
		}
		return '<tr><td>' + e[0] + ': </td><td class="data">' + r + '</td></tr>';}).join("");
	tooltip.html("<h1>" + d.properties.outcomes.county_name + ", "
		+ d.properties.outcomes.stateabbrv + "</h1><table><tr><td>" 
		+ mapThis + ": </td>" + '<td class="data">' 
		+ outcome + "</td></tr>" 
		+ table + "</table>")
	.style("left", (d3.event.pageX + 20) + "px")
	.style("top", (d3.event.pageY + 5) + "px");
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
function loadElements(yourData) {
	var keys = d3.keys(yourData[0]);
	var _yourData = yourData.slice(0,8);
	document.getElementById("previewShadow").style.opacity = 1;	
	document.getElementsByClassName("mergeShadow")[0].style.opacity = 1;
	document.getElementsByClassName("mergeShadow")[1].style.opacity = 1;

	d3.select("#uploadPreview").html("").append("table").attr("id", "previewTable").style("table-layout","fixed").append("tr").attr("class", "fixed")
		.selectAll("th").data(keys).enter().append("th").text(function(d) {
			return d; });
d3.select("#previewTable").selectAll("tr")
			.data(_yourData).enter().append("tr")
		.selectAll("td")
			.data(function(d) { return keys.map(function(key) { return d[key] }); })
			.enter().append("td").style("text-align", "right")
			.text(function(d) { return d; });

	d3.selectAll("#load").text("");

	document.getElementById("idSelect").style.cursor = "pointer";
	document.getElementById("idSelect").disabled = false;
	d3.select("#idSelect").selectAll("option.var").remove();
	d3.select("#idSelect").selectAll("option.var")
		.data(keys).enter().append("option").attr("class","var").text(function(key) { return key; });

	document.getElementById("idSelect").addEventListener("change", merge, false);

	function merge() {
		var geoId = this.options[this.selectedIndex].text;
		if(geoId !== ""){
			var matches = mobData.map(function(d){return d.GEOID;}).map(function(e){
				return yourData.map(function(h){return h[geoId];}).indexOf(e);});
			var unmatched = Array(yourData.length).fill(0)
				.map(function(d, i){return i;}).filter(function(d){
					return matches.filter(function(e){return e !== -1;}).indexOf(d) < 0;});
			var unmatchedCli = yourData.map(function(d){return d[geoId];})
				.map(function(d){
					return mobData.map(function(e){return e[geoId];}).indexOf(d);})
				.map(function(d, i){if(d === -1){return i;}})
				.filter(function(d){return d !== undefined;});
			var unmatchedServ = unmatched.filter(function(d){
				return unmatchedCli.indexOf(d) < 0;});

			if(unmatchedCli.length > 0 || unmatchedServ.length > 0){
				document.getElementById("missing").addEventListener("click", getMissing, false);
				function getMissing(){
						var missingCli = unmatchedCli.map(function(d){return yourData[d];});
						var missingServ = unmatchedServ.map(function(d){
							return {GEOID: mobData[d].GEOID, ST: mobData[d].stateabbrv, COUNTY: mobData[d].county_name};});
						var missing = {unmatched_cli: missingCli, unmatched_serv: missingServ}
						var link = document.createElement("a");
						link.setAttribute("href", "data:text/plain;charset=utf-8," 
							+ encodeURIComponent(JSON.stringify(missing)));
						link.setAttribute("download", "missing_obs.json");
						link.style.display = "none";
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
				};
			}
			matches.map(function(i, j){if(yourData[i] !== undefined){
					mobData[j]["CRACK_INDEX"] = yourData[i]["CRACK_INDEX"];
				} else {
					mobData[j]["CRACK_INDEX"] = NaN;
				};});
			var matched = matches.filter(function(d){return d !== -1;}).length;
			var matchedPop = matches.filter(function(d){return d !== -1;}).map(
						function(d){return mobData[d].cty_pop2000;})
					.reduce(function(acc, val){return Number(acc) + Number(val);}, 0);
			var totalPop = mobData.map(function(d){return d.cty_pop2000;})
					.reduce(function(acc, val){return Number(acc) + Number(val);}, 0);

			d3.select("#information").style("padding", "5px")
				.html("-- " + matched + " of " + yourData.length + " (" 
					+ fdp(matched / yourData.length) + ") were matched to " 
					+ mobData.length + " (" + fdp(matched / mobData.length) 
					+ ") geographies. <br/> -- " + fdp(matchedPop / totalPop) 
					+ " of the total US population.");
			document.getElementById("mergeResults").style.opacity = 1;
			document.getElementById("missing").style.cursor = "pointer";
			document.getElementById("merged").style.opacity = 0.5;
	//		document.getElementById("merged").style.cursor = "pointer";

			selectors[2].addEventListener("change", genMap, false);

			d3.select("#outcomeSelector").selectAll("option.var")
				.data(keys).enter().insert("option", ":first-child")
				.attr("class", "var").text(function(k){return k;});

			d3.select("#lhsSelect").selectAll("option.var")
				.data(keys).enter().insert("option", ":first-child")
				.attr("class", "var").text(function(k){return k;});
			d3.select("#rhsSelect").selectAll("div.rhsn").data(keys).enter()
				.insert("div", ":first-child").attr("class", "rhsn")
				.html(function(k){
					return '<input type="checkbox" class="rhsVar" value="' + k + '" />' 
						+ '<span class="mono">' + k + '</span>';});
		}	
	};
};

function uploadData(element, callback) {
	var uploader = document.getElementById(element); var reader = new FileReader(); 
	reader.onload = function(d) {
		var contents = d.target.result;
		callback(contents);
	};
	
	uploader.addEventListener("change", loadingPreview, false);

	function loadingPreview() {
		var file = this.files[0];
		if(typeof file !== "undefined") {
			d3.select("#uploadPreview").html("");
			d3.select("#information").html("");
			reader.readAsText(file);
		} else {
			d3.select("#uploadPreview").html("");
			d3.select("#information").html("");
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
		 .filter(function(d) {return d.properties.outcomes[mapThis] !== "NA" && !isNaN(d.properties.outcomes[mapThis]);})
			.attr("fill", function(d) 
				{ return color(Number(d.properties.outcomes[mapThis])); })
		.attr("d", path)
			.on("mouseover", mouseover)
			.on("mousemove", mousemove)
			.on("mouseout", mouseout)
			.on("click", clicked);
	
	g.append("g").attr("class","land").selectAll("path")
		.data(cty).enter().append("path")
		.filter(function(d) {return d.properties.outcomes[mapThis] === "NA" || isNaN(d.properties.outcomes[mapThis]);})
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
//	document.getElementById("dropdown").click();

	cty = topojson.feature(usa, usa.objects.cty).features;
	for(var i = 0; i < cty.length; i++){
		mobData.push(cty[i].properties.outcomes);
	};

	genMap()

	d3.selectAll(".mainContent").transition().duration(1750).style("opacity", 1);

	mobKeys = d3.keys(cty[0].properties.outcomes);
	mobKeys.pop("GEOID");
	var covKeys = mobKeys.filter(function(k){return k.match("causal") === null;})
		.filter(function(k){return k.match("perm") === null;});
	var outcomeKeys = mobKeys.filter(function(k){return covKeys.indexOf(k) < 0;});
	var allKeys = covKeys.slice(14).concat(outcomeKeys);
	covKeys.push("GEOID");

	d3.select("#outcomeSelector").selectAll("option").data(allKeys)
		.enter().append("option").text(function(k) { return k });

	document.getElementById("outcomeSelector").addEventListener("change", genMap, false);
	d3.select("#lhsSelect").selectAll("option").data(outcomeKeys).enter()
		.append("option").text(function(k){return k;});
	d3.select("#rhsSelect").selectAll("div.rhs").data(covKeys).enter()
		.append("div").attr("class", "rhs").html(function(k){
			return '<input type="checkbox" class="rhsVar" value="' + k + '"/>' + '<span class="mono">' + k + '</span>';});
};

function OLSmodel() {
	d3.select("table.reg").remove();
	var lhsSelector = document.getElementById("lhsSelect");
	var lhsVar = lhsSelector[lhsSelector.selectedIndex].text
	var coeffNames = ["int"].concat(rhsVars);

	var ym = mobData.map(function(d){return Number(d[lhsVar]);});
	var Xm = mobData.map(function(d){return rhsVars.map(function(e){
		return Number(d[e]);});});
	var X = Xm.filter(function(d, i){
		var k = [ym[i]];
		k = k.concat(d);
		return !numeric.any(numeric.isNaN(k));
	});
	var depMean = nm.transpose(X).map(function(d){return nm.sum(d);})
		.map(function(d){return d / X.length});
	depMean = depMean.reduce(function(acc, cur, i){
		acc[rhsVars[i]] = cur;
		return acc;}, {});
	X = X.map(function(d){return [1].concat(d);});
	var y = ym.filter(function(d, i){
		var k = [d];
		k = k.concat(Xm[i]);
		return !numeric.any(numeric.isNaN(k));
	});

	var yMean = y.reduce(function(acc, val){return acc + val;}, 0) / y.length
	var XtXinv = nm.inv(nm.dot(nm.transpose(X), X));
	var betas = nm.dot(XtXinv, nm.dot(nm.transpose(X), y));
	var coeffs = betas.reduce(function(acc, cur, i){
			acc[coeffNames[i]] = cur; 
			return acc;}, {});
	var yHat = nm.dot(X, betas);
	var e = nm.sub(y, yHat);
	var M = nm.sub(nm.identity(y.length), nm.dot(X, nm.dot(XtXinv, nm.transpose(X))));
	var TrM = nm.getDiag(M).reduce(function(acc, val){return acc + val;}, 0);
	var ssq = nm.dot(e, e) / TrM; 
	var se = nm.getDiag(XtXinv).map(function(d){return Math.sqrt(d * ssq);});
	var tStat = betas.map(function(b, i){return b / se[i];});	
	se = se.reduce(function(acc, cur, i){
		acc[coeffNames[i]] = cur;
		return acc;}, {});
	tStat = tStat.reduce(function(acc, cur, i){
		acc[coeffNames[i]] = cur;
		return acc;}, {});
	results = {coeffs: coeffs, stdErr: se, tStat: tStat, SER: ssq, yMean: yMean, depMean: depMean, N: y.length};

	table = Object.keys(results.coeffs).map(function(k){
		return '<tr class="reg"><td class="var">' + k 
		+ '</td><td class="coef">' 
		+ d3.format(".3f")(Number(results.coeffs[k])) + '<br>(' 
		+ d3.format(".3f")(Number(results.stdErr[k])) + ')</td><td class="coef">'
		+ d3.format(".3f")(Number(results.tStat[k])) + '</td></tr>';});
	
	table.push('<tr><td class="var topBr">N</td><td class="coef topBr">' + d3.format(",")(results.N) + '</td><td class="topBr"></td></tr>');
	table = table.join("");
	d3.select("#results").append("table").attr("class", "reg").html(table);
};

//  Run
document.body.addEventListener("mouseover", function(){
	var el = document.getElementsByClassName("rhsVar");
	el = Array.prototype.filter.call(el, function(e){return e.checked;});
	rhsVars = el.map(function(e){return e.value;});

	var predbttn = document.getElementById("predict");
	if(rhsVars.length > 0){
		predbttn.style.cursor = "pointer";
		predbttn.style.opacity = "1";
		predbttn.addEventListener("click", OLSmodel, false);
	} else {
		predbttn.style.cursor = "default";
		predbttn.style.opacity = ".5";
		predbttn.removeEventListener("click", OLSmodel, false);
	}
}, false);	
uploadData("input", loadCSV);
d3.json("/usa-sm-q.json", drawMap);
