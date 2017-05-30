
/**
 * 房间业务逻辑
 */
const gameUserModel = require('mongoose').models['GameUser'];
const roomModel = require('mongoose').models['Room'];
const roomCardRecordModel = require('mongoose').models['RoomCardRecord'];
const gameResult = require('mongoose').models['GameResult'];
const RoomChannel = require('./roomChannel.js');
const roomManager = require('./roomManager.js');
const uuid = require('../../../util/uuid.js');
const User = require('./user.js');
const Mahjong = require('./mahjong.js');
let mailModel = require('../../../util/mail.js');
let GameRecord = require('./gameRecord.js');

var Check = require('./check.js');
let Room = function (app) {
    this.sid = app.getServerId();
    this.ownerUid ; //创建者uid
    this.createTime; //创建时间
    this.status = 0;//房间状态 1,已经创建未开始 2,进行中 3,第一局已经结束 4, 全部结束 , 5,以退卡
    this.users = [];
    this.roomChannel ;
    this.roomId ;//数据库中的id
    this.mahjong;
    this.roomNo ;
    this.dice;

    this.roomType = 1;
    this.roundCount = 8;
    this.round = 0; //现在第几局
    this.currPlayUid ;//现在出牌的 玩家id
    this.currUserInaugurated ; //现在玩家接到的牌
    this.previousOut = null;//上一次打出的牌
    this.userHu = false; //如果有玩家可以胡牌 此房间 就不能接受 出牌 碰 杠 等接口访问
    this.agreeDissolve = [];//解散房间人数
    this.cannelDissove = [];//取消解散人数
    this.handlerDissolveUser = []; //已经做过解散操作的玩家
    this.dissUid = 0;
    this.result = {}; //用来存储每一局的结果
    this.allResult = {};
    this.unGang = [];
    this.record = {};
    this.next = {};
    this.check;
    this.dissCreateTime ;
    this.isLice = false;
    this.gameRecord ;
    this.maxHuCount;//最大胡牌翻数
    this.roomType ;//1,房主 2, 代开 ,3 AA
    this.huCount;//需要多少番起胡
    this.laizi ; //癞子
    this.laizipi ; //癞子皮
};
roomPro = Room.prototype;

roomPro.createRoom = async function (session, roomData) {
    let uid = session.uid;
    this.ownerUid = uid;

    //判断房卡数量是否可以扣除，如果可以，直接扣除
    const gameuser = await gameUserModel.findOne({_id: uid});
    roomData.roundCount = roomData.roundCount || 8;
    let useCardNumber = roomData.roundCount === 8 ? 4 : 8;
    this.roomType = roomData.roomType || 1;
    this.huCount = roomData.huCount || 0;
    this.maxHuCount = roomData.maxHuCount || 300;
    if(this.roomType == 3){
        useCardNumber = useCardNumber / 4 ;
    }
    if (gameuser.roomCard < useCardNumber)
        throw '房卡不足';

    if(this.roomType == 2){
        const rooms = await roomManager.getRoomsForDatabase(uid);
        let myRoomCount = rooms ? rooms.length : 0;
        if(myRoomCount >= 3){ //创建房间上限
            throw '创建房间已经达到上限';
        }
        //代开模式马上扣卡
        gameuser.roomCard -= useCardNumber;
        await gameUserModel.update({_id : uid}, {$set: gameuser});
    }

    const roomObject = {
        createUserId:'',
        roomType:this.roomType,
        serverId:app.curServer.id,
        data:{},
        roomNo:0,
        status:0
    };

    let roomNo = this.getRoomNo();//roomNo

    this.roomChannel = new RoomChannel(roomNo);
    this.roomNo = roomNo;
    this.createTime = Date.now();
    this.status = 1;

    roomObject.roomNo = roomNo;
    roomObject.createUserId = uid;
    roomObject.status = 1;
    roomObject.data = {
        configure: roomData
    };

    const room = await roomModel.create(roomObject);
    roomManager.addRoom(this);
    this.roomId = room._id;
    this.roundCount = roomData.roundCount;
    // this.roundCount = 2;

    //初始化麻将
    this.mahjong = new Mahjong();

    //游戏记录
    this.gameRecord = new GameRecord(roomNo);
    if(this.roomType != 2){
        return this.entryRoom(roomNo,session);
    }else{
        return {roomNo};
    }

};

/**
 * 进入房间
 * @param roomNo
 * @param session
 * @returns {Promise.<void>}
 */
