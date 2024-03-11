dcocker 部署

1.dockerfile
  # 指定基础镜像为最新版 nginx
	FROM nginx:latest
	# 将项目下的 ./nginx 文件夹放置在镜像中的 /home/nginx/configs 文件夹
	ADD ./nginx /home/nginx/configs
	ADD ./dist /data/html
	# 运行 nginx
	CMD ["nginx","-c","/home/nginx/configs/nginx.conf","-g", "daemon off;"]
	# 镜像对外暴露 9999端口
	EXPOSE 9999

2. nginx/nginx.conf
 
   user  root;
    worker_processes  auto;

    events {
    worker_connections  1024;
    }

    http {
    include  /etc/nginx/mime.types;
    default_type  application/octet-stream;
    keepalive_timeout  65;
    server {
        listen       9999;
        server_name  localhost;

        #access_log  /var/log/nginx/host.access.log  main;
        location / {
        #root /etc/nginx/html; 
        root /data/html;
        try_files $uri $uri/ /index.html;
        index index.html index.htm;
        }

    location ^~/gateway {
        proxy_pass http://172.17.30.184:8899/;
        }

        location /myResource/ {
        root /data/;
        autoindex on;
    }
        
        gzip on;
        gzip_static on;
        gzip_min_length 1k;
        gzip_buffers 16 64k;
        gzip_http_version 1.1;
        gzip_comp_level 9;
        gzip_types text/plain text/javascript application/javascript image/jpeg image/gif image/png application/font-woff application/x-javascript text/css application/xml;
        gzip_vary on;
        gzip_disable "MSIE [1-6]\.";
        root html/subCharge;
        index index.html index.htm;
    
    }
    }







3.# 构建镜像
# -t 后表示指定镜像名称 sv3 镜像标签 v1
# . 表示指定 Dockerfile 所在目录
docker build -t sv3:v1 .

4. 查看镜像
docker images -a # 查询本地全部镜像
docker images sv3 # 查看名为 sv3 的镜像

5. 移除镜像
docker rmi id/name # 根据镜像 id 或 name 删除镜像

6. 运行容器
	# --name 指定容器名称为 sv3
	# -p 指定外部端 9527 于容器内 9527端口连接
	# -v 代表绑定卷 也就是本地的 dist 文件如果变更 容器内的 dist文件也会做出相应改变
	# 注意 -v 两侧均需要使用绝对路径
	# -d 表示在后台运行
	# 最后的 sv3:v1 表示使用指定的镜像
	docker run --name sv3 -p 9527:9527 -v D:/sv3-template/dist:/dist -d sv3:v1


7.其他命令
# 查询容器
docker ps -a # 查询全部容器
docker ps -a | grep xxx # 筛选查询容器

# 运行容器
docker start xxx
# 暂停容器
docker stop xxx
# 重启容器
docker restart xxx

# 删除容器
docker rm 




