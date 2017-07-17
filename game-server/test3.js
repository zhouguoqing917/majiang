cardRecordModel.aggregate([
    {
        $match: {
            $or :[{agentName: 'admin'}],
            "createTime": {$gte: new Date('2017/06/04'), $lt: new Date('2017/07/04')},
        }
    },
    {
        $project : {
            day : {$substr: [{"$add":["$createTime", 28800000]}, 0, 10] },//时区数据校准，8小时换算成毫秒数为8*60*60*1000=288000后分割成YYYY-MM-DD日期格式便于分组
            "cardNum1": 1,
            "cardNum2": 1,
            "cardNum3" : 1
        }
    },
    {
        $group : {
            _id : "$day",
            "cardNum1" : {$sum : "$cardNum1"},
            "cardNum2" : {$sum : "$cardNum2"},
            "cardNum3" : {$sum : "$cardNum3"}
        }
    },
    {
        $sort: {
            "_id": -1
        }
    }
]);