roomPro.entryRoom = async function(roomNo,session){
    let uid = session.uid;
    let room = roomManager.getRoomByRoomNo(roomNo);
    const gameuser = await gameUserModel.findOne({_id: uid});
    //进入AA房间需要判断房卡
    let useCardNumber = this.roundCount === 8 ? 4 : 8;
    useCardNumber = useCardNumber / 4;
    if(this.roomType == 3 && gameuser.roomCard < useCardNumber){
        throw '房卡不足';
    }

    //判断房间状态 当我进入的房间没有且房间状态为没有开始的  or  当有我进入的房间且房间状态为已经进行的时候可以进入(断线重连)
    if(session.get('roomNo') && session.get('roomNo') != roomNo){
        throw '已经有进入的房间';
    }

    //代开房 不能进入自己的房间
    if(this.roomType == 2 && this.createUserId == uid){
        throw '不能进入自己的代开房间';
    }
    //是否已经在房间内
    let isInRoom = false;
    for(let i = 0; i < room.users.length;i++){
        if(this.users[i].uid == uid){
            isInRoom = true;
            break;
        }
    }

    //判断房间人数
    if(room.users.length >= 4 ){
        if(!isInRoom){
            throw '房间人数已满';
        }
    }

    //创建玩家对象
    let user;
    let route = 'onUserEntry';
    if(!isInRoom){
        user = new User(session);
        this.users.push(user);
        this.sendToRoomOwner();
    }else{
        route = 'onUserLine';
        user = this.getUserByUid(uid);
        user.sid = session.get('sid');
    }

    this.roomChannel.addUserToChannel(user);

    if(this.status  >= 2 ){
        user.status = 1;
    }

    if(user.mahjong.length || this.isLice){
        user.status = 2;
    }

    //将进入房间的玩家push 给房间内的人
    let uArr = this.getExceptUids(session.uid);
    if(route == 'onUserLine'){
        this.roomChannel.sendMsgToRoomExceptUid(route,{code : 200 ,data : {uid : session.uid}},uArr);
    }else{
        this.roomChannel.sendMsgToRoomExceptUid(route,{code : 200 ,data : this.getRoomUserInfoByUid(session.uid)},uArr);
    }

    await roomModel.update({_id : this.roomId}, {userCount: this.users.length , status : this.status});
    await gameUserModel.update({_id : user.uid}, {currRoomNo : roomNo ,roomId : this.roomId});
    session.set('roomNo',roomNo);
    await session.pushAll();
    return this.getRoomMessage(uid);
};

roomPro.deductRoomCard = async function(){
    let useCardNumber = this.roundCount === 8 ? 4 : 8;
    if(this.roomType == 1){//房主开房
        let uid = this.ownerUid ;
        let gameUser = gameUserModel.findOne({_id : uid});
        gameUser.roomCard -= useCardNumber;
        await gameUserModel.update({_id : uid}, {$set: gameUser});
        //写入房卡消耗记录
        await roomCardRecordModel.create({
            aboutUserId: gameUser._id,
            modifyType: 'system',
            roomId : this.roomId,
            preNumber: gameUser.roomCard + useCardNumber,
            curNumber: -useCardNumber,
            afterNumber: gameUser.roomCard,
            description: `用户开房消耗`,
            userCount : 0
        });
    }
    if(this.roomType == 3){ //AA开放
        useCardNumber = useCardNumber / 4;
        for(var i = 0; i < this.users.length; i ++){
            var uid = this.users[i];
            let gameUser = gameUserModel.findOne({_id : uid});
            gameUser.roomCard -= useCardNumber;
            await gameUserModel.update({_id : uid}, {$set: gameUser});
            //写入房卡消耗记录
            await roomCardRecordModel.create({
                aboutUserId: gameUser._id,
                modifyType: 'system',
                roomId : this.roomId,
                preNumber: gameUser.roomCard + useCardNumber,
                curNumber: -useCardNumber,
                afterNumber: gameUser.roomCard,
                description: `用户AA开房消耗`,
                roomType : this.roomType,
                userCount : 0
            });
        }
    }
};

/**
 * 获取房间号
 * @returns {string}
 */
roomPro.getRoomNo = function () {
    let sNo = this.sid.substr(this.sid.lastIndexOf('-') + 1);
    let roomNo = sNo + uuid.generate(4, 10);
    let room = roomManager.getRoomByRoomNo(roomNo);
    if(room){
        return this.getRoomNo();
    }
    return roomNo;
};

roomPro.getData = function(){
    let data = {};
    for(let key in this){
        if(typeof this[key]  != 'function'){
            data[key] = this[key];
        }
    }
    return data;
};



roomPro.sendToRoomOwner = async function(){
    var connectors = global.app.getServersByType('connector');
    var bss = global.app.get('backendSessionService');
    var ownerId = this.ownerUid;
    var session = null;
    var self = this;
    for(var i = 0 ; i < connectors.length; i ++){
        let bsession = await new Promise(function (resolve, reject) {
            bss.getByUid(connectors[i].id,ownerId,function(err,bs){
                if(!err && bs && bs.length){
                    self.roomChannel.sendMsgByUids('onMemberAmount',{code : 200 , data : { roomNo : self.roomNo, amount : self.users.length }},[{uid : ownerId,sid : connectors[i].id}]);
                    resolve(bs[0]);
                }else if(err){
                    reject(err);
                }else{
                    resolve(null);
                }
            });

        });
    }
};

roomPro.changeUserStatus = function(status ){
    for(let i = 0 ; i < this.users.length;i++){
        this.users[i].status = status;
    }
};

roomPro.getRoomMessage = function(uid,isAll){
    let obj = {
        roomNo : this.roomNo ,
        roundCount : this.roundCount ,
        round : this.round , //现在第几局
        currPlayUid : this.currPlayUid ,//现在出牌的 玩家id
        currUserInaugurated : this.currUserInaugurated , //现在玩家接到的牌
        previousOut : this.previousOut ,//上一次打出的牌
        userHu : this.userHu, //如果有玩家可以胡牌 此房间 就不能接受 出牌 碰 杠 等接口访问
        users : this.getRoomUserInfo(uid,isAll),
        dice : this.dice ,//骰子
        status : this.status,
        banker : this.banker,
        mahjongCount : this.mahjong.getPaiCount(),
        cannelDissove : this.cannelDissove,
        agreeDissolve : this.agreeDissolve,
        dissUid : this.dissUid,
        dissCreateTime : this.dissCreateTime,
        roomType : this.roomType,
        huCount : this.huCount,
        maxHuCount : this.maxHuCount,
        laizi : this.laizi,
        laizi : this.laizipi
    };
    return obj;
};



