#!/usr/bin/env node
var commander = require('commander'),
	run = require('./lib/main').run,
	init = require('./lib/main').init

commander.version("0.1.0")
	//	.option('-s, --seed','choose to create new seed')
	// 1-phantomjs 2-WS 3-Detail-WS
	.option('-l, --list','Traver list pages but not traver detail(content) page')
	.option('-c, --content','Traver content pages but not traver the list pages')
	.option('-f, --full','Full traver, first traver list page, then frome traver content pages from that list pages')
	.option('-p, --plugin <pluginName>','Sepcify which plugin(website) used to traverse')
	.parse(process.argv);

init(commander,function(){
	run();	
});
