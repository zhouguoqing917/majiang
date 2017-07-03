
/**
 * 房间业务逻辑
 */
const gameUserModel = require('mongoose').models['GameUser'];
const roomModel = require('mongoose').models['Room'];
const roomCardRecordModel = require('mongoose').models['RoomCardRecord'];
const gameResult = require('mongoose').models['GameResult'];
const gameRecordModel = require('mongoose').models['GameRecord'];
const recordModel = require('mongoose').models['Record'];


const RoomChannel = require('../roomChannel.js');
const roomManager = require('../roomManager.js');
const uuid = require('../../../../util/uuid.js');
const User = require('./user.js');
const Mahjong = require('./mahjong.js');
let mailModel = require('../../../../util/mail.js');
let GameRecord = require('../gameRecord.js');
const xfyunModel = require('../../../../xfyun/xfyunModel.js');

//todo 癞子打出去 红中 发财 算是杠


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
    this.gameType ;
    this.gangUid;
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
    let roomNo = this.getRoomNo();//roomNo

    //创建讯飞云语音 房间

    let gid = await xfyunModel.createGroup(this.ownerUid,roomNo);
    if(!gid){
        throw '创建语音房间失败';
    }

    this.gid = gid;

    const roomObject = {
        createUserId:'',
        roomType:this.roomType,
        serverId:app.curServer.id,
        data:{},
        roomNo:0,
        status:0
    };


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
        user = new User(session,gameuser.roomCard);
        this.users.push(user);
        this.sendToRoomOwner();
    }else{
        route = 'onUserLine';
        user = this.getUserByUid(uid);
        user.sid = session.get('sid');
    }
    this.roomChannel.addUserToChannel(user);

    if(user.mahjong.length ){
        user.status = 2;
    }else{
        user.status = 0;
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
    await xfyunModel.joinGroup(this.gid,uid);
    return this.getRoomMessage(uid);
};

roomPro.deductRoomCard = async function(){
    let useCardNumber = this.roundCount === 8 ? 4 : 8;
    console.error(this.roomType ,'======this.roomType ');
    if(this.roomType == 1){//房主开房
        let uid = this.ownerUid ;
        console.error(uid ,'======uid ');
        let gameUser = await gameUserModel.findOne({_id : uid});
        console.error(gameUser ,'======gameUser');
        gameUser.roomCard -= useCardNumber;
        console.error(gameUser ,'======gameUser');
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
            let gameUser = await gameUserModel.findOne({_id : uid});
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
        laizipi : this.laizipi,
        ownerUid : this.ownerUid,
        gid : this.gid
    };
    return obj;
};



/**
 * 游戏开始时 判断谁是庄
 * @returns {*}
 */
roomPro.whoIsBanker = function(){
    if(this.banker){
        return this.banker;
    }

    this.users[0].isBanker = true;
    let uid = this.users[0].uid;
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
            chi : user.chi,
            status : user.status,
            uid : user.uid,
            playOutMahjong : user.playOutMahjong,
            id : user.id,
            latitude : user.latitude,
            longitude : user.longitude,
            unHu : user.unHu,
            funNum : user.getFanNum(),
            funRecord : user.funRecord,
            roomCard : user.roomCard,
            isAction : user.isAction,
            funNum : user.funNum
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
        [1,2,3,1,2,3,1,2,3,5,5,12,13],
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
            //this.users[i].mahjong = arr[0];
            //let pai = this.mahjong.next();
            //this.users[i].mahjong.push(pai);
            this.currUserInaugurated = this.users[i].mahjong[this.users[i].mahjong.length - 1];
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
            tempArr.push(users[i]);
        }
    }
    let random = parseInt(Math.random() * tempArr.length);
    let user = tempArr[random];
    let uid = user.uid;
    let mahjong = this.mahjong.next();
    user.playOutMahjong.push(mahjong);

    let laizi = mahjong + 1;

    if(laizi % 10 == 0){
        laizi = parseInt(mahjong / 10) * 10 + 1;
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
                if(uid != this.ownerUid){
                    await xfyunModel.quitGroup(this.gid,uid);
                }
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

    let user = this.getUserByUid(uid);
    //判断玩家是否拥有此张牌
    if(user.mahjong.indexOf(pai) == -1){
        throw '玩家没有此张牌';
    }

    if(user.mahjong.length % 3 != 2){
        throw '不是可以出牌的玩家22';
    }

    user.playAMahjong(pai);
    user.playOutMahjong.push(pai);
    this.gangUid = null;
    this.previousOut = {};
    this.currUserInaugurated = null;
    //记录上一次谁出了什么牌
    this.previousOut[uid] = pai;

    if(pai == 41 || pai == 42 || pai == this.laizi){
        //推送杠广播
        this.gameRecord.addRecord(this.round,5,user,pai);
        if(pai == 41){
            user.addResultRecord(2);
        }
        if(pai == 42){
            user.addResultRecord(3);
        }
        if(pai == this.laizi){
            user.addResultRecord(4);
        }
        this.roomChannel.sendMsgToRoom('onLaiziGang',{code : 200 ,data : { gangUid : uid , beGangUid : uid,mahjong : pai ,funNum: user.getFanNum()}});
        //给玩家一张牌
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
        user.unHu = [];
        this.roomChannel.sendMsgToRoomExceptUid('onMahjong',{code : 200,data : {mahjong : -1, uid : user.uid,isGang : true , huUserIdArr : []}},uArr);
        this.currUserInaugurated = mahjong;
        user.addMahjongToUser([mahjong]);
        let huUserIdArr = [];
        try{
            let isHu = this.handlerHu(user.uid,false,true);
            if(isHu){
                user.isAction = 8;
                huUserIdArr.push(user.uid);
            }
        }catch(e){
            console.error(e);
        }

        this.roomChannel.sendMsgToMem('onMahjong',{code : 200,data : {mahjong : mahjong, uid : user.uid,isGang : true,huUserIdArr : huUserIdArr}},user);
        this.gameRecord.addRecord(this.round,3,user,mahjong);
    }else{
        //广播
        this.currPlayUid = null;
        user.isAction = 0 ;
        this.gameRecord.addRecord(this.round,2,user,pai);
        this.isLicensing(uid,pai);
    }
};

