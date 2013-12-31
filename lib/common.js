var output = function(type,str){
	if(type=='error'){
		console.log('[ERROR]: '+str);
	}else if(type == 'info'){
		console.log('[INFO]: '+str);
	}else{
		console.log(str);
	}
}

exports.output = output;