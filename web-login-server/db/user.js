let mongoose = require('mongoose');
let Promise = require("bluebird");
let db=require('./db');

let schema=new mongoose.Schema({
    openid: {
        type: String,
        required: true,
        index: {
            unique: true
        }
    },
    token: String,
    address: String,
    wxlogin: String,
    wxuserinfo: String,
    created_at: {
        type: Date,
        "default": Date.now
    }
});

let model=mongoose.model("GameUser",schema);

class entity{
    static createTest(obj){
        model.findOne({username:obj.username})
            .then((data)=>{
                console.log(data);
                if(data){ //如果存在数据，则更新
                    console.log('更新用户成功');
                    var conditions = {username : 'yaoyao'};
                    var update     = {$set : {password : 1111}};
                    var options    = {upsert : true};
                    data.password=obj.password;
                    model.update(conditions, update, options).exec();
                }else{ //如果不存在数据，则插入数据
                    console.log('aaa');
                    model.create(obj,(error)=>{
                        if(error) {
                            console.log(`新增用户失败 ${err}`);
                        } else {
                            console.log('新增用户成功');
                        }
                    });
                }
            }).catch((err)=>{
            console.log(err);
        });
    }

    /**
     * 增
     */
    static save(obj) {
        // var mongooseEntity = new model(obj);
        model.save(function (error) {
            if(error){
                console.log(`添加失败 ${error}`);
            } else {
                console.log(`添加成功`);
            }
        })
    };

    /**
     * @param obj
     * 删
     */
    static remove(obj) {
        console.log('remove方法');
        var conditions = {username: obj.username};
        model.remove(conditions, function (error) {
            if(error) {
                console.log(`删除失败 ${error}`);
            } else {
                console.log('删除成功');
            }
        });
    }

    /**
     * 改
     */
    static update(obj) {
        var conditions = {username: obj.username};
        var update = {$set: {username: obj.username, password: obj.password}};
        var options = {upsert: true};
        model.update(conditions, update, options, function (error) {
            if (error) {
                console.log(`修改失败 ${error}`);
            } else {
                console.log(`修改成功`);
            }
        });
    }

    /**
     * 查
     */
    static find(obj) {
        // var mongooseEntity = new model(obj);
        model.find('openid', function (error, result) {
            if (error) {
                console.log(`修改失败 ${error}`);
            } else {
                console.log(`修改成功`);
                console.log(result);
            }
        });
    }

    static findAndUpdate(obj){
        model.findOne({openid:obj.openid})
            .then((data)=>{
                if(data){ //如果存在数据，则更新
                    console.log('更新用户成功');
                    let conditions = {openid : obj.openid};
                    let update;
                    var options    = {upsert : true};
                    if (obj.wxlogin) {
                        update     = {$set : {wxlogin : obj.wxlogin}};
                        model.update(conditions, update, options).exec();
                    }
                    if (obj.wxuserinfo) {
                        console.log("$$$$$ wxuserinfo: " + obj.wxuserinfo);
                        update     = {$set : {wxuserinfo : obj.wxuserinfo}};
                        model.update(conditions, update, options).exec();
                    }
                }else{ //如果不存在数据，则插入数据
                    console.log('不存在用户');
                    model.create(obj,(error)=>{
                        if(error) {
                            console.log(`新增用户失败 ${err}`);
                        } else {
                            console.log('新增用户成功');
                        }
                    });
                }
            }).catch((err)=>{
            console.log(err);
        });
    }
};

module.exports = entity;