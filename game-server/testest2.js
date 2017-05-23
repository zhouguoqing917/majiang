/**
 * Created by Mrli on 17/3/9.
 */
let Check = function(is7dui){
    this.laiziRecord = [];
    this.laiziCount = 0;
    this.is7dui = is7dui || false;
};
//console.log = function(){}
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
    //if(mahjongs % 3 != 2){
    //    return false;
    //}

    let laiziCount = getLaiziCount(mahjongs);
    let allPai = transform(mahjongs);

    //check4个红中
    let count = 0;
    for(var i = 0 ; i < mahjongs.length;i++){
        if(mahjongs[i] == 99){
            count += 1;
        }
    }

    if(count >= 4){
        return true;
    }

    var have7dui = this.check7dui(allPai,laiziCount);
    if(this.is7dui && have7dui){
        return true;
    }

    let doubleCount = getDoublePos(allPai);
    let threeCount = getThreePos(allPai);
    doubleCount = doubleCount.concat(threeCount);
    let result = false;

    if(laiziCount > 0 ){
        if(isWin(allPai) == 0 && laiziCount == 2){
            return true;
        }
        let may = getDoubleAndLaiziCount(allPai);
        laiziCount -= 1;
        for(let i = 0 ; i < may.length; i ++){
            console.log(may[i],'=============================>>>>>>>>>>',allPai);
            let temp = cloneMahjong(allPai);
            temp[may[i][0]][may[i][1]] += 1;
            result = check(may[i],temp,laiziCount,false);
            if(result){
                break
            }
        }
    }

    if(doubleCount.length > 0 && !result){
        let laiziCount = getLaiziCount(mahjongs);
        for(let i = 0 ; i < doubleCount.length; i++){
            console.log(doubleCount[i],'=============================>>>>>>>>>>',allPai);
            let temp = cloneMahjong(allPai);
            result = check(doubleCount[i],temp,laiziCount,false);
            //if(!result){
            //    temp = cloneMahjong(allPai);
            //    result = check(doubleCount[i],temp,laiziCount,true);
            //}
            if(result){
                break
            }
        }
    }

    if(!result){
        if(isWin(allPai) == 0 && laiziCount == 2){
            return true;
        }
        let may = getDoubleAndLaiziCount(allPai);
        laiziCount -= 1;
        for(let i = 0 ; i < may.length; i ++){
            console.log(may[i],'=============================>>>>>>>>>>',allPai);
            let temp = cloneMahjong(allPai);
            temp[may[i][0]][may[i][1]] += 1;
            result = check(may[i],temp,laiziCount,true);
            if(result){
                break
            }
        }
    }

    if(!result){
        let laiziCount = getLaiziCount(mahjongs);
        for(let i = 0 ; i < doubleCount.length; i++){
            console.log(doubleCount[i],'=============================>>>>>>>>>>',allPai);
            let temp = cloneMahjong(allPai);
            result = check(doubleCount[i],temp,laiziCount,true);
            //if(!result){
            //    temp = cloneMahjong(allPai);
            //    result = check(doubleCount[i],temp,laiziCount,true);
            //}
            if(result){
                break
            }
        }
    }

    if(!result){
        result = csCheck(allPai);
    }

    return result;
};

