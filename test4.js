var user1 = 0;
var job1 = 1;
var job2 = 2;
var job3 = 4;
var job4 = 8;

user1 = user1 | job1;
console.log(user1);

user1 = user1 | job2;
console.log(user1);

user1 = user1 | job3;
console.log(user1);
user1 = user1 | job4;
console.log(user1);

console.log('========');

console.log(user1 & job1);

console.log(user1 & job2);

console.log(user1 & job4);