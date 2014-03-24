
var fs = require('fs'),M = require('./mysqlHelper');
require('date-utils');
var path = require('path');

var existPath = "/Users/zhenwang/Work/apache_ws/luluysc/uploads/video";
var basePath = process.env['IMG_FOLDER']; 

var sql = 'select id,title,picurl,picurl_loc from gx_video where picurl_loc is null limit 10';
// var sql = "select id,title,picurl,picurl_loc from gx_video WHERE picurl_loc like \'%yunfan%\' limit 10";
// var sql = "select id,title,picurl,picurl_loc from gx_video WHERE picurl_loc = '404' or picurl_loc like \'%QUERY%\'";
// var sql = "select id,title,picurl,picurl_loc from gx_video WHERE picurl_loc = \'%2013/%\'";

M.connect();

var saveImg = function(){
    M.executeSql(sql,function(error,models){
        if(models.length == 0){
            console.log('Finish')
            M.disconnect();
        }else{
            // console.log(models);
            if(imgExistChecker(models)){ // All Images exist 
                updateAllExistDB(models,function(){ 
                    console.log('[INFO]: All images are exist !');
                    console.log('----------------------------------------------------------------------');
                    saveImg(); 
                })
            }else{
                scrapImgAndUpdateData(models,function(){
                    console.log('----------------------------------------------------------------------');
                    // if(callBackLater) clearTimeout(callBackLater);
                    saveImg();
                });
                //scrapImgAndUpdateData(models,function(){});
                // var callBackLater = setTimeout(function(){
                //     //console.log(models);
                //     console.log('------------------------ After 160 seconds,callback automatically -----------------------------');
                //     saveImg();
                // },160000);                
            }
        }
    });
} 
// true: all models image has been saved before | false: some picurl not saved before
var imgExistChecker = function(models){
    var flag = true;
    for (var i = 0; i < models.length; i++) {
        var url = models[i].picurl,title=models[i].title;
        if(url.indexOf('http://') == 0 && url.indexOf('.com') != -1){
            var localPath = existPath + url.substr(url.indexOf('.com')+4);
            if(fs.existsSync(localPath)){
                filePath = 'uploads/video' + url.substr(url.indexOf('.com')+4);
                console.log('[INFO]:'+'|'+ title +'|'+' Img exist: ' + localPath );
                flag = true & flag;
            }else{
                return false;
            }     
        }else{
            return false;
        }
    };
    return flag;
}

var updateAllExistDB = function(models,callback){
    var count = 0, length = models.length
    models.forEach(function(model){
        var url = model.picurl, _id = model.id;
        filePath = 'uploads/video' + url.substr(url.indexOf('.com')+4);
        updateDB(filePath,_id,function(){
            count++;
            if(count == length) callback();
        }); 
    });
}


var updateDB = function(filePath,_id,callback){
    // Update Database
    var updateSQL = M.getUpdateSQL('gx_video',{picurl_loc:filePath},{id:_id});
    M.executeSql(updateSQL,function(error){
        if(error) console.log(error);
        if(callback) return callback();
        return null
    });
}

var scrapImgAndUpdateData = function(models,callback){
    var count = 0, length = models.length

    models.forEach(function(model){
        // var url = model.picurl_loc
        var url = model.picurl
        var title = model.title
        if(url.indexOf('http://') == 0 && url.indexOf('.com') != -1){
            var _id = model.id;
            var fileName = _id + '.jpg';
            var filePath = basePath + '/' + fileName;
            var localPath = existPath + url.substr(url.indexOf('.com')+4);
            if(fs.existsSync(localPath)){
                //Change filePath to the local path
                filePath = 'uploads/video' + url.substr(url.indexOf('.com')+4);
                console.log('[INFO]: Img exist: ' + localPath);
                //If image exist, update picurl_loc to exist path
                updateDB(filePath,_id,function(){
                    count++;
                    if(count == length) callback();
                });
            }else{
                // //Scrap Img to save
                var request = require('request')
                request({uri: url,encoding:'binary',timeout:100000}, function(req_err,res,body){
                    if(req_err || !res || !body || res.statusCode !== 200 ){
                        console.log('[WARNING]: URL: '+ url + ' is not accessable !');
                        if(res){
                            console.log('[INFO]:Response Code: '+ res.statusCode)
                        }else{
                            console.log('[ERROR]: No response');
                        }
                        if(req_err) console.log('[ERROR]:Request error : '+ req_err.message);
                        if(!body) console.log('[ERROR]: Body is null: ' + body);
                        //process.exit(1);
                        updateDB(404 ,_id,function(){
                            count++;
                            if(count == length) callback();
                        });
                    }
                    if(body){
                        fs.writeFile(filePath, body, 'binary', function(err){
                            if (err) console.log(err);
                            //Update picurl_loc = img-data/xxx.jpg
                            updateDB('uploads/'+ path.basename(basePath) + '/'+ fileName ,_id,function(){
                                console.log('[INFO]: Image saved. |'+title +'|'+url+'|'+_id+'|'+'||'+filePath+'||');
                                count++;
                                if(count == length) callback();
                            }); 
                        });
                    }else{
                        count++;
                        if(count == length) callback();
                    }
                });                               
            }
        }else{
            count++;
            if(count == length) callback();
        }
    });
}

saveImg();
