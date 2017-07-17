const gameUserModel = require('mongoose').models['GameUser'];
const roomModel = require('mongoose').models['Room'];
const xfyunModel = require('../../../xfyun/xfyunModel.js');
let autoNumber = require('mongoose').models['AutoNumber'];

module.exports = function(app) {
    return new Handler(app);
};
const Handler = function(app) {
    this.app = app;
};
const handler = Handler.prototype;

//验证微信登录
handler.checkLogin = async function(msg, session, next) {
    var latitude = msg.latitude || 0;
    var longitude = msg.longitude || 0;
    let self = this;
    let gameUser=await gameUserModel.checkLogin({openid: msg.openid, token: msg.token});

    try{
        if(gameUser){
            //验证登录
            gameUser.ipaddress=session.__session__.__socket__.remoteAddress.ip;
            gameUser.ipaddress = gameUser.ipaddress.substring(gameUser.ipaddress.lastIndexOf(':') + 1);
            let uid=gameUser._id;
            let sessionService = this.app.get('sessionService');
            let previousSession =  sessionService.getByUid(uid);

            //踢出其他连接服务器的登录
            const channelService = this.app.get('channelService');
            const servers=this.app.getServersByType('connector');

            servers.map(async function(value,index,arr){
                if(self.app.curServer.id!==value.id){
                    await new Promise(function (resolve, reject) {
                        self.app.rpc.connector.square.kickByUid(value.id,gameUser._id,function(err,data){
                            if(err){
                                reject(err);
                            }else{
                                resolve();
                            }

                        });
                    });
                }
            });
            if(previousSession && previousSession.length && previousSession[0].id != session.id){
                await new Promise(function(resolve,reject){
                    channelService.pushMessageByUids('onKick',{code : 200 },[{ uid : uid ,sid : self.app.curServer.id}],function(err,data){
                        if(err){
                            reject(err);
                        }else{
                            resolve();
                        }
                    });
                })
                await  new Promise(function(resolve,reject){
                    sessionService.kickBySessionId(previousSession[0].id,function(err,data){
                        if(err){
                            reject(err);
                        }else{
                            resolve();
                        }
                    });
                })
            }
            if(session.uid){
                try{
                    await new Promise(function(resolve,reject){
                        session.unbind(session.uid,function(err,data){
                            if(err){
                                reject(err);
                            }else{
                                resolve();
                            }
                        });
                    })
                }catch(e){
                    console.error('========>>>checkLogin',e.stack);
                }
            }

            if(!session.uid){
                await  new Promise(function(resolve,reject){
                    session.bind(uid,function(err,data){
                        if(err){
                            reject(err);
                        }else{
                            resolve();
                        }
                    });
                });
            }

            if(!gameUser.xfToken){
                let result = await xfyunModel.userImport(gameUser._id,gameUser.wxuserinfo.nickname,gameUser.wxuserinfo.headimgurl);
                if(!result){
                    console.error(result,'========>>>>result');
                    //导入用户失败
                    throw '讯科云导入用户失败!'
                }
                let xfToken = await xfyunModel.getUserToken(gameUser._id);
                gameUser.xfToken = xfToken;
            }

            session.set('sid',this.app.curServer.id);
            const {nickname,sex,headimgurl}=gameUser.wxuserinfo;
            session.set('userinfo',{
                ipaddress:gameUser.ipaddress,
                nickname:nickname,
                sex:sex,
                headimgurl:headimgurl,
                id : gameUser.id,
                latitude : latitude,
                longitude : longitude
            });
            //更新登录IP
            var loginTimes = gameUser.loginTimes || 0;
            loginTimes += 1;
            if(gameUser.roomId){
                let roomData = await roomModel.findOne({_id : gameUser.roomId});
                let now = Date.now();
                if(roomData && roomData.status > 3){
                    gameUser.currRoomNo = null;
                    gameUser.roomId = null;
                }else if(roomData && roomData.status <= 3){
                    session.set('roomNo',gameUser.currRoomNo);
                }else{
                    gameUser.currRoomNo = null;
                    gameUser.roomId = null;
                }
            }else{
                gameUser.currRoomNo = null;
                gameUser.roomId = null;
            }
            session.pushAll((err)=>{
                if(err)
                    console.log(`绑定session失败 ! 错误信息 : ${err.message}`);
                else
                    console.log(`新用户加入，绑定session到服务器${this.app.curServer.id}`);
            });
            session.on('closed', onUserLeave.bind(this, session));
            await gameUserModel.update({_id:gameUser._id},{$set:{ipaddress:gameUser.ipaddress , xfToken : gameUser.xfToken,loginTime : new Date(),loginTimes : loginTimes,latitude : latitude,longitude : longitude}}).exec();

            var data = {
                _id : gameUser._id,
                openid : gameUser.openid,
                token : gameUser.token,
                headimgurl : headimgurl,
                nickname : nickname,
                id : gameUser.id,
                roomCard : gameUser.roomCard,
                ipaddress : gameUser.ipaddress,
                currRoomNo : gameUser.currRoomNo,
                sex : sex,
                xfToken : gameUser.xfToken,
                realName : gameUser.realName,
                IDNo : gameUser.IDNo
            };

            next(null,{code:200,msg:'登录成功',data: data});
        }else{
            next(null,{code:500,msg:'用户名密码错误'});
        }
    }catch(e){
        next(null,{code:500,msg:e});
    }

};

