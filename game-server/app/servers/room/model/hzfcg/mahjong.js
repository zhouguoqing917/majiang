/**
 * Created by Mrli on 17/3/8.
 */

let Mahjong = function(){
    this.createMahjong();//一副麻将
    this.washMahjong();
};

//create mahjong
Mahjong.prototype.createMahjong = function(){
    let mahjong = [];
    for(let i = 1 ; i < 10 ; i ++){
        for(let j = 0 ; j < 4 ; j++){
            mahjong.push(i);
            mahjong.push(i + 10);
            mahjong.push(i + 20);
        }
    }
    for(let i = 0 ; i < 4 ; i ++){
        mahjong.push(31);//东
        mahjong.push(32);//南
        mahjong.push(33);//西
        mahjong.push(34);//北
        mahjong.push(35);//白板

        mahjong.push(41);//发财
        mahjong.push(42);//红中
    }

    this.mahjong = mahjong;
};

Mahjong.prototype.washMahjong = function(){
    let arr = [];
    for(let i = 0 ; i < 136; i++){
        let random = parseInt(Math.random() * this.mahjong.length);
        let delArr = this.mahjong.splice(random,1);
        arr = arr.concat(delArr);
    }
    this.mahjong = arr;
};

//打骰子
Mahjong.prototype.diceRoller = function(){
    let dice1 = parseInt(Math.random() * 6) + 1;
    let dice2 = parseInt(Math.random() * 6) + 1;
    return {
        dice1 : dice1,
        dice2 : dice2
    }
};

//下一张牌
Mahjong.prototype.next = function(){
    let arr = this.mahjong.splice(0,1) || [];
    return arr[0];
    //return 99;
};

//发牌
Mahjong.prototype.licensing = function(){
    return this.mahjong.splice(0,4);
};

//根据count获取mahjong
Mahjong.prototype.getMahjongByCount = function(count){
    let mahjongCount = count;
    if(this.mahjong.length < count){
        mahjongCount = this.mahjong.length;
    }
    return this.mahjong.splice(0,mahjongCount);
};

Mahjong.prototype.getPaiCount = function(){
    return this.mahjong.length;
};

Mahjong.prototype.getPaiNum = function(pai){
    if(pai == 99){
        return 10;
    }
    return pai%10;
};

Mahjong.prototype.getPaiByNum = function(num){
    for(let i = this.mahjong.length - 1 ; i >= 0; i--){
        if( this.mahjong == num){
            this.mahjong.splice(i,1);
        }
    }
};


module.exports = Mahjong;
