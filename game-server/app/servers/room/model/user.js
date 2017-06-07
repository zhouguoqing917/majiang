/**
 * Created by Mrli on 17/3/7.
 * 玩家用户类  一些数据格式
 */

let User = function(session,roomCard){
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
    this.gang = [];
    this.chi = [];
    this.playOutMahjong = [];
    this.status = 0; //玩家准备状态 0 没有准备 1 已经准备  2,游戏中 3,离线
    this.isBanker = 0; //庄家: 0 不是 1 是
    this.isAction = 0;//玩家权限操作 吃 1 碰 2 杠 4 胡 8
    this.id = userInfo.id;
    this.latitude = userInfo.latitude;
    this.longitude = userInfo.longitude;
    this.roomCard = roomCard;
    this.options = 0;
    this.readyChi = [];
    this.unHu = [];
    this.funNum = 0;
    this.gangHongzhong = 0;
    this.gangFacai = 0;
    this.gangLaizi = 0;
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
    return [pai,pai,pai];
};

pro.addChiToUser = function(uid,pais,pai){
    let arr = [];
    let temp1 = false;
    let temp2 = false;
    for(let i = this.mahjong.length - 1; i >= 0 ; i--){
        if(this.mahjong[i] == pais[0] && !temp1){
            this.mahjong.splice(i,1);
        }

        if(this.mahjong[i] == pais[1] && !temp2){
            this.mahjong.splice(i,1);
        }
    }
    pais.splice(1,0,pai);
    this.chi.push({
        uid : uid,
        pai : pais
    });
    return pais;
};

pro.clearOutMahjongByNum = function(pai){
    for(let i = this.playOutMahjong.length - 1 ; i >= 0 ; i-- ){
        if(this.playOutMahjong[i] == pai){
            this.playOutMahjong.splice(i,1);
            break;
        }
    }
};

pro.getFanNum  = function(){
    this.funNum = 1;
    //开口
    let isKaikou = false;
    if(this.chi.length){
        isKaikou = true;
    }

    if(this.peng.length){
        isKaikou = true;
    }
    let anGang = 0;
    let mingGang = 0;
    for(let i = 0; i < this.gang.length; i++){
        if(this.gang[i].type != 1){
            anGang += 1;
            isKaikou = true;
        }
        if(this.gang[i].type == 1){
            mingGang += 1;
        }
    }
    let isBanker = this.isBanker;
    if(isKaikou){
        this.funNum = this.funNum * 2;
    }
    if(anGang){
        this.funNum = this.funNum * anGang * 4;
    }
    if(mingGang){
        this.funNum = this.funNum * mingGang * 2;
    }

    if(this.gangHongzhong){
        this.funNum = this.funNum * this.gangHongzhong * 2;
    }

    if(this.gangFacai){
        this.funNum = this.funNum * this.gangFacai * 2;
    }

    if(this.gangLaizi){
        this.funNum = this.funNum * this.gangLaizi * 4;
    }
};

pro.addLaiziGang = function(laizi,pai){
    if(laizi == pai){
        this.gangLaizi += 1;
    }
    if(41 == pai){
        this.gangFacai += 1;
    }
    if(42 == pai){
        this.gangHongzhong += 1;
    }
}
module.exports = User;