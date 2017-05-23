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

module.exports.moduleId = 'broadcast';
var Module = function(opts) {
    opts = opts || {};
    this.type = opts.type || 'pull';
    //this.interval = opts.interval || DEFAULT_INTERVAL;
    //this.delay = opts.delay || DEFAULT_DELAY;
};

Module.prototype.monitorHandler = function(agent, msg, cb) {
    const channelService = global.app.get('channelService');
    channelService.broadcast('connector','onNotice',{code : 200,data : {content : msg.content,count : msg.count || 3}},null,function(err){
        cb(err);
    });
};

Module.prototype.masterHandler = function(agent, msg, cb) {

};

Module.prototype.clientHandler = async function(agent, msg, cb) {
    var services = global.app.getServersByType('connector');
    agent.request(services[0].id,module.exports.moduleId,msg,function(err, data){
        if(err){
            return cb(null, {code : 500});
        }else{
            return cb(null, {code : 200});
        }
    });
};
