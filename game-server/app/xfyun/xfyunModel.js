/**
 * Created by li on 17/6/25.
 */
let request = require('request');
const crypto = require('crypto');

let appid = "5948b406";
let key = 'fef532747577afcbabec97e92f9b3468';
let APPToken = 'd829038f-248c-412c-8b9c-af92d412d5a6';
let url = 'http://im.voicecloud.cn';
let XfyunModel = function(){};

let pro = XfyunModel.prototype;
pro.getAppToken = async function(){
    let path = '/v1/rest/getToken.do';
    let time = Date.now();
    let currTime = parseInt(time / 1000);
    const hash = crypto.createHash('md5');

    hash.update(key + '' + time + currTime);
    let checkNum = hash.digest('hex');
    console.log(checkNum);

    let allUrl = url + path;
    allUrl += '?';
    allUrl += 'X-Appid=' + appid  + '&';
    allUrl += 'X-Nonce=' + '123sad'  + '&';
    allUrl += 'X-CurTime=' + currTime  + '&';
    allUrl += 'X-CheckSum=' + checkNum  + '&';
    allUrl += 'X-Expiration=-1';
    let result = await request.get(allUrl,function(){
        console.log(arguments,'======>>>');
    });
}

pro.getUserToken = function(uid){
    let path = '/v1/rest/getUserToken.do?';
    let allUrl = url + path;
    allUrl += 'X-Appid=' + appid  + '&';
    allUrl += 'X-Token=' + APPToken  + '&';
    allUrl += 'X-Uid=' + uid  + '&';
    allUrl += 'X-Expiration=-1';
    request.get(allUrl,function(){
        console.log(arguments,'======>>>');
    });

}

//测试
new XfyunModel().getAppToken('dsa');