// // /**
// //  * Created by Mrli on 17/3/10.
// //  */
// // 代理登陆
// // /users/login
// // type : get
// // params :
// //     userName 用户名
// //     password 密码
// //
// // return :
// //     {   code : 200,
// //         userInfo : {
// //             realName : realName, //真实姓名
// //             weixinName : gameUser.wxuserinfo.weixin, //微信昵称
// //             tel : tel, //电话
// //             address : address, //地址
// //             grade : grade, //等级 0 直属代理 1,一级代理 2, 二级代理
// //             parentId : parentId, //所属一级代理id
// //             password : password, //密码
// //             createTime : new Date(), //创建时间
// //             userName : userName //用户名
// //         }
// //     }
// //
// //
// // //管理员登陆
// // /users/adminLogin
// // type : get
// // params :
// //     userName 用户名
// //     password 密码
// //
// // return :
// //     {code : 200}
// //
// //
// // //获取下级代理
// // /actions/getMyLowAgent
// // type : get
// // params :
// //     index //分页第几页
// //
// // return :
// //     {code : 200 , agents : [{同/users/login}]}
// //
// //
// // //添加代理
// // /actions/addAgent
// // type : get ,
// // params :
// //     gameUserId //代理的游戏id
// //     realName //真实姓名
// //     tel //电话
// //     address //地址
// //     password //密码
// //     userName//用户名
// //     grade //等级
// //     parentId //上级id
// //
// // return :
// //     {code : 200, userInfo : {同/users/login}}
// //
// //
// // var gameUser = {};
// // gameUser.ipaddress = 'fff:168.1.1.1';
// // console.log(gameUser.ipaddress.substring(gameUser.ipaddress.lastIndexOf(':') + 1));
//
//

//{
//    "openid" : "ol9tcw_Uuw_MLJd8yqkAP1pn3E3I44",
//    "token" : "445MHj-OfGLaiy8NRIKW2yowEXvtAgXoXDNOqnwOEciAsrtUAg204Ele2mws2G-LuSi7dukv-Jph5wJ-vjIJdxrGLur6WZ163YGvuxoWfPnbE",
//    "wxlogin" : {
//    "access_token" : "5MHj-OfGLaiy8NRIKW2yowEXvtAgXoXDNOqnwOEciAsrtUAg204Ele2mws2G-LuSi7dukv-Jph5wJ-vjIJdxrGLur6WZ163YGvuxoWfPnbE",
//        "expires_in" : 7200,
//        "refresh_token" : "_TggxwVWDGyb70b0Ka51DGQ77xBSI7_aS0pTtrGYmbn3wgJ2403J8uAdq2ziN7QFko5jeuTXPZwT2djDFc4-IxBWGUwvilo6ED3GRi7lSLs",
//        "openid" : "ol9tcw_Uuw_MLJd8yqkAP1pn3E3I",
//        "scope" : "snsapi_userinfo",
//        "unionid" : "ok_dJw7Hr7dUhVru9sELbGKVg8V4"
//},
//    "wxuserinfo" : {
//    "openid" : "ol9tcw_Uuw_MLJd8yqkAP1pn3E3I44",
//        "nickname" : "yaoyaomajiang0444",
//        "sex" : 0,
//        "language" : "zh_CN",
//        "city" : "",
//        "province" : "",
//        "country" : "CN",
//        "headimgurl" : "http://wx.qlogo.cn/mmopen/iaunJblKD5xhibQ8v4FT7xzsKDNtFiaKSpqiaVGtfoDKXE3AdETPiaMNUOO9AkE5sjSD7QWf0PFic4Iib8J2lKvqrF6wCeGYyOfAxqu/0",
//        "privilege" : [],
//        "unionid" : "ok_dJw7Hr7dUhVru9sELbGKVg8V4"
//},
//    "id" : 900004,
//    "created_at" : ISODate("2017-04-10T09:23:02.784Z"),
//    "roomCard" : 21,
//    "__v" : 0,
//    "ipaddress" : "106.19.203.197",
//    "currRoomNo" : 127302
//}
//var arr = [1,99]
//console.log(arr.indexOf(99));
//var Check = require('./app/servers/room/model/check.js')
//
//var check;
//var test = function(){
//    console.log(check);
//};
//test.prototype.create = function(temp){
//    check = new Check(temp);
//}
//
////module.exports = test;
//var self = this ;
//this.timer = setTimeout(function(){
//    clearTimeout(self.timer)
//    self.timer = null
//},100);
//
//setInterval(function(){
//    console.log(self.timer);
//},60)
console.log(new Date('2017/05/15').getTime())