/**
 * 游戏开始时 判断谁是庄
 * @returns {*}
 */
roomPro.whoIsBanker = function(){
    let user = this.getUserByUid(this.ownerUid);
    let uid  ;
    if(user){
        user.isBanker = true;
        uid = user.uid;
    }else{
        this.users[0].isBanker = true;
        uid = this.users[0].uid;
    }
    return  uid;
}
/**
 * 获取房间列表
 *
 */
roomPro.getRoomUserInfo = function(uid,isAll){
    let userArr = [] ;
    for(let i = 0; i < this.users.length; i++){
        let user = this.users[i];
        let obj = {
            ipaddress : user.ipaddress,
            nickname : user.nickname,
            headimgurl : user.headimgurl,
            sex : user.sex,
            score : user.score ,
            mahjong : [],
            peng :  user.peng,
            gang : user.gang,
            status : user.status,
            uid : user.uid,
            playOutMahjong : user.playOutMahjong,
            id : user.id,
            latitude : user.latitude,
            longitude : user.longitude
        };
        if(this.users[i].uid == uid || isAll){
            obj.mahjong = user.mahjong;
        }else{
            obj.mahjong = [];
            for(let i = 0 ; i < user.mahjong.length ; i ++){
                obj.mahjong.push(-1);
            }
        }
        userArr.push(obj);
    }
    return userArr;
};

/**
 * 获取制定用户信息
 */
roomPro.getRoomUserInfoByUid = function(uid){
    let userInfo ;
    for(let i = 0; i < this.users.length; i++){
        let user = this.users[i];
        if(user.uid == uid){
            userInfo = {
                ipaddress : user.ipaddress,
                nickname : user.nickname,
                headimgurl : user.headimgurl,
                sex : user.sex,
                score : user.score,
                uid : user.uid,
                status : user.status,
                latitude : user.latitude,
                longitude : user.longitude
            };
        }
    }
    return userInfo;
};


/**
 * 根据id 获取User
 */
roomPro.getUserByUid = function(uid){
    for(let i = 0; i < this.users.length;i++){
        if(this.users[i].uid == uid){
            return this.users[i];
        }
    }
};


roomPro.userIsInRoom = function(uid){
    if(this.getUserByUid(uid)){
        return true;
    }
    return false;
};

/**
 * 发牌给每个玩家
 * @type {Room}
 */
roomPro.licensing = async function(){
    let arr = [
        [11,11,2,12,13,13,14,14,6,9,26,29,99,99],
        [11,21,13,14,15,1,29,18,19,18,6,9,19],
        [12,21,21,22,9,23,24,24,25,25,4,5,14],
        [1,1,1,1,2,2,3,8,3,4,4,4,24],
    ];
    for(let i = 0; i < this.users.length;i++){
        let count = 13;
        if(this.users[i].isBanker){
            this.currPlayUid = this.users[i].uid;
            count = 14;
        }

         //let mahjongs = [];
         //for(let j = 0; j < arr[i].length ; j++){
         //    console.log(arr[i][j],'=====>>>>arr[sss]');
         //    mahjongs.push(arr[i][j]);
         //    this.mahjong.getPaiByNum(arr[i][j]);
         //}

        let mahjongs = this.mahjong.getMahjongByCount(count);
        this.users[i].mahjong = this.users[i].mahjong.concat(mahjongs);
        if(count == 14){
            //let pai = this.mahjong.next();
            //mahjongs.push(pai);
            //this.users[i].mahjong = [4,5,6,14,14,24,99,25,5,5,21,21,22,5]
            this.currUserInaugurated = mahjongs[this.users[i].mahjong.length - 1];
        }
        try{
            this.gameRecord.addRecord(this.round,1,this.users[i]);
        }catch(e){
            console.error(e,'=========>>>>licensing');
        }

    }
};


/**
 * 确定癞子
 */

roomPro.confirmLaizi = function(){
    let banker = this.banker;
    let users = this.users;
    let tempArr = [];
    for(let i = 0; i < users.length; i++){
        if(users[i].uid != banker){
            tempArr.push(users[i])
        }
    }
    let random = parseInt(Math.random() * tempArr.length);
    let user = tempArr[random];
    let uid = user.uid;
    let mahjong = this.mahjong.next();
    user.playOutMahjong.push(mahjong);

    let laizi = mahjong + 1;

    if(laizi % 10 == 0){
        laizi = parseInt(laizi / 10) * 10 + 1;
    }

    if(mahjong == 35){
        laizi = 31;
    }

    if(mahjong == 41 || mahjong == 42){
        laizi = 35;
    }

    this.laizi = laizi;
    this.laizipi = {};
    this.laizipi[uid] = mahjong;
};

/**
 * 销毁房间
 */
roomPro.destoryRoom = function(){
    let ownerId = this.ownerUid;
    let rooms = this.ownerRoom[ownerId] || [];
    for(let i = 0 ; i < rooms.length; i ++){
        if(rooms[i].roomNo == key){
            rooms.splice(i,1);
            break;
        }
    }
    delete this.myEntryRoom[ownerId] ;
    delete this.allRoom[key];
};


/**
 * 离开房间
 */
