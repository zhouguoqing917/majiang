const roomManager = require('../model/roomManager.js');
const gameUserModel = require('mongoose').models['GameUser'];
const roomCardRecordModel = require('mongoose').models['RoomCardRecord'];
const roomModel = require('mongoose').models['Room'];
var seqqueue = require('seq-queue');
var queue = seqqueue.createQueue(1000);
var queue2 = seqqueue.createQueue(1000);
module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

var handler = Handler.prototype;


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
    cb(null,{userCount : userCount});
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

handler.deductRoomCard = async function(cardNum,uid,next){
    console.error(uid,cardNum,'=======deductRoomCard');
    queue.push(async function(task){
        const gameuser = await gameUserModel.findOne({_id: uid});
        console.log(gameuser.roomCard,'========>>>');
        if(gameuser.roomCard < cardNum){
            return next(null, {code : 500 ,msg : '房卡不足'})
        }

        gameuser.roomCard -= parseInt(cardNum);
        await gameuser.save();
        console.log(gameuser.roomCard,'========>>>after');
        //写入房卡消耗记录
        await roomCardRecordModel.create({
            aboutUserId: gameuser._id,
            modifyType: 'system',
            preNumber: gameuser.roomCard + cardNum,
            curNumber: -cardNum,
            afterNumber: gameuser.roomCard,
            description: `用户开房消耗`,
            userCount : 0
        });
        next(null,{code : 200});
        task.done();
    },1000)
}

handler.backRoomCard = async function(uid,roomId,cardNum,next){
    queue2.push(async function(task){
        console.error(uid,roomId,cardNum,'=======backRoomCard');
        const gameuser = await gameUserModel.findOne({_id: uid});
        gameuser.roomCard += parseInt(cardNum);
        await roomModel.update({_id: roomId}, {$set : {status : 7}}).exec();
        await gameuser.save();
        //写入房卡消耗记录
        await roomCardRecordModel.create({
            aboutUserId: gameuser._id,
            modifyType: 'system',
            preNumber: gameuser.roomCard - cardNum,
            curNumber: cardNum,
            afterNumber: gameuser.roomCard,
            description: `房间超时`,
            userCount : 0
        });
        next(null,{code : 200});
        task.done();
    },1000);
}

handler.isInRoom = async function(roomNo,uid,next){
    try{
        if (!roomNo) {
            return next(null, {code: 500, msg: '参数错误!'});
        }
        let room = roomManager.getRoomByRoomNo(roomNo);
        if(!room){
            return next(null, {code: 500, msg: '房间不存在!'});
        }
        let user = room.getUserByUid(uid);
        if(!user){
            return next(null,{code : 500});
        }
        next(null,{code :200});
    }catch(ex){
        console.error('=========?????',ex);
        next(null,{code :500});
    }

}