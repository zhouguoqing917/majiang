/**
 * Created by Mrli on 17/4/20.
 */
const pomelo = require('pomelo');
class globalFilter {
    after(err, params ,session , msg, next) {
        if(msg && msg.code != 200){
            console.error(params, '=======>>>>>>',msg);
        }

        if(typeof(msg) == 'object'){
            msg.ts = Date.now();
        }
        next();
    }
}


module.exports =  new globalFilter();