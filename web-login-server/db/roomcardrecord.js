/**
 * 房卡异动记录
 * Created by Administrator on 2017/3/6.
 */
'use strict';

const mongoose = require('mongoose');
const db=require('./db');
let modelName='RoomCardRecord';

const schema=new mongoose.Schema({
    aboutUserId: String,  //创建用户的ID
    modifyType:String, //‘system' 为系统修改  其他为手动修改
    preNumber:Number, //修改前数量
    curNumber:Number, //当前修改的数量，正为增加房卡，负为减少房卡
    afterNumber:Number, //修改后数量
    description:String, //备注
    created_at: {
        type: Date,
        "default": Date.now
    }
});

schema.index( {aboutUserId : 1} );
schema.index( {modifyType : 1} );

schema.statics={

};

module.exports= {
    load:function(){
        let model = mongoose.model(modelName, schema);
        model.schema.options.versionKey = false;
        console.log(`模块${modelName}被注册`);
    }
};