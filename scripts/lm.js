function T(m) {
	var mT = [];
	for(var col = 0; col < m[0].length; col++){
		var rT = [];
		for(var row = 0; row < m.length; row++){
			rT.push(m[row][col]);
		}
	mT.push(rT);
	}
	return(mT);
}

function mMultiply(A, B) {
	var result = [];
	if(A.length !== B.length){ throw "i !== j";}
	for(var i = 0; i < A.length; i++){
		var resultRow = [];
		for(var j = 0; j < B.length; j++){
			resultRow.push(A[i].reduce(function(a, b, k){
				return a + b * B[j][k] ; }, 0));	
		}
		result.push(resultRow);
	}
	return(result);
}

function solve(A) {
	if(A.length !== A[0].length){ throw "A is not square" };
	var result = []
	for(var i = 0; i < A.length; i++){
		row = new Array(A.length).fill(0);
		row[i] = 1;
		result.push(row);	
	}
	for(var i = 0; i < A.length - 1; i++){
		A[i] = A[i].map(function(a) { return a / A[i][i] });
		A[i+1] = A[i+1].map(function(a) { return a - b }); 
	}	
}

function matchMerge(A, B, geoIdA, geoIdB){
	var matches = A.map(function(d){return d[geoIdA];})
			.map(function(e){return B.map(function(h){return h[geoIdB]}).indexOf(e);});
	var matched = matches.map(function(i, j){
		if(B[i] !== undefined){
			A[j][Var] = B[i][Var];
		} else {
			A[j][Var] = null;
		}
		return A[j];
	});
	return matched;
}
