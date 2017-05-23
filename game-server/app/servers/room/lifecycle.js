
const roomModel = require('mongoose').models['Room'];
const gameUserModel = require('mongoose').models['GameUser'];
const roomCardRecordModel = require('mongoose').models['RoomCardRecord'];

module.exports.beforeStartup = async function(app, cb) {
    let sid = app.getServerId();
    let now = Date.now();
    let date = new Date(now - 10 * 60 * 1000);
    let rooms = await roomModel.find({serverId : sid ,status : {$lte : 3}}) || [];
    for(let i = 0 ; i < rooms.length; i++){
        try {
            if(rooms[i].status = 3){
                await roomModel.update({_id : rooms[i]._id},{status : 6});
            }else{
                let uid = rooms[i].createUserId;
                let user = await gameUserModel.findOne({_id : uid});
                let roomCardRecord = await roomCardRecordModel.findOne({roomId : rooms[i]._id});
                let curNumber = roomCardRecord.curNumber;
                if(curNumber < 0){
                    curNumber = Math.abs(curNumber);
                    let preCardNumber = user.roomCard;
                    user.roomCard += curNumber;

                    //给用户加卡
                    await gameUserModel.update({_id : user._id } ,{roomCard : user.roomCard });
                    await roomModel.update({_id : rooms[i]._id},{status : 5});

                    //写入房卡消耗记录
                    await roomCardRecordModel.create({
                        aboutUserId: user._id,
                        modifyType: 'system',
                        preNumber: preCardNumber,
                        curNumber: curNumber,
                        afterNumber: user.roomCard,
                        description: `服务器重启返回房卡`,
                        userCount : 0
                    });
                    console.log('=======>>>返回房卡成功',user._id,curNumber);
                }
            }

        }catch (e){
            console.log('=======>>>返回房卡成功');
        }
    }
    // await roomModel.remove({});
    cb();
};


module.exports.afterStartup = function(app, cb) {
    cb();
};


module.exports.beforeShutdown = async function(app, cb) {
    //room.deleteRoomServer(app);
    cb();
};


module.exports.afterStartAll = async function(app) {
    // const server=app.getServerById(app.getServerId());
    //
    // app.rpc.center.room.register(null,server,()=>{
    //     console.log(`游戏房间服务器${server.id}在中心服务器注册成功`);
    // });
    //
    // //写入新建立的房间到数据库
    // room.initRoomServer(app);
};
