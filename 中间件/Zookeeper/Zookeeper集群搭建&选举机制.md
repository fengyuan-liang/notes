# Zookeeper集群搭建&选举机制

## 1. 集群搭建

这里我们使用docker-compose搭建

先拉取镜像

```java
docker pull zookeeper
```



```yaml
version: '3.1'
services:
      zoo1:
          image: zookeeper
          restart: always
          container_name: zoo1
          ports:
            - 2181:2181
          volumes:
            - /home/zk/zoo1/data:/data
            - /home/zk/zoo1/datalog:/datalog
          environment:
            ZOO_MY_ID: 1
            ZOO_SERVERS: server.1=zoo1:2888:3888;2181 server.2=zoo2:2888:3888;2181 server.3=zoo3:2888:3888;2181
            ZOO_AUTOPURGE_PURGEINTERVAL: 1

      zoo2:
          image: zookeeper
          restart: always
          container_name: zoo2
          ports:
            - 2182:2181
          volumes:
            - /home/zk/zoo2/data:/data
            - /home/zk/zoo2/datalog:/datalog
          environment:
             ZOO_MY_ID: 2
             ZOO_SERVERS: server.1=zoo1:2888:3888;2181 server.2=zoo2:2888:3888;2181 server.3=zoo3:2888:3888;2181
             ZOO_AUTOPURGE_PURGEINTERVAL: 1

      zoo3:
          image: zookeeper
          restart: always
          container_name: zoo3
          ports:
            - 2183:2181
          volumes:
            - /home/zk/zoo3/data:/dada
            - /home/zk/zoo3/datalog:/datalog
          environment:
            ZOO_MY_ID: 3
            ZOO_SERVERS: server.1=zoo1:2888:3888;2181 server.2=zoo2:2888:3888;2181 server.3=zoo3:2888:3888;2181
            ZOO_AUTOPURGE_PURGEINTERVAL: 1

```

ln -s docker-runc-current docker-runc

## 2. Leader选举

![image-20220520091021747](https://cdn.fengxianhub.top/resources-master/202205200910258.png)

选举的时候需要一些参数作为参考的维度，主要有两个参数

- Serverid：服务器ID

  例如有三台服务器，编号分别为1、2、3，编号越大的在选择算法中权重越大

- Zxid：数据ID

  服务器中存放的最大数据ID，值越大说明数据越新，权重越大

>如果某台机器获得超过半数的选票就成为leader

我们以上面的五台Zookeeper集群为例看一下选举的过程：

1. 首先Server1上线，此时集群内只有它一台机器，它会投票给自己，但是其票数没有过半（即三票），此时不能成为leader
2. Server2上线，由于集群内现在还没有leader，重新选举。根据Zookeeper顺序结点的特性，Server2的编号会比Server1大，所以Server1根据权重规则将票投给Server2，Server2投给自己，但是票数依旧没有过半，不能成为leader
3. Server3上线，集群内没有leader，重新选举。同理Server1、2、3根据权重规则都会投给Server3，此时Server3票数过半，成为整个集群的leader
4. Server4、5上线，由于集群内已经有leader了，所以不会再继续投票

## 3. Zookeeper集群角色

![image-20220520094552621](https://cdn.fengxianhub.top/resources-master/202205200945742.png)

**Zookeeper集群服务中有三个角色：**

1. Leader领导者
   - 负责处理事务请求
   - 集群内部各服务器的调度者
2. Follower跟随者
   - 处理客户端非事务请求，转发事务请求给Leader服务器
   - 参与Leader选举投票
3. Observer观察者
   - 处理客户端非事务请求，转发事务请求给Leader服务器
   - 不能参与Leader选举投票

































