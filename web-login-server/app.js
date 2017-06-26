var http = require('http');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var routes=require('./router/login');
var port=5100;



var app = express();
app.set('port', port); //设置express端口，跟http服务端口相同即可
app.use(function(req, res, next) { //404错误的处理
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public'))); //设置静态文件目录
app.use('/', routes);

app.use(function(req, res, next) { //404错误的处理
    res.send('404');
});
//
//if (app.get('env') === 'development') { //开发环境错误的处理
//    app.use(function(err, req, res, next) {
//        res.status(err.status || 500);
//        res.send(err.message);
//        //res.render('error', {
//        //    message: err.message,
//        //    error: err
//        //});
//    });
//}
//
//app.use(function(err, req, res, next) { //产品环境错误的处理
//    res.status(err.status || 500);
//    res.send(err.message);
//    //res.render('error', {
//    //    message: err.message,
//    //    error: {}
//    //});
//});

//app.listen(port);
//
var server = http.createServer(app);
server.listen(port);
require('./db/mongodb').load();
// require('./db/gameuser').load();
// http://localhost:3000/test.html
