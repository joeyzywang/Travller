var fs = require('fs'),M = require('../mysqlHelper'),S = require('string'),U = require('../utility'),cheerio = require('cheerio')

var getVideoModel = M.getVideoModel, insertVideo = M.insertVideo,getInsertSQL = M.getInsertSQL,
	getUpandDown = U.getUpandDown,	getTimeStamp = U.getTimeStamp,
	getFirstLetter = U.getFirstLetter
/*
	Links rule
*/

var getlinksFromListPage = function(body){
	var $ = cheerio.load(body);
	var allLinks = $("td[height=20][align=left] a");
	return allLinks;
}

var getPlayList = function(html){
	if(html && html.length > 0){
		var $ = cheerio.load(html);
		var lis = $('li');
		var temp = [];
		for (var i = 0; i < lis.length; i++) {
			temp.push(lis.eq(i).text());
		};
		return temp.join('\n')		
	}else{
		return '';
	}
}
/*
	Detail page processing method (Generate SQL file)
*/
var oneDetailPageHandler = function (body,callback){
	var error = null;
	var bodyStr = S(body);
	var video = getVideoModel();

	video.title = (bodyStr.between('<!--影片名称开始代码-->','<!--影片名称结束代码-->').s)
	video.picurl = (bodyStr.between('<!--影片图片开始代码-->','<!--影片图片结束代码-->').s)
	video.director = (bodyStr.between('<!--影片导演开始代码-->','<!--影片导演结束代码-->').s)
	video.actor = (bodyStr.between('<!--影片主演开始代码-->','<!--影片主演结束代码-->').s)
	video.intro = (bodyStr.between('<!--影片备注开始代码-->','<!--影片备注结束代码-->').s)
	video.keywords = (bodyStr.between('<!--影片标签开始代码-->','<!--影片标签结束代码-->').s)
	video.area = (bodyStr.between('<!--影片地区开始代码-->','<!--影片地区结束代码-->').s)
	video.year = (bodyStr.between('<!--上映日期开始代码-->','<!--上映日期结束代码-->').s)
	video.serial = (bodyStr.between('<!--影片状态开始代码-->','<!--影片状态结束代码-->').s)
	// video.addtime = getTimeStamp(bodyStr.between('<!--影片更新时间开始代码-->','<!--影片更新时间结束代码-->').s)
	video.addtime = getTimeStamp()
	video.hits = (bodyStr.between('<!--评分人数开始代码-->','<!--评分人数结束代码-->').s)
	
	video.language = (bodyStr.between('<!--影片语言开始代码-->','<!--影片语言结束代码-->').s)

	video.content = (bodyStr.between('<!--影片介绍开始代码-->','<!--影片介绍结束代码-->').s)
	var avgScore = (bodyStr.between('<!--平均分开始代码-->','<!--平均分结束代码-->').s)
	var totalScore = (bodyStr.between('<!--总分开始代码-->','<!--总分结束代码-->').s);

	var UandD = getUpandDown(avgScore,totalScore);
	video.up = UandD.up;
	video.down = UandD.down;
	video.score = avgScore; 
	//var avgScore = (bodyStr.between('<!--评分人数开始代码-->','<!--评分人数结束代码-->').s)
	video.letter = getFirstLetter(video.title);

	video.playurl = getPlayList(bodyStr.between('<!--百度播放列表开始代码-->','<!--百度播放列表结束代码-->').s)	
	video.tudou = getPlayList(bodyStr.between('<!--土豆播放列表开始代码-->','<!--土豆播放列表结束代码-->').s)
	video.youku = getPlayList(bodyStr.between('<!--优酷播放列表开始代码-->','<!--优酷播放列表结束代码-->').s)
	video.qvod = getPlayList(bodyStr.between('<!--qvod播放列表开始代码-->','<!--qvod播放列表结束代码-->').s)
	video.swf = getPlayList(bodyStr.between('<!--swf播放列表开始代码-->','<!--swf播放列表结束代码-->').s)

	var category = (bodyStr.between('<!--影片分类开始代码-->','<!--影片分类结束代码-->').s)
	video.cid = getColId(category,video.title)
	var sql = getInsertSQL('gx_video',video);
	
	fs.appendFile( process.env['INSERT_SQLFILE_PATH'] ,sql+";\n",function(error){
		callback(error,video,sql);
	});
}

/*
	Terminate check
*/
var checkTerminated = function(video){
	var nowYear = new Date().getUTCFullYear();
	var intro = video.intro, year = video.year,
		score = video.score
	if(intro == '预告片' || 
		intro.indexOf('TS') != -1
		) return false;
	
	if(intro.match(/全(.*)集/) != null ||
			intro.indexOf('大结局') != -1 || 
			intro.indexOf('全') != -1 ||
			(year != 0 && (year < nowYear) ) ||
			(score == 0) && (intro.indexOf('DVD') != -1) ||
			(score == 0) && (intro.indexOf('BD') != -1)
		){
		return true; // Done't update again ...
	}else{
		return false;
	}
}
/*
	Get Column id from video title and category name
*/

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
	}else if(str == "动画片"){
		return 39;
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

exports.getlinksFromListPage = getlinksFromListPage;
exports.oneDetailPageHandler = oneDetailPageHandler;
exports.checkTerminated = checkTerminated;