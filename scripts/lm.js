var ym = mobData.map(function(d){return Number(d[lhsVar]);});
var Xm = mobData.map(function(d){return [d[rhsVars[0]], d[rhsVars[1]]].map(Number);});

var X = Xm.filter(function(d, i){
		var k = [ym[i]];
		k = k.concat(d);
		return !numeric.any(numeric.isNaN(k));
	});
var y = ym.filter(function(d, i){
		var k = [d];
		k = k.concat(Xm[i]);
		return !numeric.any(numeric.isNaN(k));
	});
