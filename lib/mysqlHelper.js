var mysql = require('mysql'),output = require('./common').output

var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database:'gxcms',
    port: 3306
});

var connect = function(){
	conn.connect();
}

var disconnect = function(){
	conn.end();
}

var getVideoModel = function(){
	var video = { id: '',
				  cid: 0,
				  title: 'Test',
				  intro: '',
				  keywords: '',
				  color: '',
				  actor: '',
				  director: '',
				  content: '',
				  picurl: '',
				  area: '',
				  language: '',
				  year: 0,
				  serial: '0',
				  addtime: 0,
				  hits: 0,
				  monthhits: 0,
				  weekhits: 0,
				  dayhits: 0,
				  hitstime: 0,
				  stars: 0,
				  status: 1,
				  up: 0,
				  down: 0,
				  playurl: '',
				  downurl: '',
				  inputer: '',
				  reurl: '',
				  letter: '',
				  score: 0,
				  scoreer: 0,
				  genuine: 0,
				  qvod: '',
				  youku: '',
				  tudou: '',
				  swf: '' 
	};

  return video;
}

var insertVideo = function(tableName,video,callback){
	conn.query('INSERT INTO '+tableName+' SET ?',video, function(err, result) {
	    if (err){
	    	output('error','insertVideo has error '+ err);
	    }
	    output('info','insertVideo id : '+result.insertId)
	});
}

var getInsertSQL = function(tableName,video){
	var sql = 'INSERT INTO '+tableName+' SET ?';
	return mysql.format(sql,video);
}

var getUpdateSQL = function(tableName,setFields,where){
	var sql = 'UPDATE ?? SET ? WHERE ?';
	return mysql.format(sql,[tableName,setFields,where]);
}

/*
	?? 和 ? 的区别：
		?? 是对identifier用的。生成的SQL语句，不会有 'XXX'，而是`xxx`。例如: select * from TABLE_NAME (TABLE_NAME 不能用 ?)
		? 是对非identifier用的。生成的SQL语句，会有 'XXX'
*/
var queryVideo = function(tableName,queryColumns,queryObj,callback){
	var sql;
	if(queryColumns && queryColumns.length == 0){
		sql = mysql.format('SELECT * FROM ?? WHERE ?', [tableName, queryObj]);
	}else{
		sql = mysql.format('SELECT ?? FROM ?? WHERE ?', [queryColumns,tableName, queryObj]);
	}
	// console.log(sql);
	conn.query(sql,function(err, videos) {
	    if (err){
	    	output('error','queryVideo has error '+ err);
	    }
	    callback(err,videos)
	});
}

var executeSql = function(sql,callback){
	conn.query(sql,function(error,result){
		callback(error,result);
	});
}
exports.executeSql = executeSql;
exports.connect = connect;
exports.disconnect = disconnect;
exports.getVideoModel = getVideoModel;
exports.insertVideo = insertVideo;
exports.getInsertSQL = getInsertSQL;
exports.getUpdateSQL = getUpdateSQL;
exports.queryVideo = queryVideo;

