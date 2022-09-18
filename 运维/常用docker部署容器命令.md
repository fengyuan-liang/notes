# docker安装集合

🌻 如果已经过运行的项目
🌟如果已经启动的项目.则使用update更新：

```jva
docker update --restart = always 容器id
```

## 1. 项目管理工具

### 1.1 docker安装禅道

```java
docker run -d \
-p 9053:80 \
--restart always \
--name zandao \
--privileged \
idoop/zentao:latest \
&& docker ps
```

### 1.2 安装堡垒机jumpserver

数据库由 DBA 在 MySQL 中创建：

```java
create database jumpserver default charset 'utf8' collate 'utf8_bin';
grant all on jumpserver.* to 'jumpserver'@'%' identified by 'l5UxsdvsdpYKdX';
```

```java
$ docker run --name jumperserver -d \
    -v /home/data/www/jms.wzlinux.com:/opt/jumpserver/data/media \
    -p 80:80 \
    -p 2222:2222 \
    -e SECRET_KEY=ytdh2lXAId8KjUdfyrVREVucBDCcnJzYehuHf6WRgLEXneUAsP \
    -e BOOTSTRAP_TOKEN=WhcyK8QTa0vckMmC \
    -e DB_HOST=172.17.0.5 \
    -e DB_PORT=3306 \
    -e DB_USER=jumpserver \
    -e DB_PASSWORD=l5UxsdvsdpYKdX \
    -e DB_NAME=jumpserver \
    -e REDIS_HOST=127.0.0.1 \
    -e REDIS_PORT=6379 \
    -e REDIS_PASSWORD= \
    --restart=on-failure:10 \
    jumpserver/jms_all:latest
```





## 2. 数据库

### 2.1 安装mysql

```java
docker run -d \
-p 3308:3306 \
--name mysql57 \
--restart always \
-e MYSQL_ROOT_PASSWORD=k4uc93i9y7v9r3ernbhijd848dawp6alb8ko8 \
--character-set-server=utf8mb4 \
--collation-server=utf8mb4_unicode_ci \
mysql:5.7 
```

### 2.2 安装redis









## 3. 容器编排工具

### 3.1 K8s集群(手动安装)

#### 3.1.1 docker搭建centos容器

K8s集群需要centos版本高于7.8

首先我们创建一个网桥

```java
docker network create --subnet=172.30.0.0/16 k8s_net && docker network ls
```

拉取centos7.9的镜像（已经包含ssh、已更新yum源、安装python3.7）

```java
docker pull azheng0506/centos7.9_python3.7:v1.0
```

制作镜像，创建Dockerfile文件

```java
FROM azheng0506/centos7.9_python3.7:1.0
RUN yum -y install openssh-server
RUN yum -y install bind-utils
RUN yum -y install which
RUN yum -y install sudo
RUN yum install -y wget      
```

构建自己的镜像

```java
docker build -t centos7.9-k8s .
```

创建容器并分配好ip地址

```java
docker run -d  \
--add-host k8s-master:172.30.0.2 \
--net k8s_net \
--ip 172.30.0.2 \
-h k8s-master \
-p 10122:22 \
-p 17180:7180 \
--restart always \
--name k8s-master \
--privileged \
fengxiandada/centos7.9-k8s:v1.0.0 \
/usr/sbin/init \
&& docker ps  
```

进入容器修改root密码

```java
$ docker exec -it k8s-master bash
$ su root
$ passwd
$ root
$ root
```

创建slave

```java
docker run -d  \
--add-host k8s-master:172.30.0.2 \
--add-host k8s-slave01:172.30.0.3 \
--net k8s_net \
--ip 172.30.0.3 \
-h k8s-slave01 \
-p 10222:22 \
--restart always \
--name k8s-slave01 \
--privileged \
fengxiandada/centos7.9-k8s:v1.0.0  \
/usr/sbin/init \
&& docker ps
```

#### 3.1.2 集群搭建

初始化master结点

```java
# 只在 master 节点执行
# 替换 x.x.x.x 为 master 节点实际 IP（请使用内网 IP）
# export 命令只在当前 shell 会话中有效，开启新的 shell 窗口后，如果要继续安装过程，请重新执行此处的 export 命令
export MASTER_IP=172.30.0.2
# 替换 apiserver.demo 为 您想要的 dnsName
export APISERVER_NAME=apiserver.demo
# Kubernetes 容器组所在的网段，该网段安装完成后，由 kubernetes 创建，事先并不存在于您的物理网络中
export POD_SUBNET=10.100.0.1/16
echo "${MASTER_IP}    ${APISERVER_NAME}" >> /etc/hosts
curl -sSL https://kuboard.cn/install-script/v1.19.x/init_master.sh | sh -s 1.19.5
```

### 3.2 K8s集群（Kuboard-Spray方式）

```java
docker run -d \
  --privileged \
  --restart=unless-stopped \
  --name=kuboard-spray \
  -p 80:80/tcp \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /home/data/kuboard-spray-data:/data \
  eipwork/kuboard-spray:latest-amd64
  # 如果抓不到这个镜像，可以尝试一下这个备用地址：
  # swr.cn-east-2.myhuaweicloud.com/kuboard/kuboard-spray:latest-amd64
```





