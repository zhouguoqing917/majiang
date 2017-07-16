/**
 * Created by Mrli on 17/5/8.
 */

var Check = function(laizi,hhType){
    this.laizi = laizi;
    this.hhType = hhType;
};
//console.log = function(){}
var max = 4;
var pro = Check.prototype ;


/**
 * 检测胡牌
 * @param user
 * @returns Array 1,屁胡 2,碰碰胡 ,3全球人 4 , 将将胡 ,5, 清一色 ,6 风一色 ,7 海底捞 ,8 ,杠上花 ,9 7对,10 豪华7对 ,11 ,双豪七 12,三豪七  13 门清
 */
pro.checkHu = function(user,pai){
    user.unHu = user.unHu || [];
    if(user.unHu.indexOf(pai) != -1){
        return false;
    }

    var mahjongs = user.mahjong;
    if(pai){
        mahjongs = mahjongs.concat([pai]);
    }
    //是否有红中
    var hasHongzhong = this.hasHongzhong(mahjongs);
    if(hasHongzhong){
        return false;
    }

    mahjongs = [].concat(mahjongs);

    var laziCount = this.getLaiziCount(mahjongs);
    var huType = [];
    let isHu = this.checkUnHasJiang(user,pai);
    console.log(isHu,'=====>>>>>>');
    if(isHu){
        var dahuArr = this.checkDaHu(user,pai,laziCount);
        if(dahuArr && dahuArr.length){
            for(var i = 0 ; i < dahuArr.length; i ++){
                if(huType.indexOf(dahuArr[i]) == -1){
                    huType.push(dahuArr[i]);
                }
            }
        }else{
            huType.push(1);
        }
    }
    isHu = this.jianjianghu(user,pai);
    if(isHu){
        huType.push(isHu);
    }
    isHu = this.qidui(user,pai);
    if(isHu){
        huType.push(isHu);
    }
    if(huType.length > 1 && huType.indexOf(1) != -1){
        let index = huType.indexOf(1);
        huType.splice(index,1);
    }
    return huType;
};

pro.getLaiziCount = function(mahjongs){
    let laiziCount = 0;
    for(let i = 0 ; i < mahjongs.length; i++){
        if(mahjongs[i] == this.laizi){
            laiziCount += 1;
        }
    }
    return laiziCount;
};

pro.qidui = function(user,pai){
    var mahjongs = user.mahjong ;
    if(pai){
        mahjongs = mahjongs.concat(pai);
    }
    console.log(mahjongs,'=====>>>>');
    if(mahjongs.length != 14){
        return false;
    }
    let laiziCount = this.getLaiziCount(mahjongs);

    let allPai = this.qiduiQransform(mahjongs);
    let duizi = 0;
    let isHaoqi = 0;
    let isThree = 0;

    for(let i = 0 ; i < allPai.length; i ++){
        for(let j = 0; j < allPai[i].length; j ++){
            if(allPai[i][j] == 4){
                duizi += 2;
                isHaoqi += 1;
            }else if(allPai[i][j] >= 2){
                duizi += 1;
            }
        }
    }

    let hasLaizi = 7 - duizi;
    if(hasLaizi <= laiziCount){
        let lastOne = mahjongs[mahjongs.length - 1];
        if(lastOne == this.laizi){
            mahjongs.splice(mahjongs.length - 1,1);
        }
        laiziCount = this.getLaiziCount(mahjongs);
        let allPai = this.qiduiQransform(mahjongs);
        let needLaiziCount = 0;

        for(let i = 0 ; i < allPai.length; i++){
            for(let j = 0; j < allPai[i].length; j ++){
                if(allPai[i][j] == 3){
                    isThree += 1;
                    needLaiziCount += 1;
                }else if(allPai[i][j] == 1){
                    needLaiziCount += 1;
                }
            }
        }


        if(needLaiziCount == 0 && laiziCount == 4){
            isHaoqi += 1;
        }

        if(isThree <= needLaiziCount){
            isHaoqi += isThree;
            laiziCount -= isThree;
            needLaiziCount -= isThree
        }

        if(laiziCount == 2){
            isHaoqi += 1;
        }

        if(isHaoqi == 0){
            return 9;
        }
        if(isHaoqi == 1){
            return 10;
        }
        if(isHaoqi == 2){
            return 11
        }
        if(isHaoqi == 3){
            return 12;
        }
    }
    return false;
}

