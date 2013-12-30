var getPinyin = require('./cc2py').getPinyin

var getFirstLetter = function(str){
	if(str.length > 0){
		var firsrtC = str[0];
		var py = getPinyin(firsrtC);
		return py[0];
	}else{
		return "";
	}
}



var getColId = function(str,title){
	
	if((str.indexOf("综艺") != -1 && title.indexOf("比赛") != -1)||(str.indexOf("综艺") != -1 && title.indexOf("NBA") != -1)){
		return 5;
	}else if(str == "动作片"){
		return 8;
	}else if(str == "喜剧片"){
		return 9;
	}else if(str == "爱情片"){
		return 10;
	}else if(str == "科幻片"){
		return 11;
	}else if(str == "剧情片"){
		return 12;
	}else if(str == "恐怖片"){
		return 13;
	}else if(str == "战争片"){
		return 14;
	}else if(str == "纪录片"){
		return 6;
	}else if(str == "国产剧" || str == "大陆剧"){
		return 15;
	}else if(str == "台湾剧" || str == "台剧"){
		return 16;
	}else if(str == "香港剧" || str == "港剧"){
		return 17;
	}else if(str == "韩国剧" || str == "韩剧"){
		return 18;
	}else if(str == "日本剧" || str == "日剧"){
		return 19;
	}else if(str == "欧美剧" || str == "美剧"){
		return 20;
	}else if(str == "海外剧"){
		return 21;
	}else if(str == "英国剧" || str == "英剧"){
		return 23;
	}else if(str == "泰国剧" || str == "泰剧"){
		return 24;
	}else if(str == "印度剧"){
		return 25;
	}else if(str == "新加坡剧"){
		return 26;
	}else if(str == "动漫" || str == "动画片"){
		return 3;
	}else if(str == "国产动漫" || str == "动画片"){
		return 27;
	}else if(str == "日本动漫" || str == "动画片"){
		return 28;
	}else if(str == "欧美动漫" || str == "动画片"){
		return 29;
	}else if(str == "综艺"){
		return 4;
	}else if(str == "内地综艺"){
		return 30;
	}else if(str == "台湾综艺"){
		return 31;
	}else if(str == "香港综艺"){
		return 32;
	}else if(str == "韩国综艺"){
		return 33;
	}else if(str == "日本综艺"){
		return 34;
	}else if(str == "欧美综艺"){
		return 35;
	}else if(str == "演唱会"){
		return 36;
	}else if(str == "晚会"){
		return 37;
	}else if(str == "其他娱乐"){
		return 38;
	}else if(str == "微电影"){
		return 22;
	}else {
		console.log('[ERROR]: getColId error, '+ str + ' not found any match category !');		
		return 999;
	}
}

var getTimeStamp = function(){
	var milseconds =  new Date().getTime();
	return Math.round(milseconds/1000);
}