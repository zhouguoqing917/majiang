var users = [
    {id : 1},
    {id : 2},
    {id : 3},
    {id : 4},
]
var getMeBetweenBankerUsers = function(uid,beUid){
    let usersArr = [];
    let temp = false;
    for(let i = users.length - 1; i >= 0; i--){
        let user = users[i];
        if(uid == user.id){
            temp = true;
            continue;
        }

        if(temp){
            if(beUid == user.uid){
                break;
            }
            usersArr.push(user);
        }
    }
    return usersArr;
}

console.log(getMeBetweenBankerUsers(2,3))