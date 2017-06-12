const Room = require('../model/room.js');
const roomManager = require('../model/roomManager.js');
const gameUserModel = require('mongoose').models['GameUser'];
module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};
var handler = Handler.prototype;

//创建房间
handler.createRoom = async function (msg, session, next) {
    try {
        const data = await new Room(this.app).createRoom(session,msg);
        next(null, {code: 200, msg: '创建房间成功', data: data});
    } catch (ex) {
        console.error(ex);
        next(null, {code: 500, msg: ex});
    }
};

//进入房间
handler.entryRoom = async function (msg, session, next) {
    try {
        let roomNo = msg.roomNo;
        if (!roomNo) {
            return next(null, {code: 500, msg: '参数错误!'});
        }
        let room = await roomManager.getRoomByRoomNo(roomNo);
        let uid = session.uid;
        if(!room){
            await gameUserModel.update({_id:uid},{$set:{currRoomNo: null , roomId : null}}).exec();
            return next(null, {code: 400, msg: '房间不存在!'});
        }
        const data = await room.entryRoom(roomNo, session);
        next(null, {code: 200, msg: '进入房间', data: data});
    } catch (ex) {
        console.error(ex);
        next(null, {code: 400, msg: ex});
    }
};

//获取房间列表
handler.getUserRoomList = async function (msg, session, next) {
    try {
        let uid = session.uid;
        let data = await roomManager.getRoomsForDatabase(uid);
        next(null, {code: 200, msg: '房间列表', data: data});
    } catch (ex) {
        console.error(ex.stack);
        next(null, {code: 500, msg: ex});
    }
};

//离开房间
handler.leaveRoom = async function(msg, session, next){
    try {
        let roomNo = session.get('roomNo') || msg.roomNo;
        if (!roomNo) {
            return next(null, {code: 500, msg: '参数错误!'});
        }
        let room = roomManager.getRoomByRoomNo(roomNo);
        if(!room){
            return next(null, {code: 500, msg: '房间不存在!'});
        }
        let uid = session.uid;
        if(!room.getUserByUid(uid)){
            return next(null, {code: 400, msg: '不在此房间!'});
        }
        if(room.status == 2){
            const data = room.leaveRoom(uid,true);
        }else{
            session.set('roomNo',null);
            await session.pushAll();
            const data = room.leaveRoom(uid);
        }

        next(null, {code: 200, msg: '离开房间'});
    } catch (ex) {
        console.error(ex.stack);
        next(null, {code: 500, msg: ex});
    }
};


//出牌
handler.playMahjong = async function(msg, session, next){
    let roomNo = msg.roomNo;
    if (!roomNo || !msg.mahjong) {
        return next(null, {code: 500, msg: '参数错误!'});
    }
    let room = roomManager.getRoomByRoomNo(roomNo);
    if(!room){
        return next(null, {code: 500, msg: '房间不存在!'});
    }
    let uid = session.uid;
    if(!room.getUserByUid(uid)){
        return next(null, {code: 400, msg: '不在此房间!'});
    }
    try {
        let data = await room.playMahjong(uid,msg.mahjong);
        next(null, {code: 200, msg: '出牌'});
    } catch (ex) {
        console.error(ex,'=====>>>');
        next(null, {code: 500, msg: ex});
    }
};

handler.handlerChi = async function(msg, session, next){
    let roomNo = msg.roomNo;
    if (!roomNo || !msg.mahjongs || !msg.mahjongs.length || msg.mahjongs.length != 2) {
        return next(null, {code: 500, msg: '参数错误!'});
    }
    let room = roomManager.getRoomByRoomNo(roomNo);
    if(!room){
        return next(null, {code: 500, msg: '房间不存在!'});
    }
    let uid = session.uid;
    if(!room.getUserByUid(uid)){
        return next(null, {code: 400, msg: '不在此房间!'});
    }

    try {
        let data = await room.handlerChi(uid,msg.mahjongs);
        next(null, {code: 200, msg: '吃'});
    } catch (ex) {
        console.error(ex,'=====>>>');
        next(null, {code: 500, msg: ex});
    }
};

/**
 * 取消操作
 */
