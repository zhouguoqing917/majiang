#!/bin/bash


if [ "$1" == "production" ]
then
    echo 'production start update'
    ssh root@47.94.45.41 "cd /home/work ; ./game.sh ;exit";
    echo '======== 服务器47.94.45.41 拉取代码完毕 ========'

    ssh root@106.15.45.74 "cd /home/work ; ./game.sh ;exit";
    echo '======== 入口服务器 106.15.45.74 拉取完毕 并启动完成========'
else
    echo 'stage start update'

    ssh root@47.94.45.41 "cd /home/work ; ./game.sh ;exit";
    echo '======== 服务器47.94.45.41 拉取代码完毕 ========'

fi



