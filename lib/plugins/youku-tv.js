var fs = require('fs'),M = require('../mysqlHelper'),S = require('string'),U = require('../utility'),cheerio = require('cheerio')

var getVideoModel = M.getVideoModel, insertVideo = M.insertVideo,
	getInsertSQL = M.getInsertSQL,getUpdateSQL = M.getUpdateSQL,
	queryVideo = M.queryVideo,executeSql = M.executeSql,
	getUpandDown = U.getUpandDown,	getTimeStamp = U.getTimeStamp,
	getFirstLetter = U.getFirstLetter
/*
	Links rule
*/

var getlinksFromListPage = function(body){
	var $ = cheerio.load(body);
	var allLinks = $("div.yk-col3 .p-link a");
	return allLinks;
}

var getPlayList = function(html){
	if(html && html.length > 0){
		var $ = cheerio.load(html);
		var links = $('div.coll_10 ul li a');
		var temp = [];
		for (var i = 0; i < links.length; i++) {
			var href = links.eq(i).attr('href');
			temp.push(S(href).between('http://v.youku.com/v_show/id_','.html').s);
		};
		return temp.join('\n')		
	}else{
		return '';
	}
}

var getFromSlap = function(str,type){
	var sep = ""
	if(type == 'actor'){
		sep = "主演:"
	}else if(type == 'keywords'){
		sep = "类型:"
	}else if(type == 'language'){
		sep = "语言:"
		if(str == "" || !str) return "国语";
	}
	//主演:					钟汉良 / 					金基范 / 					韩栋 / 					张檬 / 					贾青			
	// 类型:					剧情 / 					武侠 / 					言情 / 					古装
	var temp = S(str).trim().s; // Clear space before and after
	var actorsTemp = S(temp).chompLeft(sep).s; //'bar'
	var actorsArr = [],tempArr = actorsTemp.split('/');
	for (var i = 0; i < tempArr.length; i++) {
		actorsArr.push(S(tempArr[i]).trim().s);
	};
	return actorsArr.join(' ');
}

var getVideoYear = function(str){
	//上映:2014-01-17
	var temp = S(str).trim().s; // Clear space before and after
	var dateTemp = S(temp).chompLeft('上映:').s; //'2014-01-17'
	return  dateTemp.substring(0,dateTemp.indexOf('-'));
}

var getArea = function(str){
	// 地区:	大陆
	var temp = S(str).trim().s;
	var areaTemp = S(temp).chompLeft('地区:').s;
	return S(areaTemp).trim().s;
}

var getIntro = function(str){
	//更新至35	/共50集
	var temp = S(str).trim().s;
	return temp;
	//$('div.basenotice').contents().eq(0).text()
}