pro.hasHongzhong = function(mahjongs){
    for(var i = 0; i < mahjongs.length; i++){
        if(this.hhType == 1){
            if(mahjongs[i] == 42){
                return true;
            }
        }
        if(this.hhType == 2){
            if(mahjongs[i] == 42 || mahjongs[i] == 41){
                return true;
            }
        }

    }
    return false;
};

pro.checkDaHu = function(user,pai,laiziCount){
    var mahjongs = user.mahjong;
    if(pai){
        mahjongs = mahjongs.concat([pai]);
    }

    mahjongs = [].concat(mahjongs);
    var allPai = this.transform(mahjongs);
    var huType = [];
    var isHu = this.qingyise(user,pai,allPai);
    if(isHu){
        huType.push(isHu);
    }

    isHu = this.pengpenghu(user,allPai,laiziCount,pai);
    if(isHu){
        huType.push(isHu);
    }

    isHu = this.menqing(user);
    if(isHu){
        huType.push(isHu);
    }
    return huType;
};

pro.checkHasJiang = function(user,pai){
    var mahjongs = user.mahjong;
    if(pai){
        mahjongs = mahjongs.concat([pai]);
    }
    mahjongs = [].concat(mahjongs);
    if(mahjongs.length % 3 != 2){
        return false;
    }

    var laiziCount = this.getLaiziCount(mahjongs);
    if(laiziCount == mahjongs.length && mahjongs.length == 2){
        return true;
    }
    var allPai = this.transform(mahjongs);
    var doubleCount = getDoubleJiangPos(allPai);
    var result = false;
    if(doubleCount.length > 0 && !result){
        var laiziCount = this.getLaiziCount(mahjongs);
        for(var i = 0 ; i < doubleCount.length; i++){
            max = 4;
            var temp = cloneMahjong(allPai);
            clearDouble(doubleCount[i],temp);
            var needLaiziCount = clearAll(temp);
            if(needLaiziCount == laiziCount || (needLaiziCount == 0 && laiziCount == 3)){
                result = true;
                break;
            }
        }
    }

    if(laiziCount > 0 ){
        var may = getDoubleJiangAndLaiziCount(allPai);
        laiziCount -= 1;
        for(var i = 0 ; i < may.length; i ++){
            //console.log(may[i],'=============================>>>>>>>>>>',allPai);
            max = 4;
            var temp = cloneMahjong(allPai);
            temp[may[i][0]][may[i][1]] += 1;
            clearDouble(may[i],temp);
            //console.log(temp,'=====>>temp');
            var needLaiziCount = clearAll(temp);
            //console.log(max,'=====>>???',laiziCount);
            if(needLaiziCount == laiziCount || (needLaiziCount == 0 && laiziCount == 3)){
                result = true;
            }
            if(result ){
                break
            }
        }
    }

    return result;
};

pro.checkUnHasJiang = function(user,pai){
    var mahjongs = user.mahjong;
    if(pai){
        mahjongs = mahjongs.concat([pai]);
    }
    mahjongs = [].concat(mahjongs);
    if(mahjongs.length % 3 != 2){
        return false;
    }

    var laiziCount = this.getLaiziCount(mahjongs);
    var allPai = this.transform(mahjongs);

    var doubleCount = getDoublePos(allPai);
    var threeCount = getThreePosArr(allPai);
    doubleCount = doubleCount.concat(threeCount);
    var result = false;

    if(doubleCount.length > 0 && !result){
        var laiziCount = this.getLaiziCount(mahjongs);
        for(var i = 0 ; i < doubleCount.length; i++){
            max = 4;
            var temp = cloneMahjong(allPai);
            clearDouble(doubleCount[i],temp);
            var needLaiziCount = clearAll(temp);
            if(needLaiziCount == laiziCount){
                result = true;
            }
        }
    }

    if(laiziCount > 0 ){
        var may = getDoubleAndLaiziCount(allPai);
        laiziCount -= 1;
        for(var i = 0 ; i < may.length; i ++){
            //console.log(may[i],'=============================>>>>>>>>>>',allPai);
            max = 4;
            var temp = cloneMahjong(allPai);
            temp[may[i][0]][may[i][1]] += 1;
            clearDouble(may[i],temp);
            //console.log(temp,'=====>>temp');
            var needLaiziCount = clearAll(temp);
            //console.log(max,'=====>>???',laiziCount);
            if(needLaiziCount == laiziCount){
                result = true;
            }
            if(result ){
                break
            }
        }
    }

    return result;
};

