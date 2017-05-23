/*!
 * Pomelo -- consoleModule nodeInfo processInfo
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('pomelo-logger').getLogger('pomelo-admin', __filename);

var DEFAULT_INTERVAL = 5 * 60;		// in second
var DEFAULT_DELAY = 10;						// in second


module.exports = function(opts) {
    return new Module(opts);
};

module.exports.moduleId = 'onLineUser';
var Module = function(opts) {
    opts = opts || {};
    this.type = opts.type || 'pull';
    //this.interval = opts.interval || DEFAULT_INTERVAL;
    //this.delay = opts.delay || DEFAULT_DELAY;
};

Module.prototype.monitorHandler = function(agent, msg, cb) {
    //notifyClient
    var count = global.app.components.__connection__.service.loginedCount;
    var logined = global.app.components.__connection__.service.logined;
    cb(null,{count : count});
};

Module.prototype.masterHandler = function(agent, msg, cb) {

};

Module.prototype.clientHandler = async function(agent, msg, cb) {
    var services = global.app.getServersByType('connector');
    var totalCount = 0;
    var serverCount = {};
    var logined = [];
    for(var i = 0; i<services.length; i++){
        let result = await new Promise(function (resolve, reject) {
            //console.log(services[i]);
            agent.request(services[i].id,module.exports.moduleId,{},function(err, data){
                resolve(data)
            });
        });
        serverCount[services[i].id] = result.count;
        totalCount += result.count;

    }
    cb(null, {totalCount:totalCount ,serverCount : serverCount});
};