handler.cannelAction = function(msg, session, next){
    let roomNo = msg.roomNo;
    if (!roomNo ) {
        return next(null, {code: 500, msg: '参数错误!'});
    }
    let room = roomManager.getRoomByRoomNo(roomNo);
    if(!room){
        return next(null, {code: 500, msg: '房间不存在!'});
    }
    let uid = session.uid;
    if(!room.getUserByUid(uid)){
        return next(null, {code: 400, msg: '不在此房间!'});
    }
    try {
        let reuslt = room.cannelAction(uid);
        next(null, {code: 200, msg: '取消操作',unhu : reuslt});
    } catch (ex) {
        next(null, {code: 500, msg: ex});
    }
};


//杠
handler.handlerGang = function(msg, session, next){
    let roomNo = msg.roomNo;
    if (!roomNo || !msg.mahjong) {
        return next(null, {code: 500, msg: '参数错误!'});
    }
    let room = roomManager.getRoomByRoomNo(roomNo);
    if(!room){
        return next(null, {code: 500, msg: '房间不存在!'});
    }
    let uid = session.uid;
    if(!room.getUserByUid(uid)){
        return next(null, {code: 400, msg: '不在此房间!'});
    }
    try {
        room.handlerGang(uid,msg.mahjong);
        next(null, {code: 200, msg: '杠'});
    } catch (ex) {
        console.error(ex,'========>>>>>>');
        next(null, {code: 500, msg: ex});
    }
};

//碰
handler.handlerPeng = function(msg, session, next){
    let roomNo = msg.roomNo;
    if (!roomNo) {
        return next(null, {code: 500, msg: '参数错误!'});
    }
    let room = roomManager.getRoomByRoomNo(roomNo);
    if(!room){
        return next(null, {code: 500, msg: '房间不存在!'});
    }

    let uid = session.uid;
    if(!room.getUserByUid(uid)){
        return next(null, {code: 400, msg: '不在此房间!'});
    }
    try {
        room.handlerPeng(uid);
        next(null, {code: 200, msg: '碰'});
    } catch (ex) {
        console.error(ex,'=======>>>>');
        next(null, {code: 500, msg: ex});
    }
};

handler.getRoomMessage = function(msg, session, next){
    let roomNo = msg.roomNo;
    if (!roomNo || msg.mahjong) {
        return next(null, {code: 500, msg: '参数错误!'});
    }
    let room = roomManager.getRoomByRoomNo(roomNo);
    if(!room){
        return next(null, {code: 500, msg: '房间不存在!'});
    }
    let uid = session.uid;
    if(!room.getUserByUid(uid)){
        return next(null, {code: 400, msg: '不在此房间!'});
    }
    try {
        let data=room.getRoomMessage(uid);
        next(null, {code: 200, msg: '获取房间信息',data:data});
    } catch (ex) {
        next(null, {code: 500, msg: ex});
    }
};

handler.handlerHu = async function(msg, session, next){
    let roomNo = msg.roomNo;
    if (!roomNo) {
        return next(null, {code: 500, msg: '参数错误!'});
    }
    let room = roomManager.getRoomByRoomNo(roomNo);
    if(!room){
        return next(null, {code: 500, msg: '房间不存在!'});
    }
    let uid = session.uid;
    if(!room.getUserByUid(uid)){
        return next(null, {code: 400, msg: '不在此房间!'});
    }
    try {
        await room.handlerHu(uid);
        next(null, {code: 200, msg: '获取房间信息'});
    } catch (ex) {
        console.error(ex,'========>>>>');
        next(null, {code: 500, msg: ex});
    }
};

handler.dissolveRoom = async function(msg, session, next){
    let roomNo = msg.roomNo;
    if (!roomNo || msg.mahjong) {
        return next(null, {code: 500, msg: '参数错误!'});
    }
    let room = roomManager.getRoomByRoomNo(roomNo);
    if(!room){
        return next(null, {code: 500, msg: '房间不存在!'});
    }
    let uid = session.uid;
    console.log(uid,'=======>>>>dissolveRoom',room.ownerUid,room);
    if(!room.getUserByUid(uid) && room.ownerUid != uid){
        return next(null, {code: 400, msg: '不在此房间!'});
    }
    try {
        room.dissolveRoom(uid);
        next(null, {code: 200, msg: '获取房间信息'});
    } catch (ex) {
        next(null, {code: 500, msg: ex});
    }
};