/**
 * 判断是否开口
 * @param user
 * @returns {boolean}
 */
pro.checkIsKaikou = function(user){
    if(user.chi.length){
        return true;
    }

    if(user.peng.length){
        return true;
    }
    var count = 0;
    for(var i = 0; i < user.gang.length; i++){
        if(user.gang[i].type != 1){
            count += 1;
        }
    }
    if(count){
        return true;
    }
    return false;
};

pro.jianjianghu = function(user,pai){
    if(user.chi.length){
        return false;
    }
    var mahjongs = user.mahjong ;
    if(pai){
        mahjongs = mahjongs.concat(pai);
    }

    var pais = this.transform(mahjongs);
    for(var i = 0; i < pais.length ; i++){
        for(var j = 0; j < pais[i].length; j++){
            if(pais[i][j] > 0 && (j != 1 && j != 4 && j != 7)){
                console.log(11111,j);
                return false;
            }

            if(i == 3 && pais[i][j] > 0){
                return false;
            }
        }
    }

    for(var i = 0; i < user.gang.length ; i ++){
        if(user.gang[i].pai[0] >= 40 || (user.gang[i].pai[0] % 10 != 2 && user.gang[i].pai[0] % 10  != 5 && user.gang[i].pai[0] % 10  != 8)){
            console.log(3333,user.gang[i].pai[0]);
            return false;
        }
    }

    for(var i = 0; i < user.peng.length ; i ++){
        if(user.peng[i].pai[0] >= 40 || (user.peng[i].pai[0] % 10 != 2 && user.peng[i].pai[0] % 10  != 5 && user.peng[i].pai[0] % 10  != 8)){
            console.log(4444);
            return false;
        }
    }
    return 4;
}


pro.pengpenghu = function(user,pais,laiziCount,pai){
    if(user.chi.length){
        return false;
    }
    var mahjongs = user.mahjong;
    if(pai){
        mahjongs = mahjongs.concat(pai);
    }
    if(laiziCount == mahjongs.length && mahjongs.length == 2){
        return 2;
    }

    var needCount = 0;
    for(var i = 0; i < pais.length; i ++){
        needCount += getFengNeedCount(pais[i]);
    }
    needCount -= 1;

    console.log(needCount,'======>>>needCount',laiziCount);

    if(needCount == laiziCount || (needCount == 0 && laiziCount == 3) || (needCount == -1 && laiziCount == 2)){
        return 2;
    }
    return false;
}


pro.qingyise = function(user,pai,pais){
    var type;
    var temp = false;
    var mahjongs = user.mahjong;
    if(pai){
        mahjongs = mahjongs.concat(pai)
    }

    for(var i = 0; i < mahjongs.length ; i++){
        if(mahjongs[i] == this.laizi){
            continue;
        }
        if(mahjongs[i] > 0 && mahjongs[i] < 10  ){
            temp = 0;
        }

        if(mahjongs[i] > 10 && mahjongs[i] < 20 ){
            temp = 1;
        }

        if(mahjongs[i] > 20 && mahjongs[i] < 30  ){
            temp = 2;
        }
        if(mahjongs[i] > 30 && mahjongs[i] < 40 ){
            temp = 3;
        }

        if(!type){
            type  = temp;
        }
        if(type != temp){
            return false;
        }
    }


    var laiziCount = this.getLaiziCount(mahjongs);
    console.log(type,'======>>>>>>type');
    for(var i = 0; i < user.gang.length ; i ++){

        if(type != getType(user.gang[i].pai[0])){
            return false;
        }
    }

    for(var i = 0; i < user.peng.length ; i ++){
        if(type != getType(user.peng[i].pai[0])){
            return false;
        }
    }

    for(var i = 0; i < user.chi.length ; i ++){
        if(type != getType(user.chi[i].pai[0])){
            return false;
        }
    }
    return 5;
};