roomPro.isLicensing = function(uid,pai,isCannel){
    let isCanLicensing = true;
    //判断出的这张牌 其它玩家是否 吃 碰 杠 胡
    let nextUser = this.getNextUserByUid(uid);
    //如果是取消操作 只需要判断 其它用户的isAction 是否大于0
    if(isCannel){
        for(let i = 0 ; i < this.users.length; i++){
            let user = this.users[i];
            if(uid == user.uid){
                continue;
            }

            if(!!user.isAction){
                isCanLicensing = false;
                break;
            }
        }
    }else{
        let huUserIdArr = [];
        for(let i = 0 ; i < this.users.length; i++){
            let user = this.users[i];
            if(uid == user.uid){
                continue;
            }
            let isHu = this.handlerHu(user.uid,false,true);
            console.error(isHu,'======ishu.....');
            try{
                if(isHu && pai){
                    isCanLicensing = false;
                    huUserIdArr.push(user.uid);
                    user.isAction = user.isAction | 8;
                }
            }catch(e){
                console.log(error);
            }
            console.error(user,pai,'======>>>>huUser');

            console.error(user.isAction , '======>>>>>>>isAction1');
            if(this.check.checkWaiGang(user,pai) ){
                user.isAction = user.isAction | 4;
                isCanLicensing = false;
            }
            console.error(user.isAction ,'======>>>>>>>isAction2');
            if(this.check.checkPeng(user,pai)){
                isCanLicensing = false;
                user.isAction = user.isAction | 2;
            }
            console.error(user.isAction ,'======>>>>>>>isAction3');
            if( nextUser.uid == this.users[i].uid && this.check.checkChi(user,pai).length  > 0 ){
                isCanLicensing = false;
                user.isAction = user.isAction | 1;
            }
            console.error(user.isAction ,'======>>>>>>>isAction4',this.check.laizi);
        }

        this.roomChannel.sendMsgToRoom('onPlayMahjong' , {code : 200, data : {uid : uid, mahjong : pai ,huUserIdArr : huUserIdArr}});
    }

    if(!isCanLicensing){
        return ;
    }

    if(this.isRoundOver()){
        let keys = Object.keys(this.previousOut);
        let preUid =  keys[0];
        this.banker = preUid;
        this.getUserByUid(preUid).isBanker = 1;
        return this.handlerHu(uid,true);
    }

    //是否可以发牌给下一个玩家
    if(isCanLicensing && !this.isRoundOver()){
        let outUid = Object.keys(this.previousOut)[0];
        let user = this.getUserByUid(outUid);
        let nextUser = this.getNextUserByUid(outUid);
        this.gangUid = null;
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
        let huUserIdArr = [];
        this.previousOut = {};
        this.roomChannel.sendMsgToRoomExceptUid('onMahjong',{code : 200,data : {mahjong : -1 , uid : nextUser.uid , huUserIdArr : huUserIdArr}  },uArr);
        this.currUserInaugurated = mahjong;
        user.userAction = false;

        nextUser.unHu = [];
        nextUser.addMahjongToUser([mahjong]);

        try{
            let isHu = this.handlerHu(nextUser.uid,false,true);
            if(isHu){
                user.isAction = 8;
                huUserIdArr.push(user.uid);
            }
        }catch(e){
            console.error(e);
        }
        this.roomChannel.sendMsgToMem('onMahjong',{code : 200,data : {mahjong : mahjong , uid : nextUser.uid , huUserIdArr : huUserIdArr}},nextUser);
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
        throw '上次玩家出牌为空';
    }

    if(user.mahjong.length % 3 == 2 || !user.isAction){
        throw '玩家牌数不对 或者不能操作';
    }

    let key = Object.keys(this.previousOut)[0];
    let mahjong = this.previousOut[key];
    let action = user.isAction;

    let userMaxAction = user.isAction & 8 ;
    userMaxAction = userMaxAction || (userMaxAction & 4);
    userMaxAction = userMaxAction || (userMaxAction & 2);
    userMaxAction = userMaxAction || (userMaxAction & 1);

    user.isAction = 0;
    user.options = 0;

    if(this.gangUid){
        for(let i = 0 ; i < this.users.length; i ++){
            if(this.users[i].isAction >= 8){
                return ;
            }
        }

        this.gangUid = null;
        //发牌给杠的玩家
        if(this.isRoundOver()){
            let keys = Object.keys(this.previousOut);
            let preUid =  keys[0];
            this.banker = preUid;
            this.getUserByUid(preUid).isBanker = 1;
            return this.handlerHu(uid,true);
        }

        //是否可以发牌给下一个玩家
        if(!this.isRoundOver()){
            let outUid = Object.keys(this.previousOut)[0];
            let nextUser = this.getUserByUid(outUid);

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
            this.roomChannel.sendMsgToRoomExceptUid('onMahjong',{code : 200,data : {mahjong : -1 , uid : nextUser.uid ,huUserIdArr : []}  },uArr);
            this.currUserInaugurated = mahjong;
            user.userAction = false;

            nextUser.unHu = [];
            nextUser.addMahjongToUser([mahjong]);
            let huUserIdArr = [];
            try{
                let isHu = this.handlerHu(nextUser.uid,false,true);
                if(isHu){
                    nextUser.isAction = 8;
                    huUserIdArr.push(nextUser.uid);
                }
            }catch(e){
                console.error(e);
            }
            this.roomChannel.sendMsgToMem('onMahjong',{code : 200,data : {mahjong : mahjong , uid : nextUser.uid ,huUserIdArr : huUserIdArr}},nextUser);
            this.gameRecord.addRecord(this.round,3,nextUser,mahjong);
        }
        return;
    }
    user.readyChi = [];
    user.readyPeng = null;
    user.readyGang = null;
    this.gameRecord.addRecord(this.round,7,user);

    let maxOption = 0;
    let maxOptionUid = null;
    let maxIsAction = 0;

    if(userMaxAction == 8){
        user.unHu.push(mahjong);
    }

    for(let i = 0 ; i < this.users.length; i ++){
        let user = this.users[i];
        if(user.options > maxOption ){
            maxOption = user.options;
            maxOptionUid = user.uid;
        }

        if(user.isAction > maxIsAction){
            maxIsAction = user.isAction;
        }
    }
    console.error(maxOption,maxIsAction,'========>>>>>>>11111');
    if(maxOption > maxIsAction){
        if(maxOption == 1){
            let handlerUser = this.getUserByUid(maxOptionUid);
            let chiArr = handlerUser.readyChi;
            console.error(chiArr,'======>>>chiArr');
            //this.clearOptions();
            return this.handlerChi(maxOptionUid,chiArr);
        }

        if(maxOption == 2){
            //this.clearOptions();
            return this.handlerPeng(maxOptionUid);
        }

        if(maxOption == 4){
            //this.clearOptions();
            return this.handlerGang(maxOptionUid,mahjong);
        }

        if(maxOption == 8){
            //this.clearOptions();
            return this.handlerHu(maxOptionUid);
        }
    }

    let isAllHandler = true;
    for(let i = 0 ; i < this.users.length; i ++){
        if(this.users[i].isAction != 0 || this.users[i].options != 0){
            isAllHandler = false;
            break;
        }
    }
    if(!isAllHandler){
        return ;
    }

    if(userMaxAction == 8 && this.currPlayUid == uid){
        return user.unHu;
    }

    this.isLicensing(uid,mahjong,true);
    return user.unHu;
};

