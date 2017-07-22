'use strict';

let mongoose = require('mongoose');
let db=require('./db');
let autoNumber = mongoose.models['AutoNumber'];
let modelName='GameUser';

let schema=new mongoose.Schema({
    id: {
        type: Number,
        required: true,
    },
    openid: {
        type: String,
        required: true,
    },
    roomCard:{
        type: Number,
        "default": 0
    },
    token: String,
    ipaddress: String,
    wxlogin: Object,
    wxuserinfo: Object,
    created_at: {
        type: Date,
        "default": Date.now
    },
    currRoomNo : {
        type: Number,
        "default": null
    },
    roomId : {
        type: String,
        "default": null
    },
    loginTime : {
        type: Date,
        "default": Date.now
    },
    loginTimes : {
        type: Number,
        "default": 0
    },
    latitude : {
        type: Number,
        "default": 0
    },
    longitude : {
        type: Number,
        "default": 0
    },
    xfToken : {
        type: String
    },
    realName:{
        type: String
    },
    IDNo : {
        type: String
    },
    deviceId : {
        type: String,
    }

});
schema.index( {id : 1});
schema.index( {openid : 1});

schema.statics={
    /**
     * 根据openid查找用户，不存在返回null
     * */
    findByOpenId:async function(openid){
        const data=await this.findOne({ openid : openid });
        return data;
    },
    /**
     * 检测用户是否存在，存在则更新用户信息，不存在则注册
     * */
    register:async function(obj){
        const data=await this.findOne({ openid : obj.openid });
        if(data){
            this.update({openid:obj.openid}, {$set : obj}, {upsert : true}).exec();
        }else{
            let n=await autoNumber.getNewNumber(modelName);
            let gameUser=Object.assign({},obj,{id:n,roomCard:3});
            this.create(gameUser,(error)=>{
                if(error) {
                    console.log(`新增用户失败 ${error.msg}`);
                } else {
                    console.log('新增用户成功');
                }
            });
        }
    },

    /**
     * 验证用户的openid与token是否对应
     * */
    checkLogin:async function(obj){
        const gameUser=await this.findOne({ openid : obj.openid,token:obj.token });
        return gameUser;
    },
    /**
     * 根据openid获取用户微信信息
     * */
    getWXUserInfo:async function(uid) {
        const gameUser = await this.findOne({_id: uid});
        return gameUser.roomCard;
    },

    /**
     * 获取四个测试用户的信息
     * */
    getForUserInfo:async function(){
        const gameUsers=await this.find({},['openid','token']).limit(4).exec();
        return gameUsers;
    }

};

module.exports= {
    load:function(){
        let model = mongoose.model(modelName, schema);
        console.log(`模块${modelName}被注册`);
    }
};