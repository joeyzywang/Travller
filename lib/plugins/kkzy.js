var fs = require('fs'),M = require('../mysqlHelper'),S = require('string'),U = require('../utility'),cheerio = require('cheerio')

var getVideoModel = M.getVideoModel, insertVideo = M.insertVideo,getInsertSQL = M.getInsertSQL,
	getUpandDown = U.getUpandDown,	getTimeStamp = U.getTimeStamp,getPlayList = U.getPlayList,getColId = U.getColId,
	getFirstLetter = U.getFirstLetter

var count = 0,sqlFileName = process.env['TRAV_DATA.sql_filename'],filePath = process.env['DATA_PATH'] + '/' + process.env['TRAV_DATA.data_foldername']

/*
	!!! Every Plugin should have this init method !!!
*/
var init = function(){
	if(!fs.existsSync(filePath)){
		fs.mkdirSync(filePath);
	}
}

/*
	Links rule
*/

var getlinksFromListPage = function(body){
	var $ = cheerio.load(body);
	var allLinks = $("td[height=20][align=left] a");
	return allLinks;
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
	video.area = (bodyStr.between('<!--影片地区开始代码-->','<!--影片地区开始代码-->').s)
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
	
	fs.appendFile( filePath+sqlFileName ,sql+";\n",function(error){
		count ++;
		console.log(count + '. '+video.title  + ' has been insert.')
		console.log('--------------------')
		callback(error,video);
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

exports.init = init;
exports.getlinksFromListPage = getlinksFromListPage;
exports.oneDetailPageHandler = oneDetailPageHandler;
exports.checkTerminated = checkTerminated;