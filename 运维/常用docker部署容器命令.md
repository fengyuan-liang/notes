# docker安装集合

🌻 如果已经过运行的项目
🌟如果已经启动的项目.则使用update更新：

```jva
docker update --restart=always 容器id
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

<a href="https://blog.csdn.net/icanflyingg/article/details/121898008?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522166589064816800184117777%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=166589064816800184117777&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-2-121898008-null-null.142^v56^pc_search_v2,201^v3^control_2&utm_term=jumpserver%20docker%E5%AE%89%E8%A3%85%E8%AE%BF%E9%97%AE%E4%B8%8D%E4%BA%86&spm=1018.2226.3001.4187">一键部署</a>：

```java
wget https://github.com/jumpserver/jumpserver/releases/download/v2.16.3/quick_start.sh
```

```java
sh quick_start.sh
```

```java
>>> 安装完成了
1. 可以使用如下命令启动, 然后访问
cd /opt/jumpserver-installer-v2.16.3
./jmsctl.sh start

2. 其它一些管理命令
./jmsctl.sh stop
./jmsctl.sh restart
./jmsctl.sh backup
./jmsctl.sh upgrade
更多还有一些命令, 你可以 ./jmsctl.sh --help 来了解

3. Web 访问
http://172.16.1.10:80
默认用户: admin  默认密码: admin

4. SSH/SFTP 访问
ssh -p2222 admin@172.16.1.10
sftp -P2222 admin@172.16.1.10

5. 更多信息
我们的官网: https://www.jumpserver.org/
我们的文档: https://docs.jumpserver.org/
```

手动部署：

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
-p 3310:3306 \
--name mysql57-prod \
--restart always \
-e MYSQL_ROOT_PASSWORD=k4uc93i9y7v9r3ernbhijd848dawp6alb8ko8 \
-e TZ=Asia/Shanghai \
-v /home/data/mysql57/mysql5.7/my.cnf:/etc/mysql/my.cnf \
-v /home/data/mysql57/mysql5.7/data:/var/lib/mysql \
-v /home/data/mysql57/mysql5.7/mysql-files:/var/lib/mysql-files \
-v /home/data/mysql57/mysql5.7/log/mysql/error.log:/var/log/mysql/error.log \
mysql:5.7
```



如果远程连接不上，可以这样

```java
// 先使用user库
use mysql;
// 建议不要使用root，换一个名字
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY '01a0bd0704aa498fa84b71545a808433' WITH GRANT OPTION
刷新权限：flush privileges
```

### 2.2 安装redis

```java
docker run -d \
--name redis \
-p 6379:6379 \
--restart unless-stopped \
--requirepass fsafawfek4uc93i9y7vd848dawp6alb8ko8 \
-v /mydata/redis/data:/data \
-v /mydata/redis/conf/redis.conf:/etc/redis/redis.conf \
redis-server /etc/redis/redis.conf \
redis:buster 

```









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





