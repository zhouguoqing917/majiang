/**
 * Created by Mrli on 17/3/24.
 */
'use strict';

const mongoose = require('mongoose');
const db=require('./db');
const modelName='GameResult';

const schema=new mongoose.Schema({
   result : {
       type : Object
   },
    record : {
        type : Object
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