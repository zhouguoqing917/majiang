/**
 * Created by Mrli on 17/5/25.
 */
/**
 * Created by Mrli on 17/3/24.
 */
'use strict';

const mongoose = require('mongoose');
const db=require('./db');
const modelName='ShareRecord';

const schema=new mongoose.Schema({
    createTime : {
        type : Number
    },
    roomNo : {
        type : Number
    },
    gameRecordId : {
        type : String
    },
    is7dui : {
        type : Boolean
    },
    isPeng : {
        type : Boolean
    },
    onlyOneBird : {
        type : Boolean
    },
    birdNum : {
        type : Number
    },
    roundCount : {
        type : Number
    },
    banker : {
        type : String
    },
    round :{
        type : Number
    },
    users : {
        type: Array
    },
    dice :{
        type : Object
    },
    actions : {
        type : Array
    },
    code : {
        type : Number
    },
    shareUid :{
        type : String
    }
});

schema.index( {round : 1} );
schema.index( {code : 1} );
schema.index( {gameRecordId : 1} );

schema.statics={

};

module.exports= {
    load:function(){
        let model = mongoose.model(modelName, schema);
        console.log(`模块${modelName}被注册`);
    }
};