roomPro.leaveRoom = async function(uid,isOffLine){
    for(let i = 0 ; i < this.users.length; i ++){
        if(this.users[i].uid == uid){
            //if(this.status == 1){
            this.roomChannel.leaveChannel(this.users[i]);
            //如果
            if(isOffLine){
                this.users[i].status = 3;
                this.roomChannel.sendMsgToRoom('onUserOffLine',{code : 200 , data : {uid : uid}});
            }else{
                this.users.splice(i,1);
                this.sendToRoomOwner();
                this.roomChannel.sendMsgToRoom('onUserLeave',{code : 200 , uid : uid});
                await gameUserModel.update({_id : uid}, {currRoomNo : null,roomId : null});
            }
            //}else{
            //    this.roomChannel.leaveChannel(this.users[i]);
            //    this.users[i].status = 3;
            //    await gameUserModel.update({_id : this.users[i].uid}, {currRoomNo : this.roomNo});
            //    this.roomChannel.sendMsgToRoom('onUserOffLine',{code : 200 , uid : uid});
            //}
        }
    }
};
/**
 * 出牌
 */
roomPro.playMahjong = async function(uid,pai){
    //判断玩家是否可以是出牌的玩家
    if(this.currPlayUid != uid){
        throw '不是可以出牌的玩家';
    }

    if(this.userHu){
        throw '有可以胡的玩家不能出牌';
    }

    let user = this.getUserByUid(uid);
    //判断玩家是否拥有此张牌
    if(user.mahjong.indexOf(pai) == -1){
        throw '玩家没有此张牌';
    }

    if(user.mahjong.length % 3 != 2){
        throw '不是可以出牌的玩家';
    }
    user.playAMahjong(pai);
    user.playOutMahjong.push(pai);
    this.previousOut = {};

    //记录上一次谁出了什么牌
    this.previousOut[uid] = pai;

    //广播
    this.roomChannel.sendMsgToRoom('onPlayMahjong' , {code : 200, data : {uid : uid, mahjong : pai}});
    this.gameRecord.addRecord(this.round,2,user,pai);
    this.isLicensing(uid,pai);
};

roomPro.isLicensing = function(uid,pai){
    let isCanLicensing = true;
    let isPeng = this.isPeng;

    //判断出的这张牌 其它玩家是否可以碰 是否可以杠
    for(let i = 0 ; i < this.users.length; i++){
        let user = this.users[i];
        if(uid == user.uid){
            continue;
        }

        if(this.check.checkWaiGang(user,pai)){
            user.isAction = true;
            isCanLicensing = false;
        }

        if(this.check.checkPeng(user,pai) && isPeng){
            isCanLicensing = false;
            user.isAction = true;
        }

        let keys = Object.keys(this.previousOut);
        let preUid =  keys[0];
        //上个玩家的牌是否是杠
        let preUser = this.getUserByUid(preUid);
        let preIsGang = false;
        for(let i = 0 ; i < preUser.gang.length; i ++){
            if(preUser.gang[i].pai[0] == pai){
                preIsGang = true;
            }
        }

        if(preIsGang && this.check.checkHu(user,pai)){
            isCanLicensing = false;
            user.isAction = true;
            this.userHu = {};
            this.userHu[user.uid] = pai;
        }
    }

    if(this.userHu){
        return ;
    }
    if(this.isRoundOver()){

        let keys = Object.keys(this.previousOut);
        // this.roundInit();

        let preUid =  keys[0];
        this.banker = preUid;
        this.getUserByUid(preUid).isBanker = 1;
        return this.handlerHu(uid,true);
        // return this.roomChannel.sendMsgToRoom('onFlow',{code : 200});
    }
    //是否可以发牌给下一个玩家
    if(isCanLicensing && !this.isRoundOver()){
        let outUid = Object.keys(this.previousOut)[0];
        let user = this.getUserByUid(outUid);
        let nextUser = this.getNextUserByUid(outUid);

        this.currPlayUid = nextUser.uid;
        let uArr = this.getExceptUids(nextUser.uid);
        let mahjong ;
        if(this.next[nextUser.uid]){
            let nextMahjong = parseInt(this.next[nextUser.uid]);
            let index = this.mahjong.mahjong.indexOf(nextMahjong);
            if(this.mahjong.mahjong.indexOf(nextMahjong) != -1){
                this.mahjong.mahjong.splice(index,1);
                mahjong = nextMahjong;
            }
        }
        if(!mahjong){
            mahjong = this.mahjong.next();
        }

        this.previousOut = {};
        this.roomChannel.sendMsgToRoomExceptUid('onMahjong',{code : 200,data : {mahjong : -1 , uid : nextUser.uid}  },uArr);
        this.currUserInaugurated = mahjong;
        this.userPeng = false;

        nextUser.addMahjongToUser([mahjong]);
        this.roomChannel.sendMsgToMem('onMahjong',{code : 200,data : {mahjong : mahjong , uid : nextUser.uid}},nextUser);
        this.gameRecord.addRecord(this.round,3,nextUser,mahjong);
    }
};

roomPro.getExceptUids = function(uid){
    var arr = [];
    for(let i = 0 ; i < this.users.length ; i ++){
        if(this.users[i].uid != uid){
            arr.push({uid : this.users[i].uid , sid : this.users[i].sid});
        }
    }
    return arr;
};

/**
 * 黄庄 判断
 * @returns {boolean}
 */
