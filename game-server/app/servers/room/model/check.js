/**
 * Created by Mrli on 17/5/8.
 */

let Check = function(is7dui){
    this.laiziRecord = [];
    this.laiziCount = 0;
    this.is7dui = is7dui || false;
};
//console.log = function(){}
var max = 4;
let pro = Check.prototype ;
/**
 * 检测胡牌
 * @param user
 * @returns {boolean}
 */

pro.checkHu = function(user,pai){
    let mahjongs = user.mahjong;
    if(pai){
        mahjongs = mahjongs.concat([pai]);
    }

    if(mahjongs.length % 3 != 2){
        return false;
    }

    let laiziCount = getLaiziCount(mahjongs);
    let allPai = transform(mahjongs);


    //check4个红中
    let count = 0;
    for(var i = 0 ; i < mahjongs.length;i++){
        if(mahjongs[i] == 99){
            count += 1;
        }
    }

    if(count >= 1 && mahjongs.length == 2){
        return true;
    }

    if(count >= 4){
        return true;
    }

    var have7dui = this.check7dui(allPai,laiziCount);
    if(this.is7dui && have7dui){
        return true;
    }

    let doubleCount = getDoublePos(allPai);
    let threeCount = getThreePosArr(allPai);
    doubleCount = doubleCount.concat(threeCount);
    let result = false;

    if(laiziCount > 0 ){
        let may = getDoubleAndLaiziCount(allPai);
        laiziCount -= 1;
        for(let i = 0 ; i < may.length; i ++){
            //console.log(may[i],'=============================>>>>>>>>>>',allPai);
            max = 4;
            let temp = cloneMahjong(allPai);
            temp[may[i][0]][may[i][1]] += 1;
            clearDouble(may[i],temp);
            //console.log(temp,'=====>>temp');
            let needLaiziCount = clearAll(temp);
            //console.log(max,'=====>>???',laiziCount);
            if(needLaiziCount == laiziCount){
                result = true;
            }
            if(result ){
                break
            }
        }
    }

    if(doubleCount.length > 0 && !result){
        let laiziCount = getLaiziCount(mahjongs);
        for(let i = 0 ; i < doubleCount.length; i++){
            max = 4;
            //console.log(doubleCount[i],'=============================>>>>>>>>>>',allPai);
            let temp = cloneMahjong(allPai);
            clearDouble(doubleCount[i],temp);
            //console.log(temp,'=====>>temp');
            let needLaiziCount = clearAll(temp);
            //console.log(max,'=====>>???',laiziCount);
            if(needLaiziCount == laiziCount){
                result = true;
            }
        }
    }

    return result;
};

pro.checkHongZhong = function(user,pai){
    if(user.mahjong.indexOf(99) == -1 && pai != 99){
        return true
    }
    return false;
};

/**
 * 检测杠牌
 * @param user
 * @param pai
 * @returns {boolean}
 */
pro.checkWaiGang = function(user,pai){
    let arr = user.mahjong;
    let count = 0;
    for(let i = 0 ; i < arr.length ; i++){
        if(arr[i] == pai && pai != 99){
            count += 1;
        }
    }

    if(count >= 3){
        return true;
    }
    return false;
};

