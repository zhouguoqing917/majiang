/**
 * Created by pg on 2017/3/2.
 */

var randomUtils = {
    randomstring: function (len) {
        len = len || 32;
        var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
        var maxPos = $chars.length;
        var pwd = '';
        for (i = 0; i < len; i++) {
            pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return pwd;
    },

    random: function (len) {
        len = len || 32;
        var pwd = '';
        for (i = 0; i < len; i++) {
            pwd += Math.floor(Math.random() * len);
        }
        return pwd;
    }
};

module.exports = function () {
    len = len || 32;
    var pwd = '';
    for (i = 0; i < len; i++) {
        pwd += Math.floor(Math.random() * len);
    }
    return pwd;
}

module.exports = randomUtils;