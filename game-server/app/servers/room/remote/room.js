const room = require('../model/room.js');
const roomManager = require('../model/roomManager.js');
module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

var handler = Handler.prototype;

/**
 * 给用户分配一个新房间
 * @param createUserId 创建者ID
 * @param roomData 房间数据
 * */
handler.createRoom = async function(createUserId,roomData, cb) {
    try{
        const data=await room.createRoom(this.app,createUserId,roomData);
        cb({code:200,msg:'创建房间成功',data:data});
    }catch(ex){
        cb({code:500,msg:ex.message});
    }
};

/**
 * 获取用户的所有房间列表
 * */
handler.getUserRoomList = async function(createUserId,roomData, cb) {
    try{
        let data = roomManager.getRoomsData();
        cb({code:200,msg:'创建房间成功',data:data});
    }catch(ex){
        console.log(ex.track);
        cb({code:500,msg:ex.message});
    }
};

handler.getRoomUserCount = async function(roomNo,cb){
    let room = roomManager.getRoomByRoomNo(roomNo);
    let userCount = room ? room.users.length : 0;
    cb(null,{userCount : userCount})
};

handler.leaveRoom = async function(roomNo,uid,next){
    try {
        if (!roomNo) {
            return next(null, {code: 500, msg: '参数错误!'});
        }
        let room = roomManager.getRoomByRoomNo(roomNo);
        if(!room){
            return next(null, {code: 500, msg: '房间不存在!'});
        }
        const data = await room.leaveRoom(uid,true);
        next(null, {code: 200, msg: '离开房间'});
    } catch (ex) {
        console.log(ex.stack);
        next(null, {code: 500, msg: ex.message});
    }
};

