/**
 * 生成自增的数字ID
 */
'use strict';

const mongoose = require('mongoose');
const db=require('./db');
const modelName='GameMessages';

const schema=new mongoose.Schema({
    gameId : {
        type: Number,
        default: 0
    },
    message : {
        type: String
    },
    source:{
        type: String
    },
    status: {
        type: Number,
        default: 0
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