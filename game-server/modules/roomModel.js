/*!
 * Pomelo -- consoleModule nodeInfo processInfo
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('pomelo-logger').getLogger('pomelo-admin', __filename);
var roomManager = require('../app/servers/room/model/roomManager.js');

module.exports = function(opts) {
    return new Module(opts);
};

module.exports.moduleId = 'roomModel';
var Module = function(opts) {
    opts = opts || {};
    this.type = opts.type || 'pull';
};

var actionsResult = {
    dissRoom : function(agent, msg, cb){
        var roomNo = msg.roomNo;
        console.log('======>>>roomNo',roomNo);
        var room = roomManager.getRoomByRoomNo(roomNo);
        if(room){
            room.forceDissolveRoom();
            cb(null,{code : '操作成功'});
        }else{
            cb(null,{code : '房间不存在'});
        }
    },
    getRoomMessage : function(agent, msg, cb){
        var roomNo = msg.roomNo;
        var room = roomManager.getRoomByRoomNo(roomNo);
        if(room){
            var data = room.getRoomMessage(null,true);
            cb(null,{code : 200, msg : '操作成功',data : data});
        }else{
            cb(null,{code : 500 , msg : '房间不存在'});
        }
    },
    getAllRoom : function(agent, msg, cb){
        var roomNo = msg.roomNo;
        var rooms = {
            roomCount : 0,
            startingCount : 0,
            overOneCount : 0,
            roomNoArr : []
        };
        for(var key in roomManager.allRoom){
            var room = roomManager.allRoom[key];
            rooms.roomCount += 1;
            if(room.status > 1){
                rooms.startingCount += 1;
            }
            if(room.status >= 3){
                rooms.overOneCount += 1;
            }
            rooms.roomNoArr.push(key);
        }
        console.log(rooms,'=====>>>>rooms');
        cb(null,{code : 200, msg : '操作成功',data : rooms});
    },
    "setNextMahjong" : function(agent, msg, cb){
        var roomNo = msg.roomNo;
        console.log('======>>>333333',roomNo);
        var room = roomManager.getRoomByRoomNo(roomNo);
        if(room){
            room.next[msg.uid] = msg.pai;
            cb(null,{code : '操作成功'});
        }else{
            cb(null,{code : '房间不存在'});
        }
    }
};

Module.prototype.monitorHandler = function(agent, msg, cb) {
    var cmd = msg.cmd;
    if(typeof(actionsResult[cmd]) == 'function'){
        actionsResult[cmd](agent, msg, cb);
    }else{
        cb(null,{code : 500 , msg : '非法操作'})
    }

};



Module.prototype.masterHandler = function(agent, msg, cb) {

};

var actions = {
    dissRoom : function(agent, msg, cb){
        var servers = global.app.getServersByType('room');
        var roomNo = msg.roomNo;
        var serverId ;
        if(!roomNo){
            return cb(null, {code : 500 , msg : '参数错误'});
        }
        let serverSuffix = (roomNo + '').substr(0,2);
        let isLegal = false;
        for(let i = 0 ; i < servers.length;i++){
            if(servers[i].id.indexOf(serverSuffix) != -1){
                isLegal = true;
                break;
            }
        }
        if(!isLegal){
            let random = parseInt(Math.random() * servers.length);
            serverId = servers[random].id;
        }else{
            serverId = `room-server-${serverSuffix}`;
        }

        if(!serverId){
            return cb(null, {code : 500 , msg : '参数非法'});
        }

        agent.request(serverId, module.exports.moduleId ,msg ,function(err, data){
                cb(null,data);
        });
    },
    "getRoomMessage" : function(agent, msg, cb){
        var servers = global.app.getServersByType('room');
        var roomNo = msg.roomNo;
        var serverId ;
        if(!roomNo){
            return cb(null, {code : 500 , msg : '参数错误'});
        }
        let serverSuffix = (roomNo + '').substr(0,2);
        let isLegal = false;
        for(let i = 0 ; i < servers.length;i++){
            if(servers[i].id.indexOf(serverSuffix) != -1){
                isLegal = true;
                break;
            }
        }
        if(!isLegal){
            let random = parseInt(Math.random() * servers.length);
            serverId = servers[random].id;
        }else{
            serverId = `room-server-${serverSuffix}`;
        }

        if(!serverId){
            return cb(null, {code : 500 , msg : '参数非法'});
        }

        agent.request(serverId, module.exports.moduleId ,msg ,function(err, data){
            cb(null,data);
        });
    },
    "getAllRoom" :async function(agent, msg, cb){
        var servers = global.app.getServersByType('room');
        var obj = {};
        for(var i = 0 ; i < servers.length; i ++){
            try{
                var result = await new Promise(function(resolve,reject){
                    agent.request(servers[i].id, module.exports.moduleId ,msg ,function(err, data){
                        console.log(err, data,'=====>>>>');
                        if(err){
                            reject(err);
                        }else{
                            resolve(data)
                        }
                    });
                });
                obj[servers[i].id] = result.data;
            }catch(e){
                console.log(e.stack,'====>>>>');
            }
        }
        cb(null,{ code : 200 ,data : obj });
    },
    "setNextMahjong" : async function(agent, msg, cb){
        var servers = global.app.getServersByType('room');
        var roomNo = msg.roomNo;
        var serverId ;
        if(!roomNo){
            return cb(null, {code : 500 , msg : '参数错误'});
        }
        let serverSuffix = (roomNo + '').substr(0,2);
        let isLegal = false;
        for(let i = 0 ; i < servers.length;i++){
            if(servers[i].id.indexOf(serverSuffix) != -1){
                isLegal = true;
                break;
            }
        }
        if(!isLegal){
            let random = parseInt(Math.random() * servers.length);
            serverId = servers[random].id;
        }else{
            serverId = `room-server-${serverSuffix}`;
        }

        if(!serverId){
            return cb(null, {code : 500 , msg : '参数非法'});
        }
        console.log('=======22222');
        agent.request(serverId, module.exports.moduleId ,msg ,function(err, data){
            cb(null,data);
        });
    }
};

Module.prototype.clientHandler = async function(agent, msg, cb) {
    var cmd = msg.cmd;
    console.log('=======111111');
    try{
        if(typeof(actions[cmd]) == 'function'){
            actions[cmd](agent, msg, cb);
        }
    }catch(e){
        cb(null,{code : 500 , msg : '非法操作'})
    }
};