pro.fengyise = function(user,pai){
    var mahjongs = user.mahjong;
    if(pai){
        mahjongs = mahjongs.concat(pai);
    }

    for(var i = 0 ; i < mahjongs; i++){
        if(mahjongs[i] < 30 && mahjongs[i] >40){
            return false
        }
    }
    for(var i = 0; i < user.gang.length ; i ++){
        if(user.gang[i].pai[0] < 30 && user.gang[i].pai[0]  >40){
            return false
        }
    }

    for(var i = 0; i < user.peng.length ; i ++){
        if(user.peng[i].pai[0] < 30 && user.peng[i].pai[0]  >40){
            return false
        }
    }

    for(var i = 0; i < user.chi.length ; i ++){
        if(user.chi[i].pai[0] < 30 && user.chi[i].pai[0]  >40){
            return false
        }
    }
    return 6;
};

pro.menqing = function(user,pai){
    var mahjongs = user.mahjong;
    if(pai){
        return false;
    }
    if(user.peng.length > 0){
        return false;
    }

    for(let i = 0; i < user.gang.length; i++){
        if(user.gang[i].type != 1){
            return false;
        }
    }
    return 13;
}



/**
 * 检测杠牌
 * @param user
 * @param pai
 * @returns {boolean}
 */
pro.checkWaiGang = function(user,pai){
    var arr = user.mahjong;
    var count = 0;
    for(var i = 0 ; i < arr.length ; i++){
        if(arr[i] == pai && pai != 99){
            count += 1;
        }
    }

    if(count >= 3){
        return true;
    }
    return false;
};


/**
 * 检测杠牌
 * @param user
 * @param pai
 * @returns {boolean}
 */
pro.checkGang = function(user,pai){
    var arr = user.mahjong;
    var allPai = this.transform(arr);
    var obj = {};
    var type = 1 ; // 1 内杠 2 外杠
    if(pai == this.laizi || pai > 30){
        return  false;
    }
    if(pai){
        var count = 0;
        for(var i = 0; i < arr.length; i ++){
            if((pai == arr[i] && pai != 99)){
                count += 1;
            }
        }
        if(count == 3){
            obj = {
                type :  3,
                pai : pai
            };
        }
        if(count == 4){
            obj = {
                type :  1,
                pai : pai
            };
        }

        for(var j = 0 ; j < user.peng.length; j++){
            if(user.peng[j].pai[0] == pai){
                obj = {
                    type :  2,
                    pai : pai
                };
            }
        }
    }
    return obj;
};

//检测碰牌
pro.checkPeng = function(user,pai){
    var arr = user.mahjong;
    var count = 0;
    for(var i = 0 ; i < arr.length ; i++){
        if(arr[i] == this.laizi || (this.hhType == 1 && arr[i] == 42) || (this.hhType == 2 && arr[i] > 40)){
            continue
        }

        if(arr[i] == pai){
            ++count;
        }

        if(count >= 2){
            return true;
        }
    }
    return false;
};

pro.checkChi = function(user,pai){
    var mahjongs = user.mahjong;
    var arr = [];
    if(pai == this.laizi){
        return arr;
    }

    if(mahjongs.indexOf(pai + 1) != -1 &&  mahjongs.indexOf(pai + 2) != -1 &&  pai < 30){
        arr.push(pai);
        arr.push(pai + 1);
        arr.push(pai + 2);
    }

    if(mahjongs.indexOf(pai + 1) != -1 &&  mahjongs.indexOf(pai - 1) != -1 &&  pai < 30){
        arr.push(pai - 1);
        arr.push(pai);
        arr.push(pai + 1);
    }

    if(mahjongs.indexOf(pai - 1) != -1 &&  mahjongs.indexOf(pai - 2) != -1 &&  pai < 30){
        arr.push(pai - 1);
        arr.push(pai - 2);
        arr.push(pai);
    }
    return arr;
}

