/*
	Content page handler
*/

var db = require('./db'),cheerio = require('cheerio'),U = require('./utility'),M = require('./mysqlHelper')
	crypto = require('crypto'),url = require('url')

var oneDetailPageHandler = require('./plugins/' + process.env['PLUGIN_NAME'] ).oneDetailPageHandler
var checkTerminated = require('./plugins/' + process.env['PLUGIN_NAME']).checkTerminated

var fs = require('fs')
console.log('================ Model Name ===================');
console.log(process.env['TRAV_DATA.model_name']);
console.log('===============================================');
var DetailLinksModel = require('./vo/detail').DetailLinksModel(process.env['TRAV_DATA.model_name']);

db.connect();
M.connect();


var count=0,newCount = 0,scrapTimes = 0;
/*
	1) Search all {status: 'N'}
	2) if the video not terminated, set status to 'W'
		if the video has been terminated, set status to 'Y'
	3) After all video has been set to NON-N ('W' or 'Y')
		update all 'W' video to 'N' 
*/

var listPageURLs = [],
	host=null

function end(error){
	if(error && error != 'DONE'){
		console.log('[ERROR]: Error happened: '+ error);
	}else{
		if(error == 'DONE'){
			console.log('[SUCCESS]: DONE! All links have been scraped !');
		}else{
			console.log('[WARNING]: Finish with end message: '+ error);
		}
	}
	db.disconnect();
	M.disconnect();
	process.exit(0);
}

function readNlinksFromDB(n,callback){
	DetailLinksModel.find({status:'N'},'url',{limit:n},function(error,docs){
		if(error){
			end(error);
		}else{
			//First scrape to check if the model is empty
			if(scrapTimes == 0 && docs.length == 0){
				callback('No links can be scraped from the model: ' + process.env['TRAV_DATA.model_name']);
			}
			if(!docs || docs.length == 0){
				callback('DONE',detailLinks);
			}else{
				var detailLinks = [];
				for (var i = 0; i < docs.length; i++) {
					detailLinks.push(docs[i].url);
				};
				callback(null,detailLinks);
			}
		}
	})
}

var request = require('request'),async = require('async');

function processDetailLinksList(detailLinks,callback){
	async.times(detailLinks.length,function(n,next){
		oneDetailPageSeries(detailLinks,function(error,result){
			next(error);
		});	
	},function(error,timesRunResult){
		if(error){
			console.log('[ERROR]: oneListPageHandler has error :'+ error.message);
		}
		callback(error);
	})	
}

async.forever(function(callback){
	readNlinksFromDB(50,function(readLinkError,detailLinks){
		scrapTimes++;
		if(readLinkError || readLinkError == 'DONE'){
			callback(readLinkError)
		}else{
			processDetailLinksList(detailLinks,function(processError){
				callback(processError);
			});			
		}
	});
},function(error){
	end(error);
});



function oneDetailPageSeries(detailPageURLs,_callback){
	var series = {};
	var detailPageURL,model,sql;

	series['shiftDetailPageURLs'] = function(callback){
		if(detailPageURLs.length == 0){
			callback('DetailPageList is empty')
		}else{
			detailPageURL = detailPageURLs.shift();
			callback(null);
		}
	}

	series['requestDetailPage'] = function(callback){
		request({uri: detailPageURL,timeout:300000,encoding:'binary'}, function(err, response, body){
	        if(err || response.statusCode !== 200){
	        	if(err) console.log('[ERROR]:Request error: '+ err.message);
	        	if(response){
	        		console.log('[INFO]:Response Code: '+response.statusCode)
	        	}else{
	        		console.log('[INFO]:Response Code: response is null')
	        	}
	        	//process.exit(1);
	        }
	        if(!body){
	        	//console.log('Body is null, skip this !');
	        	callback(null);
	        }else{
	        	var iconv = require('iconv-lite');
				var buf=new Buffer(body,'binary');					
		        var str=iconv.decode(buf, process.env['TRAV_DATA.encoding']);//将Binary buffer 转换成UTF8编码
		        oneDetailPageHandler(str,function(error,_model,_sql){	//转换编码后的html
		        	model = _model;
		        	sql = _sql;
		        	callback(error);
		        });	
	        }
		});	
	}

	series['updateLinkStatus'] = function(callback){
		if(!model){
			return callback(null);
		}

		var isTerminated = checkTerminated(model);

		if(!isTerminated){
			newCount++;
			//fs.appendFileSync('test/Terminated.txt',newCount + '. ' + model.title + ' | '+ detailPageURL + "\n");
		}
		var updateStatus = {status:'W'}
		if(isTerminated){
			updateStatus.status = 'Y';
		}
		var md5sum = crypto.createHash('md5')
			// console.log('  * detailPageURL: '+ detailPageURL);
		var _urlmd5 = md5sum.update(detailPageURL).digest('hex');
		DetailLinksModel.update({urlmd5:_urlmd5},{$set:updateStatus},function(error){
			callback(error);
		});			
	}

	async.series(series,function(error,result){
		// console.log('[INFO]: ==================== [SEPARATOR] ========================');
		if(model){
			count ++;
			if(sql == ""){
				console.log(count + '. '+model.title  + ' has NO CHANGE .' + ' ['+detailPageURL + ']')
			} else if(sql.indexOf('INSERT') != -1){
				console.log(count + '. '+model.title  + ' has been INSERT.' + ' ['+detailPageURL + ']')
			} else if(sql.indexOf('UPDATE') != -1){
				console.log(count + '. '+model.title  + ' has been UPDATED.' + ' ['+detailPageURL + ']')
			} else{
				console.log(count + '. '+model.title  + ' has been processed.' + ' ['+detailPageURL + ']')
			}
		}else{
			console.log('[WARNING]: No content handlering this time, may be no response !')
		}
		// console.log('[INFO]: ==================== [SEPARATOR] ========================\n\n');

		_callback(error,result);
	});
}