roomPro.isRoundOver = function(){
    let count = 0;
    if(this.onlyOneBird){
        count = 1;
    }else if(this.birdNum){
        count = parseInt(this.birdNum);
        count += parseInt(this.addBird);
    }

    let paiCount = this.mahjong.getPaiCount();
    if(paiCount <= count){
        //黄庄 广播
        return true;
    }
};

/**
 * 根据当前玩家获取下一个玩家
 */
roomPro.getNextUserByUid = function(uid){
    for(let i = 0; i < this.users.length; i ++){
        if(this.users[i].uid == uid){
            let index = i + 1 > 3 ? 0 : i + 1;
            return this.users[index];
        }
    }
};

/**
 * 取消操作
 * @param uid  用户id
 */
roomPro.cannelAction = function(uid){
    let user = this.getUserByUid(uid);
    if(!user){
        throw '此用户不在此房间';
    }
    if(!this.previousOut || !Object.keys(this.previousOut).length){
        return;
    }
    let key = Object.keys(this.previousOut)[0];
    let pai = this.previousOut[key];
    if(this.check.checkGang(user,pai)){
        this.unGang.push(pai);
    }

    if(user.mahjong.length % 3 == 2 || !user.isAction){
        return;
    }
    user.isAction = false;
    this.gameRecord.addRecord(this.round,7,user);
    this.isLicensing(uid);
};

/**
 * 处理杠牌
 * @uid userId
 * 分为内杠和外杠
 */
roomPro.handlerGang = function(uid,pai){
    let user = this.getUserByUid(uid);
    //判断是否可以杠
    //内杠
    let mahjong ,gangObj;
    let beUid ;
    if(uid == this.currPlayUid){
        mahjong = pai;
        gangObj = this.check.checkGang(user,mahjong);
        beUid = uid;
        if(gangObj.type != 1 &&  gangObj.type != 2){
            throw '不能杠或者参数错误';
        }
    }else{
        //外杠
        let obj = this.previousOut || {};
        let keys = Object.keys(obj);
        let previousUid = keys[0];
        mahjong = obj[previousUid];
        if(mahjong){
            beUid = previousUid;
            gangObj = this.check.checkGang(user,mahjong);
            let preUser = this.getUserByUid(previousUid);
            preUser.clearOutMahjongByNum(mahjong);
        }
    }
    if(!Object || !Object.keys(gangObj).length){
        throw '不能杠或者参数错误';
    }
    user.addGangToUser(mahjong,beUid,gangObj.type);
    let  isCanLicensing = false;
    if(gangObj.type == 2){
        for(let i = 0 ; i < this.users.length; i++){
            let user = this.users[i];
            if(uid != user.uid && this.check.checkHu(user,mahjong)){
                this.userHu = {};
                this.userHu[user.uid] = mahjong;
                break;
            }
        }
    }
    this.userPeng = false;

    //推送杠广播
    this.roomChannel.sendMsgToRoom('onGang',{code : 200 ,data : { gangUid : uid , beGangUid : beUid,mahjong : mahjong,type : gangObj.type}});
    this.gameRecord.addRecord(this.round,5,user,mahjong);
    if(this.userHu){
        this.previousOut = {};
        this.previousOut[uid] = pai;
        return;
    }else { //给玩家一张牌
        if(this.isRoundOver()){
            //todo  房间内信息 初始化 当前玩家坐庄
            // this.roundInit();
            let preUid = Object.keys(this.previousOut)[0];
            this.banker = preUid;
            this.getUserByUid(preUid).isBanker = 1;
            return this.handlerHu(uid,true);
            // return this.roomChannel.sendMsgToMem('onFlow',{code : 200});
        }
        let mahjong = this.mahjong.next();
        this.currPlayUid = user.uid;
        let uArr = this.getExceptUids(user.uid);
        this.previousOut = {};
        this.roomChannel.sendMsgToRoomExceptUid('onMahjong',{code : 200,data : {mahjong : -1, uid : user.uid,isGang : true}},uArr);
        this.currUserInaugurated = mahjong;
        user.addMahjongToUser([mahjong]);
        this.roomChannel.sendMsgToMem('onMahjong',{code : 200,data : {mahjong : mahjong, uid : user.uid,isGang : true}},user);
        this.gameRecord.addRecord(this.round,3,user,mahjong);
    }
};

/**
 * 处理碰牌
 * @uid userId
 * 分为内杠和外杠
 */
roomPro.handlerPeng = function(uid){
    let isPeng = this.isPeng;
    if(!isPeng){
        return '此局不能碰'
    }
    let obj = this.previousOut;
    if(!obj){
        return '不能碰';
    }
    let keys = Object.keys(obj);
    let previousUid = keys[0];

    //如果自己是自己 则不能碰
    if(previousUid == uid){
        throw '自己不能碰自己的牌';
    }
    let mahjong = obj[previousUid];
    let user = this.getUserByUid(uid);
    let havePeng = this.check.checkPeng(user,mahjong);
    if(!havePeng){
        throw '非法碰牌 uid : ' + uid + ' pai : ' + mahjong;
    }
    this.userPeng = true;
    let preUser = this.getUserByUid(previousUid);
    preUser.clearOutMahjongByNum(mahjong);
    this.currPlayUid = uid;
    user.addPengToUser(mahjong,previousUid);
    this.gameRecord.addRecord(this.round,4,user,mahjong);
    //pengUid 碰牌玩家  bePengUid被碰牌玩家
    this.roomChannel.sendMsgToRoom('onPeng',{code : 200 ,data : {pengUid : uid , bePengUid : previousUid,mahjong : mahjong}})
};


