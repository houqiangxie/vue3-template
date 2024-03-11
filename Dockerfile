# 指定基础镜像为最新版 nginx
FROM nginx:latest
# 将项目下的 ./nginx 文件夹放置在镜像中的 /home/nginx/configs 文件夹
ADD ./nginx /home/nginx/configs
ADD ./dist /data/html
# 运行 nginx
CMD ["nginx","-c","/home/nginx/configs/nginx.conf","-g", "daemon off;"]
# 镜像对外暴露 3000 端口
EXPOSE 9999
