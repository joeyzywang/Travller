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

var perpareSQL = function(tableName,video){
	var sql = 'INSERT INTO '+tableName+' SET ?';
	return mysql.format(sql,video);
}

exports.getVideoModel = getVideoModel;
exports.insertVideo = insertVideo;
exports.perpareSQL = perpareSQL;