/*
	Detail page processing method (Generate SQL file)
*/
var oneDetailPageHandler = function (body,callback){
	var error = null;
	var bodyStr = S(body);

	var $ = cheerio.load(body);
	var video = getVideoModel();
	var _area = getArea($('ul.baseinfo .row2 .area').text());
	video.title = $('h1.title .name').text();
	video.picurl = $('ul.baseinfo li.thumb img').attr('src');
	// video.director = (bodyStr.between('<!--影片导演开始代码-->','<!--影片导演结束代码-->').s)
	video.actor = getFromSlap($('ul.baseinfo .row1 .actor').text(),'actor'); //主演：xxx/yyy/zzz
	video.intro = getIntro($('div.basenotice').contents().eq(0).text());
	video.keywords = getFromSlap($('ul.baseinfo .row2 .type').text(),'keywords');
	video.area = _area;
	video.year = getVideoYear($('ul.baseinfo .row2 .pub').eq(0).text());
	// video.serial = (bodyStr.between('<!--影片状态开始代码-->','<!--影片状态结束代码-->').s)
	// video.addtime = getTimeStamp(bodyStr.between('<!--影片更新时间开始代码-->','<!--影片更新时间结束代码-->').s)
	video.addtime = getTimeStamp()
	// video.hits = (bodyStr.between('<!--评分人数开始代码-->','<!--评分人数结束代码-->').s)
	video.language = getFromSlap($('ul.baseinfo .row2 .lang').text(),'language')

	video.content = $('div.detail span').eq(2).text();

	video.score = $('span.rating em.num').eq(0).text(); 
	//var avgScore = (bodyStr.between('<!--评分人数开始代码-->','<!--评分人数结束代码-->').s)
	video.letter = getFirstLetter(video.title);

	video.youku = getPlayList(body);

	video.cid = getColId(_area);

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

var getColId = function(area){
	
	if( 	area == "大陆"  || area.indexOf("大陆") != -1){
		return 15;
	}else if(area == "台湾" || area.indexOf("台湾") != -1){
		return 16;
	}else if(area == "香港" || area.indexOf("香港") != -1){
		return 17;
	}else if(area == "韩国"){
		return 18;
	}else if(area == "日本"){
		return 19;
	}else if(area == "美国"){
		return 20;
	}else if(area == "英国"){
		return 23;
	}else if(area == "泰国"){
		return 24;
	}else if(area == "印度"){
		return 25;
	}else if(area == "新加坡"){
		return 26;
	}else if( area.indexOf("德国") != -1 || area.indexOf("法国") != -1 || area.indexOf("西班牙") != -1 || area.indexOf("加拿大") != -1){
		return 21;
	}{
		console.log('[ERROR]: getColId error, '+ area + ' not found any match category !');		
		return 999;
	}
}
/*
	Check Update 
*/
var checkUpdateAndGetSQL = function(video_latest,callback){
	var sql = 'select * from gx_video where title ';
	if(video_latest.title.indexOf(' ')!=-1){
		sql += 'like '+ '\'%'+video_latest.title.split(' ')[0]+'%\' and title like ' + '\'%'+video_latest.title.split(' ')[1]+'%\'';
	}else{
		sql += '= '+ '\''+video_latest.title+'\'';
	}
	console.log('[SQL]: '+ sql);
	executeSql(sql,function(error,videos){
		if(error){
			console.log('[ERROR]: DB error happened on checkUpdateAndGetSQL :' + error);
			return callback(error,"");
		}
		//Only check the first row, if there are many rows
		if(videos.length > 0){
			//youku URL 完全一样
			if(videos[0].youku == video_latest.youku){
				return callback(null,"");
			}
			//youku URL 集数比较
			var exist_serial_number = videos[0].youku.split('\n')
			var latest_serial_number = video_latest.youku.split('\n')
			if(latest_serial_number > exist_serial_number){
				return callback(null,M.getUpdateSQL('gx_video',{youku:video_latest.youku},{title:video_latest.title})+ ";\n")
			}else{
				return callback(null,"");
			}
		}else{
			//没找到有同名的影片
			return callback(null,getInsertSQL('gx_video',video_latest) + ";\n");
		}
	});
}


// var checkUpdateAndGetSQL = function(video_latest,callback){

// 	var video_exist = queryVideo('gx_video',[],{title:video_latest.title},function(error,videos){
// 		if(error){
// 			console.log('[ERROR]: DB error happened on checkUpdateAndGetSQL :' + error);
// 			return callback(error,"");
// 		}
// 		//Only check the first row, if there are many rows
// 		if(videos.length > 0){
// 			//QVOD 完全一样
// 			if(videos[0].youku == video_latest.youku){
// 				return callback(null,"");
// 			}
// 			//QVOD 集数比较
// 			var exist_serial_number = videos[0].youku.split('\n')
// 			var latest_serial_number = video_latest.youku.split('\n')
// 			if(latest_serial_number > exist_serial_number){
// 				return callback(null,M.getUpdateSQL('gx_video',{youku:video_latest.youku},{title:video_latest.title})+ ";\n")
// 			}else{
// 				return callback(null,"");
// 			}
// 		}else{
// 			//没找到有同名的影片
// 			return callback(null,getInsertSQL('gx_video',video_latest) + ";\n");
// 		}
// 	});
// }

/*
	Terminate check
*/
var checkTerminated = function(video){
	if(video.cid == 999) return false; //If 999 error, need update later

	var intro = video.intro
	if(intro.indexOf('更新') != -1){
		return false;
	}

	return true;
}


exports.getlinksFromListPage = getlinksFromListPage;
exports.oneDetailPageHandler = oneDetailPageHandler;
exports.checkTerminated = checkTerminated;