/**
 * Created by Mrli on 17/3/13.
 */
'use strict';
const nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: 'QQ',
    auth: {
        user: '531433870@qq.com',
        pass: 'ahiwhrnaaffabhfi'
    }
});

exports.sendMail = function(content){
    let mailOptions = {
        from: '531433870@qq.com', // sender address
        to: '328822014@qq.com', // list of receivers
        subject: '服务器异常', // Subject line
        text: content// plain text body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        // console.log('Message %s sent: %s', info.messageId, info.response,info);
    });

};


