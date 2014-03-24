var fs = require('fs'),M = require('./mysqlHelper');
require('date-utils');
var path = require('path'),cheerio = require('cheerio'),S = require('string')

M.connect();

// var sql = "select id,title,picurl,year from gx_video WHERE picurl like '%pic.cnjuc.com%' and picurl_loc is null limit 10";
var sql = "select id,title,picurl,year from gx_video WHERE picurl_loc =  '0' limit 10";
// var queryHost = "http://www.yunfan.com/s.php?q=";

var getQueryURL = function(queryStr){
	// var queryURL = "http://www.yunfan.com/s.php?q=" + queryStr;
	var queryURL = "http://v.baidu.com/v?word=" + queryStr + "&ie=utf-8"
	return queryURL;
}
//After finish, restore the picurl to null 
var queryFailed = "QUERY_FAILED";
var restore_sql = "update gx_video set picurl_loc = null where picurl_loc = \'"+queryFailed+"\'";

var getUpdateSQL = function(_picurl,_score,_id){
	var updatePicURL = "update gx_video set picurl_loc = \'" + _picurl + "\', score = " + _score + " where id=\'" + _id + "\'";
	return updatePicURL;
}

var getQueryTitle = function(title){
	if(title.indexOf('/') != -1){
		return title.substring(0,title.indexOf('/'))
	}else if(title.indexOf('(') != -1){
		return title.substring(0,title.indexOf('('))
	}else{
		return title
	}
}
var updatePicurl = function(){
	M.executeSql(sql,function(error,models){
        if(models.length == 0){
            console.log('Finish');
            M.disconnect();
            process.exit();
        }else{
        	var count = 0, length = models.length
        	models.forEach(function(model){
        		var title = model.title, _id = model.id, origin_picurl = model.picurl,year = model.year;
        		var queryStr = getQueryTitle(title);
        		var url = getQueryURL(queryStr);
        		// //Scrap Img to save
                var request = require('request')
                request({uri: url,timeout:15000,encoding:'binary'}, function(req_err,res,body){
                	var iconv = require('iconv-lite');
					var buf=new Buffer(body,'binary');					
		        	body=iconv.decode(buf, 'gb2312');//将Binary buffer 转换成UTF8编码
					if(body){
                        var $ = cheerio.load(body);
                        //var queryResult = $('div.bt_t a').length; //YunFan
                        var queryResult = $('div.title-wrapper');
                        
                        if(!queryResult || queryResult == 0 || queryResult == '0'){
			                console.log('[INFO]: Query URL: '+ url);
                        	console.log('[WARNING]: '+title+' has not found.');
							var updatesql = getUpdateSQL(queryFailed,0,_id);
                        	M.executeSql(updatesql,function(error){
								if(error) console.log(error)
								console.log('[INFO]: '+ title + ' query failed. Update from ['+origin_picurl+'] to [' +queryFailed+']');
								count++;
								console.log('COUNT: '+ count + ' | Length: '+ length);
								if(count == length) updatePicurl();
							});
                        }else{
                        	console.log(url + ' | search result of '+ queryResult.length);
                        	var _updatesql = "";
                        	for (var i = 0; i < queryResult.length; i++) {
                        		// The div title wrapper
                        		var divTemp = queryResult.eq(i);
                        		var divTempTitle = divTemp.find('h3 span').eq(0).find('font').text();
                        		var divTempYear = S(divTemp.find('h3 span').eq(1).text()).between('(',')').s;
                        		//If the title and year are same, then that video is what we need !!
                        		if(title == divTempTitle && year == divTempYear){
                        			var _picurl = $('div.bottompic img').eq(i).attr('src'),_score=0;
                        			var scoreTemp = $('.sp-movie-area').eq(i).find('.rating-info');
                        			//Score info not found, set it as random number less then 7 
                        			if(!scoreTemp || scoreTemp == 0 || scoreTemp.length==0){
                        				_score = 7 - Math.floor(Math.random()*3);
                        			}else{
                        				_score = scoreTemp.text();
                        			}
                        			//Update DB with the new score and image link
									_updatesql = getUpdateSQL(_picurl,_score,_id);
									console.log('Find one: '+_updatesql);
									break;
                        		}
                        	};

							// var link = $('div.bt_t a').eq(0).attr('href'); //YunFan
							// var link = $('div.title-wrapper a').href;
							// var _picurl = $('div.bottompic img').src;
							// var score = $('div.title-wrapper h3 span').eq(1).text();
							// var _updatesql = getUpdateSQL(_picurl,_id);
							if(_updatesql == ""){
                    			//If can not find same title and year, then just use the first one and random score
								var firstOneName = $('div.title-wrapper').eq(0).find('h3 span').eq(0).find('font').text();
                    			console.log('[WARNING]: Not find the same name and year. ' + title + ' ==> '+ firstOneName);
                    			var _picurl = $('div.bottompic img').eq(0).attr('src');
                    			var	_score = 7 - Math.floor(Math.random()*3);
                    			_updatesql = getUpdateSQL(_picurl,_score,_id);
							}
							M.executeSql(_updatesql,function(_error){
								console.log(_updatesql + ' is executed !');
								if(_error) console.log(_error)
								console.log('[INFO]: '+ title + ' has update picurl. From ['+origin_picurl+'] to [' +_picurl+']');
								count++;
								console.log('COUNT: '+ count + ' | Length: '+ length);
								if(count == length) updatePicurl();
							});								

							// var picurl_request = require('request');
							// var detail_url = "http://www.yunfan.com"+link;//YunFan
							// var detail_url = link;//YunFan
							// picurl_request({uri: detail_url,timeout:15000}, function(_req_err,_res,_body){
							// 	console.log('[INFO]: Query URL: '+ url);
			    //                 console.log('[INFO]: Detail Page URL: '+ detail_url);
			    //                 if(_body){
			    //                     var $ = cheerio.load(_body);
							// 		var _picurl = $('div.hb_L1 p img').eq(0).attr('src');
							// 		var _updatesql = getUpdateSQL(_picurl,_id);
							// 		M.executeSql(_updatesql,function(_error){
							// 			if(_error) console.log(_error)
							// 			console.log('[INFO]: '+ title + ' has update picurl. From ['+origin_picurl+'] to [' +_picurl+']');
							// 			count++;
							// 			console.log('COUNT: '+ count + ' | Length: '+ length);
							// 			if(count == length) updatePicurl();
							// 		});
			    //                 }else{
       //              				console.log(' ------------- NO body return when visit detail page-----------');
			    //                 	console.log('[WARNING]: No response from '+detail_url);
			    //                 	count++;
							// 		console.log('COUNT: '+ count + ' | Length: '+ length);
			    //                 	if(count == length) updatePicurl();
			    //                 }
			    //             });                        	
                        }
                    }else{
                    	console.log(' ------------- NO body when query Video-----------');
                    	count++;
						console.log('COUNT: '+ count + ' | Length: '+ length);
                    	if(count == length) updatePicurl();
                    }                		
                    
                });
        	});
        }
	});	
}

updatePicurl();
