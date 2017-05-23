var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    var a=JSON.parse(req.body.a);
    res.json({a:1});
    next();
});

router.post('/', function(req, res, next) {
    console.log(req.body.username);
    res.send('ok');
    //next();
});

module.exports = router;