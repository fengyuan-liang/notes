# MongoDB高级特性

这里我们主要学习以下特性：

- MongoDB的副本集：操作、主要概念、故障转移、选举规则 
- MongoDB的分片集群：概念、优点、操作、分片策略、故障转移 
- MongoDB的安全认证

## 1. 副本集-Replica Sets

### 1.1 简介

MongoDB中的副本集（Replica Set）是一组维护相同数据集的mongod服务。 副本集可提供冗余和高可用性，是所有生产部署的基础。 也可以说，副本集类似于有自动故障恢复功能的主从集群。通俗的讲就是用多台机器进行同一数据的异步同步，从而使多台机器拥有同一数据的多个副本，并且当主库当掉时在不需要用户干预的情况下自动 切换其他备份服务器做主库。而且还可以利用副本服务器做只读服务器，实现读写分离，提高负载。

（1）冗余和数据可用性 

复制提供冗余并提高数据可用性。 通过在不同数据库服务器上提供多个数据副本，复制可提供一定级别的容错功能，以防止丢失单个数据库服务器。 

在某些情况下，复制可以提供增加的读取性能，因为客户端可以将读取操作发送到不同的服务上， 在不同数据中心维护数据副本可以增加分布式应用程序的数据位置和可用性。 您还可以为专用目的维护其他 副本，例如灾难恢复，报告或备份。 

（2）MongoDB中的复制 

副本集是一组维护相同数据集的mongod实例。 副本集包含多个数据承载节点和可选的一个仲裁节点。 在承载数据的节点中，一个且仅一个成员被视为主节点，而其他节点被视为次要（从）节点。 主节点接收所有写操作。 

副本集只能有一个主要能够确认具有{w：“most”}写入关注的写入; 虽然在某些情况下，另一个mongod实例可能暂时认为自己也是主要的。主要记录其操作日志中的数据集的所有更改，即oplog。