pro.check7dui = function(allPai,laiziCount){
    let duizi = 0;
    for(let i = 0 ; i < allPai.length; i ++){
        for(let j = 0; j < allPai[i].length; j ++){
            if(allPai[i][j] == 4){
                duizi += 2;
            }else if(allPai[i][j] >= 2){
                duizi += 1;
            }
        }
    }

    let hasLaizi = 7 - duizi;
    if(hasLaizi <= laiziCount){
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
    let arr = user.mahjong;
    let allPai = transform(arr);
    let obj = {};
    let type = 1 ; // 1 内杠 2 外杠

    if(pai){
        let count = 0;
        for(let i = 0; i < arr.length; i ++){
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

        for(let j = 0 ; j < user.peng.length; j++){
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
    let arr = user.mahjong;
    let count = 0;
    for(let i = 0 ; i < arr.length ; i++){
        if(arr[i] == 99){
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

let clearDouble = function(jiangPos , allPai){
    allPai[jiangPos[0]][jiangPos[1]] -= 2;
    if(allPai[jiangPos[0]][jiangPos[1]] < 0){
        allPai[jiangPos[0]][jiangPos[1]] = 0
    }
};

let getThreePosArr = function(arr){
    let thrArr = [];
    for(let i = 0 ; i < arr.length ; i++){
        for(let j = 0 ; j < arr[i].length ; j ++ ){
            if(arr[i][j] >= 3){
                let temp = [i, j];
                thrArr.push(temp);
            }
        }
    }
    return thrArr;
};
let getDoublePos = function(arr){
    let doubArr = [];
    for(let i = 0 ; i < arr.length ; i++){
        for(let j = 0 ; j < arr[i].length ; j ++ ){
            if(arr[i][j] == 2){
                let temp = [i, j];
                doubArr.push(temp);
            }
        }
    }
    return doubArr;
};

let transform = function(pai){
    let arr = [
        [0,0,0,0,0,0,0,0,0],//万
        [0,0,0,0,0,0,0,0,0],//硕
        [0,0,0,0,0,0,0,0,0]//筒
    ];

    for(let i = 0; i < pai.length; i++){
        if(pai[i] != 99){
            let type = getType(pai[i]);
            let num = pai[i] % 10 - 1;
            arr[type][num] += 1;
        }
    }
    return arr;
};

let getDoubleAndLaiziCount = function(allPai){
    let arr = [];
    for(let i = 0 ; i < allPai.length;i++){
        for(let j = 0 ; j < allPai[i].length;j++){
            if(allPai[i][j] != 0){
                arr.push([i,j]);
            }
        }
    }
    return arr;
};


let getType = function(num){
    if(num > 0 && num < 10){
        return 0;
    }

    if(num > 10 && num < 20){
        return 1;
    }

    if(num > 20 && num < 30){
        return 2;
    }
};

let getLaiziCount = function(mahjongs){
    let laiziCount = 0;
    for(let i = 0 ; i < mahjongs.length; i++){
        if(mahjongs[i] == 99){
            laiziCount += 1;
        }
    }
    return laiziCount;
};

let cloneMahjong = function(allPais){
    let cloneArr = [];
    for(let i = 0 ; i < allPais.length ; i++){
        let arr = [];
        for(let j = 0; j < allPais[i].length; j++){
            arr.push(allPais[i][j]);
        }
        cloneArr.push(arr);
    }
    return cloneArr;
};


let getThreePos = function(arr){
    let thrArr = [];
    for(let j = 0 ; j < arr.length ; j ++ ){
        if(arr[j] >= 3){
            thrArr.push(j);
        }
    }
    return thrArr;
};

let clearThree = function(pais,index){
    let threeCount = getThreePos(pais);
    for(let i = 0 ; i < threeCount.length ; i++){
        if(!pais[threeCount[i] - 1] || !pais[threeCount[i] + 1]){
            pais[threeCount[i]] -= 3;
            clearThree(pais,index);
            return threeCount[i] ;
        }
    }
};
let clear = function(pais,index){
    getNeedCount(pais);
    return max;
};



let clearStraight = function(pais,arr){
    for(var i = 0; i < arr.length; i ++){
        pais[arr[i]] -= 1;
    }
};

let getAllStraight  = function(pais){
    var allArr = [];
    //console.log(pais,'====>>>pais');
    for(var i = 0 ; i < pais.length; i ++){
        if(pais[i] >= 1 && pais[i+1] >= 1 && pais[i + 2] >= 1){
            allArr.push([i , i + 1, i + 2])
        }
    }
    return allArr;
};

let clearAll = function(allPai){
    var allNeed = 0;
    for(var i = 0; i < allPai.length;i++){
        max = 4;
        clear(allPai[i],i);
        allNeed += max;
    }
    return allNeed;
};


let getNeedCount = function(pais,needCount){
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
                //console.log(2222,pais);
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

let mahjongs = [
    1,2,3,4,5,6,7,8,9,11,12,13,14,15,16,17,18,19,21,22,23,24,25,26,27,28,29,99
];

pro.canHu = function(user){
    var arr = [];
    for(let i = 0 ; i < mahjongs.length;i++){
        if(this.checkHu(user,mahjongs[i])){
            arr.push(mahjongs[i]);
        }
    }
    return arr;
};





let testmahjongs = [
    1,2,3,4,5,6,7,8,9
];
let checks = new Check(true);

var getMahjong = function(){
    var arr = [];
    for(var i = 0 ; i < 5 ; i++){
        var random = parseInt(Math.random() * testmahjongs.length);
        var mahjong = testmahjongs[random];
        if(i == 4){
            arr.push(mahjong);
            arr.push(mahjong);
            break;
        }

        //if(mahjong == 99){
        //    arr.push(mahjong);
        //    arr.push(mahjong);
        //    arr.push(mahjong);
        //    continue;
        //}

        var type = parseInt(Math.random() * 2);
        if(type == 0){
            arr.push(mahjong);
            arr.push(mahjong);
            var random = parseInt(Math.random() * 2);
            if(random == 1){
                arr.push(mahjong);
            }else{
                arr.push(99);
            }

        }else{
            if(mahjong % 10 == 1){
                arr.push(mahjong);
                var random = parseInt(Math.random() * 3);
                if(random == 1){
                    arr.push(mahjong + 2);
                    arr.push(99);
                }else if(random == 0){
                    arr.push(99);
                    arr.push(mahjong + 1);
                }else{
                    arr.push(mahjong + 1);
                    arr.push(mahjong + 2);
                }


            }else if(mahjong % 10 == 9){
                arr.push(mahjong);
                var random = parseInt(Math.random() * 3);
                if(random == 1){
                    arr.push(mahjong - 1);
                    arr.push(99);
                }else if(random == 0){
                    arr.push(99);
                    arr.push(mahjong - 2);
                }else{
                    arr.push(mahjong - 1);
                    arr.push(mahjong - 2);
                }
            }else{
                var random = parseInt(Math.random() * 3);
                arr.push(mahjong);
                if(random == 1){
                    arr.push(mahjong - 1);
                    arr.push(99);
                }else if(random == 0){
                    arr.push(99);
                    arr.push(mahjong + 1);
                }else{
                    arr.push(mahjong - 1);
                    arr.push(mahjong + 1);
                }
            }
        }

    }
    return arr;
};
var isvail = function(mahjongs){
    var allPai = transform(mahjongs);
    //console.log(allPai,'=====>>>');
    for(var i = 0 ; i < allPai.length ; i ++){
        for(var j = 0; j < allPai[i].length; j ++){
            if(allPai[i][j] > 4){
                return false;
            }
        }
    }
    return true;
}

module.exports = Check;


var test = function(){
    console.log = function(){}
    for(var i = 0 ; i < 1000000000;i++){
        var mahjongs = getMahjong();
        if(!isvail(mahjongs)){
            continue;
        }
        let member = {
            mahjong :mahjongs
        }

        if(i % 1000000 == 0){
            console.error(i);
        }
        console.error(i);
        //console.error('???????',i,member.mahjong);
        if(!checks.checkHu(member)){
            console.error(i,member.mahjong,checks.checkHu(member));
            break;
        }
    }
};

//var member = {
//    mahjong : [99,99]
//}
//////console.log(isvail([ 2, 2, 2, 1, 99, 2, 2, 2, 2, 3, 2, 4, 8, 8 ]));
//var start = Date.now();
////console.log(checks.canHu(member));
//console.log(checks.checkHu(member));
//console.log(Date.now() - start);
//clear([ 0, 0, 1, 1, 3, 2, 2, 0, 0 ] ,0);
//console.log(getNeedCount([ 0, 0, 0, 0, 0, 0, 0, 0, 1 ] ,0))
//console.log(max);
//test();

