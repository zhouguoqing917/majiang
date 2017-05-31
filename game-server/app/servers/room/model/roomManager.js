/**
 * Created by Mrli on 17/3/7.
 */

//todo 加入定时器 清理过期房间
const roomModel = require('mongoose').models['Room'];
const gameUserModel = require('mongoose').models['GameUser'];
const roomCardRecordModel = require('mongoose').models['RoomCardRecord'];
const gameResult = require('mongoose').models['GameResult'];

let mailModel = require('../../../util/mail.js');
let RoomManager = function(){
    this.ownerRoom = {}; //玩家
    this.allRoom = {};
    this.myEntryRoom = {};
    this.clearRoom();
};

RoomManager.prototype.addRoom = function(room){
    this.ownerRoom[room.ownerUid] = this.ownerRoom[room.ownerUid] || [];
    this.ownerRoom[room.ownerUid].push(room);//以玩家为key room 为value
    this.allRoom[room.roomNo] = room;
};

RoomManager.prototype.getRoomByRoomNo = function(roomNo){
    return this.allRoom[roomNo];
};

RoomManager.prototype.getMyRooms = function(uid){
    let rooms = this.ownerRoom[uid] || [];
    let roomArr = [];
    for(let i = 0 ; i < rooms.length; i ++){
        let obj = {};
        for(let key in rooms[i]){
            if(key != 'roomChannel'){
                if(key == 'users' ){
                    obj['userCount'] = rooms[i][key].length;
                }else{
                    obj[key] = rooms[i][key];
                }
            }
        }
        roomArr.push(obj);
    }
    return roomArr;
};

RoomManager.prototype.getRoomsData = function(uid){
    let roomsData = [];
    for(let i = 0; i <  this.ownerRoom[uid].length; i++){
        roomsData.push(this.ownerRoom[uid].getData);
    }
    return roomsData;
};

/**
 * 获取我的房间数量
 */
RoomManager.prototype.getMyRoomsCount = async function(){
    return await this.getRoomsForDatabase().length;
};

RoomManager.prototype.getRoomsForDatabase = async function(uid){
    let now = Date.now();
    let date = new Date(now - 10 * 60 * 1000);
    let rooms = await roomModel.find({createUserId : uid ,status : { $lte : 3}/* , $or : [{createTime : {$gte : date}} , {status : { $gt : 1}}]*/ }) || [];
    for(let i = 0; i < rooms.length;i++){
        let result = await new Promise(function (resolve, reject) {
            global.app.rpc.room.room.getRoomUserCount(rooms[i].roomNo,rooms[i].roomNo,function(err, data){
                if(err){
                    reject(err);
                }else{
                    resolve(data.userCount)
                }
            });
        });

        if(Date.now() - rooms[i].createTime >= 40 * 60 * 1000){
            await roomModel.update({_id : rooms[i]._id},{status : 5});
            if(rooms[i].status < 3){
                await this.returnRoomCard(rooms[i].createUserId , rooms[i]._id);
            }
            continue;
        }
        let temp = rooms[i].createTime.getTime() + 10 * 60 * 1000 ;
        rooms[i].userCount = result || 0;
        rooms[i].timeRemaining = (rooms[i].createTime.getTime() + 10 * 60 * 1000 ) - Date.now();
    }
    return rooms;
};

/**
 * 30秒 清楚过期房间
 */