var clearDouble = function(jiangPos , allPai){
    allPai[jiangPos[0]][jiangPos[1]] -= 2;
    if(allPai[jiangPos[0]][jiangPos[1]] < 0){
        allPai[jiangPos[0]][jiangPos[1]] = 0
    }
};

var getThreePosArr = function(arr){
    var thrArr = [];
    for(var i = 0 ; i < arr.length ; i++){
        for(var j = 0 ; j < arr[i].length ; j ++ ){
            if(arr[i][j] >= 3){
                var temp = [i, j];
                thrArr.push(temp);
            }
        }
    }
    return thrArr;
};
var getDoublePos = function(arr){
    var doubArr = [];
    for(var i = 0 ; i < arr.length ; i++){
        for(var j = 0 ; j < arr[i].length ; j ++ ){
            if(arr[i][j] == 2){
                var temp = [i, j];
                doubArr.push(temp);
            }
        }
    }
    return doubArr;
};
var getDoubleJiangPos = function(arr){
    console.log(arr)
    var doubArr = [];
    for(var i = 0 ; i < arr.length ; i++){
        if(i > 2){
            break;
        }
        for(var j = 0 ; j < arr[i].length ; j ++ ){
            if(arr[i][j] >= 2 && ( j == 1 || j == 4 || j == 7)){
                var temp = [i, j];
                doubArr.push(temp);
            }
        }
    }
    return doubArr;
};



pro.qiduiQransform = function(pai){
    var arr = [
        [0,0,0,0,0,0,0,0,0],//万
        [0,0,0,0,0,0,0,0,0],//硕
        [0,0,0,0,0,0,0,0,0],//筒
        [0,0,0,0,0,0,0,0,0], //字
        [0,0,0,0,0,0,0,0,0], //发财 红中
    ];

    for(var i = 0; i < pai.length; i++){
        if(pai[i] == 42){
            continue;
        }

        if(this.hhType == 2 && pai[i] == 41){
            continue;
        }

        if(pai[i] != this.laizi ){
            var type = getType(pai[i]);
            var num = pai[i] % 10 - 1;
            arr[type][num] += 1;
        }
    }
    return arr;
};

pro.transform = function(pai){
    var arr = [
        [0,0,0,0,0,0,0,0,0],//万
        [0,0,0,0,0,0,0,0,0],//硕
        [0,0,0,0,0,0,0,0,0],//筒
        [0,0,0,0,0,0,0,0,0] //字
    ];

    for(var i = 0; i < pai.length; i++){
        if(pai[i] == 41 || pai[i] == 42){
            continue;
        }
        if(pai[i] != this.laizi ){
            var type = getType(pai[i]);
            var num = pai[i] % 10 - 1;
            arr[type][num] += 1;
        }
    }
    return arr;
};

var getDoubleAndLaiziCount = function(allPai){
    var arr = [];
    for(var i = 0 ; i < allPai.length;i++){
        for(var j = 0 ; j < allPai[i].length;j++){
            if(allPai[i][j] != 0){
                arr.push([i,j]);
            }
        }
    }
    return arr;
};

var getDoubleJiangAndLaiziCount = function(allPai){
    var arr = [];
    for(var i = 0 ; i < allPai.length;i++){
        if(i > 2){
            break;
        }
        for(var j = 0 ; j < allPai[i].length;j++){
            if(allPai[i][j] != 0 && (j == 1 || j == 4 || j == 7)){
                arr.push([i,j]);
            }
        }
    }
    return arr;
};



var getType = function(num){
    if(num > 0 && num < 10){
        return 0;
    }

    if(num > 10 && num < 20){
        return 1;
    }

    if(num > 20 && num < 30){
        return 2;
    }
    if(num > 30 && num < 40){
        return 3;
    }
    if(num > 40 && num < 50){
        return 4;
    }
};