/**
 * 处理杠牌
 * @uid userId
 * 分为内杠和外杠
 */
roomPro.handlerGang = function(uid,pai){
    let user = this.getUserByUid(uid);
    if(user.isAction & 4 != 4){
        throw '不能杠或者已经取消';
    }
    //判断是否可以杠
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
    if(!gangObj || !Object.keys(gangObj).length){
        throw '不能杠或者参数错误';
    }

    for(let i = 0 ; i < this.users[i].length; i++){
        if(this.users[i].uid != uid && (this.users[i].isAction & 8) == 8){
            user.options = 4;
            user.isAction = 0;
            return;
        }
    }
    this.clearOptions();

    user.addGangToUser(mahjong,beUid,gangObj.type);
    let  isCanLicensing = false;
    let isHaveUserHu = false;
    let huUserIdArr = [];
    if(gangObj.type == 2){
        this.previousOut = {};
        this.previousOut[uid] = pai;
        this.gangUid = uid;
        for(let i = 0 ; i < this.users.length; i++){
            let user = this.users[i];
            try{
                let isHu = this.handlerHu(user.uid,false,true);
                if(uid != user.uid && isHu ){
                    user.isAction = 8;
                    isHaveUserHu = true;
                    huUserIdArr.push(user.uid);
                }
            }catch(e){
                console.error(e);
            }
        }
    }

    user.userAction = false;
    //推送杠广播
    this.roomChannel.sendMsgToRoom('onGang',{code : 200 ,data : { gangUid : uid , beGangUid : beUid,mahjong : mahjong,type : gangObj.type,funNum: user.getFanNum(), huUserIdArr : huUserIdArr}});
    this.gameRecord.addRecord(this.round,5,user,mahjong);
    if(isHaveUserHu){
        return;
    }else {
        if(this.isRoundOver()){
            //todo  房间内信息 初始化 当前玩家坐庄
            // this.roundInit();
            let preUid = Object.keys(this.previousOut)[0];
            this.banker = preUid;
            this.getUserByUid(preUid).isBanker = 1;
            return this.handlerHu(uid,true);
            // return this.roomChannel.sendMsgToMem('onFlow',{code : 200});
        }

        //给玩家一张牌
        let mahjong = this.mahjong.next();
        this.currPlayUid = user.uid;
        let uArr = this.getExceptUids(user.uid);
        this.previousOut = {};
        this.gangUid = null;
        user.unHu = [];
        this.roomChannel.sendMsgToRoomExceptUid('onMahjong',{code : 200,data : {mahjong : -1, uid : user.uid,isGang : true,huUserIdArr : []}},uArr);
        this.currUserInaugurated = mahjong;
        user.addMahjongToUser([mahjong]);
        if(gangObj.type == 1){
            user.addResultRecord(5);
        }else{
            user.addResultRecord(6);
        }
        let huUserIdArr = [];
        try{
            let isHu = this.handlerHu(user.uid,false,true);
            if(isHu){
                user.isAction = 8;
                huUserIdArr.push(user.uid);
            }
        }catch(e){
            console.error(e);
        }

        this.roomChannel.sendMsgToMem('onMahjong',{code : 200,data : {mahjong : mahjong, uid : user.uid,isGang : true,huUserIdArr : huUserIdArr}},user);
        this.gameRecord.addRecord(this.round,3,user,mahjong);
    }
};