![](https://cdn.fengxianhub.top/resources-master/20220729180022.png)


辅助(副本)节点复制主节点的oplog并将操作应用于其数据集，以使辅助节点的数据集反映主节点的数据 集。 如果主要人员不在，则符合条件的中学将举行选举以选出新的主要人员。

（3）主从复制和副本集区别 

主从集群和副本集最大的区别就是副本集没有固定的“主节点”；整个集群会选出一个“主节点”，当其挂 掉后，又在剩下的从节点中选中其他节点为“主节点”，副本集总有一个活跃点(主、primary)和一个或多 个备份节点(从、secondary)。

### 1.2 副本集的三个角色

副本集有两种类型三种角色

两种类型：

- 主节点（Primary）类型：数据操作的主要连接点，可读写。 
- 次要（辅助、从）节点（Secondaries）类型：数据冗余备份节点，可以读或选举。

三种角色：

主要成员（Primary）：主要接收所有写操作。就是主节点。

副本成员（Replicate）：从主节点通过复制操作以维护相同的数据集，即备份数据，不可写操作，但可以读操作（但需要配置）。是默认的一种从节点类型。

仲裁者（Arbiter）：不保留任何数据的副本，只具有投票选举作用。当然也可以将仲裁服务器维护为副 本集的一部分，即副本成员同时也可以是仲裁者。也是一种从节点类型。

![](https://cdn.fengxianhub.top/resources-master/20220729181326.png)

关于仲裁者的额外说明：

您可以将额外的mongod实例添加到副本集作为仲裁者。 仲裁者不维护数据集。 仲裁者的目的是通过响应其他副本集成员的心跳和选举请求来维护副本集中的仲裁。 因为它们不存储数据集，所以仲裁器可以是提供副本集仲裁功能的好方法，其资源成本比具有数据集的全功能副本集成员更便宜。 

如果您的副本集具有偶数个成员，请添加仲裁者以获得主要选举中的`大多数`投票。 仲裁者不需要专用硬件。 

仲裁者将永远是仲裁者，而主要人员可能会退出并成为次要人员，而次要人员可能成为选举期间的主要人员。 

如果你的副本+主节点的个数是偶数，建议加一个仲裁者，形成奇数，容易满足大多数的投票。 

如果你的副本+主节点的个数是奇数，可以不加仲裁者。

### 1.3 副本集架构目标

这里我们在Linux环境上搭建一个`一主一副本一仲裁`的MongoDB集群，集群拓扑如下：

![](https://cdn.fengxianhub.top/resources-master/20220729184427.png)


### 1.4 副本集的创建

如果Linux服务器上面没有Mongo的话可以快速安装一下（centos7）：

```shell
yum install libcurl openssl \
&& wget https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel70-6.0.0.tgz \
&& tar -zxvf mongodb-shell-linux-x86_64-rhel70-4.0.28.tgz \
&& rm -rf mongodb-shell-linux-x86_64-rhel70-4.0.28.tgz \
&& mv mongodb-linux-x86_64-rhel70-4.0.28  /usr/local/mongodb4 \
&& (
	cat <<EOF
	#set MongoDB environment
	export PATH=/usr/local/mongodb4/bin:\$PATH
	EOF
) >> /etc/profile && source /etc/profile && mongo -version
```

可以通过`mongo -version`查看是否安装成功

![](https://cdn.fengxianhub.top/resources-master/20220729204255.png)

除此之外，还可以通过docker-compose安装，过程要简单一些，感觉没必要在搭环境上面浪费太多的时间，后面的搭建步骤没有写完，请看黑马的笔记

请参考：

<a href="https://blog.csdn.net/XY1790026787/article/details/107992996?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522165910057816781432973959%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=165910057816781432973959&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-2-107992996-null-null.142^v35^experiment_2_v1&utm_term=docker-compose%E6%90%AD%E5%BB%BAmongoDB%E5%89%AF%E6%9C%AC%E9%9B%86%E9%9B%86%E7%BE%A4&spm=1018.2226.3001.4187">docker-compose搭建mongodb副本集记录</a>

![](https://cdn.fengxianhub.top/resources-master/20220729213422.png)


#### 1.4.1 第一步：创建主节点

建立存放数据和日志的目录

```shell
mkdir -p /mongodb/replica_sets/myrs_27017/log \ & mkdir -p /mongodb/replica_sets/myrs_27017/data/db
```

新建或修改配置文件：

```shell
vim /mongodb/replica_sets/myrs_27017/mongod.conf
```

myrs_27017：

```shell
systemLog:  
  #MongoDB发送所有日志输出的目标指定为文件   
destination: file  
  #mongod或mongos应向其发送所有诊断日志记录信息的日志文件的路径  
  path: "/mongodb/replica_sets/myrs_27017/log/mongod.log"  
  #当mongos或mongod实例重新启动时，mongos或mongod会将新条目附加到现有日志文件的末尾。  
  logAppend: true  
storage:  
  #mongod实例存储其数据的目录。storage.dbPath设置仅适用于mongod。  
  dbPath: "/mongodb/replica_sets/myrs_27017/data/db"  
  journal:  
  #启用或禁用持久性日志以确保数据文件保持有效和可恢复。  
  enabled: true  
processManagement:  
  #启用在后台运行mongos或mongod进程的守护进程模式。  
  fork: true  
  #指定用于保存mongos或mongod进程的进程ID的文件位置，其中mongos或mongod将写入其PID  
  pidFilePath: "/mongodb/replica_sets/myrs_27017/log/mongod.pid"  
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip   
  #bindIpAll: true   
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址  
  bindIp: localhost,192.168.2.13  
  #bindIp  
  #绑定的端口  
  port: 27017  
replication:  
  #副本集的名称  
  replSetName: myrs
```

启动节点服务：

```shell
mongod -f /mongodb/replica_sets/myrs_27017/mongod.conf
```

#### 1.4.2 第二步：创建副本节点

建立存放数据和日志的目录

```shell
#-----------myrs \
#副本节点 
mkdir -p /mongodb/replica_sets/myrs_27018/log \ & mkdir -p /mongodb/replica_sets/myrs_27018/data/db
```

新建或修改配置文件：

```shell
vim /mongodb/replica_sets/myrs_27018/mongod.conf
```

myrs_27018：

```shell
systemLog:  
  #MongoDB发送所有日志输出的目标指定为文件   
destination: file  
  #mongod或mongos应向其发送所有诊断日志记录信息的日志文件的路径  
  path: "/mongodb/replica_sets/myrs_27017/log/mongod.log"  
  #当mongos或mongod实例重新启动时，mongos或mongod会将新条目附加到现有日志文件的末尾。  
  logAppend: true  
storage:  
  #mongod实例存储其数据的目录。storage.dbPath设置仅适用于mongod。  
  dbPath: "/mongodb/replica_sets/myrs_27017/data/db"  
  journal:  
  #启用或禁用持久性日志以确保数据文件保持有效和可恢复。  
  enabled: true  
processManagement:  
  #启用在后台运行mongos或mongod进程的守护进程模式。  
  fork: true  
  #指定用于保存mongos或mongod进程的进程ID的文件位置，其中mongos或mongod将写入其PID  
  pidFilePath: "/mongodb/replica_sets/myrs_27017/log/mongod.pid"  
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip   
  #bindIpAll: true   
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址  
  bindIp: localhost,192.168.2.13  
  #bindIp  
  #绑定的端口  
  port: 27018 
replication:  
  #副本集的名称  
  replSetName: myrs
```

启动节点服务

```shell
[root@bobohost replica_sets]# /usr/local/mongodb/bin/mongod -f /mongodb/replica_sets/myrs_27018/mongod.conf 
```

1.4.3 第三步：创建仲裁节点

建立存放数据和日志的目录

```shell
#-----------myrs 
#仲裁节点 
mkdir -p /mongodb/replica_sets/myrs_27019/log \ & mkdir -p /mongodb/replica_sets/myrs_27019/data/db
```

仲裁节点：

新建或修改配置文件：

```shell
vim /mongodb/replica_sets/myrs_27019/mongod.conf
```

myrs_27019：

```shell
systemLog:  
  #MongoDB发送所有日志输出的目标指定为文件   
destination: file  
  #mongod或mongos应向其发送所有诊断日志记录信息的日志文件的路径  
  path: "/mongodb/replica_sets/myrs_27017/log/mongod.log"  
  #当mongos或mongod实例重新启动时，mongos或mongod会将新条目附加到现有日志文件的末尾。  
  logAppend: true  
storage:  
  #mongod实例存储其数据的目录。storage.dbPath设置仅适用于mongod。  
  dbPath: "/mongodb/replica_sets/myrs_27017/data/db"  
  journal:  
  #启用或禁用持久性日志以确保数据文件保持有效和可恢复。  
  enabled: true  
processManagement:  
  #启用在后台运行mongos或mongod进程的守护进程模式。  
  fork: true  
  #指定用于保存mongos或mongod进程的进程ID的文件位置，其中mongos或mongod将写入其PID  
  pidFilePath: "/mongodb/replica_sets/myrs_27017/log/mongod.pid"  
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip   
  #bindIpAll: true   
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址  
  bindIp: localhost,192.168.2.13  
  #bindIp  
  #绑定的端口  
  port: 27019 
replication:  
  #副本集的名称  
  replSetName: myrs
```

启动节点服务：

```shell
[root@bobohost replica_sets]# /usr/local/mongodb/bin/mongod -f /mongodb/replica_sets/myrs_27019/mongod.conf
```

#### 1.4.5 第四步：初始化配置副本集和主节点

后面还有一些，请看黑马的笔记，这里还是推荐使用docker安装

主要的命令有：


在其中一个节点连接mongodb（docker 进入`mongo0`容器进行连接）：

```java
# 连接
mongo

# 认证，如果没有密码则不需要，成功返回1，失败返回0
use admin
db.auth('root', 'root')

```

初始化副本集（无参初始化后，当前节点默认是`PRIMARY`节点）：

```java
rs.initiate()
```

![](https://cdn.fengxianhub.top/resources-master/20220801202154.png)


添加节点（下面的是docker的添加方式，分布式的用ip地址代替下面的主机名即可）：

```java
# 副节点
rs.add('mongo1:27017')

# 仲裁节点
rs.add('mongo2:27017', true)

```

查看副本集配置信息：

```java
rs.conf()
```



查看副本集运行状态

```java
rs.status()
```

### 1.5 副本节点的读写操作

登录主节点，写入和读取数据：

```java
replica-set:PRIMARY> use articledb
switched to db articledb
replica-set:PRIMARY> db
articledb
replica-set:PRIMARY> db.comment.insertOne({
... "_id": "1", "articleid": "100001", "content": "我们不应该把清晨浪费在手机上，健康很重要，一杯温水幸福你我他。", "userid": "1002", "nickname": "相忘于江湖", "createdatetime": new Date("2019-08-05T22:08:15.522Z"), "likenum": NumberInt(1000), "state": "1"
... })
```



登录从节点27018，这里需要注意：从节点默认是不能读取集合的数据。当前从节点只是一个备份，不是奴隶节点，无法读取数据，写当然更不行。 因为默认情况下，从节点是没有读写权限的，可以增加读的权限，但需要进行设置。

设置读操作权限： 

说明： 设置为奴隶节点，允许在从成员上运行读的操作 

语法：

```java
rs.slaveOk() 
#或 
rs.slaveOk(true)
# 最新版（6版本以上的）命令更改为
rs.secondaryOk()
```

提示： 该命令是 db.getMongo().setSlaveOk() 的简化命令。

【示例】 在`SECONDARY`上设置作为奴隶节点权限，具备读权限：

![](https://cdn.fengxianhub.top/resources-master/20220801210829.png)