pro.getLaiziCount = function(mahjongs){
    var laiziCount = 0;
    for(var i = 0 ; i < mahjongs.length; i++){
        if(mahjongs[i] == this.laizi){
            laiziCount += 1;
        }
    }
    return laiziCount;
};

var cloneMahjong = function(allPais){
    var cloneArr = [];
    for(var i = 0 ; i < allPais.length ; i++){
        var arr = [];
        for(var j = 0; j < allPais[i].length; j++){
            arr.push(allPais[i][j]);
        }
        cloneArr.push(arr);
    }
    return cloneArr;
};


var getThreePos = function(arr){
    var thrArr = [];
    for(var j = 0 ; j < arr.length ; j ++ ){
        if(arr[j] >= 3){
            thrArr.push(j);
        }
    }
    return thrArr;
};

var clearThree = function(pais,index){
    var threeCount = getThreePos(pais);
    for(var i = 0 ; i < threeCount.length ; i++){
        if(!pais[threeCount[i] - 1] || !pais[threeCount[i] + 1]){
            pais[threeCount[i]] -= 3;
            clearThree(pais,index);
            return threeCount[i] ;
        }
    }
};
//var clear = function(pais,index){
//    getNeedCount(pais);
//    return max;
//};



var clearStraight = function(pais,arr){
    for(var i = 0; i < arr.length; i ++){
        pais[arr[i]] -= 1;
    }
};

var getAllStraight  = function(pais){
    var allArr = [];
    //console.log(pais,'====>>>pais');
    for(var i = 0 ; i < pais.length; i ++){
        if(pais[i] >= 1 && pais[i+1] >= 1 && pais[i + 2] >= 1){
            allArr.push([i , i + 1, i + 2])
        }
    }
    return allArr;
};

var clearAll = function(allPai){
    var allNeed = 0;
    for(var i = 0; i < allPai.length;i++){
        max = 4;
        if(i < 3){
            getNeedCount(allPai[i]);
        }else{
            getFengNeedCount(allPai[i])
        }
        allNeed += max;
    }
    return allNeed;
};


var getNeedCount = function(pais,needCount){
    needCount = needCount || 0;
    var arr = [];
    var clone ;
    for(var i = 0; i < pais.length; i ++){
        if(pais[i] > 0){
            //一张单牌需要两个癞子
            if((pais[i + 1] > 0 && pais[i + 1] != undefined  && pais[i + 2] > 0 && pais[i + 2] != undefined) || (pais[i] == 3)){
                //console.log(1111,pais);
                if(pais[i + 1] > 0 && pais[i + 1] != undefined  && pais[i + 2] > 0 && pais[i + 2] != undefined){
                    clone = [].concat(pais);
                    clone[i] -= 1;
                    clone[i + 1] -= 1;
                    clone[i + 2] -= 1;
                    if(needCount <= max){
                        getNeedCount(clone,needCount);
                    }
                }
                if(pais[i] == 3){
                    clone = [].concat(pais);
                    clone[i] -= 3;
                    if(needCount <= max){
                        getNeedCount(clone,needCount);
                    }
                }
            }else if(pais[i] == 2 || (pais[i + 1] == 0 && pais[i + 1] != undefined  && pais[i + 2] > 0 && pais[i + 2] != undefined) || (pais[i + 1] > 0 && pais[i + 1] != undefined)){
                needCount += 1;
                if(pais[i] == 2){
                    clone = [].concat(pais);
                    clone[i] -= 2;
                    if(needCount <= max){
                        getNeedCount(clone,needCount);
                    }
                }

                if((pais[i + 1] == 0 && pais[i + 1] != undefined  && pais[i + 2] > 0 && pais[i + 2] != undefined)){
                    clone = [].concat(pais);
                    clone[i] -= 1;
                    clone[i + 2] -= 1;
                    if(needCount <= max){
                        getNeedCount(clone,needCount);
                    }
                }

                if(pais[i + 1] > 0 && pais[i + 1] != undefined){
                    clone = [].concat(pais);
                    clone[i] -= 1;
                    clone[i + 1] -= 1;
                    if(needCount <= max){
                        getNeedCount(clone,needCount);
                    }

                }
            }else if((pais[i + 1] == 0 && pais[i + 1] != undefined  && pais[i + 2] == 0 && pais[i + 2] != undefined) ||
                (pais[i - 1] == 0 && pais[i - 1] != undefined  && pais[i - 2] == 0 && pais[i - 2] != undefined)
            ){
                needCount += 2;
                if((pais[i + 1] == 0 && pais[i + 1] != undefined  && pais[i + 2] == 0 && pais[i + 2] != undefined)){
                    clone = [].concat(pais);
                    clone[i] -= 1;
                    if(needCount <= max){
                        getNeedCount(clone,needCount);
                    }
                }
                if((pais[i - 1] == 0 && pais[i - 1] != undefined  && pais[i - 2] == 0 && pais[i - 2] != undefined)){
                    clone = [].concat(pais);
                    clone[i] -= 1;
                    if(needCount <= max){
                        getNeedCount(clone,needCount);
                    }
                }
            }
        }
    }

    var isAllClear = true;
    if(clone){
        for(var i = 0 ; i < clone.length; i ++){
            if(clone[i] > 0){
                isAllClear = false;
                break;
            }
        }
        if(isAllClear){
            max = max < needCount ? max : needCount;
        }
        if(!isAllClear && needCount < max ){
            getNeedCount(clone,needCount);
        }
    }else{
        for(var i = 0 ; i < pais.length; i ++){
            if(pais[i] > 0){
                isAllClear = false;
                break;
            }
        }
        if(isAllClear){
            max = max < needCount ? max : needCount;
        }
    }

    return needCount;
};

