/**
 * Created by Mrli on 17/3/7.
 */

const roomModel = require('mongoose').models['Room'];
const gameUserModel = require('mongoose').models['GameUser'];
const roomCardRecordModel = require('mongoose').models['RoomCardRecord'];
const gameResult = require('mongoose').models['GameResult'];
const gameRecord = require('mongoose').models['GameRecord'];
const recordModel = require('mongoose').models['Record'];
const shareRecordModel = require('mongoose').models['ShareRecord'];
const serverId = 'room-server-10';
const uuid = require('../../../util/uuid.js');
const xfyunModel = require('../../../xfyun/xfyunModel.js');

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
    let myRoom = [];
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
                let roundCount = rooms[i].data.configure.roundCount ;
                let cardNum = roundCount == 8 ? 1 : 2;
                await this.returnRoomCard(rooms[i].createUserId , rooms[i]._id,cardNum);
            }
            continue;
        }
        if(result == 0 && rooms[i].status > 1){
            if(rooms[i].status < 3){
                let roundCount = rooms[i].data.configure.roundCount ;
                let cardNum = roundCount == 8 ? 1 : 2;
                await this.returnRoomCard(rooms[i].createUserId , rooms[i]._id,cardNum);
            }else{
                await roomModel.update({_id : rooms[i]._id},{status : 5});
            }
            continue;
        }

        let temp = rooms[i].createTime.getTime() + 10 * 60 * 1000 ;
        rooms[i].userCount = result || 0;
        rooms[i].timeRemaining = (rooms[i].createTime.getTime() + 10 * 60 * 1000 ) - Date.now();
        if(rooms[i].timeRemaining > 0){
            myRoom.push(rooms[i]);
        }
    }
    return myRoom;
};

/**
 * 30秒 清楚过期房间
 */
RoomManager.prototype.clearRoom = function(){
    const outTime = 30 * 60 * 1000;
    const outTime2 = 120 * 60 * 1000;
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


                    //if(room.status < 3){
                    //    let cardNum = room.roundCount == 8 ? 1 : 2;
                    //    await self.returnRoomCard(ownerId,room.roomId,cardNum);
                    //}

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


RoomManager.prototype.returnRoomCard = async function(uid,roomId,cardNum){
    try{
        let result = await new Promise(function (resolve, reject) {
            global.app.rpc.room.room.backRoomCard(serverId,uid,roomId,cardNum,function(err,info){
                if(!err ){
                    resolve(info);
                }else if(err){
                    reject(new Error(err));
                }
            });
        })
    }catch(e){
        console.error('退回房卡失败',e.stack,e);
    }
};

RoomManager.prototype.destroyRoom = async function(roomNo){
    let  room = this.getRoomByRoomNo(roomNo);
    if(room){
        await xfyunModel.removeGroup(room.gid,room.ownerUid);
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
    let results = await gameResult.find(obj).sort({'result.createTime' : -1}).limit(10);
    console.error(obj,'=====>>>>',results);
    let arr = [];
    for(let i = 0; i < results.length;i ++){
        results[i].result._id = results[i]._id;
        arr.push(results[i].result);
    }
    console.error(obj,'=====>>>>',results,arr);
    return arr;
};

RoomManager.prototype.getGameRecordList = async function(resultId){
    let results = await gameRecord.find({gameResultId : resultId} ,{scores : 1});
    return results;
};

RoomManager.prototype.getGameRecord = async function(recordId,round){
    let now = Date.now();
    let result = await recordModel.findOne({ gameRecordId :recordId,round : round});
    return result;
};

RoomManager.prototype.getRecordCode = async function(uid,recordId,round,max){
    max = max || 0;
    let code = uuid.generate(6, 10);
    let reuslt = await shareRecordModel.findOne({code : code});
    if(max > 10){
        return null;
    }
    if(reuslt){
        max += 1;
        this.getRecordCode(uid,recordId,round,max);
    }
    let result = await recordModel.findOne({ gameRecordId :recordId,round : round});
    result = Object.assign({},result);
    result = result._doc;
    delete result._id;
    result.code = code;
    result.shareUid = uid;
    await shareRecordModel.create(result);
    return code;
};

RoomManager.prototype.getGameRecordByCode = async function(code){
    let result = await shareRecordModel.findOne({ code :code});
    return result;
};


module.exports = new RoomManager();