/*
	Traveller list page to get all detail (content) pages URLs
*/

var db = require('./db'),cheerio = require('cheerio'),
	crypto = require('crypto'),url = require('url'), S = require('string'),U = require('./utility')
	jsdom = require('jsdom'),fs = require('fs')

var DetailLinksModel = require('./vo/detail').DetailLinksModel(process.env['TRAV_DATA.model_name']);

var sqlFilePath = process.env['DATA_PATH'] + '/index.sql';

var getIndexVideoNames = function(body){
	var names = [];
	var $ = cheerio.load(body);
	var links = $('div.rb ol li .skey a');
	for (var i = 0; i < links.length; i++) {
		names.push(links.eq(i).text());
	};
	return names;
}

//console.log(md5sum.update("hahha").digest('hex'));
// db.connect();

var listPageURLs = [],
	host=null,
	countLink = 0, countPage = 0


listPageURLs.push('http://www.soku.com/newtop/teleplay.html')  //tv
listPageURLs.push('http://www.soku.com/newtop/variety.html')	//zy
listPageURLs.push('http://www.soku.com/newtop/anime.html')	    //dm

console.log('[INFO]: ---------------- listPageURLs --------------------');
console.log(listPageURLs);
console.log('[INFO]: ---------------- listPageURLs --------------------');


var request = require('request'),async = require('async')

/*
	video names are ordered in the array by index
*/
function oneListPageHandler(body,callback){
	var allVideoNames = getIndexVideoNames(body);
	var fileData = "";
	for (var i = 0; i < allVideoNames.length; i++) {
		countLink++;
		var sqlData = "INSERT INTO gx_index SELECT * FROM gx_video where title "
		var temp = S(allVideoNames[i]).trim().s;
		if(temp.indexOf(' ') != -1){
			sqlData += 'like '+ '\'%'+temp.split(' ')[0]+'%\' and title like ' + '\'%'+temp.split(' ')[1]+'%\'';
		}else{
			sqlData += '=  \''+ temp + '\'';
		}
		fileData += sqlData + ';\n';
	};
	fs.appendFile(sqlFilePath,fileData,function(_error){
		if(_error){
			return callback(_error);
		}
		return callback(null);
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
		request({uri: topListPageURL,timeout:300000}, function(err, response, body){
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
	        	countPage++; // Page have response, countPage increase.
		        oneListPageHandler(body,function(error){
		        	callback(error);
		        });	
	        }else{
	        	console.log('[INFO]: Pop the link to retry later');
	        	listPageURLs.push(topListPageURL);
	        	fs.writeFileSync(process.env['DATA_PATH']+'/failedIndexLinks.txt',topListPageURL+'\n');
	        	console.log('[ERROR]: No response body return, skip: '+ topListPageURL);
	        	callback(null);
	        }
	        
		});	
	}
	async.series(series,function(error,result){
		callback(error,result);
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
		console.log('[INFO]: CountPage: '+ countPage + ', CountLink: ' + countLink);
		db.disconnect();
		if(process.env['FULL_TEST']){
			console.log('full test ...')

		}
});