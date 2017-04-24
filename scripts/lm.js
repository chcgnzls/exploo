function T(m) {
	var mT = [];
	for(var col = 0; col < m[0].lenght; col++){
		var rT = [];
		for(var row = 0; row < m.length; row++){
			rT.push(m[row][col]);
		}
	mT.push(rT);
	}
	return(mT);
}

function leftMultiply(A, B) {
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
