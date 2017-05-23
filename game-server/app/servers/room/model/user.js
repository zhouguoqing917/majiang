/**
 * Created by Mrli on 17/3/7.
 * 玩家用户类  一些数据格式
 */

let User = function(session){
    this.uid = session.uid;
    this.sid = session.get('sid');//fontend server id
    let userInfo = session.get('userinfo');
    this.ipaddress = userInfo.ipaddress;
    this.nickname = userInfo.nickname;
    this.headimgurl = userInfo.headimgurl;
    this.sex = userInfo.sex;
    this.score = 0;
    this.mahjong = [];
    this.peng = [];
    this.gang = [];//外杠
    this.playOutMahjong = [];
    this.status = 0; //玩家准备状态 0 没有准备 1 已经准备  2,游戏中 3,离线
    this.isBanker = 0; //庄家: 0 不是 1 是
    this.isAction = false;//用于判断玩家是否可以进行操作
    this.id = userInfo.id;
    this.latitude = userInfo.latitude;
    this.longitude = userInfo.longitude;
};

pro = User.prototype;

/**
 *  给玩家添加麻将
 * @param mahjongs 麻将数组
 */
pro.addMahjongToUser = function(mahjongs){
    this.mahjong = this.mahjong.concat(mahjongs)
};

/**
 * 出一张牌
 * @type {User}
 */

pro.playAMahjong = function(pai){
    for(let i = 0 ; i < this.mahjong.length; i ++){
        if(this.mahjong[i] == pai){
            this.mahjong.splice(i,1);
            break;
        }
    }
};

/**
 * 添加杠
 * @param pai 杠的牌
 * @param uid 杠了谁的
 */
pro.addGangToUser = function(pai,uid,type){
    let arr = [];
    for(let i = 0 ; i < this.mahjong.length; i++){
        if(this.mahjong[i] != pai){
            arr.push(this.mahjong[i]);
        }
    }

    for(let i = 0; i < this.peng.length; i++){
        if(this.peng[i] && this.peng[i].pai[0] == pai){
            this.peng.splice(i,1);
            break;
        }
    }
    this.mahjong = arr;
    this.gang.push({
        type : type,// 1 内杠 2 碰了之后杠 3,外杠
        uid : uid,
        pai : [pai,pai,pai,pai]
    });
    console.log('=======>>>',this.gang);
};

pro.addPengToUser = function(pai,uid){
    let arr = [];
    let count = 0;
    for(let i = this.mahjong.length - 1; i >= 0 ; i--){
        if(this.mahjong[i] == pai && count < 2){
            count += 1;
            this.mahjong.splice(i,1);
        }
    }
    this.peng.push({
        uid : uid,
        pai : [pai,pai,pai]
    });
};

pro.clearOutMahjongByNum = function(pai){
    for(let i = this.playOutMahjong.length - 1 ; i >= 0 ; i-- ){
        if(this.playOutMahjong[i] == pai){
            this.playOutMahjong.splice(i,1);
            break;
        }
    }
}
module.exports = User;