/**
 * 处理碰牌
 * @uid userId
 */
roomPro.handlerPeng = function(uid){
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
    if(!havePeng || (user.isAction & 2 != 2)){
        throw '非法碰牌 uid : ' + uid + ' pai : ' + mahjong;
    }

    //判断有没有胡的 玩家为操作
    for(let i = 0 ; i < this.users[i].length; i++){
        if(this.users[i].uid != uid && (this.users[i].isAction & 8) == 8){
            user.options = 2;
            user.isAction = 0;
            return;
        }
    }
    this.clearOptions();
    user.userAction = true;

    let preUser = this.getUserByUid(previousUid);
    preUser.clearOutMahjongByNum(mahjong);
    this.currPlayUid = uid;

    let mahjongs = user.addPengToUser(mahjong,previousUid);
    this.gameRecord.addRecord(this.round,4,user,mahjong);
    this.previousOut = null;
    user.addResultRecord(1);
    //pengUid 碰牌玩家  bePengUid被碰牌玩家
    this.roomChannel.sendMsgToRoom('onPeng',{code : 200 ,data : {pengUid : uid , bePengUid : previousUid,mahjongs : mahjongs ,funNum: user.getFanNum()}})
};

roomPro.clearOptions = function(){
    for(let i = 0 ; i < this.users.length ; i++){
        this.users[i].isAction = 0;
        this.users[i].options = 0;
        this.users[i].readyChi = [];
    }
};

