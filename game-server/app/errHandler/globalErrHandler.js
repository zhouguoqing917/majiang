/**
 * Created by Mrli on 17/4/20.
 */

module.exports = function(err, msg, resp, session, opts, cb){
    console.error('======>>>globalErrorHandler',err);
    cb(null,{code : 500,msg : '错误访问'});
};