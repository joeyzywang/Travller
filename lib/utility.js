var getPinyin = require('./cc2py').getPinyin, cheerio = require('cheerio')

var getFirstLetter = function(str){
	if(str.length > 0){
		var firsrtC = str[0];
		var py = getPinyin(firsrtC);
		return py[0];
	}else{
		return "";
	}
}


var getTimeStamp = function(){
	var milseconds =  new Date().getTime();
	return Math.round(milseconds/1000);
}


var getUpandDown = function(avgScore,totalScore){
	var upAndDown = {up:0,down:0};
	if(avgScore == 0 || totalScore == 0){
		return upAndDown;
	}
	if(avgScore < 10){
		var percent = avgScore/10;
		upAndDown.up = totalScore * percent;
		upAndDown.down = totalScore - upAndDown.up;
		return upAndDown;
	}else{
		return upAndDown;
	}
}

exports.getTimeStamp = getTimeStamp;
exports.getFirstLetter = getFirstLetter;
exports.getUpandDown = getUpandDown;