// 顺时钟玩家
roomPro.getMeBetweenBankerUsers = function(beUid,uid,usersArr){
    usersArr = usersArr || [];
    let temp = false;
    let myIndex ;
    let nextUser = this.getNextUserByUid(uid);
    if(nextUser.uid == beUid){
        return usersArr;
    }
    usersArr.push(nextUser);
    uid = nextUser.uid;
    return this.getMeBetweenBankerUsers(beUid,uid,usersArr);
}


/**
 * 胡牌
 * @param uid
 */
roomPro.handlerHu = async function(uid,isFlow,isCheck){
    let user = this.getUserByUid(uid);
    if(user.userAction){
        throw '碰了之后不能胡';
    }

    let pai , preUid, isZimo = 1 ;//1为 自摸  2, 抢杠 3,别人放炮 ,4 自己杠到的
    let preBanker = this.banker;
    let isBaoPai = false;
    if(user.isAction & 8 != 8){
        throw '不能胡或者已经取消胡';
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
                if(user.gang[i].pai[0] == pai){
                    if(user.gang[i].type == 2){
                        preIsGang = true;
                        user.gang.splice(i,1);
                    }
                    //自己杠的
                    if(preUid == uid){
                        isZimo = 4;
                    }
                }
            }
            if(preIsGang){
                isZimo = 2;
            }else{
                isZimo = 3;
            }
        }else{
            console.error('=========>>>>>>',user);
            throw '非法胡牌操作'
        }

        //初始化 resut
        for(let i = 0; i < this.users.length; i ++){
            this.result[this.users[i].uid] = this.result[this.users[i].uid] || {};
            this.result[this.users[i].uid].score = this.users[i].score;
        }

        //判断我和打出之间的玩家  也有可以胡的 则等待
        console.error('=====>>>preUid',preUid);
        if(isZimo != 1 && isZimo != 4){
            let users = this.getMeBetweenBankerUsers(uid,preUid);
            console.error(users,'=======>>>>>users');
            for(let i = 0 ; i < users.length ; i ++){
                let isHu = this.check.checkHu(users[i],pai);
                console.error(isHu,'======>>>isHu');
                if(isHu && isHu.length && !isCheck){
                    return;
                }
            }
        }

        //验证胡牌
        let isHu = false;
        if(isZimo == 1){
            isHu = this.check.checkHu(user);
        }else{
            isHu = this.check.checkHu(user,pai);
        }

        if(!isHu && isHu.length){
            throw '没有可以胡的玩家';
        }
        console.error(isHu,'========>>>>isHu');
        //判断是否海底捞 7
        if((isZimo == 1 || isZimo == 4) && this.mahjong.mahjong.length < 14){
            if(isHu.length == 1 && isHu[0] == 1){
                isHu = [7];
            }else{
                isHu.push(7);
            }
        }

        //是否是杠上花 8
        if(isZimo == 4){
            let isHu = this.check.checkUnHasJiang(user,pai);
            if(isHu){
                if(isHu.length == 1 && isHu[0] == 1){
                    isHu = [8];
                }else{
                    isHu.push(8);
                }
            }
        }

        //判断是否硬胡
        let check = new Check(0);
        let yinghu = false;
        if(isZimo == 1 || isZimo == 4){
            yinghu = check.checkHu(user)
        }else{
            yinghu = check.checkHu(user,pai)
        }
        if(yinghu && yinghu.length){
            user.addResultRecord(10);
        }
        let preUser = this.getUserByUid(preUid);
        if(isZimo == 2){ //抢杠
            preUser.addResultRecord(7);
            user.addResultRecord(16);
        }

        if(isZimo == 3){ //别人放冲
            preUser.addResultRecord(7);
        }

        if(isZimo == 1){
            user.addResultRecord(8);
        }

        ////判断自摸番
        //let hasZimoFan = true;
        //for(let i = 0 ; i < isHu.length; i++){
        //    if(isHu[i] == 7 || isHu[i] == 8){
        //        hasZimoFan = false;
        //        break;
        //    }
        //}
        //if(isZimo == 1){
        //    user.addResultRecord(8);
        //}

        //计算大胡番
        for(let i = 0 ; i < isHu.length; i++){
            //1,屁胡 2,碰碰胡 ,3全球人, 4 , 将将胡 ,5, 清一色 , 6 风一色 ,7 海底捞 ,8 ,杠上花
            //1 开口 2,发财杠 3,红中杠 4 癞子杠 5 暗杠 6 明杠 7 放冲 8 自摸 9,庄家
            //10 硬胡 11,清一色 12,风一色 13,碰碰胡 14,将一色 15,杠上开花 16,抢杠 17,全球人 18 海底捞
            if(isHu[i] == 2){
                user.addResultRecord(13);
            }
            if(isHu[i] == 3){
                user.addResultRecord(17);
            }
            if(isHu[i] == 4){
                user.addResultRecord(14);
            }
            if(isHu[i] == 5){
                user.addResultRecord(11);
            }
            if(isHu[i] == 6){
                user.addResultRecord(12);
            }
            if(isHu[i] == 7){
                user.addResultRecord(18);
            }
            if(isHu[i] == 8){
                user.addResultRecord(15);
            }
        }

        //庄家
        let bankerUid = this.banker;
        let bankerUser = this.getUserByUid(bankerUid);
        bankerUser.addResultRecord(9);

        let winUserFun = user.getFanNum();

        //计算每个玩家的番数
        let isTop = false;
        let topCount = 0;
        for(let i = 0; i < this.users.length; i ++){
            let user = this.users[i];
            user.funNum = user.getFanNum();
            if(user.uid != uid){
                if(( winUserFun * user.funNum ) < 300){
                    isTop = true;
                }else{
                    topCount += 1;
                }
            }
        }

        if(isTop){ //正常计算
            for(let i = 0; i < this.users.length; i ++) {
                let user = this.users[i];
                if(user.uid != uid){
                    let num = winUserFun * user.funNum > 300 ? 300 : winUserFun * user.funNum ;
                    user.funNum = num;
                }
            }
        }
        //计算顶
        if(topCount >= 3 ){
            let kaikouCount = 0;
            //判断玩家开口 是否形成光明顶
            for(let i = 0; i < this.users.length; i ++){
                let user = this.users[i];
                let temp = true;
                if(user.uid != uid){
                    for(let j = 0; j < user.resultRecord.length;j++){
                        if(user.resultRecord[j]['type'] == 1){
                            temp = false;
                        }
                    }
                }
                if(!temp){
                    kaikouCount += 1;
                }
            }


            for(let i = 0; i < this.users.length; i ++) {
                let user = this.users[i];
                if(user.uid != uid){
                    if(kaikouCount == 0){
                        user.funNum = 900;
                    }else if (kaikouCount > 0 && kaikouCount < 3){
                        user.funNum = 700;
                    }else{
                        user.funNum = 500;
                    }
                }
            }
        }
        // 计算包牌
        if(isZimo == 3 ){ //计算包牌情况
            if(isHu && isHu.length == 1 && isHu[0] == 3 && !this.check.canHu(preUser).length){
                //包牌
                isBaoPai = true;
            }else if(isHu.indexOf(4) != -1 && isHu.indexOf(5) != -1){ //大胡 第三铺 玩家 包牌
                //第三铺
                let arr = [];
                arr = arr.concat(user.chi);
                arr = arr.concat(user.peng);
                arr = arr.concat(user.gang);
                if(arr.length >= 3){
                    //排序
                    for(let i = 0; i < arr.length;i++){
                        let temp;
                        for(let j = 0; j < arr.length; j ++){
                            if(arr[i].ts > arr[j].ts){
                                temp = arr[i].ts;
                                arr[i] = arr[j];
                                arr[j] = temp;
                            }
                        }
                    }
                    if(arr[2].uid != uid){
                        let uid = arr[2].uid;
                        isBaoPai = true;
                        preUser = this.getUserByUid(uid);
                    }
                }

            }
        }
        let maxFunNum = 0;
        if(isCheck){
            for(let i = 0; i < this.users.length; i ++) {
                let user = this.users[i];
                if(preUid ){
                    if(preUid == user.uid){
                        maxFunNum = user.funNum;
                        break;
                    }else if(user.uid != uid && user.funNum > maxFunNum){
                        maxFunNum = user.funNum;
                    }
                }
            }
            if(maxFunNum >= this.huCount){
                return true;
            }
            return false;
        }

        if(isZimo == 2 || isBaoPai){ //包牌
            for(let i = 0; i < this.users.length; i ++) {
                let user = this.users[i];
                if(user.uid != uid && preUser.uid != user.uid){
                    preUser.funNum += user.funNum ;
                    user.funNum = 0;
                }
            }
        }


        //计算分数
        for(let i = 0; i < this.users.length; i ++) {
            let otherUser = this.users[i];
            if(otherUser.uid != uid){
                otherUser.score -= otherUser.funNum;

                user.score += otherUser.funNum;
            }
        }

        //总结算
        for(let i = 0; i < this.users.length; i ++) {
            let resUser = this.users[i];
            this.allResult[resUser.uid] = this.allResult[resUser.uid] || {};
            this.allResult[resUser.uid].win = this.allResult[resUser.uid].win || 0;
            this.allResult[resUser.uid].score = resUser.score ;
            if(resUser.uid == user.uid){
                this.allResult[resUser.uid].win += 1;
            }
        }

        //一局结果
        for(let i = 0; i < this.users.length; i ++){
            let user = this.users[i];
            this.result[user.uid].nickname = user.nickname;
            this.result[user.uid].score = user.score - this.result[user.uid].score;
            this.result[user.uid].funRecord = user.getFunRecord();
            this.result[user.uid].funNum = user.funNum;
            this.result[user.uid].winUserFunNum = winUserFun;
            this.result[user.uid].id  = user.id;
            this.result[user.uid].headimgurl  = user.headimgurl;
            this.result[user.uid].packBrand = false;
            this.result[user.uid].mahjong = user.mahjong;
            if(preUser && preUser.uid == user.uid && isBaoPai){
                this.result[user.uid].packBrand = true;
            }
        }

    }


    //一盘结束
    //if(this.round == 1 && this.status != 3){
    //    //更新数据库 此房间已经不能退卡
    //    this.status = 3;
    //    await roomModel.update({_id : this.roomId},{status : 3})
    //}

    if(this.round <= this.roundCount ){
        if(!isFlow){
            this.banker = uid;
        }else{
            this.banker = this.currPlayUid;
        }
        this.roundInit();
        let bankerUser = this.getUserByUid(this.banker);
        bankerUser.isBanker = 1;

        this.allResult.ownerUid = this.ownerUid;
        this.allResult.roomNo = this.roomNo;
        this.allResult.roundCount = this.roundCount;
        this.allResult.endTime = Date.now();
        this.allResult.round = this.round ;
        this.allResult.createTime = this.createTime ;
        this.allResult.huCount = this.huCount;
        this.allResult.maxHuCount = this.maxHuCount;

    }
    this.gameRecord.addRecord(this.round,6,user,pai);
    if(this.round >= this.roundCount){
        this.addGameResult();
        roomManager.destroyRoom(this.roomNo);
        await roomModel.update({_id : this.roomId},{status : 4});
    }
    this.roomChannel.sendMsgToRoom('onRoundOver',{code : 200 , data : {allResult : this.allResult,result : this.result , banker : preBanker,isFlow : isFlow || false }});
};


