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
	if(A.length !== A[0].length){throw "This system of equations has no solution"};
	var R = []
	for(var i = 0; i < A.length; i++){
		row = new Array(A.length).fill(0);
		row[i] = 1;
		R.push(row);	
	}
	var col = 0;
	for(var row = 0; row < A.length - 1; row++){
		A[row] = A[row].map(function(a){return a / A[row][col];});
		A[row+1] = A[row+1].map(function(a){return a / A[row+1][col+1];});
		A[row+1] = A[row+1].map(function(a, i){return a - A[row+1][i];});
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
