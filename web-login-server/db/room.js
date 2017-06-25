'use strict';

const mongoose = require('mongoose');
const db=require('./db');
let modelName='Room';

const schema=new mongoose.Schema({
    createUserId: String,  //创建用户的ID
    roomType:{//'hongzhong':摇摇红中麻将
        type: String,
        required: true
    },
    serverId:String,
    data:Object,
    roomNo:Number,
    status:{    //状态  0代表未初始化  10代表已经初始化  20代表正式开始牌局  30达标牌局已经结束
        type: Number,
        "default": 0
    },
    created_at: {
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