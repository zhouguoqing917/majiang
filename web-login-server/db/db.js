var connectionString, db, mongoose, options;

mongoose = require('mongoose');

var host  = "192.168.0.222";
var port  = "27017";
var db    = "hongzhong";
var username='yaoyao';
var pwd='yaoyao8888';


connectionString = `mongodb://${username}:${pwd}@${host}:${port}/${db}`;

options = {
    db: {
        native_parser: true
    },
    server: {
        auto_reconnect: true,
        poolSize: 5
    }
};

mongoose.Promise = require('bluebird');

mongoose.connect(connectionString, options, (err, res)=> {
    if (err) {
        console.log(`[mongoose log] Error connecting to: ${connectionString} . ${err}`);
        return process.exit(1);
    } else {
        return console.log(`[mongoose log] Successfully connected to: ${connectionString}`);
    }
});

db = mongoose.connection;

db.on('error', console.error.bind(console, 'mongoose connection error:'));

db.once('open', function() {
    return console.log('mongoose open success');
});


module.exports = db;