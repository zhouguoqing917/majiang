const mongoose = require('mongoose');
const env = process.argv[2] || '';
let host  = "127.0.0.1";
let port = 27017;
let dbname    = "hongzhong";
let connectionString = '';
if(env.indexOf('production') != -1){
    host  = "dds-uf69ede233697a542.mongodb.rds.aliyuncs.com";
    port  = 3717;
    let username = 'hongzhong';
    let pwd = 'Yaojing1818';
    connectionString = `mongodb://${username}:${pwd}@${host}:${port}/${dbname}`;
    console.log('数据库连接线上环境');
}else if(env.indexOf('stage') != -1){
    host = '10.174.66.16';
    let username = 'hongzhong';
    let pwd = 'Yaojing1818';
    connectionString = `mongodb://${username}:${pwd}@${host}:${port}/${dbname}`;
}else{
    connectionString = `mongodb://${host}:${port}/${dbname}`
}

const options = {
    db: {
        native_parser: true
    },
    server: {
        auto_reconnect: true,
        poolSize: 5
    }
};

mongoose.Promise = require('bluebird');

mongoose.connect(connectionString, options, (err, res) => {
    if (err)
{
    console.log(`[mongoose log]
    Error
    connecting
    to: ${connectionString} .
    $
    {
        err
    }`)
    ;
    return process.exit(1);
}
else
{
    return console.log(`[mongoose log]
    Successfully
    connected
    to: ${connectionString}`
)
    ;
}
})
;

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'mongoose connection error:'));

db.once('open', function () {
    return console.log('mongoose open success');
});


module.exports = db;