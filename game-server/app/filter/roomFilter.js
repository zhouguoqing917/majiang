/**
 * Created by Mrli on 17/4/20.
 */
/**
 * 非登录用户只能访问指定路由
 * */
const pomelo = require('pomelo');
class roomFilter {
    before(msg, session, next) {
        if(global.updateSreverId && msg.__route__ == 'room.roomHandler.createRoom'){
           return next({code : 201,msg : '该服务器重启'});
        }
        next();
    }
}


module.exports =  new LoginFilter();