/*
	THIS RESOURCE IS ONLY FOR [QVOD] !!!
*/
var fs = require('fs'),M = require('../mysqlHelper'),S = require('string'),U = require('../utility'),cheerio = require('cheerio')

var getVideoModel = M.getVideoModel, insertVideo = M.insertVideo,getInsertSQL = M.getInsertSQL,getUpdateSQL = M.getUpdateSQL,queryVideo = M.queryVideo,
	getUpandDown = U.getUpandDown,	getTimeStamp = U.getTimeStamp,
	getFirstLetter = U.getFirstLetter

/*
	Links rule
*/

var getlinksFromListPage = function(body){
	var $ = cheerio.load(body);
	var allLinks = $("td[height=26] a");
	return allLinks;
}
/*
	Get Play Number
*/
var getPlayNumber = function(html){
	if(html && html.length > 0){
		var $ = cheerio.load(html);
		var lis = $("input[name=copy_yah]");
		return lis.length;		
	}else{
		return 0;
	}	
}

/*
	Play url handler
*/
var getPlayList = function(html){
	if(html && html.length > 0){
		var $ = cheerio.load(html);
		var lis = $("input[name=copy_yah]");
		var temp = [];
		for (var i = 0; i < lis.length; i++) {
			temp.push( getSerialNameAndURL(lis.eq(i).val()) );
		};
		return temp.join('\n')		
	}else{
		return '';
	}
}

var getSerialNameAndURL = function(playURL){
	var flag = S(playURL).endsWith('|');
	if(flag){
		var temp = playURL.substring(0,playURL.length-2);
		var lastSepIndex = temp.lastIndexOf('|');
		var mediaNameIndex = temp.lastIndexOf('.');
		var title = temp.substring(lastSepIndex + 1 ,mediaNameIndex);
		return title + '$' + playURL;
	}else{
		return '未知标题$' + playURL;
	}
}

var getDirector = function(html){
	if(html && html.length > 0){
		var $ = cheerio.load(html);
		var string = S($('table tbody tr td table tbody').eq(0).children().eq(2).text()).trim().s;
		var directorStr = S(string).chompLeft('影片导演：').s; //'bar'
		return directorStr;		
	}else{
		return '';
	}
}

