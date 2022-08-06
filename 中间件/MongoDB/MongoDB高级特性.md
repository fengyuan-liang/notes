# MongoDB高级特性

这里我们主要学习以下特性：

- MongoDB的副本集：操作、主要概念、故障转移、选举规则 
- MongoDB的分片集群：概念、优点、操作、分片策略、故障转移 
- MongoDB的安全认证

## 1. 副本集-Replica Sets

### 1.1 简介

MongoDB中的副本集（Replica Set）是一组维护相同数据集的mongod服务。 副本集可提供冗余和高可用性，是所有生产部署的基础。 也可以说，副本集类似于有自动故障恢复功能的主从集群。通俗的讲就是用多台机器进行同一数据的异步同步，从而使多台机器拥有同一数据的多个副本，并且当主库当掉时在不需要用户干预的情况下自动 切换其他备份服务器做主库。而且还可以利用副本服务器做只读服务器，实现读写分离，提高负载。

（1）**冗余和数据可用性** 

复制提供冗余并提高数据可用性。 通过在不同数据库服务器上提供多个数据副本，复制可提供一定级别的容错功能，以防止丢失单个数据库服务器。 

在某些情况下，复制可以提供增加的读取性能，因为客户端可以将读取操作发送到不同的服务上， 在不同数据中心维护数据副本可以增加分布式应用程序的数据位置和可用性。 您还可以为专用目的维护其他 副本，例如灾难恢复，报告或备份。 

（2）**MongoDB中的复制** 

副本集是一组维护相同数据集的mongod实例。 副本集包含多个数据承载节点和可选的一个仲裁节点。 在承载数据的节点中，一个且仅一个成员被视为主节点，而其他节点被视为次要（从）节点。 主节点接收所有写操作。 

副本集只能有一个主要能够确认具有{w：“most”}写入关注的写入; 虽然在某些情况下，另一个mongod实例可能暂时认为自己也是主要的。主要记录其操作日志中的数据集的所有更改，即oplog。

