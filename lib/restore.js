/*
	MONGO DB restore and commands note 
*/
//db.detaillinksmodels.update({status:'Y'},{$set:{status:'N'}},{multi:true});
//db.detaillinksmodels.update({status:'Y'},{$set:{status:'N'}},{multi:true});
//db.detaillinksmodels.update({status:'W'},{$set:{status:'N'}},{multi:true});

var	db = require('./db'),output = require('./common').output;

var restoreW2N = function(dbName,callback){
	if(!dbName){
		output('error','No model name specified !');
		process.exit();
	} 
	var DetailLinksModel = require('./vo/detail').DetailLinksModel(dbName);
	db.connect();
	DetailLinksModel.update({status:'W'},{status:'N'},{multi:true},function(error,numberAffected,rawResp){
		if(error){
			output('error','restoreW2N has error: '+error)
		}else{
			output('info',' restoreW2N success, restore row number: ' + numberAffected);
		}
		db.disconnect();
		callback();
	})
}

exports.restoreW2N = restoreW2N;