handler.userReady = async function(msg, session, next){
    try {
        let uid = session.uid;
        let roomNo = msg.roomNo;
        if (!roomNo) {
            return next(null, {code: 500, msg: '参数错误!'});
        }
        let room = await roomManager.getRoomByRoomNo(roomNo);
        if(!room){
            return next(null, {code: 500, msg: '房间不存在!'});
        }
        if(!room.getUserByUid(uid)){
            return next(null, {code: 400, msg: '不在此房间!'});
        }
        room.userReady(uid);
        next(null, {code: 200, msg: '', data: {}});
    } catch (ex) {
        next(null, {code: 500, msg: '已经准备'});
    }
};

handler.initiateDissolveRoom = async function(msg, session, next){
    try {
        let uid = session.uid;
        let roomNo = msg.roomNo;
        if (!roomNo) {
            return next(null, {code: 500, msg: '参数错误!'});
        }
        let room = await roomManager.getRoomByRoomNo(roomNo);
        if(!room){
            return next(null, {code: 500, msg: '房间不存在!'});
        }
        if(!room.getUserByUid(uid) && room.ownerUid != uid ){
            return next(null, {code: 400, msg: '不在此房间!'});
        }
        if(!room.getUserByUid(uid) && room.ownerUid == uid && room.status > 1){
            return next(null, {code: 400, msg: '房间已经开始!'});
        }
        await room.initiateDissolveRoom(uid );
        next(null, {code: 200, msg: '发起解散', data: {}});
    } catch (ex) {
        next(null, {code: 200, msg: ex.message});
    }
};

handler.agreeDissolveRoom = async function(msg, session, next){
    try {
        let uid = session.uid;
        let roomNo = msg.roomNo;
        if (!roomNo) {
            return next(null, {code: 500, msg: '参数错误!'});
        }
        let room = await roomManager.getRoomByRoomNo(roomNo);
        if(!room){
            return next(null, {code: 500, msg: '房间不存在!'});
        }
        if(!room.getUserByUid(uid)){
            return next(null, {code: 400, msg: '不在此房间!'});
        }
        await room.handlerDissolveRoom(uid);
        next(null, {code: 200, msg: '同意解散', data: {}});
    } catch (ex) {
        next(null, {code: 500, msg: ex});
    }
};

handler.cannelDissolveRoom = async function(msg, session, next){
    try {
        let uid = session.uid;
        let roomNo = msg.roomNo;
        if (!roomNo) {
            return next(null, {code: 500, msg: '参数错误!'});
        }
        let room = await roomManager.getRoomByRoomNo(roomNo);
        if(!room){
            return next(null, {code: 500, msg: '房间不存在!'});
        }
        if(!room.getUserByUid(uid)){
            return next(null, {code: 400, msg: '不在此房间!'});
        }
        await room.cannelDissolveRoom(uid);
        next(null, {code: 200, msg: '取消解散', data: {}});
    } catch (ex) {
        next(null, {code: 500, msg: ex});
    }
};

handler.voiceToRoom = async function(msg, session, next){
    try {
        let uid = session.uid;
        let roomNo = msg.roomNo;
        let voiceId = msg.voiceId;
        if (!roomNo || !voiceId) {
            return next(null, {code: 500, msg: '参数错误!'});
        }
        let room = await roomManager.getRoomByRoomNo(roomNo);
        if(!room){
            return next(null, {code: 500, msg: '房间不存在!'});
        }
        if(!room.getUserByUid(uid)){
            return next(null, {code: 400, msg: '不在此房间!'});
        }
        room.voiceToRoom(uid,voiceId);
        next(null, {code: 200, msg: '进入房间', data: {}});
    } catch (ex) {
        next(null, {code: 500, msg: ex});
    }
};

handler.sendMessage = async function(msg, session, next){
    try {
        let uid = session.uid;
        let roomNo = msg.roomNo;
        let message = msg.message;
        if (!roomNo || !message) {
            return next(null, {code: 500, msg: '参数错误!'});
        }
        let room = await roomManager.getRoomByRoomNo(roomNo);
        if(!room){
            return next(null, {code: 500, msg: '房间不存在!'});
        }
        if(!room.getUserByUid(uid)){
            return next(null, {code: 400, msg: '不在此房间!'});
        }
        room.sendMessage(uid,message);
        next(null, {code: 200, msg: '进入房间', data: {}});
    } catch (ex) {
        next(null, {code: 500, msg: ex});
    }
};

handler.getGameResultList = async function(msg, session, next){
    try {
        let uid = session.uid;
        let results = await roomManager.getGameResultList(uid);
        next(null, {code: 200, data : {result : results, uid : uid}});
    }catch(ex){
        next(null, {code: 500, msg: '查询失败'});
    }
};