![](https://cdn.fengxianhub.top/resources-master/20220729180022.png)


辅助(副本)节点复制主节点的oplog并将操作应用于其数据集，以使辅助节点的数据集反映主节点的数据 集。 如果主要人员不在，则符合条件的中学将举行选举以选出新的主要人员。

（3）**主从复制和副本集区别** 

主从集群和副本集最大的区别就是副本集没有固定的“主节点”；整个集群会选出一个`主节点`，当其挂掉后，又在剩下的从节点中选中其他节点为`主节点`，副本集总有一个活跃点(主、primary)和一个或多个备份节点(从、secondary)。

### 1.2 副本集的三个角色

副本集有两种类型三种角色

两种类型：

- 主节点（Primary）类型：数据操作的主要连接点，可读写。 
- 次要（辅助、从）节点（Secondaries）类型：数据冗余备份节点，可以读或选举。

三种角色：

**主要成员（Primary）**：主要接收所有写操作。就是主节点。

副本成员（Replicate）：从主节点通过复制操作以维护相同的数据集，即备份数据，不可写操作，但可以读操作（但需要配置）。是默认的一种从节点类型。

**仲裁者（Arbiter）**：不保留任何数据的副本，只具有投票选举作用。当然也可以将仲裁服务器维护为副 本集的一部分，即副本成员同时也可以是仲裁者。也是一种从节点类型。

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

如果Linux服务器上面没有Mongo的话可以快速安装一下（centos7，安装MongoDB 4 版本）：

```shell
yum install libcurl openssl \
&& wget https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel70-4.0.28.tgz \
&& tar -zxvf mongodb-linux-x86_64-rhel70-4.0.28.tgz \
&& rm -rf mongodb-linux-x86_64-rhel70-4.0.28.tgz \
&& mv  mongodb-linux-x86_64-rhel70-4.0.28  /usr/local/mongodb4 \
&& (
	cat <<EOF
	#set MongoDB environment
	export PATH=/usr/local/mongodb4/bin:\$PATH
	EOF
) >> /etc/profile && source /etc/profile && mongo -version
```

可以通过`mongo -version`查看是否安装成功

![](https://cdn.fengxianhub.top/resources-master/20220729204255.png)

除此之外，还可以通过docker-compose安装，过程要简单一些

请参考：<a href="https://blog.csdn.net/XY1790026787/article/details/107992996?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522165910057816781432973959%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=165910057816781432973959&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-2-107992996-null-null.142^v35^experiment_2_v1&utm_term=docker-compose%E6%90%AD%E5%BB%BAmongoDB%E5%89%AF%E6%9C%AC%E9%9B%86%E9%9B%86%E7%BE%A4&spm=1018.2226.3001.4187">docker-compose搭建mongodb副本集记录</a>

![](https://cdn.fengxianhub.top/resources-master/20220729213422.png)


#### 1.4.1 第一步：创建主节点

建立存放数据和日志的目录

```shell
mkdir -p /mongodb/replica_sets/myrs_27017/log \
&& mkdir -p /mongodb/replica_sets/myrs_27017/data/db
```

新建或修改配置文件：

```shell
vim /mongodb/replica_sets/myrs_27017/mongod.conf
```

myrs_27017（只需要修改下面的ip地址）：

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
net:
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip
  #bindIpAll: true
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址
  bindIp: localhost,你的局域网ip地址
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
mkdir -p /mongodb/replica_sets/myrs_27018/log && mkdir -p /mongodb/replica_sets/myrs_27018/data/db
```

新建或修改配置文件：

```shell
vim /mongodb/replica_sets/myrs_27018/mongod.conf
```

myrs_27018（只需要修改下面的ip地址）：

```shell
systemLog:
  #MongoDB发送所有日志输出的目标指定为文件
  destination: file
  #mongod或mongos应向其发送所有诊断日志记录信息的日志文件的路径
  path: "/mongodb/replica_sets/myrs_27018/log/mongod.log"
  #当mongos或mongod实例重新启动时，mongos或mongod会将新条目附加到现有日志文件的末尾。
  logAppend: true
storage:
  #mongod实例存储其数据的目录。storage.dbPath设置仅适用于mongod。
  dbPath: "/mongodb/replica_sets/myrs_27018/data/db"
  journal:
    #启用或禁用持久性日志以确保数据文件保持有效和可恢复。
    enabled: true
processManagement:
  #启用在后台运行mongos或mongod进程的守护进程模式。
  fork: true
  #指定用于保存mongos或mongod进程的进程ID的文件位置，其中mongos或mongod将写入其PID
  pidFilePath: "/mongodb/replica_sets/myrs_27018/log/mongod.pid"
net:
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip
  #bindIpAll: true
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址
  bindIp: localhost,你的局域网ip地址
  #bindIp
  #绑定的端口
  port: 27018
replication:
  #副本集的名称
  replSetName: myrs
```

启动节点服务

```shell
[root@node1 ~]# mongod -f /mongodb/replica_sets/myrs_27018/mongod.conf
about to fork child process, waiting until server is ready for connections.
forked process: 18400
child process started successfully, parent exiting
```

1.4.3 第三步：创建仲裁节点

建立存放数据和日志的目录

```shell
#-----------myrs 
#仲裁节点 
mkdir -p /mongodb/replica_sets/myrs_27019/log && mkdir -p /mongodb/replica_sets/myrs_27019/data/db
```

仲裁节点：

新建或修改配置文件：

```shell
vim /mongodb/replica_sets/myrs_27019/mongod.conf
```

myrs_27019（只需要修改下面的ip地址）：

```shell
systemLog:
  #MongoDB发送所有日志输出的目标指定为文件
  destination: file
  #mongod或mongos应向其发送所有诊断日志记录信息的日志文件的路径
  path: "/mongodb/replica_sets/myrs_27019/log/mongod.log"
  #当mongos或mongod实例重新启动时，mongos或mongod会将新条目附加到现有日志文件的末尾。
  logAppend: true
storage:
  #mongod实例存储其数据的目录。storage.dbPath设置仅适用于mongod。
  dbPath: "/mongodb/replica_sets/myrs_27019/data/db"
  journal:
    #启用或禁用持久性日志以确保数据文件保持有效和可恢复。
    enabled: true
processManagement:
  #启用在后台运行mongos或mongod进程的守护进程模式。
  fork: true
  #指定用于保存mongos或mongod进程的进程ID的文件位置，其中mongos或mongod将写入其PID
  pidFilePath: "/mongodb/replica_sets/myrs_27019/log/mongod.pid"
net:
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip
  #bindIpAll: true
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址
  bindIp: localhost,你的局域网ip地址
  #bindIp
  #绑定的端口
  port: 27019
replication:
  #副本集的名称
  replSetName: myrs
```

启动节点服务：

```shell
[root@node1 ~]# mongod -f /mongodb/replica_sets/myrs_27019/mongod.conf
about to fork child process, waiting until server is ready for connections.
forked process: 48961
child process started successfully, parent exiting
```

#### 1.4.5 第四步：初始化配置副本集和主节点

>现在我们虽然启动了三个MongoDB服务，但是服务之间是没有联系的，现在我们需要将其关联起来

使用客户端命令连接任意一个节点，但这里尽量要连接主节点(27017节点)：

```java
mongo --host=你的ip地址 --port=27017
```

结果，连接上之后，很多命令无法使用，，比如 show dbs 等，必须初始化副本集才行

准备初始化新的副本集：

语法：`rs.initiate(configuration)`

```java
> rs.initiate()
{
        "info2" : "no configuration specified. Using a default configuration for the set",
        "me" : "node1:27017",
        "ok" : 1
}
myrs:SECONDARY>
myrs:PRIMARY>
```

提示：

1）“ok”的值为1，说明创建成功。 

2）命令行提示符发生变化，变成了一个从节点角色，此时默认不能读写。稍等片刻，回车，变成主节点。

#### 1.4.6 第五步：查看副本集的配置内容

说明： 返回包含当前副本集配置的文档。 

语法：`rs.conf(configuration)`

提示：`rs.config()` 是该方法的别名。 `configuration`：可选，如果没有配置，则使用默认主节点配置。

```java
myrs:PRIMARY> rs.conf()
{
        "_id" : "myrs",
        "version" : 1,
        "protocolVersion" : NumberLong(1),
        "writeConcernMajorityJournalDefault" : true,
        "members" : [
                {
                        "_id" : 0,
                        "host" : "node1:27017",
                        "arbiterOnly" : false,
                        "buildIndexes" : true,
                        "hidden" : false,
                        "priority" : 1,
                        "tags" : {

                        },
                        "slaveDelay" : NumberLong(0),
                        "votes" : 1
                }
        ],
        "settings" : {
                "chainingAllowed" : true,
                "heartbeatIntervalMillis" : 2000,
                "heartbeatTimeoutSecs" : 10,
                "electionTimeoutMillis" : 10000,
                "catchUpTimeoutMillis" : -1,
                "catchUpTakeoverDelayMillis" : 30000,
                "getLastErrorModes" : {

                },
                "getLastErrorDefaults" : {
                        "w" : 1,
                        "wtimeout" : 0
                },
                "replicaSetId" : ObjectId("62ebc0864d46a5f094c41eb8")
        }
}
```

说明： 

- "_id" : "myrs" ：副本集的配置数据存储的主键值，默认就是副本集的名字 
- "members" ：副本集成员数组，此时只有一个： "host" : "180.76.159.126:27017" ，该成员不 是仲裁节点： "arbiterOnly" : false ，优先级（权重值）： "priority" : 1, 
- "settings" ：副本集的参数配置。

提示：副本集配置的查看命令，本质是查询的是 system.replset 的表中的数据：

```java
myrs:PRIMARY> use local
switched to db local
myrs:PRIMARY> show collections
oplog.rs
replset.election
replset.minvalid
replset.oplogTruncateAfterPoint
startup_log
system.replset
system.rollback.id
myrs:PRIMARY> db.system.replset.find()
{ "_id" : "myrs", "version" : 1, "protocolVersion" : NumberLong(1),
"writeConcernMajorityJournalDefault" : true, "members" : [ { "_id" : 0, "host" :
"180.76.159.126:27017", "arbiterOnly" : false, "buildIndexes" : true, "hidden" :
false, "priority" : 1, "tags" : { }, "slaveDelay" : NumberLong(0), "votes" : 1
} ], "settings" : { "chainingAllowed" : true, "heartbeatIntervalMillis" : 2000,
"heartbeatTimeoutSecs" : 10, "electionTimeoutMillis" : 10000,
"catchUpTimeoutMillis" : -1, "catchUpTakeoverDelayMillis" : 30000,
"getLastErrorModes" : { }, "getLastErrorDefaults" : { "w" : 1, "wtimeout" : 0
}, "replicaSetId" : ObjectId("5d539bdcd6a308e600d126bb") } }
myrs:PRIMARY>
```

#### 1.4.7 第六步：查看副本集状态

检查副本集状态。 

说明： 返回包含状态信息的文档。此输出使用从副本集的其他成员发送的心跳包中获得的数据反映副本集的当前状态。 

语法：`rs.status()`

```java
myrs:PRIMARY> rs.status()
{
        "set" : "myrs",
        "date" : ISODate("2022-08-04T12:55:32.667Z"),
        "myState" : 1,
        "term" : NumberLong(1),
        "syncingTo" : "",
        "syncSourceHost" : "",
        "syncSourceId" : -1,
        "heartbeatIntervalMillis" : NumberLong(2000),
        "optimes" : {
                "lastCommittedOpTime" : {
                        "ts" : Timestamp(1659617725, 1),
                        "t" : NumberLong(1)
                },
                "readConcernMajorityOpTime" : {
                        "ts" : Timestamp(1659617725, 1),
                        "t" : NumberLong(1)
                },
                "appliedOpTime" : {
                        "ts" : Timestamp(1659617725, 1),
                        "t" : NumberLong(1)
                },
                "durableOpTime" : {
                        "ts" : Timestamp(1659617725, 1),
                        "t" : NumberLong(1)
                }
        },
        "lastStableCheckpointTimestamp" : Timestamp(1659617705, 1),
        "electionCandidateMetrics" : {
                "lastElectionReason" : "electionTimeout",
                "lastElectionDate" : ISODate("2022-08-04T12:50:14.373Z"),
                "electionTerm" : NumberLong(1),
                "lastCommittedOpTimeAtElection" : {
                        "ts" : Timestamp(0, 0),
                        "t" : NumberLong(-1)
                },
                "lastSeenOpTimeAtElection" : {
                        "ts" : Timestamp(1659617414, 1),
                        "t" : NumberLong(-1)
                },
                "numVotesNeeded" : 1,
                "priorityAtElection" : 1,
                "electionTimeoutMillis" : NumberLong(10000),
                "newTermStartDate" : ISODate("2022-08-04T12:50:14.375Z"),
                "wMajorityWriteAvailabilityDate" : ISODate("2022-08-04T12:50:14.462Z")
        },
        "members" : [
                {
                        "_id" : 0,
                        "name" : "node1:27017",
                        "health" : 1,
                        "state" : 1,
                        "stateStr" : "PRIMARY",
                        "uptime" : 2525,
                        "optime" : {
                                "ts" : Timestamp(1659617725, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDate" : ISODate("2022-08-04T12:55:25Z"),
                        "syncingTo" : "",
                        "syncSourceHost" : "",
                        "syncSourceId" : -1,
                        "infoMessage" : "",
                        "electionTime" : Timestamp(1659617414, 2),
                        "electionDate" : ISODate("2022-08-04T12:50:14Z"),
                        "configVersion" : 1,
                        "self" : true,
                        "lastHeartbeatMessage" : ""
                }
        ],
        "ok" : 1,
        "operationTime" : Timestamp(1659617725, 1),
        "$clusterTime" : {
                "clusterTime" : Timestamp(1659617725, 1),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
}
```

说明： 

- "set" : "myrs" ：副本集的名字 
- "myState" : 1：说明状态正常 
- "members" ：副本集成员数组，此时只有一个： "name" : "180.76.159.126:27017" ，该成员的 角色是 "stateStr" : "PRIMARY", 该节点是健康的： "health" : 1 。

#### 1.4.8 第四步：添加副本从节点

在主节点添加从节点，将其他成员加入到副本集

语法：`rs.add(host, arbiterOnly)`

| Parameter   | Type               | Description                                                  |
| ----------- | ------------------ | ------------------------------------------------------------ |
| host        | string or document | 要添加到副本集的新成员。 指定为字符串或配置文档：1）如 果是一个字符串，则需要指定新成员的主机名和可选的端口 号；2）如果是一个文档，请指定在members数组中找到的副 本集成员配置文档。 您必须在成员配置文档中指定主机字段。 有关文档配置字段的说明，详见下方文档：“主机成员的配置文 档” |
| arbiterOnly | boolean            | 可选的。 仅在  值为字符串时适用。 如果为true，则添 加的主机是仲裁者。 |

主机成员的配置文档：

```java
{
    _id: <int>,
    host: <string>, // required
    arbiterOnly: <boolean>,
    buildIndexes: <boolean>,
    hidden: <boolean>,
    priority: <number>,
    tags: <document>,
    slaveDelay: <int>,
    votes: <number>
}

```

>注意其他结点不要按回车，不然会变成主节点

```java
myrs:PRIMARY> rs.add("node1:27018")
{
        "ok" : 1,
        "operationTime" : Timestamp(1659619332, 1),
        "$clusterTime" : {
                "clusterTime" : Timestamp(1659619332, 1),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
}
```

"ok" : 1 ：说明添加成功

#### 1.4.9 添加仲裁结点

语法：`rs.addArb(host)`

```java
myrs:PRIMARY> rs.addArb("node1:27019")
{
        "ok" : 1,
        "operationTime" : Timestamp(1659619452, 1),
        "$clusterTime" : {
                "clusterTime" : Timestamp(1659619452, 1),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
}
```

>所有结点都添加完毕后我们在看一下config

```java
myrs:SECONDARY> rs.conf()
{
        "_id" : "myrs",
        "version" : 3,
        "protocolVersion" : NumberLong(1),
        "writeConcernMajorityJournalDefault" : true,
        "members" : [
                {
                        "_id" : 0,
                        "host" : "node1:27017",
                        "arbiterOnly" : false,
                        "buildIndexes" : true,
                        "hidden" : false,
                        "priority" : 1,
                        "tags" : {

                        },
                        "slaveDelay" : NumberLong(0),
                        "votes" : 1
                },
                {
                        "_id" : 1,
                        "host" : "node1:27018",
                        "arbiterOnly" : false,
                        "buildIndexes" : true,
                        "hidden" : false,
                        "priority" : 1,
                        "tags" : {

                        },
                        "slaveDelay" : NumberLong(0),
                        "votes" : 1
                },
                {
                        "_id" : 2,
                        "host" : "node1:27019",
                        "arbiterOnly" : true,
                        "buildIndexes" : true,
                        "hidden" : false,
                        "priority" : 0,
                        "tags" : {

                        },
                        "slaveDelay" : NumberLong(0),
                        "votes" : 1
                }
        ],
        "settings" : {
                "chainingAllowed" : true,
                "heartbeatIntervalMillis" : 2000,
                "heartbeatTimeoutSecs" : 10,
                "electionTimeoutMillis" : 10000,
                "catchUpTimeoutMillis" : -1,
                "catchUpTakeoverDelayMillis" : 30000,
                "getLastErrorModes" : {

                },
                "getLastErrorDefaults" : {
                        "w" : 1,
                        "wtimeout" : 0
                },
                "replicaSetId" : ObjectId("62ebc0864d46a5f094c41eb8")
        }
}
```

#### 1.4.10 docker搭建主要命令


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
myrs:PRIMARY> use articledb
switched to db articledb
myrs:PRIMARY> db
articledb
myrs:PRIMARY> db.comment.insertOne({"_id": "1", "articleid": "100001", "content": "我们不应该把清晨浪费在手机上，健康很 重要，一杯温水幸福你我他。", "userid": "1002", "nickname": "相忘于江湖", "createdatetime": new Date("2019-08-05T22:08:15.522Z"), "likenum": NumberInt(1000), "state": "1" })
```

登录从节点27018，我们会发现读取不了数据

```java
myrs:SECONDARY> db.comment.findOne({"_id": "1"})
2022-08-04T21:28:31.786+0800 E QUERY    [js] Error: error: {
        "operationTime" : Timestamp(1659619707, 1),
        "ok" : 0,
        "errmsg" : "not master and slaveOk=false",
        "code" : 13435,
        "codeName" : "NotMasterNoSlaveOk",
        "$clusterTime" : {
                "clusterTime" : Timestamp(1659619707, 1),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
} :
_getErrorWithCode@src/mongo/shell/utils.js:25:13
DBCommandCursor@src/mongo/shell/query.js:708:1
DBQuery.prototype._exec@src/mongo/shell/query.js:113:28
DBQuery.prototype.hasNext@src/mongo/shell/query.js:288:5
DBCollection.prototype.findOne@src/mongo/shell/collection.js:260:10
@(shell):1:1
```

这里需要注意：**从节点默认是不能读取集合的数据**。当前从节点只是一个备份，不是奴隶节点，无法读取数据，写当然更不行。 因为默认情况下，从节点是没有读写权限的，可以增加读的权限，但需要进行设置。

设置读操作权限： 

说明： 设置为奴隶节点，允许在从成员上运行读的操作 

语法：

```java
rs.slaveOk() 
#或 
rs.slaveOk(true)
# 最新版（4版本以上的）命令更改为
rs.secondaryOk()
```

设置完后就可以正常读数据了

```java
myrs:SECONDARY> rs.secondaryOk()
myrs:SECONDARY> use articledb
switched to db articledb
myrs:SECONDARY> db.comment.findOne({"_id": "1"})
{
        "_id" : "1",
        "articleid" : "100001",
        "content" : "我们不应该把清晨浪费在手机上，健康很重要，一杯温水幸福你我他。",
        "userid" : "1002",
        "nickname" : "相忘于江湖",
        "createdatetime" : ISODate("2019-08-05T22:08:15.522Z"),
        "likenum" : 1000,
        "state" : "1"
}
```

提示： 该命令是 `db.getMongo().setSlaveOk()` 的简化命令。

【示例】 在`SECONDARY`上设置作为奴隶节点权限，具备读权限：

如果要取消作为奴隶结点

```java
rs.secondaryOk(false)
```



### 1.6 主节点的选举原则

MongoDB在副本集中，会自动进行主节点的选举，主节点选举的触发条件：

1） 主节点故障 

2） 主节点网络不可达（默认心跳信息为10秒） 

3） 人工干预（rs.stepDown(600)）

一旦触发选举，就要根据一定规则来选主节点。

选举规则是根据票数来决定谁获胜：

- 票数最高，且获得了“大多数”成员的投票支持的节点获胜。 

  “大多数”的定义为：假设复制集内投票成员数量为N，则大多数为 N/2 + 1。例如：3个投票成员， 则大多数的值是2。当复制集内存活成员数量不足大多数时，整个复制集将无法选举出Primary， 复制集将无法提供写服务，处于只读状态。

- 若票数相同，且都获得了“大多数”成员的投票支持的，数据新的节点获胜。 

  数据的新旧是通过操作日志oplog来对比的。

**在获得票数的时候，优先级（priority）参数影响重大**

可以通过设置优先级（priority）来设置额外票数。优先级即权重，取值为0-1000，相当于可额外增加 0-1000的票数，优先级的值越大，就越可能获得多数成员的投票（votes）数。指定较高的值可使成员更有资格成为主要成员，更低的值可使成员更不符合条件。

**默认情况下，优先级的值是1**

可以看出，主节点和副本节点的优先级各为1，即，默认可以认为都已经有了一票。但选举节点，`优先级是0`，（要注意是，官方说了，`选举节点的优先级必须是0`，不能是别的值。即不具备选举权，但具有投票权）

我们可以通过`rs.conf()`命令进行查看

【了解】修改优先级

比如，下面提升从节点的优先级：

1）先将配置导入cfg变量

```java
myrs:SECONDARY> cfg=rs.conf()
```

2）然后修改值（ID号默认从0开始）：

```java
myrs:SECONDARY> cfg.members[1].priority=2
2
```

3）重新加载配置

```java
myrs:SECONDARY> rs.reconfig(cfg)
{ "ok" : 1 }
```

稍等片刻会重新开始选举。

### 1.7 故障测试

#### 1.7.1 副本节点故障测试

关闭27018副本节点：

发现，主节点和仲裁节点对27018的心跳失败。因为主节点还在，因此，没有触发投票选举。

如果此时，在主节点写入数据。

```java
myrs:PRIMARY> db.comment.insertOne({"_id": "2", "articleid": "100001", "content": "我们不应该把清晨浪费在手机上，健康很 重要，一杯温水幸福你我他。", "userid": "1002", "nickname": "相忘于江湖", "createdatetime": new Date("2019-08-05T22:08:15.522Z"), "likenum": NumberInt(1000), "state": "1" })
```

**再启动从节点，会发现，主节点写入的数据，会自动同步给从节点。**

#### 1.7.2主节点故障测试

关闭27017节点，发现，从节点和仲裁节点对27017的心跳失败，当失败超过10秒，此时因为没有主节点了，会自动发起投票。

而副本节点只有27018，因此，候选人只有一个就是27018，开始投票。

27019向27018投了一票，27018本身自带一票，因此共两票，超过了“大多数”

27019是仲裁节点，没有选举权，27018不向其投票，其票数是0

最终结果，27018成为主节点。具备读写功能

在27018写入数据查看

```java
myrs:PRIMARY> db.comment.insertOne({"_id": "3", "articleid": "100001", "content": "我们不应该把清晨浪费在手机上，健康很 重要，一杯温水幸福你我他。", "userid": "1002", "nickname": "相忘于江湖", "createdatetime": new Date("2019-08-05T22:08:15.522Z"), "likenum": NumberInt(1000), "state": "1" })
```

再启动27017节点，发现27017变成了从节点，27018仍保持主节点。 

登录27017节点，发现是从节点了，数据自动从27018同步。 从而实现了高可用

#### 1.7.3 仲裁节点和主节点故障

先关掉仲裁节点27019，再关掉现在的主节点27018，登录27017后，发现，27017仍然是从节点，副本集中没有主节点了，导致此时，副本集是只读状态， 无法写入

为啥不选举了？因为27017的票数，没有获得大多数，即没有大于等于2，它只有默认的一票（优先级是1）

如果要触发选举，随便加入一个成员即可

- 如果只加入27019仲裁节点成员，则主节点一定是27017，因为没得选了，仲裁节点不参与选举， 但参与投票。
- 如果只加入27018节点，会发起选举。因为27017和27018都是两票，则按照谁数据新，谁当主节点。

#### 1.7.4 仲裁节点和从节点故障

先关掉仲裁节点27019，再关掉现在的副本节点27018，10秒后，27017主节点自动降级为副本节点。（服务降级）

### 1.8 图形化工具连接副本集

我这里使用的是Navicat，其他工具其实也差不多

![image-20220804215809057](https://cdn.fengxianhub.top/resources-master/202208042158400.png)

### 1.9 SpringDataMongoDB连接副本集

副本集语法：

```java
mongodb://host1,host2,host3/articledb?connect=replicaSet&slaveOk=true&replicaSet=副本集名字
```

其中：

- slaveOk=true：开启副本节点读的功能，可实现读写分离。 
- connect=replicaSet：自动到副本集中选择读写的主机。如果slaveOK是打开的，则实现了读写分离

【示例】 连接 replica set 三台服务器 (端口 27017, 27018, 和27019)，直接连接第一个服务器，无论是replica set一部分或者主服务器或者从服务器，写入操作应用在主服务器 并且分布查询到从服务器。

配置文件`application.yml`，配置单节点的MongoDB可以看笔者的上一篇文章

```yaml
spring:
  #数据源配置
  data:
    mongodb:
      # 使用uri连接
      uri: mongodb://ip地址:27017,ip地址:27018,ip地址:27019/articledb?connect=replicaSet&slaveOk=true&replicaSet=myrs
```

注意：

主机必须是副本集中所有的主机，包括主节点、副本节点、仲裁节点。

SpringDataMongoDB自动实现了读写分离；写操作时，只打开主节点连接：

## 2. 分片集群-Sharded Cluster

### 2.1 分片概念

分片（sharding）是一种跨多台机器分布数据的方法， MongoDB使用分片来支持具有非常大的数据集和高吞吐量操作的部署。 

换句话说：分片(sharding)是指将数据拆分，**将其分散存在不同的机器上的过程**。有时也用分区 (partitioning)来表示这个概念。将数据分散到不同的机器上，不需要功能强大的大型计算机就可以储存`更多的数据`，处理更多的负载。 

具有大型数据集或高吞吐量应用程序的数据库系统可以会挑战单个服务器的容量。例如，高查询率会耗 尽服务器的CPU容量。工作集大小大于系统的RAM会强调磁盘驱动器的I / O容量。 

>有两种解决系统增长的方法：垂直扩展和水平扩展。

**垂直扩展**意味着增加单个服务器的容量，例如使用更强大的CPU，添加更多RAM或增加存储空间量。可用技术的局限性可能会限制单个机器对于给定工作负载而言足够强大。此外，基于云的提供商基于可用 的硬件配置具有硬性上限。结果，垂直缩放有实际的最大值。

**水平扩展**意味着划分系统数据集并加载多个服务器，添加其他服务器以根据需要增加容量。虽然单个机 器的总体速度或容量可能不高，但每台机器处理整个工作负载的子集，可能提供比单个高速大容量服务 器更高的效率。扩展部署容量只需要根据需要添加额外的服务器，`这可能比单个机器的高端硬件的总体成本更低`。权衡是基础架构和部署维护的复杂性增加。

**MongoDB支持通过分片进行水平扩展**

### 2.2 分片集群包含的组件

MongoDB分片群集包含以下组件：

- 分片（存储）：每个分片包含分片数据的子集。 每个分片都可以部署为副本集。 
- mongos（路由）：mongos充当查询路由器，在客户端应用程序和分片集群之间提供接口。 
- config servers（`调度`的配置）：配置服务器存储群集的元数据和配置设置。 从MongoDB 3.4开 始，必须将配置服务器部署为副本集（CSRS）。

![image-20220806113808248](https://cdn.fengxianhub.top/resources-master/202208061138596.png)

MongoDB在集合级别对数据进行分片，将集合数据分布在集群中的分片上。

### 2.3 分片集群架构目标

两个分片节点副本集（3+3）+ 一个配置节点副本集（3）+ 两个路由节点（2），共11个服务节点

这里备份的原因都是为了容灾

![image-20220806114234763](https://cdn.fengxianhub.top/resources-master/202208061142037.png)

这里我们从下往上搭建

### 2.4 分片（存储）节点副本集的创建

所有的的配置文件都直接放到 `sharded_cluster` 的相应的子目录下面，默认配置文件名字： `mongod.conf`

#### 2.4.1 第一套副本集

我们先创建第一个集群，集群内结点创建顺序如下：

![image-20220806120533420](https://cdn.fengxianhub.top/resources-master/202208061205681.png)

准备存放数据和日志的目录：

```java
#-----------myshardrs01
mkdir -p /mongodb/sharded_cluster/myshardrs01_27018/log \ &
mkdir -p /mongodb/sharded_cluster/myshardrs01_27018/data/db \ &
mkdir -p /mongodb/sharded_cluster/myshardrs01_27118/log \ &
mkdir -p /mongodb/sharded_cluster/myshardrs01_27118/data/db \ &
mkdir -p /mongodb/sharded_cluster/myshardrs01_27218/log \ &
mkdir -p /mongodb/sharded_cluster/myshardrs01_27218/data/db
```

>搭建主节点

新建或修改配置文件：

```java
vim /mongodb/sharded_cluster/myshardrs01_27018/mongod.conf
```

myshardrs01_27018：

```yaml
systemLog:
  #MongoDB发送所有日志输出的目标指定为文件
  destination: file
  #mongod或mongos应向其发送所有诊断日志记录信息的日志文件的路径
  path: "/mongodb/sharded_cluster/myshardrs01_27018/log/mongod.log"
  #当mongos或mongod实例重新启动时，mongos或mongod会将新条目附加到现有日志文件的末尾。
  logAppend: true
storage:
  #mongod实例存储其数据的目录。storage.dbPath设置仅适用于mongod。
  dbPath: "/mongodb/sharded_cluster/myshardrs01_27018/data/db"
  journal:
    #启用或禁用持久性日志以确保数据文件保持有效和可恢复。
    enabled: true
processManagement:
  #启用在后台运行mongos或mongod进程的守护进程模式。
  fork: true
  #指定用于保存mongos或mongod进程的进程ID的文件位置，其中mongos或mongod将写入其PID
  pidFilePath: "/mongodb/sharded_cluster/myshardrs01_27018/log/mongod.pid"
net:
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip
  #bindIpAll: true
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址
  bindIp: localhost,你的局域网ip
  #bindIp
  #绑定的端口
  port: 27018
replication:
#副本集的名称
  replSetName: myshardrs01
sharding:
  #分片角色
  clusterRole: shardsvr

```

大部分和上面的副本集集群一样，就是在最后多了一个`sharding`，用来表示分片的角色，有两种可选

| Value     | Description                           |
| --------- | ------------------------------------- |
| configsvr | 表示这是一个配置结点，默认端口为27019 |
| shardsvr  | 表示这是一个分片结点，默认端口为27018 |

注意：设置`sharding.clusterRole`需要mongod实例运行复制。 要将实例部署为副本集成员，请使用 replSetName设置并指定副本集的名称。

>搭建从结点

新建或修改配置文件：

```java
vim /mongodb/sharded_cluster/myshardrs01_27118/mongod.conf
```

myshardrs01_27118：

```yaml
systemLog:
  #MongoDB发送所有日志输出的目标指定为文件
  destination: file
  #mongod或mongos应向其发送所有诊断日志记录信息的日志文件的路径
  path: "/mongodb/sharded_cluster/myshardrs01_27118/log/mongod.log"
  #当mongos或mongod实例重新启动时，mongos或mongod会将新条目附加到现有日志文件的末尾。
  logAppend: true
storage:
  #mongod实例存储其数据的目录。storage.dbPath设置仅适用于mongod。
  dbPath: "/mongodb/sharded_cluster/myshardrs01_27118/data/db"
  journal:
    #启用或禁用持久性日志以确保数据文件保持有效和可恢复。
    enabled: true
processManagement:
  #启用在后台运行mongos或mongod进程的守护进程模式。
  fork: true
  #指定用于保存mongos或mongod进程的进程ID的文件位置，其中mongos或mongod将写入其PID
  pidFilePath: "/mongodb/sharded_cluster/myshardrs01_27118/log/mongod.pid"
net:
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip
  #bindIpAll: true
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址
  bindIp: localhost,你的局域网ip地址
  #bindIp
  #绑定的端口
  port: 27118
replication:
#副本集的名称
  replSetName: myshardrs01
sharding:
  #分片角色
  clusterRole: shardsvr
```

>搭建仲裁结点

新建或修改配置文件：

```java
vim /mongodb/sharded_cluster/myshardrs01_27218/mongod.conf
```

myshardrs01_27218：

```yaml
systemLog:
  #MongoDB发送所有日志输出的目标指定为文件
  destination: file
  #mongod或mongos应向其发送所有诊断日志记录信息的日志文件的路径
  path: "/mongodb/sharded_cluster/myshardrs01_27218/log/mongod.log"
  #当mongos或mongod实例重新启动时，mongos或mongod会将新条目附加到现有日志文件的末尾。
  logAppend: true
storage:
  #mongod实例存储其数据的目录。storage.dbPath设置仅适用于mongod。
  dbPath: "/mongodb/sharded_cluster/myshardrs01_27218/data/db"
  journal:
    #启用或禁用持久性日志以确保数据文件保持有效和可恢复。
    enabled: true
processManagement:
  #启用在后台运行mongos或mongod进程的守护进程模式。
  fork: true
  #指定用于保存mongos或mongod进程的进程ID的文件位置，其中mongos或mongod将写入其PID
  pidFilePath: "/mongodb/sharded_cluster/myshardrs01_27218/log/mongod.pid"
net:
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip
  #bindIpAll: true
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址
  bindIp: localhost,你的局域网ip地址
  #bindIp
  #绑定的端口
  port: 27218
replication:
#副本集的名称
  replSetName: myshardrs01
sharding:
  #分片角色
  clusterRole: shardsvr
```

**启动第一套副本集：一主一副本一仲裁**

依次启动三个mongod服务：

```shell
[root@node1 ~]# mongod -f /mongodb/sharded_cluster/myshardrs01_27018/mongod.conf
about to fork child process, waiting until server is ready for connections.
forked process: 99318
child process started successfully, parent exiting
[root@node1 ~]# mongod -f /mongodb/sharded_cluster/myshardrs01_27118/mongod.conf
about to fork child process, waiting until server is ready for connections.
forked process: 99813
child process started successfully, parent exiting
[root@node1 ~]# mongod -f /mongodb/sharded_cluster/myshardrs01_27218/mongod.conf
about to fork child process, waiting until server is ready for connections.
forked process: 99928
child process started successfully, parent exiting
```

查看一下：

```shell
[root@node1 ~]# ps -aux|grep mongo
root      99318  2.2  1.4 1110116 56516 ?       Sl   12:19   0:01 mongod -f /mongodb/sharded_cluster/myshardrs01_27018/mongod.conf
root      99813  3.2  1.4 1108064 57456 ?       Sl   12:20   0:01 mongod -f /mongodb/sharded_cluster/myshardrs01_27118/mongod.conf
root      99928  4.2  1.4 1108060 55840 ?       Sl   12:20   0:01 mongod -f /mongodb/sharded_cluster/myshardrs01_27218/mongod.conf
root     100490  0.0  0.0 112816   972 pts/3    S+   12:20   0:00 grep --color=auto mongo
```

可以看到三个服务正常启动了，至此我们第一个分片集群搭建完成

现在我们初始化一下集群，和上面初始化副本集集群一样

>使用客户端命令连接任意一个节点，但这里尽量要连接主节点

```shell
mongo --port 27018
```

执行初始化副本集命令

```shell
> rs.initiate()
{
        "info2" : "no configuration specified. Using a default configuration for the set",
        "me" : "node1:27018",
        "ok" : 1
}
myshardrs01:OTHER>
```

查看副本集情况(节选内容)：

```shell
myshardrs01:OTHER> rs.status()
{
        "set" : "myshardrs01",
        "date" : ISODate("2022-08-06T04:36:38.186Z"),
        "myState" : 1,
        "term" : NumberLong(1),
        "syncingTo" : "",
        "syncSourceHost" : "",
        "syncSourceId" : -1,
        "heartbeatIntervalMillis" : NumberLong(2000),
        "optimes" : {
                "lastCommittedOpTime" : {
                        "ts" : Timestamp(1659760595, 1),
                        "t" : NumberLong(1)
                },
                "readConcernMajorityOpTime" : {
                        "ts" : Timestamp(1659760595, 1),
                        "t" : NumberLong(1)
                },
                "appliedOpTime" : {
                        "ts" : Timestamp(1659760595, 1),
                        "t" : NumberLong(1)
                },
                "durableOpTime" : {
                        "ts" : Timestamp(1659760595, 1),
                        "t" : NumberLong(1)
                }
        },
        "lastStableCheckpointTimestamp" : Timestamp(1659760545, 4),
        "electionCandidateMetrics" : {
                "lastElectionReason" : "electionTimeout",
                "lastElectionDate" : ISODate("2022-08-06T04:35:45.307Z"),
                "electionTerm" : NumberLong(1),
                "lastCommittedOpTimeAtElection" : {
                        "ts" : Timestamp(0, 0),
                        "t" : NumberLong(-1)
                },
                "lastSeenOpTimeAtElection" : {
                        "ts" : Timestamp(1659760545, 1),
                        "t" : NumberLong(-1)
                },
                "numVotesNeeded" : 1,
                "priorityAtElection" : 1,
                "electionTimeoutMillis" : NumberLong(10000),
                "newTermStartDate" : ISODate("2022-08-06T04:35:45.309Z"),
                "wMajorityWriteAvailabilityDate" : ISODate("2022-08-06T04:35:45.374Z")
        },
        "members" : [
                {
                        "_id" : 0,
                        "name" : "node1:27018",
                        "health" : 1,
                        "state" : 1,
                        "stateStr" : "PRIMARY",
                        "uptime" : 1020,
                        "optime" : {
                                "ts" : Timestamp(1659760595, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDate" : ISODate("2022-08-06T04:36:35Z"),
                        "syncingTo" : "",
                        "syncSourceHost" : "",
                        "syncSourceId" : -1,
                        "infoMessage" : "could not find member to sync from",
                        "electionTime" : Timestamp(1659760545, 2),
                        "electionDate" : ISODate("2022-08-06T04:35:45Z"),
                        "configVersion" : 1,
                        "self" : true,
                        "lastHeartbeatMessage" : ""
                }
        ],
        "ok" : 1,
        "operationTime" : Timestamp(1659760595, 1),
        "$clusterTime" : {
                "clusterTime" : Timestamp(1659760595, 1),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
}
```

添加副本节点：

```shell
myshardrs01:PRIMARY> rs.add("node1:27118")
{
        "ok" : 1,
        "operationTime" : Timestamp(1659760671, 1),
        "$clusterTime" : {
                "clusterTime" : Timestamp(1659760671, 1),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
}
```

添加仲裁结点：

```shell
myshardrs01:PRIMARY> rs.addArb("node1:27218") 
{
        "ok" : 1,
        "operationTime" : Timestamp(1659760725, 2),
        "$clusterTime" : {
                "clusterTime" : Timestamp(1659760725, 2),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
}
```



#### 2.4.2 第二套副本集

准备存放数据和日志的目录：

```shell
#-----------myshardrs02
mkdir -p /mongodb/sharded_cluster/myshardrs02_27318/log \ &
mkdir -p /mongodb/sharded_cluster/myshardrs02_27318/data/db \ &
mkdir -p /mongodb/sharded_cluster/myshardrs02_27418/log \ &
mkdir -p /mongodb/sharded_cluster/myshardrs02_27418/data/db \ &
mkdir -p /mongodb/sharded_cluster/myshardrs02_27518/log \ &
mkdir -p /mongodb/sharded_cluster/myshardrs02_27518/data/db
```

新建或修改配置文件：

```shell
vim /mongodb/sharded_cluster/myshardrs02_27318/mongod.conf
```

myshardrs02_27318：

```yaml
systemLog:
  #MongoDB发送所有日志输出的目标指定为文件
  destination: file
  #mongod或mongos应向其发送所有诊断日志记录信息的日志文件的路径
  path: "/mongodb/sharded_cluster/myshardrs02_27318/log/mongod.log"
  #当mongos或mongod实例重新启动时，mongos或mongod会将新条目附加到现有日志文件的末尾。
  logAppend: true
storage:
  #mongod实例存储其数据的目录。storage.dbPath设置仅适用于mongod。
  dbPath: "/mongodb/sharded_cluster/myshardrs02_27318/data/db"
  journal:
    #启用或禁用持久性日志以确保数据文件保持有效和可恢复。
    enabled: true
processManagement:
  #启用在后台运行mongos或mongod进程的守护进程模式。
  fork: true
  #指定用于保存mongos或mongod进程的进程ID的文件位置，其中mongos或mongod将写入其PID
  pidFilePath: "/mongodb/sharded_cluster/myshardrs02_27318/log/mongod.pid"
net:
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip
  #bindIpAll: true
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址
  bindIp: localhost,你的局域网ip
  #bindIp
  #绑定的端口
  port: 27318
replication:
#副本集的名称
  replSetName: myshardrs02
sharding:
  #分片角色
  clusterRole: shardsvr
```

新建或修改配置文件：

```shell
vim /mongodb/sharded_cluster/myshardrs02_27418/mongod.conf
```

myshardrs02_27418：

```yaml
systemLog:
  #MongoDB发送所有日志输出的目标指定为文件
  destination: file
  #mongod或mongos应向其发送所有诊断日志记录信息的日志文件的路径
  path: "/mongodb/sharded_cluster/myshardrs02_27418/log/mongod.log"
  #当mongos或mongod实例重新启动时，mongos或mongod会将新条目附加到现有日志文件的末尾。
  logAppend: true
storage:
  #mongod实例存储其数据的目录。storage.dbPath设置仅适用于mongod。
  dbPath: "/mongodb/sharded_cluster/myshardrs02_27418/data/db"
  journal:
    #启用或禁用持久性日志以确保数据文件保持有效和可恢复。
    enabled: true
processManagement:
  #启用在后台运行mongos或mongod进程的守护进程模式。
  fork: true
  #指定用于保存mongos或mongod进程的进程ID的文件位置，其中mongos或mongod将写入其PID
  pidFilePath: "/mongodb/sharded_cluster/myshardrs02_27418/log/mongod.pid"
net:
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip
  #bindIpAll: true
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址
  bindIp: localhost,你的局域网ip
  #bindIp
  #绑定的端口
  port: 27418
replication:
#副本集的名称
  replSetName: myshardrs02
sharding:
  #分片角色
  clusterRole: shardsvr
```

新建或修改配置文件：

```shell
vim /mongodb/sharded_cluster/myshardrs02_27518/mongod.conf
```

myshardrs02_27518：

```yaml
systemLog:
  #MongoDB发送所有日志输出的目标指定为文件
  destination: file
  #mongod或mongos应向其发送所有诊断日志记录信息的日志文件的路径
  path: "/mongodb/sharded_cluster/myshardrs02_27518/log/mongod.log"
  #当mongos或mongod实例重新启动时，mongos或mongod会将新条目附加到现有日志文件的末尾。
  logAppend: true
storage:
  #mongod实例存储其数据的目录。storage.dbPath设置仅适用于mongod。
  dbPath: "/mongodb/sharded_cluster/myshardrs02_27518/data/db"
  journal:
    #启用或禁用持久性日志以确保数据文件保持有效和可恢复。
    enabled: true
processManagement:
  #启用在后台运行mongos或mongod进程的守护进程模式。
  fork: true
  #指定用于保存mongos或mongod进程的进程ID的文件位置，其中mongos或mongod将写入其PID
  pidFilePath: "/mongodb/sharded_cluster/myshardrs02_27518/log/mongod.pid"
net:
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip
  #bindIpAll: true
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址
  bindIp: localhost,你的局域网ip
  #bindIp
  #绑定的端口
  port: 27518
replication:
#副本集的名称
  replSetName: myshardrs02
sharding:
  #分片角色
  clusterRole: shardsvr
```

启动第二套副本集：一主一副本一仲裁

```shell
[root@node1 ~]# mongod -f /mongodb/sharded_cluster/myshardrs02_27318/mongod.conf
about to fork child process, waiting until server is ready for connections.
forked process: 112235
child process started successfully, parent exiting
[root@node1 ~]# mongod -f /mongodb/sharded_cluster/myshardrs02_27418/mongod.conf
about to fork child process, waiting until server is ready for connections.
forked process: 112413
child process started successfully, parent exiting
[root@node1 ~]# mongod -f /mongodb/sharded_cluster/myshardrs02_27518/mongod.conf
about to fork child process, waiting until server is ready for connections.
forked process: 112563
child process started successfully, parent exiting
```

查看一下启动情况

```shell
[root@node1 ~]# ps -aux|grep mongo
root      99318  0.6  1.6 1112876 62660 ?       Sl   12:19   0:04 mongod -f /mongodb/sharded_cluster/myshardrs01_27018/mongod.conf
root      99813  0.6  1.7 1113148 66108 ?       Sl   12:20   0:04 mongod -f /mongodb/sharded_cluster/myshardrs01_27118/mongod.conf
root      99928  0.6  1.6 1111348 62580 ?       Sl   12:20   0:04 mongod -f /mongodb/sharded_cluster/myshardrs01_27218/mongod.conf
root     112235  3.2  1.4 1108064 57532 ?       Sl   12:30   0:01 mongod -f /mongodb/sharded_cluster/myshardrs02_27318/mongod.conf
root     112413  3.5  1.4 1108064 56012 ?       Sl   12:31   0:01 mongod -f /mongodb/sharded_cluster/myshardrs02_27418/mongod.conf
root     112563  5.2  1.4 1108060 54252 ?       Sl   12:31   0:01 mongod -f /mongodb/sharded_cluster/myshardrs02_27518/mongod.conf
```

>初始化集群

连接：

```shell
mongo --port 27318
```

初始化主节点

```shell
> rs.initiate()
{
        "info2" : "no configuration specified. Using a default configuration for the set",
        "me" : "node1:27318",
        "ok" : 1
}
```

添加副本结点

```shell
myshardrs02:SECONDARY> rs.add("node1:27418")
{
        "ok" : 1,
        "operationTime" : Timestamp(1659760910, 1),
        "$clusterTime" : {
                "clusterTime" : Timestamp(1659760910, 1),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
}
```

添加仲裁结点

```shell
myshardrs02:PRIMARY> rs.addArb("node1:27518")
{
        "ok" : 1,
        "operationTime" : Timestamp(1659760950, 1),
        "$clusterTime" : {
                "clusterTime" : Timestamp(1659760950, 1),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
}
```

查看集群信息

```shell
myshardrs02:PRIMARY> rs.config()
{
        "_id" : "myshardrs02",
        "version" : 3,
        "protocolVersion" : NumberLong(1),
        "writeConcernMajorityJournalDefault" : true,
        "members" : [
                {
                        "_id" : 0,
                        "host" : "node1:27318",
                        "arbiterOnly" : false,
                        "buildIndexes" : true,
                        "hidden" : false,
                        "priority" : 1,
                        "tags" : {

                        },
                        "slaveDelay" : NumberLong(0),
                        "votes" : 1
                },
                {
                        "_id" : 1,
                        "host" : "node1:27418",
                        "arbiterOnly" : false,
                        "buildIndexes" : true,
                        "hidden" : false,
                        "priority" : 1,
                        "tags" : {

                        },
                        "slaveDelay" : NumberLong(0),
                        "votes" : 1
                },
                {
                        "_id" : 2,
                        "host" : "node1:27518",
                        "arbiterOnly" : true,
                        "buildIndexes" : true,
                        "hidden" : false,
                        "priority" : 0,
                        "tags" : {

                        },
                        "slaveDelay" : NumberLong(0),
                        "votes" : 1
                }
        ],
        "settings" : {
                "chainingAllowed" : true,
                "heartbeatIntervalMillis" : 2000,
                "heartbeatTimeoutSecs" : 10,
                "electionTimeoutMillis" : 10000,
                "catchUpTimeoutMillis" : -1,
                "catchUpTakeoverDelayMillis" : 30000,
                "getLastErrorModes" : {

                },
                "getLastErrorDefaults" : {
                        "w" : 1,
                        "wtimeout" : 0
                },
                "replicaSetId" : ObjectId("62edf0dbeeeb9c96c49c8d58")
        }
}
```

### 2.5 配置节点副本集的创建

第一步：准备存放数据和日志的目录：

```shell
#-----------configrs
#建立数据节点data和日志目录
mkdir -p /mongodb/sharded_cluster/myconfigrs_27019/log \ &
mkdir -p /mongodb/sharded_cluster/myconfigrs_27019/data/db \ &
mkdir -p /mongodb/sharded_cluster/myconfigrs_27119/log \ &
mkdir -p /mongodb/sharded_cluster/myconfigrs_27119/data/db \ &
mkdir -p /mongodb/sharded_cluster/myconfigrs_27219/log \ &
mkdir -p /mongodb/sharded_cluster/myconfigrs_27219/data/db
```

新建或修改配置文件：

```shell
vim /mongodb/sharded_cluster/myconfigrs_27019/mongod.conf
```

myconfigrs_27019：

```yaml
systemLog:
  #MongoDB发送所有日志输出的目标指定为文件
  destination: file
  #mongod或mongos应向其发送所有诊断日志记录信息的日志文件的路径
  path: "/mongodb/sharded_cluster/myconfigrs_27019/log/mongod.log"
  #当mongos或mongod实例重新启动时，mongos或mongod会将新条目附加到现有日志文件的末尾。
  logAppend: true
storage:
  #mongod实例存储其数据的目录。storage.dbPath设置仅适用于mongod。
  dbPath: "/mongodb/sharded_cluster/myconfigrs_27019/data/db"
  journal:
    #启用或禁用持久性日志以确保数据文件保持有效和可恢复。
    enabled: true
processManagement:
  #启用在后台运行mongos或mongod进程的守护进程模式。
  fork: true
  #指定用于保存mongos或mongod进程的进程ID的文件位置，其中mongos或mongod将写入其PID
  pidFilePath: "/mongodb/sharded_cluster/myconfigrs_27019/log/mongod.pid"
net:
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip
  #bindIpAll: true
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址
  bindIp: localhost,你的局域网ip
  #bindIp
  #绑定的端口
  port: 27019
replication:
#副本集的名称
  replSetName: myconfigrs
sharding:
  #分片角色
  clusterRole: configsvr
```

新建或修改配置文件：

```shell
vim /mongodb/sharded_cluster/myconfigrs_27119/mongod.conf
```

myconfigrs_27119

```yaml
systemLog:
  #MongoDB发送所有日志输出的目标指定为文件
  destination: file
  #mongod或mongos应向其发送所有诊断日志记录信息的日志文件的路径
  path: "/mongodb/sharded_cluster/myconfigrs_27119/log/mongod.log"
  #当mongos或mongod实例重新启动时，mongos或mongod会将新条目附加到现有日志文件的末尾。
  logAppend: true
storage:
  #mongod实例存储其数据的目录。storage.dbPath设置仅适用于mongod。
  dbPath: "/mongodb/sharded_cluster/myconfigrs_27119/data/db"
  journal:
    #启用或禁用持久性日志以确保数据文件保持有效和可恢复。
    enabled: true
processManagement:
  #启用在后台运行mongos或mongod进程的守护进程模式。
  fork: true
  #指定用于保存mongos或mongod进程的进程ID的文件位置，其中mongos或mongod将写入其PID
  pidFilePath: "/mongodb/sharded_cluster/myconfigrs_27119/log/mongod.pid"
net:
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip
  #bindIpAll: true
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址
  bindIp: localhost,你的ip地址
  #bindIp
  #绑定的端口
  port: 27119
replication:
#副本集的名称
  replSetName: myconfigrs
sharding:
  #分片角色
  clusterRole: configsvr
```

新建或修改配置文件：

```shell
vim /mongodb/sharded_cluster/myconfigrs_27219/mongod.conf
```

myconfigrs_27219

```yaml
systemLog:
  #MongoDB发送所有日志输出的目标指定为文件
  destination: file
  #mongod或mongos应向其发送所有诊断日志记录信息的日志文件的路径
  path: "/mongodb/sharded_cluster/myconfigrs_27219/log/mongod.log"
  #当mongos或mongod实例重新启动时，mongos或mongod会将新条目附加到现有日志文件的末尾。
  logAppend: true
storage:
  #mongod实例存储其数据的目录。storage.dbPath设置仅适用于mongod。
  dbPath: "/mongodb/sharded_cluster/myconfigrs_27219/data/db"
  journal:
    #启用或禁用持久性日志以确保数据文件保持有效和可恢复。
    enabled: true
processManagement:
  #启用在后台运行mongos或mongod进程的守护进程模式。
  fork: true
  #指定用于保存mongos或mongod进程的进程ID的文件位置，其中mongos或mongod将写入其PID
  pidFilePath: "/mongodb/sharded_cluster/myconfigrs_27219/log/mongod.pid"
net:
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip
  #bindIpAll: true
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址
  bindIp: localhost,你的ip地址
  #bindIp
  #绑定的端口
  port: 27219
replication:
#副本集的名称
  replSetName: myconfigrs
sharding:
  #分片角色
  clusterRole: configsvr
```

启动配置副本集：一主两副本

依次启动三个mongod服务：

```shell
[root@node1 ~]# mongod -f /mongodb/sharded_cluster/myconfigrs_27019/mongod.conf
about to fork child process, waiting until server is ready for connections.
forked process: 22393
child process started successfully, parent exiting
[root@node1 ~]# mongod -f /mongodb/sharded_cluster/myconfigrs_27119/mongod.conf
about to fork child process, waiting until server is ready for connections.
forked process: 22908
child process started successfully, parent exiting
[root@node1 ~]# mongod -f /mongodb/sharded_cluster/myconfigrs_27219/mongod.conf
about to fork child process, waiting until server is ready for connections.
forked process: 23170
child process started successfully, parent exiting
```

查看一下集群情况，现在我们的二个分片 + 一个配置集群共9个结点就全部搭建完毕了

![image-20220806130824604](https://cdn.fengxianhub.top/resources-master/202208061308965.png)

接着和上面一样初始化集群，这里要注意的是当前集群没有仲裁结点，所以添加的方式为普通添加

```shell
> rs.initiate()
{
        "info2" : "no configuration specified. Using a default configuration for the set",
        "me" : "node1:27019",
        "ok" : 1,
        "$gleStats" : {
                "lastOpTime" : Timestamp(1659762561, 1),
                "electionId" : ObjectId("000000000000000000000000")
        },
        "lastCommittedOpTime" : Timestamp(0, 0)
}
myconfigrs:SECONDARY> rs.add("node1:27119")
{
        "ok" : 1,
        "operationTime" : Timestamp(1659762587, 1),
        "$gleStats" : {
                "lastOpTime" : {
                        "ts" : Timestamp(1659762587, 1),
                        "t" : NumberLong(1)
                },
                "electionId" : ObjectId("7fffffff0000000000000001")
        },
        "lastCommittedOpTime" : Timestamp(1659762580, 1),
        "$clusterTime" : {
                "clusterTime" : Timestamp(1659762587, 1),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
}
myconfigrs:PRIMARY> rs.add("node1:27219")
{
        "ok" : 1,
        "operationTime" : Timestamp(1659762642, 1),
        "$gleStats" : {
                "lastOpTime" : {
                        "ts" : Timestamp(1659762642, 1),
                        "t" : NumberLong(1)
                },
                "electionId" : ObjectId("7fffffff0000000000000001")
        },
        "lastCommittedOpTime" : Timestamp(1659762640, 1),
        "$clusterTime" : {
                "clusterTime" : Timestamp(1659762642, 1),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
}
```

### 2.6 路由节点的创建和操作

#### 2.6.1 第一个路由节点的创建和连接

这里路由结点不要存储数据，所以只需要创建日志文件夹即可

第一步：准备存放数据和日志的目录：

```shell
#-----------mongos01
mkdir -p /mongodb/sharded_cluster/mymongos_27017/log
```

mymongos_27017节点：

新建或修改配置文件：	

```shell
vim /mongodb/sharded_cluster/mymongos_27017/mongos.conf
```

这里的配置也和上面的非常类似，不同的是下面会多了一个`sharding`模块，用来指定配置节点副本集

语法为：myconfigrs/【mongod服务1】,【mongod服务2】

mongos.conf

```yaml
systemLog:
  #MongoDB发送所有日志输出的目标指定为文件
  destination: file
  #mongod或mongos应向其发送所有诊断日志记录信息的日志文件的路径
  path: "/mongodb/sharded_cluster/mymongos_27017/log/mongod.log"
  #当mongos或mongod实例重新启动时，mongos或mongod会将新条目附加到现有日志文件的末尾。
  logAppend: true
processManagement:
  #启用在后台运行mongos或mongod进程的守护进程模式。
  fork: true
  #指定用于保存mongos或mongod进程的进程ID的文件位置，其中mongos或mongod将写入其PID
  pidFilePath: "/mongodb/sharded_cluster/mymongos_27017/log/mongod.pid"
net:
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip
  #bindIpAll: true
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址
  bindIp: localhost,你的IP地址
  #bindIp
  #绑定的端口
  port: 27017
sharding:
  #指定配置节点副本集
  configDB: myconfigrs/你的IP地址:27019,你的IP地址:27119,你的IP地址:27219
```

启动mongos：

```shell
[root@node1 ~]# mongos -f /mongodb/sharded_cluster/mymongos_27017/mongos.conf
about to fork child process, waiting until server is ready for connections.
forked process: 40211
child process started successfully, parent exiting
```

客户端登录mongos

```shell
[root@node1 ~]# mongo --port 27017
MongoDB shell version v4.0.28
connecting to: mongodb://127.0.0.1:27017/?gssapiServiceName=mongodb
Implicit session: session { "id" : UUID("922b1841-8e65-4e1c-a245-3b43e568063c") }
MongoDB server version: 4.0.28
Server has startup warnings:
2022-08-06T13:22:10.971+0800 I CONTROL  [main]
2022-08-06T13:22:10.971+0800 I CONTROL  [main] ** WARNING: Access control is not enabled for the database.
2022-08-06T13:22:10.971+0800 I CONTROL  [main] **          Read and write access to data and configuration is unrestricted.
2022-08-06T13:22:10.971+0800 I CONTROL  [main] ** WARNING: You are running this process as the root user, which is not recommended.
2022-08-06T13:22:10.971+0800 I CONTROL  [main]
mongos>
```

现在我们可以直接在`mogos`上对集群进行操作，但是此时是不能进行写数据的

```shell
mongos> show dbs;
admin   0.000GB
config  0.000GB
mongos> use test_mongos
switched to db test_mongos
mongos> db.test_mongos_collection_01.insert({username:"张三"})
WriteCommandError({
        "ok" : 0,
        "errmsg" : "unable to initialize targeter for write op for collection test_mongos.test_mongos_collection_01 :: caused by :: Database test_mongos not found :: caused by :: No shards found",
        "code" : 70,
        "codeName" : "ShardNotFound",
        "operationTime" : Timestamp(1659763578, 2),
        "$clusterTime" : {
                "clusterTime" : Timestamp(1659763578, 2),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
})
```

我们看报错信息的最后一句：`No shards found`，表示没有找到分片集群，通过路由节点操作，现在只是连接了配置节点，还没有连接分片数据节点，因此无法写入业务数据。

#### 2.6.2 在路由节点上进行分片配置操作

1. 使用命令添加分片，语法：`sh.addShard("IP:Port")`

   将第一套分片副本集添加进来（node1是我本机的ip，在host文件中做了映射）:

   ```shell
   mongos> sh.addShard("myshardrs01/node1:27018,node1:27118,node1:27218")
   {
           "shardAdded" : "myshardrs01",
           "ok" : 1,
           "operationTime" : Timestamp(1659763922, 3),
           "$clusterTime" : {
                   "clusterTime" : Timestamp(1659763922, 3),
                   "signature" : {
                           "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                           "keyId" : NumberLong(0)
                   }
           }
   }
   ```

   查看分片状态情况：

   ```shell
   mongos> sh.status()
   --- Sharding Status ---
     sharding version: {
           "_id" : 1,
           "minCompatibleVersion" : 5,
           "currentVersion" : 6,
           "clusterId" : ObjectId("62edf782a970a7e85804d195")
     }
     shards:
           {  "_id" : "myshardrs01",  "host" : "myshardrs01/node1:27018,node1:27118",  "state" : 1 }
     active mongoses:
           "4.0.28" : 1
     autosplit:
           Currently enabled: yes
     balancer:
           Currently enabled:  yes
           Currently running:  no
           Failed balancer rounds in last 5 attempts:  0
           Migration Results for the last 24 hours:
                   No recent migrations
     databases:
           {  "_id" : "config",  "primary" : "config",  "partitioned" : true }
   ```

   继续将第二套分片副本集添加进来：

   ```shell
   mongos> sh.addShard("myshardrs02/node1:27318,node1:27418,node1:27518")
   {
           "shardAdded" : "myshardrs02",
           "ok" : 1,
           "operationTime" : Timestamp(1659764031, 4),
           "$clusterTime" : {
                   "clusterTime" : Timestamp(1659764031, 4),
                   "signature" : {
                           "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                           "keyId" : NumberLong(0)
                   }
           }
   }
   ```

   查看一下，可以看到我们现在有了两个集群：

   ```shell
   mongos> sh.status()
   --- Sharding Status ---
     sharding version: {
           "_id" : 1,
           "minCompatibleVersion" : 5,
           "currentVersion" : 6,
           "clusterId" : ObjectId("62edf782a970a7e85804d195")
     }
     shards:
           {  "_id" : "myshardrs01",  "host" : "myshardrs01/node1:27018,node1:27118",  "state" : 1 }
           {  "_id" : "myshardrs02",  "host" : "myshardrs02/node1:27318,node1:27418",  "state" : 1 }
     active mongoses:
           "4.0.28" : 1
     autosplit:
           Currently enabled: yes
     balancer:
           Currently enabled:  yes
           Currently running:  no
           Failed balancer rounds in last 5 attempts:  0
           Migration Results for the last 24 hours:
                   No recent migrations
     databases:
           {  "_id" : "config",  "primary" : "config",  "partitioned" : true }
   ```

   移除分片参考(了解)：

   ```shell
   use admin
   db.runCommand( { removeShard: "myshardrs02" } )
   ```

   注意：如果只剩下最后一个shard，是无法删除的 移除时会自动转移分片数据，需要一个时间过程。 完成后，再次执行删除分片命令才能真正删除。

2. 开启分片功能：`sh.enableSharding("库名")、sh.shardCollection("库名.集合名",{"key":1})`

   >首先是数据库分片：在mongos上的articledb数据库配置sharding

   ```shell
   mongos> sh.enableSharding("articledb")
   {
           "ok" : 1,
           "operationTime" : Timestamp(1659764163, 5),
           "$clusterTime" : {
                   "clusterTime" : Timestamp(1659764163, 5),
                   "signature" : {
                           "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                           "keyId" : NumberLong(0)
                   }
           }
   }
   ```

   查看分片状态：

   ```shell
   mongos> sh.status()
   --- Sharding Status ---
     sharding version: {
           "_id" : 1,
           "minCompatibleVersion" : 5,
           "currentVersion" : 6,
           "clusterId" : ObjectId("62edf782a970a7e85804d195")
     }
     shards:
           {  "_id" : "myshardrs01",  "host" : "myshardrs01/node1:27018,node1:27118",  "state" : 1 }
           {  "_id" : "myshardrs02",  "host" : "myshardrs02/node1:27318,node1:27418",  "state" : 1 }
     active mongoses:
           "4.0.28" : 1
     autosplit:
           Currently enabled: yes
     balancer:
           Currently enabled:  yes
           Currently running:  no
           Failed balancer rounds in last 5 attempts:  0
           Migration Results for the last 24 hours:
                   No recent migrations
     databases:
           {  "_id" : "articledb",  "primary" : "myshardrs02",  "partitioned" : true,  "version" : {  "uuid" : UUID("09d57e82-a96b-4fb3-947a-62d76e7be4af"),  "lastMod" : 1 } }
           {  "_id" : "config",  "primary" : "config",  "partitioned" : true }
   ```

   >其次是集合进行分片

   对集合分片，你必须使用 sh.shardCollection() 方法指定集合和分片键。

   语法：

   ```shell
   sh.shardCollection(namespace, key, unique)
   ```

   参数：

   | Parameter | Type     | Description                                                  |
   | --------- | -------- | ------------------------------------------------------------ |
   | namespace | string   | 要（分片）共享的目标集合的命名空间，格式：` <database>.<collection>` |
   | key       | document | 用作分片键的索引规范文档。shard键决定MongoDB如何在 shard之间分发文档。除非集合为空，否则索引必须在shard collection命令之前存在。如果集合为空，则MongoDB在对集合 进行分片之前创建索引，前提是支持分片键的索引不存在。简单 的说：由包含字段和该字段的索引遍历方向的文档组成。 |
   | unique    | boolean  | 当值为true情况下，片键字段上会限制为确保是唯一索引。哈希策略片键不支持唯一索引。默认是false。 |

   对集合进行分片时,你需要选择一个 `片键（Shard Key）` , shard key 是每条记录都必须包含的，且建立了索引的单个字段或复合字段，MongoDB按照片键将数据划分到不同的 数据块中，并将 数据块均衡地分布到所有分片中

   为了按照片键划分数据块，`MongoDB使用基于哈希的分片方式`（随机平均分配）或者`基于范围的分片方式`（数值大小分配） 。 

   用什么字段当片键都可以，如：nickname作为片键，但一定是必填字段。

下面就让我们来看看具体的分片规则

#### 2.6.3 分片规则一：Hash策略

对于`基于哈希的分片` ,`MongoDB`计算一个字段的哈希值，并用这个哈希值来创建数据块

在使用基于哈希分片的系统中,拥有`相近`字键的文档 **很可能不会存储在同一个数据块中**，因此数据的分离性更好一些

使用nickname作为片键，根据其值的哈希值进行数据分片

```shell
mongos> sh.enableSharding("articledb")  # 开启数据库分片
{
        "ok" : 1,
        "operationTime" : Timestamp(1659767306, 2),
        "$clusterTime" : {
                "clusterTime" : Timestamp(1659767306, 2),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
}
mongos> sh.shardCollection("articledb.comment",{"nickname":"hashed"}) # 通过字段nickname对comment数据库Hash分片
{
        "collectionsharded" : "articledb.comment",
        "collectionUUID" : UUID("b623b9b8-16b7-47da-89ba-570b7ff94e9e"),
        "ok" : 1,
        "operationTime" : Timestamp(1659769272, 24),
        "$clusterTime" : {
                "clusterTime" : Timestamp(1659769272, 24),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
}
```

现在我们再查看一下`mongos`的状态，可以看到下面的`databases`中已经有了一条记录，表示数据库分片，然后下面的`articledb.comment`表示对集合comment进行了分片，然后分片的规则是`shard key: { "nickname" : "hashed" }`，表示通过字段`nickname`进行hash分片

```shell
mongos> sh.status()
--- Sharding Status ---
  sharding version: {
        "_id" : 1,
        "minCompatibleVersion" : 5,
        "currentVersion" : 6,
        "clusterId" : ObjectId("62edf782a970a7e85804d195")
  }
  shards:
        {  "_id" : "myshardrs01",  "host" : "myshardrs01/node1:27018,node1:27118",  "state" : 1 }
        {  "_id" : "myshardrs02",  "host" : "myshardrs02/node1:27318,node1:27418",  "state" : 1 }
  active mongoses:
        "4.0.28" : 1
  autosplit:
        Currently enabled: yes
  balancer:
        Currently enabled:  yes
        Currently running:  no
        Failed balancer rounds in last 5 attempts:  0
        Migration Results for the last 24 hours:
                512 : Success
  databases:
        {  "_id" : "articledb",  "primary" : "myshardrs02",  "partitioned" : true,  "version" : {  "uuid" : UUID("09d57e82-a96b-4fb3-947a-62d76e7be4af"),  "lastMod" : 1 } }
                articledb.comment
                        shard key: { "nickname" : "hashed" }
                        unique: false
                        balancing: true
                        chunks:
                                myshardrs01     2
                                myshardrs02     2
                        { "nickname" : { "$minKey" : 1 } } -->> { "nickname" : NumberLong("-4611686018427387902") } on : myshardrs01 Timestamp(1, 0)
                        { "nickname" : NumberLong("-4611686018427387902") } -->> { "nickname" : NumberLong(0) } on : myshardrs01 Timestamp(1, 1)
                        { "nickname" : NumberLong(0) } -->> { "nickname" : NumberLong("4611686018427387902") } on : myshardrs02 Timestamp(1, 2)
                        { "nickname" : NumberLong("4611686018427387902") } -->> { "nickname" : { "$maxKey" : 1 } } on : myshardrs02 Timestamp(1, 3)
        {  "_id" : "config",  "primary" : "config",  "partitioned" : true }
                config.system.sessions
                        shard key: { "_id" : 1 }
                        unique: false
                        balancing: true
                        chunks:
                                myshardrs01     512
                                myshardrs02     512
                        too many chunks to print, use verbose if you want to force print
```

#### 2.6.4 分片规则二：范围策略

对于 `基于范围的分片` ，`MongoDB`按照片键的范围把数据分成不同部分

假设有一个数字的片键：想象一个 从负无穷到正无穷的直线，每一个片键的值都在直线上画了一个点

MongoDB把这条直线划分为更短的不重叠的片段,并称之为 `数据块` ，每个数据块包含了片键在一定范围内的数据

在使用片键做范围划分的系统中,拥有`相近`片键的文档很可能存储在同一个数据块中，因此也会存储在同 一个分片中

**即通过一个范围决定该记录在那个分片中**

如使用作者年龄字段作为片键，按照点赞数的值进行分片：

```shell
mongos> sh.shardCollection("articledb.author",{"age":1})
{
        "collectionsharded" : "articledb.author",
        "collectionUUID" : UUID("c6525b7b-9d26-4ea5-ad45-73bdceb68273"),
        "ok" : 1,
        "operationTime" : Timestamp(1659769984, 10),
        "$clusterTime" : {
                "clusterTime" : Timestamp(1659769984, 10),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
}
```

查看状态，可以发现多了一条分片规则，但是此时分片数据存储的位置只有：`myshardrs02`，是我们后面添加的集群

这里和MySQL的分库分表类似，要在数据插入的过程中自动生成存储和分片的范围，我们接下来插入数据看看

```shell
mongos> sh.status()
--- Sharding Status ---
  sharding version: {
        "_id" : 1,
        "minCompatibleVersion" : 5,
        "currentVersion" : 6,
        "clusterId" : ObjectId("62edf782a970a7e85804d195")
  }
  shards:
        {  "_id" : "myshardrs01",  "host" : "myshardrs01/node1:27018,node1:27118",  "state" : 1 }
        {  "_id" : "myshardrs02",  "host" : "myshardrs02/node1:27318,node1:27418",  "state" : 1 }
  active mongoses:
        "4.0.28" : 1
  autosplit:
        Currently enabled: yes
  balancer:
        Currently enabled:  yes
        Currently running:  no
        Failed balancer rounds in last 5 attempts:  0
        Migration Results for the last 24 hours:
                512 : Success
  databases:
        {  "_id" : "articledb",  "primary" : "myshardrs02",  "partitioned" : true,  "version" : {  "uuid" : UUID("09d57e82-a96b-4fb3-947a-62d76e7be4af"),  "lastMod" : 1 } }
                articledb.author
                        shard key: { "age" : 1 }
                        unique: false
                        balancing: true
                        chunks:
                                myshardrs02     1
                        { "age" : { "$minKey" : 1 } } -->> { "age" : { "$maxKey" : 1 } } on : myshardrs02 Timestamp(1, 0)
                articledb.comment
                        shard key: { "nickname" : "hashed" }
                        unique: false
                        balancing: true
                        chunks:
                                myshardrs01     2
                                myshardrs02     2
                        { "nickname" : { "$minKey" : 1 } } -->> { "nickname" : NumberLong("-4611686018427387902") } on : myshardrs01 Timestamp(1, 0)
                        { "nickname" : NumberLong("-4611686018427387902") } -->> { "nickname" : NumberLong(0) } on : myshardrs01 Timestamp(1, 1)
                        { "nickname" : NumberLong(0) } -->> { "nickname" : NumberLong("4611686018427387902") } on : myshardrs02 Timestamp(1, 2)
                        { "nickname" : NumberLong("4611686018427387902") } -->> { "nickname" : { "$maxKey" : 1 } } on : myshardrs02 Timestamp(1, 3)
        {  "_id" : "config",  "primary" : "config",  "partitioned" : true }
                config.system.sessions
                        shard key: { "_id" : 1 }
                        unique: false
                        balancing: true
                        chunks:
                                myshardrs01     512
                                myshardrs02     512
                        too many chunks to print, use verbose if you want to force print
```



#### 2.6.5 分片后插入数据测试

测试一（哈希规则）：登录mongs后，向comment循环插入1000条数据做测试：

```javascript
mongos> use articledb
switched to db articledb
mongos> for(var i=1;i<=1000;i++) {db.comment.insert({_id:i+"",nickname:"BoBo"+i})}
WriteResult({ "nInserted" : 1 })
mongos> db.comment.count()
1000
```

注意：从路由上插入的数据，必须包含片键，否则无法插入。

分别登陆两个片的主节点，统计文档数量

```shell
myshardrs01:PRIMARY> use articledb
switched to db articledb
myshardrs01:PRIMARY> db.comment.count()
507
```

```shell
myshardrs02:PRIMARY> use articledb
switched to db articledb
myshardrs02:PRIMARY> db.comment.count()
493
```

可以看到，1000条数据近似均匀的分布到了2个shard上。是根据片键的哈希值分配的。

这种分配方式非常易于`水平扩展`：一旦数据存储需要更大空间，`可以直接再增加分片即可`，同时提升了性能。

使用`db.comment.stats()`查看单个集合的完整情况，`mongos`执行该命令可以查看该集合的数据分片的情况。

使用`sh.status()`查看本库内所有集合的分片信息。

>测试二（范围规则）：登录mongs后，向comment循环插入2w 条数据做测试

范围分片这一块的逻辑比较复杂，我们需要提前进行一些设置，不然可能会导致我们的分片数始终为默认的一片

如果没有进行分片一般有两种可能：

- 系统繁忙，正在分片中

- 数据块（chunk）没有填满，默认的数据块尺寸（chunksize）是`64M`，填满后才会考虑向其他片的 数据块填充数据，因此，为了测试，可以将其改小，这里改为1M，操作如下

  ```shell
  # 这里的设置是在路由结点上，即mongos上
  use config
  db.settings.save( { _id:"chunksize", value: 1 } )
  # 测试完改回来
  db.settings.save( { _id:"chunksize", value: 64 } )
  ```

  注意：要先改小，再设置分片。为了测试，可以先删除集合，重新建立集合的分片策略，再插入数据测试即可

接下来插入数据

```shell
mongos> use articledb
switched to db articledb
mongos> for(var i=1;i<=220000;i++){db.author.save({"name":"BoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBoBo"+i,"age":NumberInt(i%120)})}
WriteResult({ "nInserted" : 1 })
mongos> db.comment.count()
220000
```

我们看看我们的两个分片集群中的插入情况

```shell
# 路由结点
mongos>  db.author.count()
220000
# 分片一
myshardrs01:PRIMARY> db.author.count()
110038
# 分片二
myshardrs02:PRIMARY> db.author.count()
109962
```



其实我们在插入数据的时候也能够明显看到分片集群的好处，将请求的压力分发到不同的分片集群中，提高整个系统的并发和吞吐量

![image-20220806160956000](https://cdn.fengxianhub.top/resources-master/202208061609624.png)

#### 2.6.6 再增加一个路由节点

文件夹：

```shell
#-----------mongos02
mkdir -p /mongodb/sharded_cluster/mymongos_27117/log
```

新建或修改配置文件：

```shell
vim /mongodb/sharded_cluster/mymongos_27117/mongos.conf
```

mongos.conf

```shell
systemLog:
  #MongoDB发送所有日志输出的目标指定为文件
  destination: file
  #mongod或mongos应向其发送所有诊断日志记录信息的日志文件的路径
  path: "/mongodb/sharded_cluster/mymongos_27117/log/mongod.log"
  #当mongos或mongod实例重新启动时，mongos或mongod会将新条目附加到现有日志文件的末尾。
  logAppend: true
processManagement:
  #启用在后台运行mongos或mongod进程的守护进程模式。
  fork: true
  #指定用于保存mongos或mongod进程的进程ID的文件位置，其中mongos或mongod将写入其PID
  pidFilePath: "/mongodb/sharded_cluster/mymongos_27117/log/mongod.pid"
net:
  #服务实例绑定所有IP，有副作用，副本集初始化的时候，节点名字会自动设置为本地域名，而不是ip
  #bindIpAll: true
  #服务实例绑定的IP,如果使用云服务器，后面的ip请用云服务器的局域网ip地址
  bindIp: localhost,你的IP地址
  #bindIp
  #绑定的端口
  port: 27117
sharding:
  #指定配置节点副本集
  configDB: myconfigrs/你的IP地址:27019,你的IP地址:27119,你的IP地址:27219
```

启动

```shell
[root@node1 ~]#  mongos -f /mongodb/sharded_cluster/mymongos_27117/mongos.conf
about to fork child process, waiting until server is ready for connections.
forked process: 58215
child process started successfully, parent exiting
```

使用mongo客户端登录27117，发现，第二个路由无需配置，因为分片配置都保存到了配置服务器中了。

### 2.7 使用工具连接分片集群

![image-20220806173538910](https://cdn.fengxianhub.top/resources-master/202208061735167.png)



### 2.8 SpringDataMongDB连接分片集群

在分片集群中有路由结点，所以我们只需要连接路由结点即可

```yaml
spring:
  #数据源配置
  data:
    mongodb:
      # 使用uri连接
      uri: mongodb://node1:27017,node1:27117/articledb
```

感觉还是非常方便的，只需要连接路由结点即可，完全可以当做单机使用！

## 3. 安全认证

### 3.1 MongoDB的用户和角色权限简介

默认情况下，MongoDB实例启动运行时是没有启用用户访问权限控制的，也就是说，在实例本机服务器上都可以随意连接到实例进行各种操作，MongoDB不会对连接客户端进行用户验证，这是非常危险的。

mongodb官网上说，为了能保障mongodb的安全可以做以下几个步骤：

- 使用新的端口，默认的27017端口如果一旦知道了ip就能连接上，不太安全
- 设置mongodb的网络环境，最好将mongodb部署到公司服务器内网，这样外网是访问不到的。公司内部访问使用vpn等
- 开启安全认证。认证要同时设置服务器之间的内部认证方式，同时要设置客户端连接到集群的账号密码认证方式

为了强制开启用户访问控制(用户验证)，则需要在MongoDB实例启动时使用选项` --auth` 或在指定启动 配置文件中添加选项 `auth=true`

在开始之前需要了解一下概念

- 启用访问控制

  MongoDB使用的是`基于角色的访问控制`(Role-Based Access Control,RBAC)来管理用户对实例的访问

  通过对用户授予一个或多个角色来控制用户访问数据库资源的权限和数据库操作的权限，在对用户分配角色之前，用户无法访问实例

- 角色

  在MongoDB中通过角色对用户授予相应数据库资源的操作权限，每个角色当中的权限可以显式指定， 也可以通过继承其他角色的权限，获得父角色存在的权限

- 权限

  权限由指定的`数据库资源(resource)`以及允许在指定资源上进行的`操作(action)`组成，包括：

  1. 资源(resource)包括：数据库、集合、部分集合和集群
  2. 操作(action)包括：对资源进行的增、删、改、查(CRUD)操作

  在角色定义时可以包含一个或多个已存在的角色，新创建的角色会继承包含的角色所有的权限。

  在同一个数据库中，**新创建角色可以继承其他角色的权限**，在 admin 数据库中创建的角色可以继承在其它任意数据库中角色的权限

关于角色权限的查看，可以通过如下命令查询（了解）：

```javascript
// 查询所有角色权限(仅用户自定义角色)
> db.runCommand({ rolesInfo: 1 })
// 查询所有角色权限(包含内置角色)
> db.runCommand({ rolesInfo: 1, showBuiltinRoles: true })
// 查询当前数据库中的某角色的权限
> db.runCommand({ rolesInfo: "<rolename>" })
// 查询其它数据库中指定的角色权限
> db.runCommand({ rolesInfo: { role: "<rolename>", db: "<database>" } }
// 查询多个角色权限
> db.runCommand(
    {
            rolesInfo: [
                "<rolename>",
                { role: "<rolename>", db: "<database>" },
                ...
            ]
    }
)

```

示例： 查看所有内置角色：

```shell
myshardrs02:PRIMARY> db.runCommand({ rolesInfo: 1, showBuiltinRoles: true })
{
        "roles" : [
                {
                        "role" : "dbAdmin",
                        "db" : "articledb",
                        "isBuiltin" : true,
                        "roles" : [ ],
                        "inheritedRoles" : [ ]
                },
                {
                        "role" : "dbOwner",
                        "db" : "articledb",
                        "isBuiltin" : true,
                        "roles" : [ ],
                        "inheritedRoles" : [ ]
                },
                {
                        "role" : "enableSharding",
                        "db" : "articledb",
                        "isBuiltin" : true,
                        "roles" : [ ],
                        "inheritedRoles" : [ ]
                },
                {
                        "role" : "read",
                        "db" : "articledb",
                        "isBuiltin" : true,
                        "roles" : [ ],
                        "inheritedRoles" : [ ]
                },
                {
                        "role" : "readWrite",
                        "db" : "articledb",
                        "isBuiltin" : true,
                        "roles" : [ ],
                        "inheritedRoles" : [ ]
                },
                {
                        "role" : "userAdmin",
                        "db" : "articledb",
                        "isBuiltin" : true,
                        "roles" : [ ],
                        "inheritedRoles" : [ ]
                }
        ],
        "ok" : 1,
        "operationTime" : Timestamp(1659779530, 1),
        "$gleStats" : {
                "lastOpTime" : Timestamp(0, 0),
                "electionId" : ObjectId("7fffffff0000000000000001")
        },
        "lastCommittedOpTime" : Timestamp(1659779530, 1),
        "$configServerState" : {
                "opTime" : {
                        "ts" : Timestamp(1659779523, 2),
                        "t" : NumberLong(1)
                }
        },
        "$clusterTime" : {
                "clusterTime" : Timestamp(1659779530, 1),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
}
```

### 3.2 常用的内置角色

- 数据库用户角色：read、readWrite
- 所有数据库用户角色：readAnyDatabase、readWriteAnyDatabase、 userAdminAnyDatabase、dbAdminAnyDatabase
- 数据库管理角色：dbAdmin、dbOwner、userAdmin
- 集群管理角色：clusterAdmin、clusterManager、clusterMonitor、hostManager
- 备份恢复角色：backup、restore
- 超级用户角色：root
- 内部角色：system

角色说明：

| 角色                 | 权限描述                                                     |
| -------------------- | ------------------------------------------------------------ |
| read                 | 可以读取指定数据库中任何数据                                 |
| readWrite            | 可以读写指定数据库中任何数据，包括创建、重命名、删除集合     |
| readAnyDatabase      | 可以读取所有数据库中任何数据(除了数据库config和local之外)    |
| readWriteAnyDatabase | 可以读写所有数据库中任何数据(除了数据库config和local之外)    |
| userAdminAnyDatabase | 可以读取所有数据库中任何数据(除了数据库config和local之外)    |
| dbAdminAnyDatabase   | 可以读取任何数据库以及对数据库进行清理、修改、压缩、获取统 计信息、执行检查等操作(除了数据库config和local之外) |
| dbAdmin              | 可以读取指定数据库以及对数据库进行清理、修改、压缩、获取统计信息、执行检查等操作 |
| userAdmin            | 可以在指定数据库创建和修改用户                               |
| clusterAdmin         | 可以对整个集群或数据库系统进行管理操作                       |
| backup               | 备份MongoDB数据最小的权限                                    |
| restore              | 从备份文件中还原恢复MongoDB数据(除了system.profile集合)的权限 |
| root                 | 超级账号，超级权限                                           |

### 3.3 单实例环境

我们先关掉所有的MongoDB服务

```shell
kill -9 `netstat -ntlp | grep mongo | awk '{print $7}'| awk -F/ '{print $1}'`
# 或者
ps -ef|grep mongo|grep -v grep|awk '{print$2}'|xargs kill -9
```

我们这里是对单实例的MongoDB服务开启安全认证，这里的单实例指的是未开启副本集或分片的MongoDB实例

