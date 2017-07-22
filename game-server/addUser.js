/**
 * Created by admin on 2017/7/13.
 */
require('./app/db/mongodb').load();

const gameUserModel = require('mongoose').models['GameUser'];


let addUser = async function(){
    let obj = {
        openid : "ol9tcwy79lKc7zf3nlLSpFNpGJu0",
        token : "GySofASVojbx2SlL9ceYqQa5S9EAWZvL9b29PZjv-K_bGzn5-D-CXQOU8nahZW9P8mcsQ2BzI8zGge7Nn-R_1iQ_iCJcpStiDWGd2TjTcYQ",
        "wxlogin" : {
            "access_token" : "GySofASVojbx2SlL9ceYqQa5S9EAWZvL9b29PZjv-K_bGzn5-D-CXQOU8nahZW9P8mcsQ2BzI8zGge7Nn-R_1iQ_iCJcpStiDWGd2TjTcYQ",
            "expires_in" : 7200,
            "refresh_token" : "u4htgu3gvayNJxzGwCbJzGEvIBULSPuEooX4XdlyDL70aFN1OTgVfqa8pE1hdytrOvigMmEr2AWfLWULqlhWKNNPihWSMmFLo2_1k3cxCuw",
            "openid" : "ol9tcwy79lKc7zf3nlLSpFNpGJu0",
            "scope" : "snsapi_userinfo",
            "unionid" : "ok_dJwyR44MHkNgkYqMtAfEGzn90"
        },
        "wxuserinfo" : {
            "openid" : "ol9tcwy79lKc7zf3nlLSpFNpGJu0",
            "nickname" : "Android",
            "sex" : 1,
            "language" : "zh_CN",
            "city" : "",
            "province" : "",
            "country" : "JE",
            "headimgurl" : "/0",
            "privilege" : [],
            "unionid" : "ok_dJwyR44MHkNgkYqMtAfEGzn90"
        },
        "id" : 100036,
        "created_at" : new Date(),
        "roomCard" : 997,
        "__v" : 0,
        "ipaddress" : "110.53.253.37",
                "roomId" : "5964855a62597c3cce73dc8f",
            "currRoomNo" : 527610,
            "loginTime" : new Date(),
            "loginTimes" : 772,
            "latitude" : 28.212135,
            "longitude" : 112.907848
}
    for(let i = 2 ; i <= 8 ; i++){
        obj.openid = i*11111111;
        //obj.wxuserinfo = i;
        obj.wxuserinfo.openid = i*11111111;
        obj.wxuserinfo.nickname = "玩家" + i;
        obj.wxuserinfo.headimgurl = "http://wx.qlogo.cn/mmopen/xgghTUGdCxUJiaJIKVYf5BRCl5qkrvFSZkicVZmAOYPEGfqiblKAtsS9JhOUTJibVKlXr9Uy0EGQVlzmFa5QUkTAQXhTVic6oxrMq/0";
        obj.token = i*11111111;
        obj.id = 100000 + i*11111111;
        await gameUserModel.create(obj,(err,res)=>{
            if(err){
                console.log(err);
            }else{
                console.log(res);
            }
        })
    }

}
addUser();