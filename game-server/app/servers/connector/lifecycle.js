

module.exports.beforeStartup = function(app, cb) {
    cb();
};


module.exports.afterStartup = function(app, cb) {
    cb();
};


module.exports.beforeShutdown = function(app, cb) {
    // do some operations before application shutdown down
    cb();
};


module.exports.afterStartAll = function(app) {
    // const server=app.getServerById(app.getServerId());
    //
    // app.rpc.center.square.register(null,server,()=>{
    //     console.log(`连接服务器${server.id}在中心服务器注册成功`);
    // });
};
