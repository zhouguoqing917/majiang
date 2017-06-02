/**
 * Created by Mrli on 17/4/18.
 */
var Record = function(roomNo){
    this.startTime = Date.now();
    this.roomNo = roomNo;
};

/**
 * add record
 * @type 操作类型 1 , 发牌 2,出牌 3,抓牌 4,碰 5 杠 6 胡 7 过
 */

Record.prototype.addRecord = function(round,type,user,mahjong){
    this[round] = this[round] || {

            actions : []
        }
    var obj = {
        type : type,
        timestamp : Date.now(),
        mahjongs : user.mahjong.concat([]),
        peng : user.peng.concat([]),
        gang : user.gang.concat([]),
        chi : user.chi.concat([]),
        uid : user.uid
    };

    if(type == 1){ // 一局初始化
        obj.des = '发牌';
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
        obj.mahjong = mahjong;
        obj.des = '吃';
    }
    this[round].actions.push(obj);
};

module.exports = Record;


