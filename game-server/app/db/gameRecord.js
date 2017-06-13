/**
 * Created by Mrli on 17/3/24.
 */
'use strict';

const mongoose = require('mongoose');
const db=require('./db');
const modelName='GameRecord';

const schema=new mongoose.Schema({
    startTime : {
        type : Number
    },
    roomNo : {
        type : Number
    },
    scores : {
        type : Array
    },
    gameResultId : {
        type : String
    }
});

schema.index( {roomNo : 1} );
schema.index( {gameResultId : 1} );

schema.statics={

};

module.exports= {
    load:function(){
        let model = mongoose.model(modelName, schema);
        console.log(`模块${modelName}被注册`);
    }
};