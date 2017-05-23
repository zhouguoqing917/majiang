var crc = require('crc');

// select an item from list based on key
module.exports.dispatch = function(list) {
	var index = parseInt(Math.random() * list.length);
	return list[index];
};
