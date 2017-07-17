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
    this.funNum = 1;
    this.userAction = false;
    this.funRecord = [];//{type : 1} , 1 开口 2,发财杠 3,红中杠 4 癞子杠 5 暗杠 6 明杠 7 放冲 8 自摸 9,庄家
    //10 硬胡 11,清一色 12,风一色 13,碰碰胡 14,将一色 15,杠上开花 16,抢杠 17,全球人 18 海底捞 ,19 7对,20 豪华7对 ,21 ,双豪七 22,三豪七  23 门清 24 吃癞子 25 三铺倒 26 亮牌 27
    this.brightMahjong = [];
    this.hasBrightMahjong = false;
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
        pai : [pai,pai,pai,pai],
        ts : Date.now()
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
        pai : [pai,pai,pai],
        ts : Date.now()
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
            temp1 = true;
        }

        if(this.mahjong[i] == pais[1] && !temp2){
            this.mahjong.splice(i,1);
            temp2 = true;
        }
    }
    pais.splice(1,0,pai);
    this.chi.push({
        uid : uid,
        pai : pais,
        ts : Date.now()
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


pro.addResultRecord = function(type){
    let obj = {
        type : type
    };

    if(type == 1 || type == 6 ){
        let has = false;
        for(let i = 0 ; i < this.funRecord.length; i++){
            if(this.funRecord['type'] == 1){
                has = true;
                break;
            }
        }
        if(!has){
            this.funRecord.push(obj);
        }
    }else{
        this.funRecord.push(obj);
    }
};

pro.getFanNum = function(hhType,laizi,isWin){
    //1 开口 2,发财杠 3,红中杠 4 癞子杠 5 暗杠 6 明杠 7 放冲 8 自摸 9,庄家
    //10 硬胡 11,清一色 12,风一色 13,碰碰胡 14,将一色 15,杠上开花 16,抢杠 17,全球人 18 海底捞
    this.funNum = 1;
    let kaikouFan = true;
    for(let i = 0 ;i < this.funRecord.length; i++){
        let type = this.funRecord[i].type;
        if(kaikouFan && type == 1){
            this.funNum = this.funNum * 2;
            kaikouFan = false;
        }
        if(type == 2 || type == 3 || type == 6 || type == 7 || type == 8 || type == 9 || type == 10){
            this.funNum = this.funNum * 2;
        }
        if(type == 5 || type == 4){
            this.funNum = this.funNum * 4;
        }

        //if(type == 11 || type == 12 || type == 13 || type == 14 || type == 15 || type == 16 || type == 17 || type == 18){
        //    this.funNum = this.funNum * 20;
        //}
        if(type == 25 && isWin){
            this.funNum = this.funNum * 2;
        }
        let daHuFan = 0;
        if(type == 23 || type == 11 || type == 12 || type == 13 || type == 14 || type == 15 || type == 16 || type == 17 || type == 18 || type == 19){
            daHuFan += 5;
        }

        if(type == 20 ){
            daHuFan += 10;
        }

        if(type == 21){
            daHuFan += 20;
        }

        if(type == 22){
            daHuFan += 30;
        }

        if(daHuFan){
            this.funNum = this.funNum * daHuFan;
        }

        if(type == 26){
            if(hhType == 1){
                this.funNum = this.funNum * 2;
            }
            if(hhType == 2){
                this.funNum = this.funNum * 4;
            }

            if(laizi == 35){
                this.funNum = this.funNum * 4;
            }
            this.funNum = this.funNum * 2;
        }
    }

    return this.funNum;
};

pro.getFunRecord = function(hhType,laizi){
    let arr = [];
    let kaikouFan = true;
    for(let i = 0 ;i < this.funRecord.length; i++){
        let obj = {};
        let type = this.funRecord[i].type;
        if(kaikouFan && type == 1){
            kaikouFan = false;
            obj[type] = 2 ;
        }

        if(type == 2 || type == 3 || type == 6 || type == 7 || type == 8 || type == 9 || type == 10){
            obj[type] = 2 ;
        }

        if(type == 5 || type == 4 || type == 2){
            obj[type] = 4 ;
        }

        if(type == 25){
            obj[type] = 3 ;
        }

        if(type == 23 || type == 11 || type == 12 || type == 13 || type == 14 || type == 15 || type == 16 || type == 17 || type == 18 || type == 19){
            obj[type] = 5 ;
        }

        if(type == 20 ){
            obj[type] = 10 ;
        }

        if(type == 21){
            obj[type] = 20 ;
        }

        if(type == 22){
            obj[type] = 30 ;
        }

        if(type == 26){
            let num = 1;
            if(hhType == 1){
                num = num * 2;
            }
            if(hhType == 2){
                num = num * 4;
            }

            if(laizi == 35){
                num = num * 4;
            }
            obj[type] = num * 2;
        }

        if(obj[type]){
            arr.push(obj);
        }
    }
    return arr;
};

pro.addBrightMahjong = function(){

    let arr = [];
    let count = 0;
    let del = function(pai){
        for(let i = this.mahjong.length - 1; i >= 0 ; i--){
            if(this.mahjong[i] == pai ){
                this.mahjong.splice(i,1);
                break;
            }
        }
    }
    del.call(this,41);
    del.call(this,42);
    del.call(this,35);
    this.brightMahjong.push([42,41,35]);
};
module.exports = User;