let express = require('express');
let router = express.Router();
let http = require('../lib/httpHelper');
let cryptUtil = require("./crypt");
//var xml2js = require('xml2js');
//let randomutils = require('../lib/randomutils');

const mongoose = require('mongoose');

let wechat_AppID = 'wx010656fcc8f87eea';
let wechat_AppSecret = '41d7386f0f977ba715e8012bae278062';

router.get('/', function(req, res, next) {
    //var a=JSON.parse(req.body.a);
    res.json({a:1});
    next();
});

/**
 * 登陆
 */
router.get('/login', async function(req, res, next) {
    console.log(`获取到query: ${JSON.stringify(req.query)}`);
    console.log(`获取到code: ${JSON.stringify(req.query.code)}`);
    // 加解密，预留
    // let encrypt_text = cryptUtil.des.encrypt(JSON.stringify(req.body),0);
    // let decrypt_text = cryptUtil.des.decrypt(encrypt_text,0);

    // code 换取 access_token
    try{
        let wechat_url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${wechat_AppID}&secret=${wechat_AppSecret}&code=${req.query.code}&grant_type=authorization_code`;
        let data=await http.getLocal(wechat_url);
        console.log(`收到信息${data}`,wechat_url,'======>>wechat_url');
        let wxlogin=JSON.parse(data);
        if(wxlogin.errcode){
            throw new Error(wxlogin.errmsg);
        }
        let {access_token,expires_in,refresh_token,openid,scope,unionid} = wxlogin;

        let wechat_userinfo = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`;
        data = await http.getLocal(wechat_userinfo);
        let wxuserinfo=JSON.parse(data);
        if(wxuserinfo.errcode){
            throw new Error(wxuserinfo.errmsg);
        }
        let gameUserObject={openid:openid,token:access_token,wxlogin:wxlogin,wxuserinfo:wxuserinfo};
        console.log(gameUserObject);
        const gameUser = mongoose.models['GameUser'];
        await gameUser.register(gameUserObject);

        res.json({code:200,openid:openid,token:access_token});
    }catch(ex){
        res.json({code:500,msg:ex.message});
    }
});

/**
 * 微信支付订单获取
 */
// router.post('/api/wxorder', async function(req, res, next) {
//     console.log(`获取到body: ${JSON.stringify(req.body)}`);
//     let wxpay_url = `https://api.mch.weixin.qq.com/pay/unifiedorder`;
//
//     let body = `<xml>
//            <appid>wx2421b1c4370ec43b</appid>
//            <attach>支付测试</attach>
//            <body>APP支付测试</body>
//            <mch_id>10000100</mch_id>
//            <nonce_str>1add1a30ac87aa2db72f57a2375d8fec</nonce_str>
//            <notify_url>http://wxpay.wxutil.com/pub_v2/pay/notify.v2.php</notify_url>
//            <out_trade_no>1415659990</out_trade_no>
//            <spbill_create_ip>14.23.150.211</spbill_create_ip>
//            <total_fee>${req.total_fee}</total_fee>
//            <trade_type>APP</trade_type>
//            <!--<sign>0CB01533B8C1EF103065174F50BCA001</sign>-->
//         </xml>`;
//
//     let xmlcontent;
//     xml2js.parseString(body,{explicitArray : false}, function (error, res) {
//         let obj = res.xml;
//         // 升序排序,拼接字符串key="value"&
//         Object.keys(obj).sort();
//         let content = '';
//         for(let key of Object.keys(obj).sort()){
//             content += `${key}=${obj[key]}&`;
//         }
//         // 拼接api密钥
//         content += '192006250b4c09247ec02edce69f6a2d';
//         // md5签名
//         let sign = crypto.createHash('md5').update(content).digest('hex');
//         obj.sign = sign;
//         var builder = new xml2js.Builder();
//         xmlcontent = builder.buildObject(obj);
//     });
//
//     // 时间戳 秒，10位，毫秒要转换成秒
//     let timestamp = parseInt(new Date().getTime()/1000);
//     // 随机字符串，不长于32位
//     let noncestr = randomutils.randomstring(32);
//     // 商户订单号 时间戳毫秒+19位随机数
//     let out_trade_no = new Date().getTime() + randomutils.randomstring(19);
//     data=await http.postLocal(wxpay_url, xmlcontent);
//
//     let orderres=JSON.parse(data);
//     // 请求成功
//     if(orderres.return_code === 'SUCCESS') {
//         // 成功时返回的字段
//         //let {appid, mch_id, device_info, nonce_str, sign, result_code, err_code, err_code_des};
//     } else {
//     // 请求失败
//         /// 失败时返回的字段
//         //let {trade_type, prepay_id};
//     }
//     // 返回信息
//     if(orderres.return_msg){
//
//     }
//     //let {appid,partnerid,prepayid,package,noncestr,timestamp,sign};
// });

/**
 * 微信支付查询
 */
module.exports = router;
