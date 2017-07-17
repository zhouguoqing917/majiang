/**
 * 非登录用户只能访问指定路由
 * */
const pomelo = require('pomelo');
class LoginFilter {
    before(msg, session, next) {
        const sessionService = pomelo.app.get('sessionService');
        if(!session.uid && msg.__route__!=='connector.loginHandler.checkLogin'  && msg.__route__!=='gate.gateHandler.queryEntry' && msg.__route__!=='connector.loginHandler.visitorLogin'){
            next({code : 500,msg : '无法访问'});
            return;
        }
        if(global.updateSreverId){
            next({code : 201,msg : '该服务器重启'});
        }
        next();
    }
}


module.exports =  new LoginFilter();