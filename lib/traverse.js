/*
	Traveller list page to get all detail (content) pages URLs
*/

var db = require('./db'),cheerio = require('cheerio'),
	crypto = require('crypto'),url = require('url'), S = require('string'),U = require('./utility')
	jsdom = require('jsdom')

var DetailLinksModel = require('./vo/detail').DetailLinksModel(process.env['TRAV_DATA.model_name']);
var getlinksFromListPage = require('./plugins/'+U.requirePlugin()).getlinksFromListPage;

//console.log(md5sum.update("hahha").digest('hex'));
db.connect();

var listPageURLs = [],
	host=null

function createLinkList(urlRule,start,end){
	if(!host){
		var obj = url.parse(urlRule);
		host = obj.protocol + '//' + obj.host;
		console.log('[INFO]: Host: '+ host)
	}
	if(urlRule.indexOf('*') != -1){
		for (var i = start; i <= end; i++) {
			listPageURLs.push(urlRule.replace('*',i));
		};
	}else{
		listPageURLs.push(urlRule);
	}
}
createLinkList(process.env['TRAV_DATA.link_pattern'],
				process.env['TRAV_DATA.link_range_start'],
					process.env['TRAV_DATA.link_range_end']);

console.log('[INFO]: ---------------- listPageURLs --------------------');
console.log(listPageURLs);
console.log('[INFO]: ---------------- listPageURLs --------------------');


var request = require('request'),async = require('async')

function oneListPageHandler(body,callback){
	var error = null;
	var detailLinks = [];
	// var $ = cheerio.load(body);
	// var allLinks = $("td[height=20][align=left] a");
	var allLinks = getlinksFromListPage(body);

	for (var i = 0; i < allLinks.length; i++) {
		var href= allLinks.eq(i).attr('href'), url="";
		if(href.indexOf('http://') == -1){
			url = host+href
		}else{
			url=href;
		}
		detailLinks.push(url);
	};

	async.times(detailLinks.length,function(n,next){
		storeDetailLink(detailLinks[n],function(error){
			next(error);
		});
	},function(error){
		if(error){
			console.log('[ERROR]: oneListPageHandler has error :'+ error.message);
		}
		callback(error);
	});
}

function oneListPageSeries(listPageURLs,oneListPageHandler,callback){
	var series = {};
	var topListPageURL;

	//Shift linkList
	series['shiftLinkList'] = function(callback){
		if(listPageURLs.length == 0){
			callback('LinkList is empty')
		}else{
			topListPageURL = listPageURLs.shift();
			callback(null);
		}
	}

	//Request the shifted link and handler it (store into db)
	series['requestLink'] = function(callback){
		console.log('currentListPage:');
		console.log(topListPageURL);
		request({uri: topListPageURL}, function(err, response, body){
	        if(err || !response || response.statusCode !== 200){
	        	if(response){
	        		console.log('[INFO]:Response Code: '+ response.statusCode)
	        	}else{
	        		console.log('[ERROR]: No response');
	        	}
	        	console.log('[ERROR]:Request error : '+ err.message);
	        	//process.exit(1);
	        }
	        if(body){
		        oneListPageHandler(body,function(error){
		        	callback(error);
		        });	
	        }else{
	        	console.log('[ERROR]: No response body return, skip: '+ topListPageURL);
	        	callback(null);
	        }
	        
		});	
	}
	async.series(series,function(error,result){
		callback(error,result);
	})	
}

// If not exist, will create it
function storeDetailLink(detailLinkURL,callback){
	var md5sum = crypto.createHash('md5')
	console.log('detailLinkURL: '+ detailLinkURL)
	var _urlmd5 = md5sum.update(detailLinkURL).digest('hex');
	console.log('_urlmd5: '+ _urlmd5)
	DetailLinksModel.findOne({urlmd5:_urlmd5},'url',function(error,detailLink){
		if(error){
			console.log('[ERROR]: storeDetailLink findOne error: '+ error.message);
		}
		if(detailLink){
			console.log('[INFO]: Link exist, stop create :' + detailLink.url);
			//Link exist then go to next
			callback(error);
		}else{
			var detailLink = new DetailLinksModel();
			detailLink.host = host;
			detailLink.url = detailLinkURL;
			detailLink.status = 'N';
			detailLink.urlmd5 = _urlmd5;
			detailLink.save(function(saveErr){
				if(saveErr){
					console.log('[ERROR]: storeDetailLink save error: '+ saveErr.message);
				}
				callback(saveErr);
			});
		}
	});
}

async.whilst(function(){
		return listPageURLs.length > 0;
	},
	function(callback){
		oneListPageSeries(listPageURLs,oneListPageHandler,function(error,result){
			callback(null);
		});
	},function(err){
		if(err){
			console.log('[ERROR]: Error happen during list iteration'+ err.message);
		}else{
			console.log('[SUCCESS]: All links finished !!');
		}
		db.disconnect();
		if(process.env['FULL_TEST']){
			console.log('full test ...')

		}
});