// function oneDetailPageHandler(body,callback){
// 	var error = null;
// 	var bodyStr = S(body);
// 	var video = getVideoModel();

// 	video.title = (bodyStr.between('<!--影片名称开始代码-->','<!--影片名称结束代码-->').s)
// 	video.picurl = (bodyStr.between('<!--影片图片开始代码-->','<!--影片图片结束代码-->').s)
// 	video.director = (bodyStr.between('<!--影片导演开始代码-->','<!--影片导演结束代码-->').s)
// 	video.actor = (bodyStr.between('<!--影片主演开始代码-->','<!--影片主演结束代码-->').s)
// 	video.intro = (bodyStr.between('<!--影片备注开始代码-->','<!--影片备注结束代码-->').s)
// 	video.keywords = (bodyStr.between('<!--影片标签开始代码-->','<!--影片标签结束代码-->').s)
// 	video.area = (bodyStr.between('<!--影片地区开始代码-->','<!--影片地区结束代码-->').s)
// 	video.year = (bodyStr.between('<!--上映日期开始代码-->','<!--上映日期结束代码-->').s)
// 	video.serial = (bodyStr.between('<!--影片状态开始代码-->','<!--影片状态结束代码-->').s)
// 	// video.addtime = getTimeStamp(bodyStr.between('<!--影片更新时间开始代码-->','<!--影片更新时间结束代码-->').s)
// 	video.addtime = getTimeStamp()
// 	video.hits = (bodyStr.between('<!--评分人数开始代码-->','<!--评分人数结束代码-->').s)
	
// 	video.language = (bodyStr.between('<!--影片语言开始代码-->','<!--影片语言结束代码-->').s)

// 	video.content = (bodyStr.between('<!--影片介绍开始代码-->','<!--影片介绍结束代码-->').s)
// 	var avgScore = (bodyStr.between('<!--平均分开始代码-->','<!--平均分结束代码-->').s)
// 	var totalScore = (bodyStr.between('<!--总分开始代码-->','<!--总分结束代码-->').s);

// 	var UandD = getUpandDown(avgScore,totalScore);
// 	video.up = UandD.up;
// 	video.down = UandD.down;
// 	video.score = avgScore; 
// 	//var avgScore = (bodyStr.between('<!--评分人数开始代码-->','<!--评分人数结束代码-->').s)
// 	video.letter = getFirstLetter(video.title);

// 	video.playurl = getPlayList(bodyStr.between('<!--百度播放列表开始代码-->','<!--百度播放列表结束代码-->').s)	
// 	video.tudou = getPlayList(bodyStr.between('<!--土豆播放列表开始代码-->','<!--土豆播放列表结束代码-->').s)
// 	video.youku = getPlayList(bodyStr.between('<!--优酷播放列表开始代码-->','<!--优酷播放列表结束代码-->').s)
// 	video.qvod = getPlayList(bodyStr.between('<!--qvod播放列表开始代码-->','<!--qvod播放列表结束代码-->').s)
// 	video.swf = getPlayList(bodyStr.between('<!--swf播放列表开始代码-->','<!--swf播放列表结束代码-->').s)

// 	var category = (bodyStr.between('<!--影片分类开始代码-->','<!--影片分类结束代码-->').s)
// 	video.cid = getColId(category,video.title)
// 	var sql = perpareSQL('gx_video',video);

// 	fs.appendFile('test/SQLTest.sql',sql+";\n",function(error){
// 		if(error) {
// 			console.log('[ERROR]: Content insert database error: '+ error.message);
// 		}
// 		// count ++;
// 		// //console.log(count + '. '+video.title  + ' has been insert.')
// 		// console.log('--------------------')
// 		callback(error,video);
// 	});
// }



// conn.query('update gx_video set ', function(err, rows, fields) {
//     if (err) throw err;
//     console.log('The solution is: ', rows[0].solution);
// });