roomPro.addGameResult = async function(){
    if(this.status <= 1){
        return ;
    }
    try{
        if(!this.allResult || !Object.keys(this.allResult).length){
            this.allResult = {};
            this.allResult.ownerUid = this.ownerUid;
            this.allResult.roomNo = this.roomNo;
            this.allResult.roundCount = this.roundCount;
            this.allResult.endTime = Date.now();
            this.allResult.round = this.round ;
            this.allResult.createTime = this.createTime ;
            this.allResult.huCount = this.huCount;
            this.allResult.maxHuCount = this.maxHuCount;
            for(let i = 0; i < this.users.length ; i++){
                this.allResult[this.users[i].uid] = this.allResult[this.users[i].uid] || {};
                this.allResult[this.users[i].uid].score = 0;
                this.allResult[this.users[i].uid].nickname = this.users[i].nickname;
                this.allResult[this.users[i].uid].bridCount = 0;
                this.allResult[this.users[i].uid].pengCount = 0;
                this.allResult[this.users[i].uid].mingGangCount = 0;
                this.allResult[this.users[i].uid].anGangCount = 0;

                this.result[this.users[i].uid] = this.result[this.users[i].uid] || {};
                this.result[this.users[i].uid].score = 0;
                this.result[this.users[i].uid].nickname = this.users[i].nickname;
                this.result[this.users[i].uid].headimgurl = this.users[i].headimgurl;
                this.result.createTime = Date.now();
            }
            this.gameRecord.addScore(this.result);
            console.log(this.result,'=======>>>this.result');
        }
        let data = await gameResult.create({
            result  : this.allResult
        });

        this.gameRecord.gameResultId = data._id;
        let records = [].concat(this.gameRecord.records);
        records = records[0];
        delete this.gameRecord.records;
        let recordInfo = await gameRecordModel.create(this.gameRecord);

        for(let key in records){
            let obj = records[key];
            obj.roomNo =  this.gameRecord.roomNo;
            obj.round = parseInt(key);
            obj.roundCount = this.gameRecord.roundCount;
            obj.createTime = Date.now();
            obj.gameRecordId = recordInfo._id;
            await recordModel.create(obj);
        }
    }catch(e){
        console.error(e.stack);
    }
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

roomPro.userReady = async function(uid){
    let user = this.getUserByUid(uid);
    if(user.status == 1){
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
    console.error(this.users.length,'1111');
    if(isAllReady && this.users.length == 4){
        console.error(this.users.length,'22222');
        this.result = {};
        this.round += 1;
        this.dice = this.mahjong.diceRoller();
        this.banker = this.whoIsBanker();

        this.deductRoomCard();//扣除房卡
        this.licensing();
        this.confirmLaizi();
        this.status = 2;
        let self = this;
        this.check = new Check(this.laizi);
        this.changeUserStatus(2);
        for(let i = 0 ; i < this.users.length; i ++){
            let fun = function(user){
                self.roomChannel.sendMsgToMem('onGameStart',{code : 200 , data : self.getRoomMessage(user.uid)},user);
            };
            fun(this.users[i]);
        }

        let ownerUid = this.ownerUid;
        let ownerUser = this.getUserByUid(ownerUid);
        //如果房主不在房间
        if(!ownerUser){
           await xfyunModel.quitGroup(this.gid,ownerUid);
        }
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
        this.users[i].chi = [];
        this.users[i].userAction = false;
        this.users[i].playOutMahjong = [];
        this.users[i].isAction = false;
        this.users[i].status = 0;
        this.users[i].isBanker = 0;
        this.users[i].options = 0;
        this.users[i].readyChi = [];
        this.users[i].unHu = [];
        this.users[i].funNum = 1;
        this.users[i].resultRecord = [];
        this.users[i].funRecord = [];
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
    const outTime = 3 * 60000;

    if(uid == this.ownerUid){
        isBanker = true;
    }

    if(this.status == 1 && !isBanker){
        throw '您不是房主!';
    }

    this.dissUid = uid;
    this.dissCreateTime = Date.now();

    if(isBanker && this.users.length < 4){ //当第一局未结束 直接解散房间
        this.roomChannel.sendMsgToRoom('onRoomDissolve',{code : 200,allResult : this.allResult});
        let  cardNum = this.roundCount == 8 ? 1 : 2;
        await this.addGameResult();
        await roomModel.update({_id : this.roomId},{status : 5});
        await roomManager.returnRoomCard(this.ownerUid,this.roomId,cardNum);
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
        await roomModel.update({_id : this.roomId},{status : 5});
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
        await roomModel.update({_id : this.roomId},{status : 5});
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
    await roomModel.update({_id : this.roomId},{status : 5});
    //if(this.status < 3){ // 返回房卡
    //    roomManager.returnRoomCard(this.ownerUid,this.roomId);
    //}else{
    //    await roomModel.update({_id : this.roomId},{status : 5});
    //}
};

/**
 * 吃牌
 * @type {Function}
 */
roomPro.handlerChi = function(uid,mahjongs){
    let user = this.getUserByUid(uid);
    //判断玩家是否拥有此张牌
    for(let i = 0; i <  mahjongs.length; i++){
        if(user.mahjong.indexOf(mahjongs[i]) == -1){
            throw '玩家没有此张牌';
        }
    }

    let obj = this.previousOut;
    if(!obj || user.isAction & 1 != 1){
        throw '不能吃';
    }
    let keys = Object.keys(obj);
    let previousUid = keys[0];

    //如果自己是自己 则不能吃
    if(previousUid == uid){
        throw '自己不能吃自己的牌';
    }
    let mahjong = obj[previousUid];

    let temp = false;
    //判断能不能吃
    if(mahjongs.indexOf(mahjong + 1) != -1 && mahjongs.indexOf(mahjong + 2) != -1 ){
        temp = true;
    }else if(mahjongs.indexOf(mahjong + 1) != -1 && mahjongs.indexOf(mahjong - 1) != -1 ){
        temp = true;
    }else if(mahjongs.indexOf(mahjong - 1) != -1 && mahjongs.indexOf(mahjong - 2) != -1 ){
        temp = true;
    }
    if(!temp){
        throw '非法吃牌';
    }

    //判断其它玩家
    for(let i = 0 ; i < this.users.length; i ++){
        if(this.users[i].uid != uid && (this.users[i].isAction != 0 || this.users[i].options != 0 )){
            user.readyChi = mahjongs;
            user.options = 1;
            user.isAction = 0;
            return ;
        }
    }

    this.clearOptions();
    let preUser = this.getUserByUid(previousUid);
    preUser.clearOutMahjongByNum(mahjong);
    user.unHu = [];
    this.currPlayUid = uid;
    mahjongs = user.addChiToUser(previousUid,mahjongs,mahjong);
    this.gameRecord.addRecord(this.round,8,user,mahjong);
    //pengUid 碰牌玩家  bePengUid被碰牌玩家
    this.roomChannel.sendMsgToRoom('onChi',{code : 200 ,data : {chiUid : uid , beChiUid : previousUid,mahjong : mahjongs.join(','),funNum: user.getFanNum()}})
};

module.exports = Room;

