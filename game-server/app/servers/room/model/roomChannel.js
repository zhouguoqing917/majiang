/**
 * Created by Mrli on 17/3/7.
 */
const channelService = global.app.get('channelService');
let RoomChannel = function(roomNo){
    var chel = channelService.getChannel(roomNo);
    if(chel){
        chel.destroy();
    }
    this.channel = channelService.createChannel(roomNo);
};

let pro = RoomChannel.prototype;


pro.sendMsgToRoom = function(route,msg){
    if(typeof(msg) == 'object'){
        msg.ts = Date.now()
    }
    //if(route == 'onPlayMahjong'){
    //    msg.ts -= 5000;
    //}
    this.channel.pushMessage(route,msg);
};

pro.destroy = function(){
    this.channel.destroy();
};

pro.sendMsgToMem = function(route,msg,user){
    if(typeof(msg) == 'object'){
        msg.ts = Date.now()
    }
    channelService.pushMessageByUids(route,msg,[{uid : user.uid,sid : user.sid}]);
};

pro.sendMsgByUids= function(route,msg,uids){
    if(typeof(msg) == 'object'){
        msg.ts = Date.now()
    }
    channelService.pushMessageByUids(route,msg,uids);
};

pro.addUserToChannel = function(user) {
    let member = this.channel.getMember(user.uid);
    if(this.channel.getMember(user.uid)){
        this.channel.leave(member.uid , member.sid);
    }
    this.channel.add(user.uid,user.sid);
};

pro.sendMsgToRoomExceptUid = function(route,msg,arr){
    if(typeof(msg) == 'object'){
        msg.ts = Date.now()
    }
    channelService.pushMessageByUids(route,msg,arr);
};

pro.leaveChannel = function(user){
    this.channel.leave(user.uid,user.sid)
};

module.exports = RoomChannel;


