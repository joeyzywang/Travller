var db = require('mongoose');
var load = require('konphyg/lib/load'),path = require('path');

var Config = load(path.join(path.dirname(__filename),'../config/db.json'),null,false);
console.log(path.join(path.dirname(__filename),'../config/db.json'))
exports.Config = Config

var get_monog_url = function() {
  if (process.env.VCAP_SERVICES) {
    return "mongodb://" + Config.username + ":" + Config.password + "@" + Config.hostname + ":" + Config.port + "/" + obj.db;
  } else {
    return "mongodb://" + Config.host + ":" + Config.port + "/" + Config.db;
    //return "mongodb://" + Config.host + "/" + Config.db;
  }
};

var connect = function() {
    var dbURL = get_monog_url();
    console.log('mongodb url = ' + dbURL);
    db.connect(dbURL);
    db.connection.on('error', function (err) {
      console.log(err);
      process.exit();
    });
};

var disconnect = function(){
  db.connection.close();
};

exports.get_monog_url = get_monog_url;
exports.connect = connect;
exports.disconnect = disconnect;