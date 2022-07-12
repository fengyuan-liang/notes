# docker-compose搭建hadoop集群

大致的步骤分为：

- 

## 1. 配置SSH

首先我们要配置ssh，通过ssh去连接我们docker的内部的容器，就像我们连接服务器一样

先检查本机是否开启了ssh服务，输入`ssh localhost`看能不能进行自连，如果不能进行连接说明没有开启ssh，输入`vim /etc/ssh/ssh_config`修改ssh的配置，将端口打开，再重启ssh服务即可

## 2. github官网拉取docker-compose文件

我们在github上搜索`docker-hadoop`

https://github.com/big-data-europe/docker-hadoop

这里官方给出了一个git地址：https://github.com/big-data-europe/docker-hadoop.git

我们将代码拉取到本地，这个里面的docker-compose非常重要，相当于我们的资源清单

我们可以分析一下下面的东西，看样子我们只需要准备好这些资源，就可以**一键启动**

![image-20220708101410778](https://cdn.fengxianhub.top/resources-master/202207081014107.png)

我们可以看一下这个清单

```yaml
version: "3"

services:
  namenode:
    image: bde2020/hadoop-namenode:2.0.0-hadoop3.2.1-java8
    container_name: namenode
    restart: always
    ports:
      - 9870:9870
      - 9000:9000
    volumes:
      - hadoop_namenode:/hadoop/dfs/name
    environment:
      - CLUSTER_NAME=test
    env_file:
      - ./hadoop.env

  datanode:
    image: bde2020/hadoop-datanode:2.0.0-hadoop3.2.1-java8
    container_name: datanode
    restart: always
    volumes:
      - hadoop_datanode:/hadoop/dfs/data
    environment:
      SERVICE_PRECONDITION: "namenode:9870"
    env_file:
      - ./hadoop.env
  
  resourcemanager:
    image: bde2020/hadoop-resourcemanager:2.0.0-hadoop3.2.1-java8
    container_name: resourcemanager
    restart: always
    environment:
      SERVICE_PRECONDITION: "namenode:9000 namenode:9870 datanode:9864"
    env_file:
      - ./hadoop.env

  nodemanager1:
    image: bde2020/hadoop-nodemanager:2.0.0-hadoop3.2.1-java8
    container_name: nodemanager
    restart: always
    environment:
      SERVICE_PRECONDITION: "namenode:9000 namenode:9870 datanode:9864 resourcemanager:8088"
    env_file:
      - ./hadoop.env
  
  historyserver:
    image: bde2020/hadoop-historyserver:2.0.0-hadoop3.2.1-java8
    container_name: historyserver
    restart: always
    environment:
      SERVICE_PRECONDITION: "namenode:9000 namenode:9870 datanode:9864 resourcemanager:8088"
    volumes:
      - hadoop_historyserver:/hadoop/yarn/timeline
    env_file:
      - ./hadoop.env
  
volumes:
  hadoop_namenode:
  hadoop_datanode:
  hadoop_historyserver:
```

我们大致可以看出需要那些东西，现在我们结合自己的集群来配置一个这样的文件就可以了，我们看一下nginx的配置文件叭

```shell
server {
    listen       80;
    server_name  localhost;

    root /data;
    gzip on;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Accept-Encoding "";
    }

    location /bde-css/ {
    }
}

server {
  listen 127.0.0.1:8000;
  location / {
      proxy_pass http://127.0.0.1:8001;
      sub_filter '</head>' '<link rel="stylesheet" type="text/css" href="/bde-css/materialize.min.css">
      <link rel="stylesheet" type="text/css" href="/bde-css/bde-hadoop.css"></head>';
      sub_filter_once on;
      proxy_set_header Accept-Encoding "";
  }    
}

server {
  listen 127.0.0.1:8001;
  gunzip on;
  location / {
    proxy_pass http://namenode:50070;
    proxy_set_header Accept-Encoding gzip;
  }
}
```

