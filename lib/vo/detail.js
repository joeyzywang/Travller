var mongoose = require('mongoose');
	require('date-utils')
var Schema = mongoose.Schema;

/*
	Status:
		N: need to update,
		W: waiting for restore to N
		Y: yes, it has been updated, will not update again
*/

var detailLinks = {
	host:String,
	url:String,
	status:String,
	last_visit:String,
	urlmd5:String,
	created_at: { type: String, default: function(){
		var now = new Date();
		var format = 'YYYY-MM-DD-HH24-MI-SS';
		return now.toFormat(format); } }
}

exports.DetailLinksModel = function(modelName){
	if(!modelName){
		return mongoose.model('defaultLinks',new Schema(detailLinks,{collection:"defaultLinks"}));
	}else{
		return mongoose.model(modelName,new Schema(detailLinks,{collection:modelName}));
	}
}

//exports.DetailLinksModel = 