/*
	Detail page processing method (Generate SQL file)
*/
var oneDetailPageHandler = function (body,callback){
	var bodyStr = S(body);
	var video = getVideoModel();
	var subtitle = 		(bodyStr.between('<!--影片副标开始代码-->','<!--影片副标结束代码-->').s)
	video.title =    	(bodyStr.between('<!--影片名称开始代码-->','<!--影片名称结束代码-->').s)
	video.picurl =		'http://www.bdzy.cc'+(bodyStr.between('<!--影片图片开始代码-->','<!--影片图片结束代码-->').s)
	video.director = 	getDirector(body);
	video.actor = 		(bodyStr.between('<!--影片演员开始代码-->','<!--影片演员结束代码-->').s)
	video.intro = 		(bodyStr.between('<!--影片备注开始代码-->','<!--影片备注结束代码-->').s)
	// video.keywords = 	(bodyStr.between('<!--影片标签开始代码-->','<!--影片标签结束代码-->').s)
	video.area = 		(bodyStr.between('<!--影片地区开始代码-->','<!--影片地区结束代码-->').s)
	video.year = 		(bodyStr.between('<!--上映日期开始代码-->','<!--上映日期结束代码-->').s)
	video.serial = 		(bodyStr.between('<!--影片状态开始代码-->','<!--影片状态结束代码-->').s)
	// video.addtime = getTimeStamp(bodyStr.between('<!--影片更新时间开始代码-->','<!--影片更新时间结束代码-->').s)
	video.addtime = getTimeStamp();
	// video.hits = (bodyStr.between('<!--评分人数开始代码-->','<!--评分人数结束代码-->').s)
	video.language = 	(bodyStr.between('<!--影片语言开始代码-->','<!--影片语言结束代码-->').s)
	video.content = 	(bodyStr.between('<!--影片介绍开始代码-->','<!--影片介绍结束代码-->').s)
	// var avgScore = (bodyStr.between('<!--平均分开始代码-->','<!--平均分结束代码-->').s)
	// var totalScore = (bodyStr.between('<!--总分开始代码-->','<!--总分结束代码-->').s);
	// var UandD = getUpandDown(avgScore,totalScore);
	// video.up = UandD.up;
	// video.down = UandD.down;
	video.score = 0; 
	//var avgScore = (bodyStr.between('<!--评分人数开始代码-->','<!--评分人数结束代码-->').s)
	video.letter = getFirstLetter(video.title);
	// video.playurl = getPlayList(bodyStr.between('<!--百度播放列表开始代码-->','<!--百度播放列表结束代码-->').s)	
	// video.tudou = getPlayList(bodyStr.between('<!--土豆播放列表开始代码-->','<!--土豆播放列表结束代码-->').s)
	// video.youku = getPlayList(bodyStr.between('<!--优酷播放列表开始代码-->','<!--优酷播放列表结束代码-->').s)
	// video.swf = getPlayList(bodyStr.between('<!--swf播放列表开始代码-->','<!--swf播放列表结束代码-->').s)
	video.qvod = getPlayList(bodyStr);

	var category = (bodyStr.between('<!--影片类型开始代码-->','<!--影片类型结束代码-->').s)
	if(video.title == '' || (!video.title)){
		console.log('----------- body ----------');
		console.log(body);
		console.log('-------------------------');
		console.log(video);
		console.log('	have no title !');
		process.exit();
	}
	video.cid = getColId(category,video.title,video.area,video.intro,video.serial,getPlayNumber(bodyStr));
	// var sql = getInsertSQL('gx_video',video);
	if(video.cid == 999){
		callback(null,video,"");
	}else{
		checkUpdateAndGetSQL(video,function(error,sql){
			if(error || sql == ""){ //If error or no sql,  no need to update
				callback(error,video,sql);
			}else{
				var sqlFilePath;
				if(sql.indexOf('UPDATE') != -1)	sqlFilePath = process.env['UPDATE_SQLFILE_PATH'];
				if(sql.indexOf('INSERT') != -1)	sqlFilePath = process.env['INSERT_SQLFILE_PATH'];
				
				fs.appendFile(sqlFilePath,sql,function(error_fs){
					callback(error_fs,video,sql);
				});			
			}
			
		});		
	}
}

/*
	Terminate check
*/
var checkTerminated = function(video){
	if(video.serial == '完结' ||video.serial.indexOf('完结')!=-1){
		return true;
	}else{
		return false;
	} 
}
/*
	Get Column id from video title and category name
*/

