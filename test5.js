
let users = [
    {uid : 1},
    {uid : 2},
    {uid : 3},
    {uid : 4}
]
let getNextUserByUid = function(uid){
    for(let i = 0; i < users.length; i ++){
        if(users[i].uid == uid){
            let index = i + 1 > 3 ? 0 : i + 1;
            return users[index];
        }
    }
};

// 顺时钟玩家
let getMeBetweenBankerUsers = function(beUid,uid,usersArr){
    usersArr = usersArr || [];
    let temp = false;
    let myIndex ;
    let nextUser = getNextUserByUid(uid);
    if(nextUser.uid == beUid){
        return usersArr;
    }
    usersArr.push(nextUser);
    uid = nextUser.uid;
    return getMeBetweenBankerUsers(beUid,uid,usersArr);
}

console.log(getMeBetweenBankerUsers(3,4));
console.log(getMeBetweenBankerUsers(1,4));
