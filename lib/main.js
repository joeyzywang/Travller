var path = require('path'), child_process = require('child_process'),load = require('konphyg/lib/load')
	fs = require('fs'), U = require('./utility'), R = require('./restore')
	output = require('./common').output,require('date-utils')

var INSERT_SQL = "insert.sql", UPDATE_SQL = "update.sql"

var node = process.execPath || 'node';
var opts = {stdio: 'inherit'};
var listPageArg = [];
var contentPageArg = [];
var indexerArg = [];
var scrapImgArg = [];

/*
	Init Folder
*/
var initFolder = function(){
	var filePath = global['DATA_PATH'] + '/' + global['PLUGIN_NAME'],
		backupPath = global['BACKUP_PATH']

	if(!fs.existsSync(filePath)){
		fs.mkdirSync(filePath);
	}
	if(fs.existsSync(filePath + '/' + INSERT_SQL)){
		fs.renameSync(filePath + '/' + INSERT_SQL,backupPath + '/' + new Date().toFormat('YYYY_MM_DD_HH_MI_SS') + '-' + INSERT_SQL);
	}
	if(fs.existsSync(filePath + '/' + UPDATE_SQL)){
		fs.renameSync(filePath + '/' + UPDATE_SQL,backupPath + '/' + new Date().toFormat('YYYY_MM_DD_HH_MI_SS') + '-' + UPDATE_SQL);
	}
	global['INSERT_SQLFILE_PATH'] = filePath + '/' + INSERT_SQL;
	global['UPDATE_SQLFILE_PATH'] = filePath + '/' + UPDATE_SQL
}

var init = function(commander,callback){
	// Init Global Variables
	global['BASE_PATH'] = path.dirname(__dirname);
	global['CONFIG_PATH'] = global['BASE_PATH'] + '/config';
	global['DATA_PATH'] = global['BASE_PATH'] + '/data';
	global['BACKUP_PATH'] = global['BASE_PATH'] + '/backup';
	global['LIB_PATH'] = global['BASE_PATH'] + '/lib';
	global['TRAV_TYPE'] = commander.type;
	global['PLUGIN_NAME'] = commander.plugin;
	global['FAILED_LINKS'] = commander.failedLinks;
	if(fs.existsSync(global['CONFIG_PATH']) && fs.existsSync(path.join(global['CONFIG_PATH'],'/travller.json'))){
			var travllerData = load(path.join(global['CONFIG_PATH'],'/travller.json'),null,false);
			// console.log(travllerData)
			global['TRAV_DATA'] = travllerData[global['PLUGIN_NAME']];
	}
	//Init child spawn params
	opts['env'] = global;
	listPageArg.push(global['LIB_PATH'] + '/traverse');
	contentPageArg.push(global['LIB_PATH'] + '/detailPageProcess');	
	indexerArg.push(global['LIB_PATH'] + '/indexer');	
	scrapImgArg.push(global['LIB_PATH'] + '/imgSave');	
	//Before Run and Run Section
	beforeRun(commander,function(){
		//Check Run Opts
		var errorMsg = checkRunOpts();
		if(errorMsg){
			output('error',errorMsg);
			process.exit();
		}
		callback(); // Run
	})
}
/*
	Before Run Section
*/
var beforeRun = function(commander,callback){
	if(commander.restore){
		R.restoreW2N(commander.restore,function(){
			process.exit(); 
			// Restore has no callback
		});
	}else if(commander.indexer){ //Generate index db
		if(fs.existsSync(global['DATA_PATH'] + '/index.sql')){
			fs.renameSync(global['DATA_PATH'] + '/index.sql',global['BACKUP_PATH'] + '/index-' + new Date().toFormat('YYYY_MM_DD_HH_MI_SS') + '.sql');
		}
		var runspawn = child_process.spawn(node,indexerArg,opts);
		runspawn.on('close',function(code){
			process.exit();
		})
	}else if(commander.scrapImg){ //Generate index db
		// global['IMG_FOLDER'] = global['BASE_PATH'] + '/img-data_' + new Date().toFormat('YYYY_MM_DD_HH_MI_SS');
		//DIY the image folder to the web uploads directory to reduce copy and paste work
		global['IMG_FOLDER'] = '/Users/zhenwang/Work/apache_ws/luluysc/uploads' + '/img-data_' + new Date().toFormat('YYYY_MM_DD_HH_MI_SS');
		if( !fs.existsSync(global['IMG_FOLDER']) ){
			fs.mkdirSync(global['IMG_FOLDER'])
		}
		var runspawn = child_process.spawn(node,scrapImgArg,opts);
		runspawn.on('close',function(code){
			process.exit();
		})
	}else{
		callback();
	}
}

/*
	Run Travers Section
*/
var run = function(){
	// Init Data Folder Section
	initFolder();

	// child_process global varialbe only support key-value (not object)
	travData2Global(); 

	if(global['TRAV_TYPE'] == 'list'){
		var runspawn = child_process.spawn(node,listPageArg,opts);
	}else if(global['TRAV_TYPE'] == 'content'){
		var runspawn = child_process.spawn(node,contentPageArg,opts);
	}else if(global['TRAV_TYPE'] == 'full'){
		var runspawn = child_process.spawn(node,listPageArg,opts);
		runspawn.on('close', function (code) {
			console.log('[INFO]: --------------------- Content Page Scraping Start ------------------------');
			var runspawn_1 = child_process.spawn(node,contentPageArg,opts);
		});		
	}else{
		console.log('[ERROR]: Traver type is invalid');
		process.exit();
	}

}

function checkRunOpts(){
	if(!global['TRAV_DATA'])   return "Trav_DATA not found, path error";
	if(!global['PLUGIN_NAME']) return "Plugin not choose !"
	return null;
}

function travData2Global(){
	var temp = global['TRAV_DATA'];
	for(var key in temp){
		global['TRAV_DATA' + '.' + key] = temp[key];
	}
	delete global['TRAV_DATA'];
}

exports.init = init;
exports.run = run;