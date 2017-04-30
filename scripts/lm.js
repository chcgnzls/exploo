var nm = numeric;

var ym = mobData.map(function(d){return Number(d[lhsVar]);});
var Xm = mobData.map(function(d){return rhsVars.map(function(e){return Number(d[e]);});});
var X = Xm.filter(function(d, i){
		var k = [ym[i]];
		k = k.concat(d);
		return !numeric.any(numeric.isNaN(k));
	});
X = X.map(function(d){return [1].concat(d);});
var y = ym.filter(function(d, i){
		var k = [d];
		k = k.concat(Xm[i]);
		return !numeric.any(numeric.isNaN(k));
	});
	
var meanDep = nm.transpose(X).map(function(d){return d.reduce(function(acc, val){return acc + val;}, 0) / d.length;});
var varDep = nm.transpose(X).map(function(d, i){return d.map(function(a){return Math.pow(a - meanDep[i], 2);}).reduce(function(acc, val){return acc + val;}, 0) / d.length;})

var XtXinv = nm.inv(nm.dot(nm.transpose(X), X));
var betas = nm.dot(XtXinv, nm.dot(nm.transpose(X), y)); 
var se = nm.getDiag(XtXinv).map(function(d, i){return Math.sqrt(d * varDep[i]);});
