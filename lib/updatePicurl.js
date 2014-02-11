var fs = require('fs'),M = require('./mysqlHelper');
require('date-utils');
var path = require('path'),cheerio = require('cheerio')

M.connect();

var sql = "select id,title,picurl from gx_video WHERE picurl like '%pic.cnjuc.com%' and picurl_loc is null limit 10";
// var queryHost = "http://www.yunfan.com/s.php?q=";

var getQueryURL = function(queryStr){
	// var queryURL = "http://www.yunfan.com/s.php?q=" + queryStr;
	var queryURL = "http://v.baidu.com/v?word=" + queryStr + "&ie=utf-8"
	return queryURL;
}
//After finish, restore the picurl to null 
var queryFailed = "QUERY_FAILED";
var restore_sql = "update gx_video set picurl_loc = null where picurl_loc = \'"+queryFailed+"\'";

var getUpdateSQL = function(_picurl,_id){
	var updatePicURL = "update gx_video set picurl_loc = \'" + _picurl + "\' where id=\'" + _id + "\'";
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
        		var title = model.title, _id = model.id, origin_picurl = model.picurl;
        		var queryStr = getQueryTitle(title);
        		var url = getQueryURL(queryStr);
        		// //Scrap Img to save
                var request = require('request')
                request({uri: url,timeout:15000}, function(req_err,res,body){
					if(body){
                        var $ = cheerio.load(body);
                        //var queryResult = $('div.bt_t a').length; //YunFan
                        var queryResult = $('div.title-wrapper a');

                        if(!queryResult || queryResult == 0 || queryResult == '0'){
			                console.log('[INFO]: Query URL: '+ url);
                        	console.log('[WARNING]: '+title+' has not found.');
							var updatesql = getUpdateSQL(queryFailed,_id);
                        	M.executeSql(updatesql,function(error){
								if(error) console.log(error)
								console.log('[INFO]: '+ title + ' query failed. Update from ['+origin_picurl+'] to [' +queryFailed+']');
								count++;
								console.log('COUNT: '+ count + ' | Length: '+ length);
								if(count == length) updatePicurl();
							});
                        }else{
							// var link = $('div.bt_t a').eq(0).attr('href'); //YunFan
							var link = $('div.title-wrapper a').href;
							var _picurl = $('div.bottompic img').src;
							var _updatesql = getUpdateSQL(_picurl,_id);
							M.executeSql(_updatesql,function(_error){
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
