var db = require('./db'),cheerio = require('cheerio'),
	crypto = require('crypto'),url = require('url'), S = require('string'),
	jsdom = require('jsdom')

var DetailLinksModel = require('./vo/detail').DetailLinksModel

db.connect();

var mysql = require('mysql');
var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database:'gxcms',
    port: 3306
});
conn.connect();

var listPageURLs = [],
	host=null

function end(error){
	if(error){
		console.log('[ERROR]: Error happened: '+ error.message);
	}else{
		console.log('[SUCCESS]: All links have been scraped !');
	}
	db.disconnect();
	conn.end();
	process.exit(0);
}

function readNlinksFromDB(n,callback){
	DetailLinksModel.find({status:'N'},'url',{limit:n},function(error,docs){
		if(error){
			end(error);
		}else{
			if(!docs){
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
		if(readLinkError == 'DONE'){
			callback(readLinkError)
		}else{
			processDetailLinksList(detailLinks,function(processError){
				callback(processError);
			});			
		}
	});
},function(error){
	if(error!='DONE')
		console.log(error);
	end(error);
})



function oneDetailPageSeries(detailPageURLs,_callback){
	var series = {};
	var detailPageURL;

	series['shiftDetailPageURLs'] = function(callback){
		if(detailPageURLs.length == 0){
			callback('DetailPageList is empty')
		}else{
			detailPageURL = detailPageURLs.shift();
			callback(null);
		}
	}

	series['requestDetailPage'] = function(callback){
		request({uri: detailPageURL,timeout:300000}, function(err, response, body){
			console.log('*'+detailPageURL);
	        if(err || response.statusCode !== 200){
	        	console.log('[ERROR]:Request error: '+ err.message);
	        	if(response){
	        		console.log('[INFO]:Response Code: '+response.statusCode)
	        	}else{
	        		console.log('[INFO]:Response Code: response is null')
	        	}
	        	//process.exit(1);
	        }
	        if(!body){
	        	console.log('Body is null, skip this !');
	        	callback(null);
	        }else{
		        oneDetailPageHandler(body,function(error){
		        	callback(error);
		        });	
	        }
	       
		});	
	}

	series['updateLinkStatus'] = function(callback){
		var md5sum = crypto.createHash('md5')
		console.log('detailPageURL: '+ detailPageURL)
		var _urlmd5 = md5sum.update(detailPageURL).digest('hex');
		DetailLinksModel.update({urlmd5:_urlmd5},{$set:{status:'Y'}},function(error){
			callback(error);
		})
	}

	async.series(series,function(error,result){
		_callback(error,result);
	});
}

function oneDetailPageHandler(body,callback){
	var error = null;
	var scoreStr = S(body);
	console.log('FileName:' + scoreStr.between('<!--影片名称开始代码-->','<!--影片名称结束代码-->').s)
	console.log('AvgScore:' + scoreStr.between('<!--平均分开始代码-->','<!--平均分结束代码-->').s)
	console.log('TotalScore:' + scoreStr.between('<!--总分开始代码-->','<!--总分结束代码-->').s)
	console.log('--------------------')
	callback(error);
}

// conn.query('update gx_video set ', function(err, rows, fields) {
//     if (err) throw err;
//     console.log('The solution is: ', rows[0].solution);
// });