var getColId = function(str,title,area,intro,serial,playNumber){
	
	if((str=='综艺其它' && title.indexOf("比赛") != -1)||(str.indexOf("综艺其它") != -1 && title.indexOf("NBA") != -1)){
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
	}else if ( str == "卡通动漫" && ( ( (serial.indexOf('完结')!=-1 ||intro.indexOf('BD')!=-1 || intro.indexOf('DVD')!=-1) && playNumber < 5 ) ) ) { // 完结的动漫片，并且基数少于5，归于电影
		return 39;
	}else if(str == "国产电视剧"){
		return 15;
	}else if(str == "台湾电视剧"){
		return 16;
	}else if(str == "香港电视剧"){
		return 17;
	}else if(str == "韩国电视剧"){
		return 18;
	}else if(str == "日本电视剧"){
		return 19;
	}else if(str == "欧美电视剧" && !isBritsh(title)){
		return 20;
	}else if(str == "海外电视剧"){
		return 21;
	}else if(str == "欧美电视剧" && isBritsh(title)){ //英剧
		return 23;
	}else if(str == "海外电视剧" && area == "泰国"){
		return 24;
	}else if(str == "海外电视剧" && area == "印度"){ //印度剧
		return 25;
	}else if(str == "海外电视剧" && area == "新加坡"){ //新加坡剧
		return 26;
	}else if(str == "动漫"){ //动漫的父目录
		return 3;
	}else if(str == "卡通动漫" && area == '大陆'){
		return 27;
	}else if(str == "卡通动漫" && area == '日本'){
		return 28;
	}else if(str == "卡通动漫" && area == '欧美'){
		return 29;
	}else if(str == "综艺"){
		return 4;
	}else if(str == "综艺节目" && area =='大陆'){ 
		return 30;
	}else if(str == "综艺节目" && area == '台湾'){
		return 31;
	}else if(str == "综艺节目" && area == '香港'){
		return 32;
	}else if(str == "综艺节目" && area == '韩国'){
		return 33;
	}else if(str == "综艺节目" && area == '日本'){
		return 34;
	}else if(str == "综艺节目" && area == '欧美'){
		return 35;
	}else if(str == "综艺节目"){ //地区不存在，算大陆的 
		return 30;
	}else if(str == "综艺节目" && (title.indexOf('演唱会')!=-1)){
		return 36;
	}else if(str == "综艺节目" && (title.indexOf('晚会')!=-1)){
		return 37;
	}else if(str == "音乐"){ //其他娱乐
		return 38;
	}else if(str == "微电影"){
		return 22;
	}else {
		console.log('[ERROR]: getColId error, '+ str + ' not found any match category !');		
		return 999;
	}
}
var isBritsh = function(title){
	var britsh = [];
	britsh.push('黑镜')
	britsh.push('殊途同归')
	britsh.push('唐顿庄园')
	britsh.push('皮囊')
	britsh.push('神探夏洛克')
	britsh.push('梅林传奇')
	britsh.push('布莱克书店')
	britsh.push('米兰达')
	britsh.push('白教堂血案')
	britsh.push('IT狂人')
	britsh.push('憨豆先生')
	britsh.push('神秘博士')
	britsh.push('大侦探波罗')
	britsh.push('梅林传奇')
	britsh.push('摩斯探长前传')
	britsh.push('马普尔小姐探案')
	britsh.push('白教堂血案')
	britsh.push('飞天大盗')
	britsh.push('我欲为人')

	for (var i = 0; i < britsh.length; i++) {
		if(title.indexOf(britsh[i]) != -1){
			return true;
		}
	};
	return false;
}

/*
	Check Update 
*/

var checkUpdateAndGetSQL = function(video_latest,callback){
	var video_exist = queryVideo('gx_video',[],{title:video_latest.title},function(error,videos){
		if(error){
			console.log('[ERROR]: DB error happened on checkUpdateAndGetSQL :' + error);
			return callback(error,"");
		}
		//Only check the first row, if there are many rows
		if(videos.length > 0){
			//QVOD 完全一样
			if(videos[0].qvod == video_latest.qvod){
				return callback(null,"");
			}
			//QVOD 集数比较
			var exist_serial_number = videos[0].qvod.split('\n')
			var latest_serial_number = video_latest.qvod.split('\n')
			if(latest_serial_number > exist_serial_number){
				return callback(null,M.getUpdateSQL('gx_video',{qvod:video_latest.qvod},{title:video_latest.title})+ ";\n")
			}else{
				return callback(null,"");
			}
		}else{
			//没找到有同名的影片
			if(video_latest.serial != "完结" || video_latest.serial.indexOf('连载') != -1)
				video_latest.intro = '更新至' + video_latest.intro;
			return callback(null,getInsertSQL('gx_video',video_latest) + ";\n");
		}
	});
}

exports.getlinksFromListPage = getlinksFromListPage;
exports.oneDetailPageHandler = oneDetailPageHandler;
exports.checkTerminated = checkTerminated;