RoomManager.prototype.clearRoom = function(){
    const outTime = 30 * 60 * 1000;
    const outTime2 = 40 * 60 * 1000;
    let self = this;
    setInterval(async function(){
        try {
            let now = Date.now();
            for(let key in self.allRoom){
                let room = self.allRoom[key];
                //超过10分钟 或者 房间状态为3的
                console.log('============>>>>111clear Room : ' +  room.roomNo  + ' 时间 : ' + now + " 创建时间 :" + room.createTime + ' 房间状态 : ' + room.status);
                if((now - room.createTime >= outTime && room.status <= 1) || (now - room.createTime >= outTime2)){
                    if(now - room.createTime < outTime2){
                        console.error('============>>>>111clear Room : ' +  room.roomNo  + ' 时间 : ' + now + " 创建时间 :" + room.createTime + ' 房间状态 : ' + room.status);
                    }
                    await roomModel.update({_id : room.roomId},{status : 5});
                    delete self.allRoom[key];
                    await room.roomChannel.sendMsgToRoom('onRoomDissolve',{code : 200 , allResult : room.allResult});
                    room.roomChannel.destroy();
                    let ownerId = room.ownerUid;
                    await room.addGameResult();
                    let rooms = self.ownerRoom[ownerId] || [];
                    for(let i = 0 ; i < rooms.length; i ++){
                        if(rooms[i].roomNo == key){
                            rooms.splice(i,1);
                            break;
                        }
                    }

                    if(room.status < 3){
                        await self.returnRoomCard(ownerId,room.roomId);
                    }

                    console.log('============>>>>222clear Room : ' +  room.roomNo  + ' 时间 : ' + now + " 创建时间 :" + room.createTime + ' 房间状态 : ' + room.status);
                    let bss = global.app.get('backendSessionService');
                    for(let j = 0;j < room.users.length;j++){
                        let user = room.users[j];
                        try{
                            let session =  await new Promise(function (resolve, reject) {
                                bss.getByUid(user.sid,user.uid,function(err,bsession){
                                    if(!err && bsession && bsession.length){
                                        resolve(bsession[0]);
                                    }else if(err){
                                        console.log('===========>>>getByUid',err);
                                        reject(new Error(err));
                                    }else{
                                        resolve(null);
                                    }
                                });
                            });
                            if(session){
                                session.set('roomNo',null);
                                await session.pushAll();
                            }
                        }catch(e){
                            console.log(e);
                        }
                    }

                    console.log('============>>>>444clear Room : ' +  room.roomNo  + ' 时间 : ' + now + " 创建时间 :" + room.createTime + ' 房间状态 : ' + room.status);
                    let roomNo = room.roomNo;
                    room = null;
                    delete self.myEntryRoom[ownerId] ;
                    delete self.allRoom[key];
                    console.log('============>>>>clear Room success: ' + roomNo );
                }
            }
        }catch (e){
            console.error(e.stack);
            mailModel.sendMail('============>>>>clear Room error: ' + e.stack);
        }
    },40000)
};

RoomManager.prototype.returnRoomCard = async function(uid,roomId){
    let user = await gameUserModel.findOne({_id : uid});
    let roomCardRecord = await roomCardRecordModel.findOne({roomId : roomId});
    if(!roomCardRecord){
        return;
    }
    let curNumber = roomCardRecord.curNumber;
    let preRoomCard = user.roomCard;
    if(curNumber < 0){
        curNumber = Math.abs(curNumber);
        user.roomCard += curNumber;
        //给用户加卡
        await gameUserModel.update({_id : uid } ,{roomCard : user.roomCard });
        //修改房间状态
        await roomModel.update({_id :roomId},{status : 5});
        //写入房卡消耗记录

        await roomCardRecordModel.create({
            aboutUserId: user._id,
            modifyType: 'system',
            preNumber: preRoomCard,
            curNumber: curNumber,
            afterNumber: user.roomCard,
            description: `房间超时`,
            userCount : 0
        });
    }
};

RoomManager.prototype.destroyRoom = async function(roomNo){
    let  room = this.getRoomByRoomNo(roomNo);
    if(room){
        for(let i = 0 ; i < room.users.length; i ++){
            let user = room.users[i];
            let bss = global.app.get('backendSessionService');
            let bsession = await new Promise(function (resolve, reject) {
                bss.getByUid(user.sid,user.uid,function(err,bs){
                    if(!err && bs && bs.length){
                        resolve(bs[0])
                    }else if(err){
                        reject(err);
                    }else{
                        resolve(null)
                    }
                });
            });
            if(bsession ){
                bsession.set('roomNo',null);
                await bsession.pushAll();
            }
        }
        room.roomChannel.destroy();
        let ownerId = room.ownerUid;
        delete this.allRoom[roomNo];
        let rooms = this.ownerRoom[ownerId] || [];
        for(let i = 0 ; i < rooms.length; i ++){
            if(rooms[i].roomNo == roomNo){
                rooms.splice(i,1);
                break;
            }
        }
    }
};

RoomManager.prototype.getGameResultList = async function(uid){
    let now = Date.now();
    let key = 'result.' + uid;
    let obj = {};
    obj[key] = {$ne:null};
    let results = await gameResult.find(obj ,{result : 1}).sort({'result.createTime' : -1}).limit(10);
    return results;
};

module.exports = new RoomManager();