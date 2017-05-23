#!/bin/bash


if [ "$1" == "production" ]
then
    echo 'production start update'
    ssh root@106.14.94.54 "cd /home/work ; ./game.sh ;exit";
    echo '======== 服务器106.14.94.54 拉取代码完毕 ========'

    ssh root@106.15.45.74 "cd /home/work ; ./game.sh ;exit";
    echo '======== 入口服务器 106.15.45.74 拉取完毕 并启动完成========'
else
    echo 'stage start update'

    ssh root@106.14.240.205 "cd /home/work ; ./game.sh ;exit";
    echo '======== 服务器 106.14.240.205 拉取代码完毕 ========'

    ssh root@106.15.38.247 "cd /home/work ; ./game.sh ;exit";
    echo '======== 入口服务器 106.15.38.247 拉取完毕 并启动完成========'
fi