/**
 * 胡牌
 * @param uid
 */
roomPro.handlerHu = async function(uid,isFlow){
    if(this.userPeng){
        throw '碰了之后不能胡';
    }

    //判断上一次出牌的玩家是不是自己
    let user = this.getUserByUid(uid);
    let pai , preUid,bridMahjongs = [], inBird,inBirdCount ,isZimo = true ;
    let huUidArr = [];
    let otherIsHu = false;
    let preBanker = this.banker;
    //算分 抓码 算杠 房间初始化(麻将 局数 玩家牌 庄家判定) 讲数据推送至客户端
    for(let i = 0 ; i < this.users.length;i++){
        this.result[this.users[i].uid] = this.result[this.users[i].uid] || {};
        this.result[this.users[i].uid]['mahjong'] = this.users[i].mahjong;
        this.result[this.users[i].uid]['gang'] = this.users[i].gang;
        this.result[this.users[i].uid]['peng'] = this.users[i].peng;
        this.result[this.users[i].uid]['score'] = this.users[i].score;
        this.result[this.users[i].uid]['nickname'] = this.users[i].nickname;
    }

    //如果可以胡牌 判断是自摸还是抢杠
    if(!isFlow){
        if(this.currPlayUid == uid ){ //自摸
            pai = this.currUserInaugurated;
        }else if(this.previousOut && Object.keys(this.previousOut)){
            let keys = Object.keys(this.previousOut);
            preUid =  keys[0];
            //上个玩家的牌是否是杠
            let user = this.getUserByUid(preUid);
            let preIsGang = false;
            pai = this.previousOut[preUid];
            for(let i = 0 ; i < user.gang.length; i ++){
                if(user.gang[i].pai[0] == pai && user.gang[i].type == 2){
                    preIsGang = true;
                    //移除杠
                    user.gang.splice(i,1);
                }
            }
            if(!preIsGang){
                throw '不能胡不是杠的牌';
            }
            isZimo = false;
            otherIsHu = true;
            pai = this.previousOut[preUid]
        }else{
            console.error('=========>>>>>>',user);
            throw '非法胡牌操作'
        }

        let count = 2;
        let haveHongzhong = false;
        if(this.check.checkHongZhong(user,pai)){
            haveHongzhong = true;
        }

        if(this.onlyOneBird){
            bridMahjongs = this.mahjong.getMahjongByCount(1);
            let num = this.mahjong.getPaiNum(bridMahjongs[0]);
            //let bridCount = 0;
            //bridCount = haveHongzhong ? this.addBird : 0;
            //bridMahjongs = this.mahjong.getMahjongByCount(bridCount);
            //inBird = this.isInBird(bridMahjongs);
            //num += inBird.length;
            inBirdCount = 1;
            count += num ;
        }else{
            let bridCount = this.birdNum;
            bridCount += haveHongzhong ? this.addBird : 0;
            bridMahjongs = this.mahjong.getMahjongByCount(bridCount);
            inBird = this.isInBird(bridMahjongs);
            inBirdCount = inBird.length;
            count += inBird.length * 2;
        }

        let haveUserHu = false;
        for(let x = 0 ; x < this.users.length; x++){
            let user = this.users[x];
            let uid = user.uid;
            let isHu = this.check.checkHu(user);
            if(otherIsHu){
                isHu = this.check.checkHu(user,pai);
            }
            if(isHu){
                if(isZimo && this.currPlayUid == uid ){
                    haveUserHu = true;
                    huUidArr.push(uid);
                    //其他玩家减分
                    for(let i = 0 ; i < this.users.length; i++){
                        if(this.users[i].uid != uid){
                            this.users[i].score -= count;
                        }else if(this.users[i].uid == uid){
                            this.users[i].score += count * 3;
                        }
                    }
                }else if(otherIsHu){
                    haveUserHu = true;
                    huUidArr.push(uid);
                    user.mahjong.push(pai);
                    //抢杠
                    this.users[x].score += count * 3;
                    this.getUserByUid(preUid).score -= count* 3;
                }
            }
        }

        if(!haveUserHu){
            let userStr = '';
            for(let i = 0 ; i < this.users.length; i ++){
                let user = this.users[i];
                userStr += JSON.stringify(this.getRoomUserInfo(user.uid));
            }
            mailModel.sendMail('======>>>userStr : ' + userStr + '======>>room' + JSON.stringify(this.getRoomMessage())+'=======>>otherIsHu:'+otherIsHu+'======>>isZimo'+isZimo);
            throw '没有可以胡的玩家';
        }
    }

    //计算杠
    for(let i = 0 ; i < this.users.length; i++){
        let gang = this.users[i].gang;
        for(let key = 0 ; key < gang.length; key ++){
            let multiple = 1;
            if(gang[key].type == 1 ){
                multiple = 2;
            }
            if(gang[key].uid != this.users[i].uid){
                let user = this.getUserByUid(gang[key].uid);
                user.score -= 3 * multiple;
                this.users[i].score += 3 * multiple;
            }else{
                //其余每个人扣一分
                for(let j = 0; j < this.users.length; j++){
                    if(this.users[j].uid != this.users[i].uid){
                        this.users[j].score -= 1 * multiple;
                    }else{
                        this.users[j].score += 3 * multiple;
                    }
                }
            }
        }
    }


    for(let i = 0 ; i < this.users.length;i++){
        this.result[this.users[i].uid]['score'] = this.users[i].score - this.result[this.users[i].uid]['score'] ;
        if(huUidArr.indexOf(this.users[i].uid) != -1){
            this.result[this.users[i].uid]['hu'] = pai;
        }
    }

    //一盘结束
    if(this.round == 1 && this.status != 3){
        //更新数据库 此房间已经不能退卡
        this.status = 3;
        await roomModel.update({_id : this.roomId},{status : 3})
    }

    let leaveOver = this.mahjong.mahjong;
    if(this.round <= this.roundCount ){
        if(!isFlow){
            this.banker = uid;
        }else{
            this.banker = this.currPlayUid;
        }
        this.roundInit();

        //如果有一个人以上胡
        let count = 0;
        if(!isZimo){
            for(var key in this.result){
                if(this.result[key].hu){
                    count += 1;
                }
            }
        }

        if(count >= 2){
            this.banker = preUid;
        }
        let bankerUser = this.getUserByUid(this.banker);
        bankerUser.isBanker = 1;
        //整理总结果
        this.allResult = this.allResult || {};
        for(let key in this.result){
            this.allResult[key] = this.allResult[key] || {};
            this.allResult[key].huCount = this.allResult[key].huCount || 0;
            this.allResult[key].bridCount = this.allResult[key].bridCount || 0;
            if(this.result[key].hu){
                this.allResult[key].huCount += 1;
                this.allResult[key].bridCount += inBirdCount;
            }

            if(this.result[key].peng){
                this.allResult[key].pengCount = this.allResult[key].pengCount || 0;
                this.allResult[key].pengCount += this.result[key].peng.length;
            }
            if(this.result[key].gang){
                this.allResult[key].mingGangCount = this.allResult[key].mingGangCount || 0;
                this.allResult[key].anGangCount = this.allResult[key].anGangCount || 0;
                for(let i = 0 ; i < this.result[key].gang.length; i++){
                    if(this.result[key].gang[i] && this.result[key].gang[i].type == 1){
                        this.allResult[key].anGangCount += 1;
                    }else{
                        this.allResult[key].mingGangCount += 1;
                    }
                }
            }

            this.allResult[key].score = this.getUserByUid(key).score;
            this.allResult[key].nickname = this.getUserByUid(key).nickname;
        }
        this.allResult.ownerUid = this.ownerUid;
        this.allResult.roomNo = this.roomNo;
        this.allResult.roundCount = this.roundCount;
        this.allResult.endTime = Date.now();
        this.allResult.round = this.round ;
        this.allResult.createTime = this.createTime ;
    }
    this.gameRecord.addRecord(this.round,6,user,pai);
    if(this.round >= this.roundCount){
        this.addGameResult();
        roomManager.destroyRoom(this.roomNo);
        await roomModel.update({_id : this.roomId},{status : 4});
    }
    this.roomChannel.sendMsgToRoom('onRoundOver',{code : 200 , data : {allResult : this.allResult,result : this.result , banker : preBanker, leaveOver : leaveOver ,birds : bridMahjongs}});
};


