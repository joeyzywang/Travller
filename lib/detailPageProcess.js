/*
	Content page handler
*/

var db = require('./db'),cheerio = require('cheerio'),U = require('./utility')
	crypto = require('crypto'),url = require('url')

var oneDetailPageHandler = require('./plugins/'+U.requirePlugin()).oneDetailPageHandler
var checkTerminated = require('./plugins/'+U.requirePlugin()).checkTerminated

var fs = require('fs')

var DetailLinksModel = require('./vo/detail').DetailLinksModel(process.env['TRAV_DATA.model_name']);

db.connect();


var newCount = 0;
/*
	1) Search all {status: 'N'}
	2) if the video not terminated, set status to 'W'
		if the video has been terminated, set status to 'Y'
	3) After all video has been set to NON-N ('W' or 'Y')
		update all 'W' video to 'N' 
*/
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
	var detailPageURL,model;

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
	        	if(err) console.log('[ERROR]:Request error: '+ err.message);
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
		        oneDetailPageHandler(body,function(error,_model){
		        	model = _model;
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
			fs.appendFileSync('test/Terminated.txt',newCount + '. ' + model.title + ' | '+ detailPageURL + "\n");
		}
		var updateStatus = {status:'W'}
		if(isTerminated){
			updateStatus.status = 'Y';
		}

		var md5sum = crypto.createHash('md5')
		console.log('  * detailPageURL: '+ detailPageURL);

		var _urlmd5 = md5sum.update(detailPageURL).digest('hex');
		DetailLinksModel.update({urlmd5:_urlmd5},{$set:updateStatus},function(error){
			callback(error);
		});
	}

	async.series(series,function(error,result){
		_callback(error,result);
	});
}


// conn.query('update gx_video set ', function(err, rows, fields) {
//     if (err) throw err;
//     console.log('The solution is: ', rows[0].solution);
// });







