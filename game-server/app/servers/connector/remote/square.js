/**
 * Created by Administrator on 2017/3/8.
 */

module.exports = function(app) {
    return new Handler(app);
};

const Handler = function(app) {
    this.app = app;
};
const handler = Handler.prototype;

/**
 * 踢掉该UID的用户，防止用户同时连接多个连接服务器
 * @param uid 绑定的UID
 * */
handler.kickByUid = async function(uid, cb) {
    console.log(`${this.app.curServer.id}的断开连接RPC方法被访问`);
    const sessionService=this.app.get('sessionService');
    const channelService = this.app.get('channelService');
    let previousSession =  sessionService.getByUid(uid);
    //console.log(previousSession);
    let self = this;
    if(previousSession){
        previousSession.forEach(async function(value,index,arr){
            if (value){
                await channelService.pushMessageByUids('onKick',{code : 200 },[{ uid : value.uid ,sid : self.app.curServer.id}]);
            }
            sessionService.kickBySessionId(value.id);
            console.log(`用户${value.uid}原来在${self.app.curServer.id}的连接已经被断开`);
        });
    }
    cb();
};

