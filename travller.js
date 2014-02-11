#!/usr/bin/env node
var commander = require('commander'),
	run = require('./lib/main').run,
	init = require('./lib/main').init

commander.version("0.1.0")
	//	.option('-s, --seed','choose to create new seed')
	// 1-phantomjs 2-WS 3-Detail-WS
	.option('-t, --type <type>','Traver type: list / content / full')
	.option('-p, --plugin <pluginName>','Sepcify which plugin(website) used to traverse')
	.option('-r, --restore <restoreDB>','Restore specified DB to update W status to N')
	.option('-f, --failedLinks','Read failedLinks to retry failed links')
	.option('-i, --indexer','Call indexer to generate index DB')
	.option('-s, --scrapImg','Scrap Img to save and update DB')
	.parse(process.argv);

init(commander,function(){
	run();	
});
