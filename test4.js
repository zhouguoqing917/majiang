let crypto = require('crypto');
let str = '3da55aa8cb60be06c9ae9f3ff00eec17' + '123'
const hash = crypto.createHash('md5');
hash.update(str);
let checkNum = hash.digest('hex');
console.log(checkNum);