var getFengNeedCount = function(pais,needCount){
    needCount = needCount || 0;
    var arr = [];
    var clone ;
    for(var i = 0; i < pais.length; i ++){
        if(pais[i] > 0){
            //一张单牌需要两个癞子
            if(pais[i] == 1){
                pais[i] -= 1;
                needCount += 2;
            }else if(pais[i] == 2){
                pais[i] -= 2;
                needCount += 1;
            }else if(pais[i] == 3){
                pais[i] -= 3;
            }else if(pais[i] == 4){
                pais[i] -= 3;
                needCount += 2;
            }
        }
    }
    max = needCount;
    return needCount;
};

var mahjongs = [
    1,2,3,4,5,6,7,8,9,11,12,13,14,15,16,17,18,19,21,22,23,24,25,26,27,28,29,31,32,33,34,35
];

pro.canHu = function(user){
    var arr = [];
    for(var i = 0 ; i < mahjongs.length;i++){
        let isHu = this.checkHu(user,mahjongs[i]);
        if( isHu && isHu.length > 0 ){
            arr.push(mahjongs[i]);
        }
    }
    return arr;
};


pro.checkBrightMahjong = function(user){
    let mahjongs = user.mahjong;
    if(mahjongs.indexOf(35) != -1 && mahjongs.indexOf(41) != -1 && mahjongs.indexOf(42) != -1){
        return true;
    }
    return false;
};


var testmahjongs = [
    1,2,3,4,5,6,7,8,9
];
var checks = new Check(2);


module.exports = Check;


//
//var member = {
//    mahjong:  [ 21,25,27,2,21] ,
//    peng:
//        [ {pai : [26,26,26]} ,{pai : [28,28,28] }],
//    gang: [],
//    chi: [{pai : [23,24,25]}],
//}
////console.log(isvail([ 2, 2, 2, 1, 99, 2, 2, 2, 2, 3, 2, 4, 8, 8 ]));
////var start = Date.now();
////console.log(checks.canHu(member));
//console.log(checks.checkHu(member),'====>>>>>>>>>>>>>>');
//console.log(Date.now() - start);
////clear([ 0, 0, 1, 1, 3, 2, 2, 0, 0 ] ,0);
////console.log(getFengNeedCount([ 2, 3, 3, 3, 3] ,0))
//console.log(max);

