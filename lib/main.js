var path = require('path'), child_process = require('child_process'),load = require('konphyg/lib/load')
	fs = require('fs'), U = require('./utility')
	output = require('./common').output

var init = function(commander,callback){
	global['BASE_PATH'] = path.dirname(__dirname);
	global['CONFIG_PATH'] = global['BASE_PATH'] + '/config';
	global['DATA_PATH'] = global['BASE_PATH'] + '/data';
	global['LIB_PATH'] = global['BASE_PATH'] + '/lib';
	global['FULL_TEST'] = commander.full;
	global['PLUGIN_NAME'] = commander.plugin;
	if(fs.existsSync(global['CONFIG_PATH']) && fs.existsSync(path.join(global['CONFIG_PATH'],'/travller.json'))){
			var travllerData = load(path.join(global['CONFIG_PATH'],'/travller.json'),null,false);
			// console.log(travllerData)
			global['TRAV_DATA'] = travllerData[global['PLUGIN_NAME']];
	}
	// console.log(global['TRAV_DATA'])
	var errorMsg = checkOpts();
	if(errorMsg){
		output('error',errorMsg);
		process.exit();
	}
	// require('./plugins/'+U.requirePlugin()).init(); // Plugin init
	callback();
}

var run = function(){
	travData2Global(); // child_process global varialbe only support key-value (not object)
	var node = process.execPath || 'node';
	var opts = {env:global,stdio: 'inherit'};
	var args = [];
	args.push(global['LIB_PATH'] + '/traverse');
	// args.push(global['BASE_PATH'] + '/test/test.js');
	var runspawn = child_process.spawn(node,args,opts);
	runspawn.on('close', function (code) {
	  console.log('child process exited with code ' + code);
	});
}

function checkOpts(){
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