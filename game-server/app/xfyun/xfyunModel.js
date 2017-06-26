/**
 * Created by li on 17/6/25.
 */
let request = require('request-promise-native');
const crypto = require('crypto');

let appid = "5948b406";
let key = 'fef532747577afcbabec97e92f9b3468';
let APPToken = 'd829038f-248c-412c-8b9c-af92d412d5a6';
let url = 'http://im.voicecloud.cn';
let XfyunModel = function(){
    this.token = null;
};

let pro = XfyunModel.prototype;
pro.getAppToken = async function(){
    let path = '/v1/rest/getToken.do';
    let time = Date.now();
    let currTime = parseInt(time / 1000);
    let str = key + '' + time + currTime;

    const hash = crypto.createHash('md5');
    hash.update(str);
    let checkNum = hash.digest('hex');
    let allUrl = url + path;
    let options = {
        url: allUrl,
        headers: {
            'X-Appid': appid,
            'X-Nonce': time,
            'X-CurTime' : currTime,
            'X-CheckSum' : checkNum,
            'X-Expiration' : -1
        }
    };
    let result = await request(options);
    result = JSON.parse(result);
    if(result.ret == 0 && result.token){
        this.token = result.token;
    }else{
        process.exit(0);
    }
}

//获取用户token
pro.getUserToken = async function(uid){
    let path = '/v1/rest/getUserToken.do';
    let allUrl = url + path;
    let options = {
        url: allUrl,
        headers: {
            'X-Appid': appid,
            'X-Token': this.token,
            'X-Uid' : uid,
            'X-Expiration' : -1
        }
    };
    let result = await request(options);
    result = JSON.parse(result);
    console.log(result.token,'=====>>111>');
    if(result.ret == 0 && result.token){
        return result.token;
    }
    return null;
};

//用户导入
pro.userImport = async function(uid,userName,headimgurl){
    let path = '/v1/user/import.do';
    let allUrl = url + path;
    let options = {
        url: allUrl,
        headers: {
            'X-Appid': appid,
            'X-Token': this.token
        },
        form: JSON.stringify({
            uid : uid,
            name : userName,
            icons : headimgurl,
            cMsgID : uid
        })
    };
    let result = await request.post(options);
    result = JSON.parse(result);
    console.log(result,'=====>>>');
    if(result.ret == 0 ){
        return true;
    }
    return null;


};

pro.createGroup = async function(owner,roomNo){
    let path = '/v1/group/create.do';
    let allUrl = url + path;
    let options = {
        url: allUrl,
        headers: {
            'X-Appid': appid,
            'X-Token': this.token
        },
        form : JSON.stringify({
            owner : owner,
            gname : roomNo,
            type : 0,
            cMsgID : roomNo
        })
    };
    let result = await request.post(options);
    result = JSON.parse(result);
    console.log('=====>>>createGroup',result);
    if(result.ret == 0 && result.gid){
        return result.gid;
    }
    return null;
};

pro.joinGroup = async function(gid,uid){
    let path = '/v1/group/join.do';
    let allUrl = url + path;
    let options = {
        url: allUrl,
        headers: {
            'X-Appid': appid,
            'X-Token': this.token
        },
        form : JSON.stringify(
            {
                gid : gid,
                uid : uid,
                cMsgID : uid
            }
        )
    };
    let result = await request.post(options);
    result = JSON.parse(result);
    console.log(result,'====>>join');
    if(result.ret == 0 ){
        return true;
    }
    return null;
};

pro.quitGroup = async function(gid,uid){
    let path = '/v1/group/exit.do';
    let allUrl = url + path;
    let options = {
        url: allUrl,
        headers: {
            'X-Appid': appid,
            'X-Token': this.token
        },
        form : JSON.stringify(
            {
                gid : gid,
                uid : uid,
                cMsgID : uid
            }
        )
    };
    let result = await request.post(options);
    result = JSON.parse(result);
    console.log(result,'======>>>>');
    if(result.ret == 0 ){
        return true;
    }
    return null;
};

pro.removeGroup = async function(gid,ownerUid){
    let path = '/v1/group/remove.do';
    let allUrl = url + path;
    let options = {
        url: allUrl,
        headers: {
            'X-Appid': appid,
            'X-Token': this.token
        },
        form : JSON.stringify({
            gid : gid,
            uid : ownerUid,
            cMsgID : ownerUid
        })
    };
    let result = await request.post(options);
    result = JSON.parse(result);
    if(result.ret == 0 ){
        return true;
    }
    return null;
};

pro.getGroupList = async function(ownerUid){
    let path = '/v1/group/getlist.do';
    let allUrl = url + path;
    let options = {
        url: allUrl,
        headers: {
            'X-Appid': appid,
            'X-Token': this.token
        },
        form : JSON.stringify({
            uid : ownerUid,
            cMsgID : ownerUid
        })
    };
    let result = await request.post(options);
    result = JSON.parse(result);
    console.log('=====>>>>>getGroupList',result);
    if(result.ret == 0 ){
        return true;
    }
    return null;
};

module.exports = new XfyunModel();

//let model = new XfyunModel();
//let test = async function(){
//    await model.getAppToken();
//    console.log(model.token);
//    await model.userImport('123456','123456','123456');
//    await model.getUserToken('123456');
//    //7aa392f0-be73-406c-9a1c-7eb0bb6ec0f5
//    //await model.createGroup('123123','123456');
//    await model.getGroupList('123456');
//    //7aa392f0-be73-406c-9a1c-7eb0bb6ec0f5
//    //await model.joinGroup('7aa392f0-be73-406c-9a1c-7eb0bb6ec0f5','123456');
//    //await model.quitGroup('7aa392f0-be73-406c-9a1c-7eb0bb6ec0f5','123123');
//};
//
//test();