var csCheck = function(allPai){
    var threeCount = getThreePos(allPai);
    var doubleCount = getDoublePos(allPai);

    var csClearStraight = function(allPai,posArr){
        posArr = posArr || [];
        for(var i = 0 ; i < allPai.length; i++){
            for(var j = 0; j < allPai[i].length; j ++){
                if(allPai[i][j] > 0 && allPai[i][j + 1] > 0 && allPai[i][j + 2] > 0){
                    posArr.push([i,j]);
                    posArr.push([i,j + 1]);
                    posArr.push([i,j + 2]);
                    allPai[i][j] -= 1;
                    allPai[i][j + 1] -= 1;
                    allPai[i][j + 2] -= 1;
                    return csClearStraight(allPai,posArr);
                }
            }
        }
        return posArr;
    };
    var csClearThree = function(allPai){
        var threeCount = getThreePos(allPai);
        for(var i = 0 ; i < threeCount.length ; i++){
            allPai[threeCount[i][0]][threeCount[i][1]] -= 3;
        }
        return threeCount;
    };
    var  backClear = function(allPai,posArr,count){
        for(var i = 0; i < posArr.length; i ++){
            allPai[posArr[i][0]][posArr[i][1]] += count;
        }
    };
    var checkFun = function(jiangPos,allPai,isRes){
        //把将去掉

        clearDouble(jiangPos,allPai);
        //去除顺子
        var clearStraightpos;
        var clearThreePos;
        if(!isRes ){
            clearStraightpos = csClearStraight(allPai);
            clearThreePos = csClearThree(allPai);
        }else{
            clearThreePos = csClearThree(allPai);
            clearStraightpos = csClearStraight(allPai);
        }

        //把三张去掉
        var mark = false;
        if(!isWin(allPai)){
            mark = true;
        }

        //还原
        backClear(allPai,[jiangPos],2);//将
        backClear(allPai,clearThreePos,3);//三张
        backClear(allPai,clearStraightpos,1);//顺子
        return mark;
    };


    var maybe = [];
    maybe = doubleCount.concat(threeCount);

    var result = false;
    var jiangPos ;
    if(doubleCount.length == 0 && threeCount.length == 0){//没有一对 且 三张的也没有  那必然不能胡牌
        return false;
    }else{
        for(var i = 0 ; i < maybe.length; i ++){
            jiangPos = maybe[i];
            result = checkFun(maybe[i],allPai,false);
            if(result){
                break;
            }
        }
        if(!result){
            for(var i = 0 ; i < maybe.length; i ++){
                jiangPos = maybe[i];
                result = checkFun(maybe[i],allPai,true);
                if(result){
                    break;
                }
            }
        }
    }
    return result;
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


pro.checkHongZhong = function(user,pai){
    if(user.mahjong.indexOf(99) == -1 && pai != 99){
        return true
    }
    return false;
};


let check = function(jiangPos,allPai,laiziCount,isRev){
    //console.log(jiangPos,'=======>>>>???');
    console.log(allPai,'=======>>>>11',jiangPos);
    clearDouble(jiangPos,allPai);
    console.log(allPai,'=======>>>>',jiangPos);
    //console.log('=====>>>>jiang',allPai);
    ////把三张去掉
    //var cloneObj = cloneMahjong(allPai);
    //var index = clearThree(cloneObj);
    //var count1 = getCount(cloneObj);
    //var cloneObj2 = cloneMahjong(allPai);
    //
    ////去除顺子
    //clearStraight(cloneObj2);
    //var count2 = getCount(cloneObj2);
    //
    //console.log(cloneObj,cloneObj2,count1,count2);
    //if(count1 < count2){
    //    clearStraight(allPai);
    //    clearThree(allPai);
    //}else{
    //    clearThree(allPai);
    //    clearStraight(allPai);
    //}

    //console.log('clear--after:',allPai,laiziCount,count1,count2);
    if(isRev){
        clearStraight(allPai);
    }

    let mark = false;
    let count = isWin(allPai);
    let temp = cloneMahjong(allPai);
    console.log('======>>clearStraight===after',allPai);
    if(count > 0 && laiziCount > 0){
        var win = clearLaizi(allPai,laiziCount,true);
        if(win){
            mark = true;
        }
        if(!mark){
            win = clearLaizi(temp,laiziCount,false);
            if(win){
                mark = true;
            }
        }
    }else if(count == 0 && (laiziCount == 0 || laiziCount == 3)){
        mark = true;
    }
    if(!isRev){
        count = clearStraight(allPai);
    }

    if(count == 0){
        mark = true;
    }
    return mark;
};

let haveStraight = function(allPai){
    var count = 0;
    for(var i = 0 ; i < allPai.length; i ++){
        for(var j = 0 ; j < allPai[i].length ; j ++){
            if(allPai[i][j] >= 1){
                count += 1;
            }else{
                count = 0;
            }
            if(count >= 3){
                return true;
            }
        }
        count = 0;
    }
    return false;
};

var  checkStraight = function(allPai,pos){
    var index1 = parseInt(pos[0]) ;
    var index2 = parseInt(pos[1]) ;
    if(allPai[index1][index2 - 1] && allPai[index1][index2] && allPai[index1][index2 + 1]){
        return true
    }
    //console.log('=======>>>',index2 + 2,index2 + 1,pos,allPai[index1][index2 + 1] , allPai[index1][index2] , allPai[index1][index2 + 2]);
    if(allPai[index1][index2 + 1] && allPai[index1][index2] && allPai[index1][index2 + 2]){
        return true
    }

    if(allPai[index1][index2 - 1] && allPai[index1][index2] && allPai[index1][index2 - 2]){
        return true
    }
}

let clearLaizi = function(allPai,laiziCount,isRev){
    let temp = false;
    let isClearLaizi = false;
    console.log('=======>>>>allPai',allPai);
    let theLess = {};
    for(let i = 0; i < allPai.length; i++){
        var key = 1000;
        for(let j = 0 ; j < allPai[i].length;j++){
            if(allPai[i][j] != 0 ){
                if(allPai[i][j + 1] != undefined  && allPai[i][j + 1] == 0){
                    allPai[i][j + 1] += 1;
                    var cloneMahjongObj = cloneMahjong(allPai);
                    console.log(cloneMahjongObj,'=====??>????')
                    var index = clearStraightForward(cloneMahjongObj);
                    console.log(cloneMahjongObj,index,'=====>>');
                    var count1 ;

                    if(index || index == 0){
                        count1 = getCount(cloneMahjongObj,index);
                        var cloneMahjongObj2 = cloneMahjong(allPai);
                        reverseClearStraight(cloneMahjongObj2);
                        var count2 = getCount(cloneMahjongObj2,index);

                        count2 = count2 < count1 ? count2 : count1;
                        console.log(count2,count1,'=====>>>count1',i,cloneMahjongObj2);
                        if(count2 < key){
                            key = count2;
                            theLess[count2] = [i,j + 1];
                        }
                    }
                    allPai[i][j + 1] -= 1;
                    console.log('===key',key);

                }
                if(allPai[i][j - 1] != undefined && allPai[i][j - 1] == 0){
                    allPai[i][j - 1] += 1;
                    var cloneMahjongObj = cloneMahjong(allPai);
                    var index = clearStraightForward(cloneMahjongObj);
                    var count1 ;
                    if(index || index == 0){
                        count1clearAll = getCount(cloneMahjongObj,index);
                        var cloneMahjongObj2 = cloneMahjong(allPai);
                        reverseClearStraight(cloneMahjongObj2);
                        var count2 = getCount(cloneMahjongObj2,index);

                        count2 = count2 < count1 ? count2 : count1;
                        console.log(count2,count1,'=====>>>count1',i,cloneMahjongObj2);
                        if(count2 < key){
                            key = count2;
                            theLess[count2] = [i,j - 1];
                        }
                    }
                    allPai[i][j - 1] -= 1;

                }


                //if(allPai[i][j + 1] != undefined && allPai[i][j + 1] == 0 && !(allPai[i][j] && allPai[i][j - 1] && allPai[i][j - 2])){
                //    allPai[i][j + 1] += 1;
                //
                //    console.log(checkStraight(allPai,[[i],[j + 1]]),'===111');
                //    if(!checkStraight(allPai,[[i],[j + 1]])){
                //        allPai[i][j + 1] -= 1;
                //    }else{
                //        temp = true;
                //    }
                //    break;
                //}else if(allPai[i][j - 1] != undefined && allPai[i][j - 1] == 0&& !(allPai[i][j] && allPai[i][j + 1] && allPai[i][j + 2])){
                //    allPai[i][j - 1] += 1;
                //    console.log(allPai,checkStraight(allPai,[[i],[j - 1]]),'===222');
                //    if(!checkStraight(allPai,[[i],[j - 1]])){
                //        allPai[i][j - 1] -= 1;
                //    }else{
                //        temp = true;
                //    }
                //    break;
                //}
            }
        }
        console.log(key,'=====>>>>>>>>');
        if(1000 != key){
            allPai[theLess[key][0]][theLess[key][1]] += 1;
            console.log(key,'=====>>>>>>>>allPaikey',allPai);
            if(checkStraight(allPai,theLess[key])){
                isClearLaizi = true;
                var cloneMahjongObj = cloneMahjong(allPai);
                var index = clearStraightForward(cloneMahjongObj);
                var count1 ;
                if(index || index == 0){
                    count1 = getCount(cloneMahjongObj,index);
                }


                var cloneMahjongObj2 = cloneMahjong(allPai);
                reverseClearStraight(cloneMahjongObj2);
                var count2;
                if(index || index == 0){
                    count2 = getCount(cloneMahjongObj2,index);
                }
                if(count1 < count2){
                    clearStraightForward(allPai)
                }else{
                    reverseClearStraight(allPai);
                }
                break;
            }else{
                allPai[theLess[key][0]][theLess[key][1]] -= 1;
            }


        }
    }
    console.log('=======>>>>allPai2222',allPai,isClearLaizi);
    if(!isClearLaizi ){
        for(let i = 0; i < allPai.length; i++) {
            var tempVar = false;
            for (let j = 0; j < allPai[i].length; j++) {
                if( allPai[i][j] == 2){
                    allPai[i][j] += 1;
                    tempVar = true;
                    break;
                }
            }
            if(tempVar){
                isClearLaizi = true;
                break;
            }
        }
    }
    console.log('=======>>>>allPai333',allPai,isClearLaizi);
    //if(isClearLaizi){
    //var clearThreePos = clearThree(allPai);
    //var cloneMahjongObj = cloneMahjong(allPai);
    //clearStraight(cloneMahjongObj);
    //var count1 = getCount(cloneMahjongObj);
    //
    //var cloneMahjongObj2 = cloneMahjong(allPai);
    //reverseClearStraight(cloneMahjongObj2);
    //var count2 = getCount(cloneMahjongObj2);
    //
    //if(count1 < count2){
    //    clearStraight(allPai)
    //}else if(count1 > count2){
    //    reverseClearStraight(allPai);
    //}else {//相等的情况
    //    var allDiff1 = getAllDiff(cloneMahjongObj);
    //    //console.log(allDiff1,allDiff2,'====================allDiff');
    //    var allDiff2 = getAllDiff(cloneMahjongObj2);
    //    if(allDiff1 < allDiff2){
    //        clearStraight(allPai)
    //    }else{
    //        reverseClearStraight(allPai);
    //    }
    //}
    //var before = 0;
    //var after = 0;
    //var isclear = false;
    //for(var i = 0 ;i < allPai.length; i ++){
    //    for(var j = 0 ; j < allPai[i].length; j++){
    //        if(allPai[i][j] > 0){
    //            before += 1;
    //        }
    //    }
    //}
    clearStraight(allPai);
    //for(var i = 0 ;i < allPai.length; i ++){
    //    for(var j = 0 ; j < allPai[i].length; j++){
    //        if(allPai[i][j] > 0){
    //            after += 1;
    //        }
    //    }
    //}
    //if(after <= before){
    //    isclear = true;
    //}
    //}



    console.log('=======>>>>allPai444',allPai,isClearLaizi,laiziCount);
    var count = isWin(allPai);
    if(isClearLaizi){
        laiziCount -= 1;
    }
    console.log('====111',laiziCount);
    if((count == 0 && laiziCount == 0 )|| (count == 0 &&laiziCount == 3) || (count == 1 && laiziCount== 2)){
        return true;
    }
    console.log('====2222',laiziCount);
    if((count == 0 && laiziCount== 0)){
        return true;
    }


    console.log('====333',laiziCount);
    if(!isClearLaizi ){
        return false;
    }
    console.log('====444',laiziCount);
    //如果有癞子 还清不掉 肯定是不能胡的
    if(laiziCount > 0){
        console.log('====333',laiziCount);
        return clearLaizi(allPai,laiziCount,isRev);
    }
    return false;
};


let getAllDiff = function(allPai,index){
    var allDiff = 0;
    for(var i = 0 ; i < allPai.length; i ++){
        if(index != i){
            continue;
        }
        var  temp = 0;
        for(var j = 0 ; j < allPai[i];j++){
            if(allPai[i][j] == 0){
                temp += 1;
            }else{
                temp = 0;
            }

            if(temp > allDiff){
                allDiff = temp;
            }
        }
    //    var index1 = -1, index2 = -1;
    //    var count ;
    //    if(index == i){
    //        for(var j = 0; j < allPai[i].length; j ++){
    //            if(index1 == -1 && allPai[i][j] > 0 && j > index2){
    //                console.log(index1,'====>>>');
    //                index1 = j;
    //            }
    //            //console.log(index1,index2,j,index2);
    //            if(index1 < index2){
    //                continue;
    //            }
    //            if(j > index1 && allPai[i][j] > 0){
    //                index2 = j;
    //            }
    //            if(index2 ){
    //                count = index2 - index1;
    //                console.log(index1,index2);
    //                if(count > allDiff){
    //                    //index1 = index2;
    //                    allDiff = count;
    //                    index1 = -1
    //                }
    //            }
    //
    //        }
    //    }

        //var indexFirst = allPai[i].indexOf(1);
        //
        //var indexEnd = allPai[i].lastIndexOf(1);
        ////console.log(allPai[i],indexFirst,indexEnd,'==================!!!!');
        //if(indexFirst >= 0 && indexEnd >= 0){
        //    allDiff += indexEnd - indexFirst;
        //}

    }
    return allDiff;
};

let getThreePos = function(arr){
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

let isWin = function(allPai){
    let count = 0;
    for(let i = 0 ; i < allPai.length; i++){
        for(let j = 0; j < allPai[i].length; j++){
            if(allPai[i][j] > 0){
                count += allPai[i][j];
            }
        }
    }
    return count;
};

let getCount = function(allPai,index){
    var count = 0;
    for(var i = 0 ; i < allPai.length; i ++){
        //console.log(index,i,'=====>>>>???');
        if(index == i){
            var indexFirst ,indexEnd;
            for(var j = 0; j < allPai[i].length; j++){
                if(allPai[i][j] > 0 ){
                    indexFirst = j;
                    break;
                }
            }
            for(var j = 0; j < allPai[i].length; j++){
                if(allPai[i][j] > 0 ){
                    indexEnd = j;
                }
            }
            //console.log(indexFirst,indexEnd,'=====end',index);
            for(var j = indexFirst ; j <= indexEnd;j++){
                if(allPai[i][j] == 0){
                    count += 1;
                }
            }
        }
    }
    return count;
};

let clearDouble = function(jiangPos , allPai){
    allPai[jiangPos[0]][jiangPos[1]] -= 2;
    if(allPai[jiangPos[0]][jiangPos[1]] < 0){
        allPai[jiangPos[0]][jiangPos[1]] = 0
    }
};

let clearThree = function(allPai,index){
    let threeCount = getThreePos(allPai);
    for(let i = 0 ; i < threeCount.length ; i++){
        if(index == threeCount[i][0] && isCanClearThree(allPai,index)){
            console.log('clearThree   ',threeCount);
            allPai[threeCount[i][0]][threeCount[i][1]] -= 3;
            clearThree(allPai,index);
            return threeCount[i][0] ;
        }else if(index != 0 && !index){
            allPai[threeCount[i][0]][threeCount[i][1]] -= 3;
            return threeCount[i][0] ;
        }

    }
};

var clearStraightForward = function(allPai){
    for(let i = 0 ; i < allPai.length; i++){
        for(let j = 0; j < allPai[i].length; j ++){
            if(allPai[i][j] > 0 && allPai[i][j + 1] > 0 && allPai[i][j + 2] > 0){
                allPai[i][j] -= 1;
                allPai[i][j + 1] -= 1;
                allPai[i][j + 2] -= 1;
                return i;
                //return clearStraightForward(allPai);
            }
        }
    }
};

let isCanClearThree = function(allPai,index){
    for(var i = 0; i < allPai.length; i ++){
        if(index == i){
            for(var j = 0; j < allPai[i].length; j ++){
                if(allPai[i][j] >= 3 && (!allPai[i][j - 1] || !allPai[i][j + 1])){
                    return true;
                }
            }
        }

    }
}

let clearStraight = function(allPai){
    console.log(allPai,'=======>>>>>>0000');
    var cloneMahjongObj = cloneMahjong(allPai);
    var index = clearStraightForward(cloneMahjongObj);
    console.log(getThreePos(cloneMahjongObj).length,';=======>>>>11');
    if(getThreePos(cloneMahjongObj).length ){
        console.log(index,'=====>?>>index');
        clearThree(cloneMahjongObj,index);
        //clearStraight(cloneMahjongObj);
    }
    console.log(cloneMahjongObj,';=======>>>>11',index);
    var count1 = getAllDiff(cloneMahjongObj,index);


    var cloneMahjongObj2 = cloneMahjong(allPai);
    reverseClearStraight(cloneMahjongObj2);
    console.log(getThreePos(cloneMahjongObj2).length,';=======>>>>');
    if(getThreePos(cloneMahjongObj2).length){
        clearThree(cloneMahjongObj2,index);
        //clearStraight(cloneMahjongObj2);
    }

    var count2 = getAllDiff(cloneMahjongObj2,index);

    var cloneThree = cloneMahjong(allPai);
    var threeIndex = clearThree(cloneThree,index);

    var count3 = getCount(cloneThree,threeIndex);


    console.log(allPai,'=======>>>>>>1111',cloneMahjongObj,cloneMahjongObj2);

    var which = count1 <= count2 ? count1 : count2;
    console.log(count1,count2,count3,index,count3 <= which,which);
    if( threeIndex >= 0 && !index && index != 0 && getThreePos(allPai).length){
        clearThree(allPai);
        //clearStraight(allPai);
    }
    if((threeIndex == index  && count3 <= which) || (!index && index != 0 && threeIndex >= 0)){
        clearThree(allPai,threeIndex);
    }else{
        if(count1 < count2){
            clearStraightForward(allPai);
        }else if(count1 > count2){
            reverseClearStraight(allPai);
        }else {//相等的情况
            var allDiff1 = getAllDiff(cloneMahjongObj,index);
            var allDiff2 = getAllDiff(cloneMahjongObj2,index);
            console.log(allDiff1,allDiff2);
            if(allDiff1 < allDiff2){
                clearStraightForward(allPai)
            }else{
                reverseClearStraight(allPai);
            }
        }
    }
    console.log( getThreePos(allPai),haveStraight(allPai),'========>>>>>',allPai);
    console.log(allPai,'=======>>>>>>2222');

    if(haveStraight(allPai) || getThreePos(allPai).length){
        clearStraight(allPai);
    }
};

let reverseClearStraight = function(allPai){
    for(let i = 0; i < allPai.length;i++){
        for(let j = allPai[i].length - 1; j >= 0; j --){
            if(allPai[i][j] > 0 && allPai[i][j - 1] > 0 && allPai[i][j - 2] > 0){
                allPai[i][j] -= 1;
                allPai[i][j - 1] -= 1;
                allPai[i][j - 2] -= 1;
                return i;
            }

        }
    }
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

let getLaiziCount = function(mahjongs){
    let laiziCount = 0;
    for(let i = 0 ; i < mahjongs.length; i++){
        if(mahjongs[i] == 99){
            laiziCount += 1;
        }
    }
    return laiziCount;
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


let mahjongs = [
    1,2,3,4,5,6,7,8,9,11,12,13,14,15,16,17,18,19,21,22,23,24,25,26,27,28,29,99
];


//打什么听牌
pro.playToTing = function(user){
    let canTing = [];
    for (let j = 0; j < user.mahjong.length; j++){
        if(canTing.indexOf(user.mahjong[j]) != -1){
            continue;
        }
        for(let i = 0 ; i < mahjongs.length;i++){
            let temp = false;
            let mahjong = user.mahjong.splice(j,1,mahjongs[i]);
            if(this.checkHu(user)){
                canTing.push(mahjong[0]);
                temp = true;
            }
            user.mahjong.splice(j,1,mahjong[0]);
            if(temp){
                break;
            }
        }
    }
    return canTing;
}

pro.canHu = function(user){
    var arr = [];
    for(let i = 0 ; i < mahjongs.length;i++){
        if(this.checkHu(user,mahjongs[i])){
            arr.push(mahjongs[i]);
        }
    }
    return arr;
};



let member = {
    //mahjong : [ 3,4,5,18,18,28,28,99]
    //mahjong : [ 13,15,16,17,25,25,26,26,26,27,29,99,99]
    //mahjong : [5,5,6,7,26,26,27,28,29,99,26],
    //mahjong : [99,99,8,8,12,13,16,17,23,23,15],
    //mahjong : [99,99,99,1,7,8,11,15,21,21,23,25,25],
    //mahjong : [1,2,3,4,99,29,29,29],
    //mahjong : [3,3,8,8,13,14,16,17,18,24,25,99,99,99]
    //mahjong : [3,4,3,4,8,8,11,11,13,25,26,27,99,99],
    //mahjong : [2,2,3,3,5,5,5,5],
    //mahjong : [5,7,8,8,15,15,16,18,99,99],
    //mahjong : [12,12,19,19,19,23,25,27,99,99],
    //mahjong : [21,21,22,22,22,23,23]
    //mahjong : [99,99,3,3,4,4,5,5,6,6,7,7,21],
    //mahjong : [99,99,99,4,13,15,28]

    //mahjong : [99,99,99,3,3,4,4,5,6,6,7,9,25]
    //mahjong : [1,3,4,4,5,6,6,7,7,15,99,99,99]

    //mahjong : [2,3,4,4,5,6,6,7,7,99,99,99,21],

    //mahjong : [1,2,4,7,99,99,99]
    //mahjong : [1,2,6,9,99,99,99]
    //mahjong : [4,5,5,5,6,7,7,8,8,8]
    //mahjong : [1,2,4,5,7,99,99]
    //mahjong : [1,2,3,4,6,8,9,21,99,99]
    //mahjong : [1,2,4,6,7,8,9,99,99,21],
    //mahjong : [3,6,8,9,99,99,99],
    //mahjong : [3,5,5,5,6,7,8,9,9,99]
    //mahjong : [1,1,1,2,3,4,5,5,7,99]
    //mahjong : [1,1,1,3,99,99,7,9,9,9],
    //mahjong : [1,1,99,6,7,8,9,9,99,99,23,24,24]
    //mahjong : [5,5,6,6,6,7,99]
    //mahjong : [4,4,11,12,13,16,17,18,22,23,24,25,99]
    //mahjong : [2,3,5,5,5,5,7,8,99,99]
    //mahjong : [1,1,2,3,4,5,6,7,8,99]
    //mahjong : [2,5,5,5,7,7,7,8,99,99,6,6,99]
    //mahjong : [2,4,5,5,5,6,7,8,99,99]
    //mahjong : [1,2,4,5,5,5,6,7,7,8,99,99,99]
    //mahjong : [2,5,5,5,7,8,7,99,99,99]
    //mahjong : [13,14,14,15,17,18,19,6,7,8,9,9,99]
    //mahjong : [3,3,4,4,5,5,6,7,21,23,26,26,99]
    //mahjong : [2,2,15,16,21,22,22,23,23,23,24,24,25]
    //mahjong : [2,3,4,5,5,6,8,15,16,21,23,99,99]
    //mahjong : [99,5,13,13,25,26,27,99]
    //mahjong : [6,7,8,13,13]
    //mahjong : [1,1,5,5,16,22,22,24,26,26,28,28,99]
    //mahjong : [9,9,9,11,11,13,14,15,16,16,16,21,21,12]
    //mahjong : [4,5,6,14,14,24,25,99],
    //mahjong : [2,2,2,4,4,7,8,9,26,26,27,28,28,99]
    //mahjong : [99,99,99,1,3,4,5,6,7,9,16,16,23]
    //mahjong : [ 15, 16, 17, 15, 16, 17, 17, 18, 19, 21, 21 ]
    mahjong : [ 22, 21, 99, 15, 14, 16, 29, 29, 99, 27, 26, 28, 29, 29 ],
    //[ 28, 28, 28, 24, 24, 24, 21, 22, 23, 22, 21, 99, 29, 29 ]
    //[ 26, 26, 99, 19, 18, 99, 8, 7, 9, 29, 99, 27, 26, 26 ]
    //[ 4, 4, 4, 1, 3, 99, 7, 7, 7, 2, 1, 3, 21, 21 ]
    //[ 27, 26, 99, 25, 24, 26, 23, 22, 24, 25, 24, 26, 29, 29 ]
};


let startDate = Date.now();
let checks = new Check(true);
//console.log(checks.canHu(member));
// console.log(checks.playToTing(member));
//console.log(checks.check7dui(member));
console.log(checks.checkHu(member));
console.log(Date.now() - startDate);

var test1  = [ [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 1, 1, 0, 1, 0, 0, 0, 0, 1 ] ];

var test2 = [ [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 1, 1, 0, 0, 0, 0, 1, 0, 1 ] ];
//console.log(getAllDiff(test2,2),'=====>>>');


let testmahjongs = [
    1,2,3,4,5,6,7,8,9,11,12,13,14,15,16,17,18,19,21,22,23,24,25,26,27,28,29
];

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

var test = function(){
    for(var i = 0 ; i < 1000000000;i++){
        let member = {
            mahjong :getMahjong()
        }
        if(i % 1000000 == 0){
            console.error(i);
        }
        //console.error('???????',i,member.mahjong);
        if(!checks.checkHu(member)){
            console.error(i,member.mahjong,checks.checkHu(member));
            break;
        }
    }
};

var tas = haveStraight([ [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 1, 0, 1 ] ]);

var tas1 = getThreePos([ [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 1, 1, 0, 0, 0, 0, 0, 0, 2 ] ] ).length;
console.log(tas,tas1,'=======>>>>>????');
//test();
module.exports = Check;


