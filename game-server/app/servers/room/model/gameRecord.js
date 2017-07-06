/**
 * Created by Mrli on 17/4/18.
 */
var Record = function(room){
    this.startTime = Date.now();
    this.roomNo = room.roomNo;
    this.is7dui = room.is7dui;
    this.isPeng = room.isPeng;
    this.onlyOneBird = room.onlyOneBird;
    this.birdNum = room.birdNum;
    this.scores = [];
    this.records = {};
    this.roundCount = room.roundCount;
};

/**
 * add record
 * @type 操作类型 1 , 发牌 2,出牌 3,抓牌 4,碰 5 杠 6 胡 7 过 8刘局
 */
Record.prototype.addRecord = function(round,type,user,mahjong,dice){
    this.records[round] = this.records[round] || {
            actions : []
        };
    let obj = {
        type : type,
        timestamp : Date.now(),
        mahjongs : user.mahjong.concat([]),
        peng : user.peng.concat([]),
        gang : user.gang.concat([]),
        uid : user.uid
    };
    if(dice){
        this.records[round].dice = dice;
        this.records[round].users = this.records[round].users || [];
        let obj = {
            nickname : user.nickname,
            headimgurl : user.headimgurl,
            uid : user.uid
        };
        this.records[round].users.push(obj);
    }

    if(type == 1){ // 一局初始化
        obj.des = '发牌';
        if(obj.mahjongs.length == 14){
            this.records[round].banker =  user.uid;
        }
    }

    if(type == 2){
        obj.mahjong = mahjong;
        obj.des = '出牌';
    }

    if(type == 3){
        obj.mahjong = mahjong;
        obj.des = '抓牌';
    }

    if(type == 4){
        obj.mahjong = mahjong;
        obj.des = '碰';
    }

    if(type == 5){
        obj.mahjong = mahjong;
        obj.des = '杠';
    }

    if(type == 6){
        obj.mahjong = mahjong;
        obj.des = '胡';
    }

    if(type == 7){
        obj.mahjong = mahjong;
        obj.des = '过';
    }
    if(type == 8){
        obj.des = '流局';
    }
    if(type == 9){
        obj.mahjong = mahjong;
        obj.des = '吃';
    }
    this.records[round].actions.push(obj);
};

Record.prototype.addScore = function(result){
    result.createTime = Date.now();
    this.scores.push(result);
};

module.exports = Record;


