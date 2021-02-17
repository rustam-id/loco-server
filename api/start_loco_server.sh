#!/bin/bash
echo "Удаление существующих образа и контейнера";
docker stop loco_server;
docker rm loco_server;
docker rmi loco_server_img:v1;
echo "Начало процесса установки";
echo "Устанавливаем образ  сервиса"; 
docker build -t loco_server_img:v1 .;
echo "Запускаем контейнер";
docker run -p 3008:3008  -d  --name loco_server loco_server_img:v1;