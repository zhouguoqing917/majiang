
let router = {
    room :function(session, msg, app, cb) {
        let servers = app.getServersByType('room');
        let temp = [];
        if(global.updateSreverId){
            for(var i = 0 ; i < servers ; i ++){
                if(servers[i].id != global.updateSreverId){
                    temp.push(servers[i]);
                }
            }
        }else{
            temp = servers;
        }

        let random = parseInt(Math.random() * temp.length);
        let serverId = temp[random].id;
        let roomNo=null;
        if(msg.args && msg.args.length>0 && msg.args[0].body && msg.args[0].body.roomNo){
            roomNo = msg.args[0].body.roomNo;
        }else if(session && typeof(session.get) == 'function' && session.get('roomNo')){
            roomNo = session.get('roomNo')
        }else if(Number.isInteger(parseInt(session))){
            roomNo = session;
        }

        if(roomNo){
            let serverSuffix = (roomNo + '').substr(0,2);
            let isLegal = false;
            for(let i = 0 ; i < servers.length;i++){
                if(servers[i].id.indexOf(serverSuffix) != -1){
                    isLegal = true;
                    break;
                }
            }

            if(!isLegal){
                let random = parseInt(Math.random() * servers.length);
                serverId = servers[random].id;
            }else{
                serverId = `room-server-${serverSuffix}`;
            }
        }
        if(!serverId) {
            cb(new Error('can not find server info for type: ' + msg.serverType));
            return;
        }
        cb(null, serverId);
    },connector :function(serverId, msg, app, cb) {
        //todo 路由为实现
        if(!serverId) {
            cb(new Error('您必须制定一个服务器id'));
            return;
        }
        cb(null, serverId);
    }
};

let loadRouter = function(app){
    for(let key in router){
        app.route(key,router[key]);
    }
};

module.exports = loadRouter;