roomPro.addGameResult = async function(){
    if(!this.allResult || !Object.keys(this.allResult).length){
        return;
    }
    let data = await gameResult.create({
        result  : this.allResult,
        record : {}
    });
};

roomPro.isInBird = function(arr){
    let birdArr = [];
    for(let i = 0 ; i < arr.length; i ++){
        if(arr[i]%10 == 1 || arr[i]%10 == 5 || arr[i]%10 == 9){
            birdArr.push(arr[i]);
        }
    }
    return birdArr;
};

roomPro.userReady = function(uid){
    let user = this.getUserByUid(uid);
    if(user.status >= 1){
        throw '玩家已经准备!';
    }
    user.status = 1;
    //如果全部准备 发送gamestart
    this.roomChannel.sendMsgToRoom('onReady',{code :200,data : { uid : uid}});
    let isAllReady = true;
    for(let i = 0 ; i < this.users.length; i ++){
        if(this.users[i].status != 1){
            isAllReady = false;
        }
    }

    if(isAllReady){
        this.result = {};
        this.round += 1;
        this.dice = this.mahjong.diceRoller();
        this.changeUserStatus(2);
        this.deductRoomCard();//扣除房卡
        this.check = new Check(this.laizi);
        this.licensing();
        this.confirmLaizi();
        this.roomChannel.sendMsgToRoom('onGameStart',{code : 200});
    }
};

roomPro.roundInit = function(){
    this.mahjong = new Mahjong();//换一副拍
    this.dice = {};
    this.currPlayUid = null;//现在出牌的 玩家id
    this.currUserInaugurated = null; //现在玩家接到的牌
    this.previousOut = null;//上一次打出的牌
    this.userHu = false;
    this.unGang = [];
    this.isLice = false;
    //清理用户
    for(let i = 0; i < this.users.length; i ++){
        this.users[i].mahjong = [];
        this.users[i].peng = [];
        this.users[i].gang = [];//外杠
        this.users[i].playOutMahjong = [];
        this.users[i].isAction = false;
        this.users[i].status = 0;
        this.users[i].isBanker = 0;
    }
};

