const pomelo = require('pomelo');
const loginFilter = require('./app/filter/loginFilter');
const globalFilter = require('./app/filter/globalFilter');
const router = require('./app/router/router.js');
const mail = require('./app/util/mail.js');
const xfyunModel = require('./app/xfyun/xfyunModel.js');
require('./app/db/mongodb').load();

/**
 * Init app for client.
 */
const app = pomelo.createApp();
app.set('name', 'yaojing');

//讲app 挂到global上
global.app = app;

// app configuration
//新增服务器必须增加修改三个地方
/**
 * 此处要添加链接配置
 * config/adminServer.json要添加与master通讯token
 * servers下要添加handler
 * */
app.configure('production|development|stage', function(){
    app.after(globalFilter);

    let onLineUser = require('./modules/onLineUser');
    let roomModel = require('./modules/roomModel');
    let broadcast = require('./modules/broadcast.js');

    app.registerAdmin(roomModel,{app : app});
    app.registerAdmin(onLineUser,{app : app});
    app.registerAdmin(broadcast,{app : app});
    //全局错误handler
    let globalErrHandler = require('./app/errHandler/globalErrHandler.js');
    app.set('errorHandler',globalErrHandler);

    //注册apptoken
    xfyunModel.getAppToken();
});
app.configure('production|development|stage', 'gate', function(){
    app.set('connectorConfig', {
        connector : pomelo.connectors.hybridconnector,
        //heartbeat : 2,
        useDict : true,
        useProtobuf : true
    });
});
app.configure('production|development|stage', 'master', function(){
    app.filter(pomelo.filters.serial());
    app.set('connectorConfig', {
        connector : pomelo.connectors.hybridconnector,
        //heartbeat : 2,
        useDict : true,
        useProtobuf : true
    });
});

app.configure('production|development|stage', 'connector', function(){
    app.filter(pomelo.filters.serial());
    // if(app.get('env') != 'development'){
    app.before(loginFilter);
    // }

    app.set('connectorConfig', {
        connector : pomelo.connectors.hybridconnector,
        heartbeat : 3,
        useDict : true,
        useProtobuf : true
    });
});

app.configure('production|development|stage', 'room', function(){
    app.filter(pomelo.filters.serial());
    app.before(loginFilter);
});

//加载route
router(app);

// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
    mail.sendMail('======>>>uncaughtException : '+ err.stack);
});

if(app.get('env') != 'development') {
 console.log = function(){};
}