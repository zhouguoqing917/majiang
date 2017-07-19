/**
 * 生成自增的数字ID
 */
'use strict';

const mongoose = require('mongoose');
const db=require('./db');
const modelName='GameAnnouncements';

const schema=new mongoose.Schema({
    type : {
        type: Number,
        default: 0
    },
    platform:{
        type: Number,
        "default": 0
    },
    startAt: {
        type: Date
    },
    endAt : {
        type: Date
    },
    interval : {
        type: Number
    },
    loop : {
        type: Number
    },
    content : {
        type : String
    },
    operateUserId : {
        type : Number
    },
    createdAt : {
        type : Date
    },
    updatedAt : {
        type : Date
    }

});


schema.statics={
};

module.exports= {
    load:function(){
        let model = mongoose.model(modelName, schema);
        console.log(`模块${modelName}被注册`);
    }
};