roomPro.initiateDissolveRoom = async function(uid){
    if(this.handlerDissolveUser.indexOf(uid) != -1){
        throw '已经做过选择';
    }

    if(this.dissUid){
        throw '已经有玩家发起解散,不能重复发送!';
    }


    //判断是否是房主
    let self = this;
    let isBanker = false;
    const outTime = 2 * 60000;

    if(uid == this.ownerUid){
        isBanker = true;
    }
    if(this.status == 1 && !isBanker){
        return;
    }

    this.dissUid = uid;
    this.dissCreateTime = Date.now();

    if(isBanker && this.users.length < 4){ //当第一局未结束 直接解散房间
        this.allResult.endTime = this.allResult.endTime || Date.now();
        this.roomChannel.sendMsgToRoom('onRoomDissolve',{code : 200,allResult : this.allResult});
        await this.addGameResult();
        await roomManager.returnRoomCard(this.ownerUid,this.roomId);
        await roomModel.update({_id : this.roomId},{status : 5});
        roomManager.destroyRoom(this.roomNo);
    }else{
        //发起解散
        this.agreeDissolve.push(uid);
        await this.roomChannel.sendMsgToRoom('onDissolveHandler',{
            code : 200,
            data : {
                dissUid : this.dissUid,
                cannelDissove : this.cannelDissove,
                agreeDissolve : this.agreeDissolve,
                dissCreateTime : this.dissCreateTime
            }
        });
        this.handlerDissolveUser.push(uid);
        this.ressolveTimer = setTimeout(function(){
            self.dissolveRoom.call(self,true);
        },outTime);
    }
};

//处理解散房间
roomPro.handlerDissolveRoom = async function(uid){

    if(this.handlerDissolveUser.indexOf(uid) != -1){
        throw '已经做过选择';
    }
    if(!this.dissUid){
        return;
    }
    this.handlerDissolveUser.push(uid);
    this.agreeDissolve.push(uid);
    await this.roomChannel.sendMsgToRoom('onDissolveHandler',{
        code : 200,
        data : {
            dissUid : this.dissUid,
            cannelDissove : this.cannelDissove,
            agreeDissolve : this.agreeDissolve,
            dissCreateTime : this.dissCreateTime
        }
    })
    await this.dissolveRoom();
};

roomPro.cannelDissolveRoom = async function(uid){
    if(this.handlerDissolveUser.indexOf(uid) != -1){
        throw '已经做过选择';
    }
    if(!this.dissUid){
        return;
    }
    this.handlerDissolveUser.push(uid);
    //this.agreeDissolve -= 1;
    this.cannelDissove.push(uid);
    await this.roomChannel.sendMsgToRoom('onDissolveHandler',{
        code : 200,
        data : {
            dissUid : this.dissUid,
            cannelDissove : this.cannelDissove,
            agreeDissolve : this.agreeDissolve,
            dissCreateTime : this.dissCreateTime
        }
    });
    await this.dissolveRoom();
};



roomPro.dissolveRoom = async function(isTime){
    //不在线玩家人数
    var temp = this.users.length;
    var rate = this.agreeDissolve.length / temp;
    var cannelRate = this.cannelDissove.length /temp;
    if( rate > 0.5){
        this.dissUid = false;
        this.allResult.endTime = this.allResult.endTime || Date.now();
        this.roomChannel.sendMsgToRoom('onRoomDissolve',{code : 200,allResult : this.allResult});
        await this.addGameResult();
        roomManager.destroyRoom(this.roomNo);
        this.ressolveTimer && clearTimeout(this.ressolveTimer);
        if(this.status < 3){ // 返回房卡
            roomManager.returnRoomCard(this.ownerUid,this.roomId);
        }else{
            await roomModel.update({_id : this.roomId},{status : 5});
        }
    }

    if(cannelRate >= 0.5){
        this.dissUid = false;
        this.agreeDissolve = [];
        this.handlerDissolveUser = [];
        this.cannelDissove = [];
        this.roomChannel.sendMsgToRoom('onCannelDissolve',{code : 200});
        this.ressolveTimer && clearTimeout(this.ressolveTimer);
    }

    if(isTime){
        this.dissUid = false;
        this.allResult.endTime = this.allResult.endTime || Date.now();
        console.log(this.allResult,'=======>>>>this.allResult');
        this.roomChannel.sendMsgToRoom('onRoomDissolve',{code : 200,allResult : this.allResult});
        await this.addGameResult();
        roomManager.destroyRoom(this.roomNo);
        this.ressolveTimer && clearTimeout(this.ressolveTimer);
        if(this.status < 3){ // 返回房卡
            roomManager.returnRoomCard(this.ownerUid,this.roomId);
        }else{
            await roomModel.update({_id : this.roomId},{status : 5});
        }
        this.ressolveTimer && clearTimeout(this.ressolveTimer);
    }
};

roomPro.voiceToRoom = function(uid,voiceId){
    this.roomChannel.sendMsgToRoom('onVoice',{code : 200 , data : {voiceId : voiceId , uid : uid}});
};

roomPro.sendMessage= function(uid,message){
    this.roomChannel.sendMsgToRoom('onMessage',{code : 200 , data : {message : message , uid : uid}});
};


/**
 * 用于后台强制解散房间
 */
roomPro.forceDissolveRoom = async function(){
    this.allResult.endTime = this.allResult.endTime || Date.now();
    this.roomChannel.sendMsgToRoom('onRoomDissolve',{code : 200,allResult : this.allResult});
    await this.addGameResult();
    roomManager.destroyRoom(this.roomNo);
    if(this.status < 3){ // 返回房卡
        roomManager.returnRoomCard(this.ownerUid,this.roomId);
    }else{
        await roomModel.update({_id : this.roomId},{status : 5});
    }
};

module.exports = Room;

