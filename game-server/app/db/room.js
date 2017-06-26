/**
 * 生成自增的数字ID
 */
'use strict';

const mongoose = require('mongoose');
const db=require('./db');
const modelName='Room';

const schema=new mongoose.Schema({
    createUserId: String,  //创建用户的ID
    roomType:{//'hongzhong':摇摇红中麻将
        type: String,
        required: true
    },
    serverId:String,
    data:Object,
    roomNo:Number,
    userCount : {
        type: Number,
        default: 0
    },
    timeRemaining : {
        type: Number, //剩余时间
        default: 0
    },
    status:{//状态  0代表未初始化 2,进行中 3,第一局已经结束 4, 全部结束 , 5,以退卡
        type: Number,
        "default": 0
    },
    createTime: {
        type: Date,
        "default": Date.now
    }
});

schema.index( {createUserId : 1} );
schema.index( {roomType : 1} );
schema.index( {roomNo : 1} );
schema.index( {serverId : 1} );

schema.statics={
};

module.exports= {
    load:function(){
        let model = mongoose.model(modelName, schema);
        console.log(`模块${modelName}被注册`);
    }
};