//let roomData = {"roomNo":"113551","roundCount":8,"round":1,"currPlayUid":"59361ab6eccf6136bfb18897","currUserInaugurated":16,"previousOut":null,"userHu":false,"users":[{"ipaddress":"113.57.28.32","nickname":"88888888","headimgurl":"http://wx.qlogo.cn/mmopen/xgghTUGdCxUJiaJIKVYf5BRCl5qkrvFSZkicVZmAOYPEGfqiblKAtsS9JhOUTJibVKlXr9Uy0EGQVlzmFa5QUkTAQXhTVic6oxrMq/0","sex":1,"score":0,"mahjong":[23,42,1,42,16,17,12,6,35,28,6,22,5,16],"peng":[],"gang":[],"chi":[],"status":3,"uid":"59361ab6eccf6136bfb18897","playOutMahjong":[],"id":100008,"latitude":1,"longitude":1,"unHu":[],"funNum":1,"funRecord":[],"roomCard":916,"isAction":0,"brightMahjong":[],"hasBrightMahjong":false},{"ipaddress":"113.57.28.32","nickname":"44444444","headimgurl":"http://wx.qlogo.cn/mmopen/xgghTUGdCxUJiaJIKVYf5BRCl5qkrvFSZkicVZmAOYPEGfqiblKAtsS9JhOUTJibVKlXr9Uy0EGQVlzmFa5QUkTAQXhTVic6oxrMq/0","sex":1,"score":0,"mahjong":[11,8,15,7,23,22,19,26,25,26,15,27,35],"peng":[],"gang":[],"chi":[],"status":3,"uid":"59241e49eccf6136bfb18893","playOutMahjong":[],"id":100004,"latitude":1,"longitude":1,"unHu":[],"funNum":1,"funRecord":[],"roomCard":1000,"isAction":0,"brightMahjong":[],"hasBrightMahjong":false},{"ipaddress":"113.57.28.32","nickname":"33333333","headimgurl":"http://wx.qlogo.cn/mmopen/xgghTUGdCxUJiaJIKVYf5BRCl5qkrvFSZkicVZmAOYPEGfqiblKAtsS9JhOUTJibVKlXr9Uy0EGQVlzmFa5QUkTAQXhTVic6oxrMq/0","sex":1,"score":0,"mahjong":[1,28,16,24,35,41,22,41,26,41,19,6,25],"peng":[],"gang":[],"chi":[],"status":2,"uid":"59241e30eccf6136bfb18892","playOutMahjong":[],"id":100003,"latitude":1,"longitude":1,"unHu":[],"funNum":1,"funRecord":[],"roomCard":1000,"isAction":0,"brightMahjong":[],"hasBrightMahjong":false},{"ipaddress":"113.57.28.32","nickname":"22222222","headimgurl":"http://wx.qlogo.cn/mmopen/xgghTUGdCxUJiaJIKVYf5BRCl5qkrvFSZkicVZmAOYPEGfqiblKAtsS9JhOUTJibVKlXr9Uy0EGQVlzmFa5QUkTAQXhTVic6oxrMq/0","sex":1,"score":0,"mahjong":[14,25,24,18,13,14,14,9,17,2,15,21,13],"peng":[],"gang":[],"chi":[],"status":2,"uid":"59241df8eccf6136bfb18891","playOutMahjong":[1],"id":100002,"latitude":1,"longitude":1,"unHu":[],"funNum":1,"funRecord":[],"roomCard":988,"isAction":0,"brightMahjong":[],"hasBrightMahjong":false}],"dice":{"dice1":1,"dice2":3},"status":2,"banker":"59361ab6eccf6136bfb18897","mahjongCount":66,"cannelDissove":[],"agreeDissolve":[],"dissUid":0,"roomType":"1","huCount":"4","maxHuCount":300,"laizi":2,"laizipi":{"59241df8eccf6136bfb18891":1},"ownerUid":"59361ab6eccf6136bfb18897","gid":"319a8121-d2e9-4eb1-95c6-122c75dfc7f3","brightOver":false,"gameType":"2","hhType":"1","ownerNickname":"88888888"}
//
//for(let i = 0 ; i < roomData.users.length; i ++){
//    console.log(checks.checkBrightMahjong(roomData.users[i]))
//}