handler.visitorLogin = async function(msg, session, next){
    let deviceId = msg.deviceId;
    if(!deviceId){
        return next(null ,{code : 500, msg : '参数错误'});
    }
    var latitude = msg.latitude || 0;
    var longitude = msg.longitude || 0;
    try {
        let gameUser = await gameUserModel.findOne({deviceId: deviceId});
        let n = await autoNumber.getNewNumber('GameUser');
        let temp = true;
        if(!gameUser){
            temp = false;
            gameUser = {
                deviceId : deviceId,
                id : n,
                roomCard : 0,
                created_at : new Date(),
                loginTimes : 0,
                wxuserinfo : {
                    nickname : '游客' + n,
                    sex : 1
                },
                latitude : latitude,
                longitude : longitude,
                openid : 'youke'
            };
        }
        let ipaddress = session.__session__.__socket__.remoteAddress.ip;
        gameUser.ipaddress = ipaddress;
        ipaddress = gameUser.ipaddress.substring(gameUser.ipaddress.lastIndexOf(':') + 1);
        gameUser.loginTime = new Date();
        gameUser.loginTimes += 1;


        session.set('sid',this.app.curServer.id);
        const {nickname}=gameUser.wxuserinfo;
        session.set('userinfo',{
            ipaddress:gameUser.ipaddress,
            nickname:nickname,
            sex:1,
            id : gameUser.id,
            latitude : latitude,
            longitude : longitude
        });


        if(gameUser.roomId){
            let roomData = await roomModel.findOne({_id : gameUser.roomId});
            let now = Date.now();
            if(roomData && roomData.status > 3){
                gameUser.currRoomNo = null;
                gameUser.roomId = null;
            }else if(roomData && roomData.status <= 3){
                session.set('roomNo',gameUser.currRoomNo);
            }else{
                gameUser.currRoomNo = null;
                gameUser.roomId = null;
            }
        }else{
            gameUser.currRoomNo = null;
            gameUser.roomId = null;
        }
        session.pushAll((err)=>{
            if(err)
                console.log(`绑定session失败 ! 错误信息 : ${err.message}`);
            else
                console.log(`新用户加入，绑定session到服务器${this.app.curServer.id}`);
        });

        if(temp){
            await gameUserModel.update({_id : gameUser._id}, {$set : gameUser});
        }else{
            let user = await gameUserModel.create(gameUser);
            console.error(user,'========>>>')
            if(!gameUser.xfToken){
                let result = await xfyunModel.userImport(user._id,gameUser.wxuserinfo.nickname,'..');
                if(!result){
                    console.error(result,'========>>>>result');
                    //导入用户失败
                    throw '讯科云导入用户失败!'
                }
                let xfToken = await xfyunModel.getUserToken(gameUser._id);
                gameUser.xfToken = xfToken;
            }
        }
        next(null,{code:200,msg:'登录成功',data: data});
    }catch(e){
        console.error(e,'=====>>>>e');
        next(null,{code:200,msg:'登录失败'});
    }
};

handler.realNameVerify = async function(msg, session, next){
    let realName = msg.realName;
    let IDNo = msg.IDNo;
    let uid = session.uid;
    await gameUserModel.update({_id : uid},{realName : realName, IDNo : IDNo});
    next(null,{code:200,msg:'认证成功'});
};

//获取用户微信信息
handler.getWXUserInfo=async function(msg, session, next) {
    let wxuserinfo=await gameUserModel.getWXUserInfo(msg.openid);
    //返回值给客户端
    if (wxuserinfo) {
        next(null,{code: 200, msg:'获取用户微信信息成功',data: wxuserinfo});
    } else {
        next(null,{code: 500, msg: '用户名信息不存在'});
    }
};

//获取四个测试用户信息
handler.getForUserInfo=async function(msg, session, next) {
    let forUserInfo=await gameUserModel.getForUserInfo(msg.openid);
    //返回值给客户端
    next(null,{code: 200, msg:'获取4个测试用户信息成功',data: forUserInfo});
};

handler.heartbeat = function(msg, session, next){
    next(null,{code : 200});
};

let onUserLeave = function(app, session) {
    if(!session || !session.uid) {
        return;
    }
    //用户断开session连接需要干的其他事情
    //退出房间
    let roomNo = session.get('roomNo');
    let uid = session.uid;
    if(roomNo){
        this.app.rpc.room.room.leaveRoom(roomNo,roomNo,uid,function(err,data){
            if(data.code == 200){
                console.log('玩家断线离开房间 => roomNo : ' + roomNo);
            }
        });
    }
};

