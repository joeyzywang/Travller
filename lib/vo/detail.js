var mongoose = require('mongoose');
	require('date-utils')
var Schema = mongoose.Schema;

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

exports.DetailLinksModel = mongoose.model('DetailLinksModel',new Schema(detailLinks));